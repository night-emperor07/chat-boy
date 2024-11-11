from flask import Flask, request, jsonify, render_template
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
import torch
import os
import json
from dotenv import load_dotenv

load_dotenv()

hf_token = os.getenv('HF_TOKEN')

app = Flask(__name__)

# Configure the SQLite database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///chatbot.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Database model for Chat
class Chat(db.Model):
    __tablename__ = 'chats'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    messages = db.relationship('Message', backref='chat', lazy=True)

# Database model for Message
class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    sender = db.Column(db.String(50), nullable=False)  # "user" or "bot"
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    chat_id = db.Column(db.Integer, db.ForeignKey('chats.id'), nullable=False)

# Initialize the database (create tables)
with app.app_context():
    db.create_all()

bnb_config = BitsAndBytesConfig(load_in_8bit=True)

tokenizer = AutoTokenizer.from_pretrained('meta-llama/Llama-3.2-3B-Instruct')
model = AutoModelForCausalLM.from_pretrained('meta-llama/Llama-3.2-3B-Instruct', quantization_config=bnb_config, torch_dtype=torch.bfloat16, device_map='cuda')

# Dummy user data
users = {
    'testuser': 'password123'
}

user_data = {
    "previous_chats": [],
    "current_chat": None,
    "chat_history": {}
}

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if username in users and users[username] == password:
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

# @app.route('/previous_chats', methods=['GET'])
# def previous_chats():
#     username = request.args.get('username')
#     chats = user_data.get(previous_chats, [])
#     return jsonify({'chats': chats})

@app.route("/")
def index():
    return render_template("index.html")

@app.route('/send_message', methods=['POST'])
def send_message():
    data = request.get_json()
    query = data.get("message")
    conversation = [{"role": "user", "content": query}]
    # format and tokenize the tool use prompt 
    inputs = tokenizer.apply_chat_template(
                conversation,
                add_generation_prompt=True,
                return_dict=True,
                return_tensors="pt",
    )
    inputs.to(model.device)
    out = model.generate(**inputs, max_new_tokens=200)
    response = tokenizer.decode(out[0][len(inputs["input_ids"][0]):], skip_special_tokens=True)
    return jsonify({
        'user_message': query,
        'bot_response': response,
        'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })

@app.route('/create_chat', methods=['POST'])
def create_chat():
    data = request.json
    chat_name = data.get('chatName')

    if not chat_name:
        return jsonify({"error": "Chat name is required"}), 400

    # Create a new chat entry in the database
    new_chat = Chat(name=chat_name)
    db.session.add(new_chat)
    db.session.commit()

    # Return the updated chat list with the new chat highlighted
    chats = Chat.query.all()
    chat_list = [{"id": chat.id, "name": chat.name} for chat in chats]
    
    return jsonify({
        "previousChats": chat_list,
        "currentChat": new_chat.id
    })

@app.route('/save_chat', methods=['POST'])
def save_chat():
    data = request.json
    messages = data.get('messages')
    chat_id = data.get('chat_id')

    # Check if the chat exists
    chat = Chat.query.get(chat_id)
    if not chat:
        return jsonify({"error": "Chat not found"}), 404

    # Add each message to the Message table
    for msg in messages:
        new_message = Message(
            text=msg['text'],
            sender=msg['sender'],
            chat_id=chat.id
        )
        db.session.add(new_message)

    db.session.commit()
    return jsonify({"status": "Chat saved successfully."}), 200


if __name__ == '__main__':
    app.run(host="127.0.0.1:5000")
