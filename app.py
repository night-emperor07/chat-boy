from flask import Flask, request, jsonify, render_template
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from datetime import datetime
import torch
import os
from dotenv import load_dotenv

load_dotenv()

hf_token = os.getenv('HF_TOKEN')

app = Flask(__name__)

bnb_config = BitsAndBytesConfig(load_in_8bit=True)

tokenizer = AutoTokenizer.from_pretrained('meta-llama/Llama-3.2-3B-Instruct')
model = AutoModelForCausalLM.from_pretrained('meta-llama/Llama-3.2-3B-Instruct', quantization_config=bnb_config, torch_dtype=torch.bfloat16, device_map='cuda')

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

if __name__ == '__main__':
    app.run(host="127.0.0.1:5000")
