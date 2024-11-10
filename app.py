from flask import Flask, request, jsonify
from datetime import datetime

app = Flask(__name__)

@app.route('/send_message', methods=['POST'])
def send_message():
    data = request.get_json()
    user_message = data.get('message')
    
    # Process the message (Here we'll just return a sample response)
    bot_response = f"You said: {user_message}. Here's the bot's reply."
    
    return jsonify({
        'user_message': user_message,
        'bot_response': bot_response,
        'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })

if __name__ == '__main__':
    app.run(debug=True)