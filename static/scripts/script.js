async function sendMessage() {
    const userInput = document.getElementById('userInput').value;
    if (!userInput) return;

    displayMessage(userInput, 'user'); // Display user message

    try {
        const response = await fetch('http://127.0.0.1:5000/send_message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: userInput })
        });
        const data = await response.json();
        displayMessage(data.bot_response, 'bot'); // Display bot response

    } catch (error) {
        console.error('Error:', error);
    }
    document.getElementById('userInput').value = ''; // Clear input
}

// function displayMessage(text, sender) {
//     const messagesDiv = document.getElementById('messages');

//     // Create message wrapper
//     const messageDiv = document.createElement('div');
//     messageDiv.classList.add('message', sender);

//     // Avatar div
//     const avatarDiv = document.createElement('div');
//     avatarDiv.classList.add('avatar');

//     // Message content
//     const messageContentDiv = document.createElement('div');
//     messageContentDiv.classList.add('message-content');
//     messageContentDiv.textContent = text;

//     // Append elements based on sender (user or bot)
//     messageDiv.appendChild(avatarDiv);
//     messageDiv.appendChild(messageContentDiv);

//     messagesDiv.appendChild(messageDiv);
//     messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll to the latest message
// }

function displayMessage(text, sender) {
    const messagesDiv = document.getElementById('messages');
    
    const messageWrapper = document.createElement('div');
    messageWrapper.classList.add('message-wrapper');
    messageWrapper.classList.add(sender);  // Adds 'user' or 'bot' class
    
    // Add icon element
    const icon = document.createElement('img');
    icon.classList.add('message-icon');
    icon.src = sender === 'user' ? 'static/images/user_logo.png' : 'static/images/bot.png';
    icon.alt = `${sender} icon`;
    
    // Add text message element
    const messageText = document.createElement('div');
    messageText.classList.add('message-text');
    messageText.textContent = text;

    // Append icon and message text to wrapper
    messageWrapper.appendChild(icon);
    messageWrapper.appendChild(messageText);
    
    // Append wrapper to messages div
    messagesDiv.appendChild(messageWrapper);

    // Scroll to the bottom of messages
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function toggleMenu() {
    const profileMenu = document.getElementById('profileMenu');
    profileMenu.style.display = profileMenu.style.display === 'block' ? 'none' : 'block';
}

// Close the menu if clicked outside
document.addEventListener('click', (event) => {
    const profileMenu = document.getElementById('profileMenu');
    const profilePicture = document.querySelector('.profile-picture');
    if (profileMenu.style.display === 'block' && !profileMenu.contains(event.target) && event.target !== profilePicture) {
        profileMenu.style.display = 'none';
    }
});
// Toggle the login and chat views
function toggleView(showLogin) {
    document.getElementById('loginPage').style.display = showLogin ? 'flex' : 'none';
    document.getElementById('chatContainer').style.display = showLogin ? 'none' : 'flex';
}

// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Send login request to backend
    try {
        const response = await fetch('http://127.0.0.1:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        if (data.success) {
            // Login successful, show chat UI
            toggleView(false);
            fetchPreviousChats(); // Fetch previous chats after login
        } else {
            // Show error message
            document.getElementById('loginError').textContent = data.message;
            document.getElementById('loginError').style.display = 'block';
        }
    } catch (error) {
        console.error('Error during login:', error);
    }
});

// Fetch and display previous chats
async function fetchPreviousChats() {
    try {
        const response = await fetch('http://127.0.0.1:5000/previous_chats', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        const previousChatsDiv = document.getElementById('previousChats');
        previousChatsDiv.innerHTML = ''; // Clear existing chats

        // Display each chat
        data.chats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.classList.add('chat-item');
            chatItem.textContent = chat.title; // Assuming each chat has a 'title' field
            previousChatsDiv.appendChild(chatItem);
        });
    } catch (error) {
        console.error('Error fetching previous chats:', error);
    }
}
function openModal() {
    document.getElementById('newChatModal').style.display = 'block';
}

// Function to close the modal
function closeModal() {
    document.getElementById('newChatModal').style.display = 'none';
}

async function createChat() {
    const chatName = document.getElementById('newChatName').value;

    if (chatName.trim() === '') {
        alert('Please enter a chat name.');
        return;
    }

    // Collect current messages from the chat area before creating a new chat
    const currentMessages = Array.from(document.querySelectorAll('.message-wrapper')).map(message => {
        return {
            text: message.querySelector('.message-text').textContent,
            sender: message.classList.contains('user') ? 'user' : 'bot'
        };
    });

    // Send current messages to the backend to be saved
    await saveChat(currentMessages);

    // Send request to create the new chat
    const response = await fetch('http://127.0.0.1:5000/create_chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatName })
    });

    if (response.ok) {
        const data = await response.json();
        updatePreviousChats(data.previousChats, data.currentChat);
        clearChatArea(); // Clear chat area for new chat
        closeModal();
    } else {
        alert('Failed to create chat.');
    }
}

async function saveChat(messages) {
    const chat_id = currentChatId; // Store the current chat ID in a global variable
    const response = await fetch('http://127.0.0.1:5000/save_chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, chat_id })
    });

    if (!response.ok) {
        alert('Failed to save chat.');
    }
}

// Function to clear the chat area
function clearChatArea() {
    document.getElementById('messages').innerHTML = '';
}


// Function to update the previous chats section
function updatePreviousChats(previousChats, currentChat) {
    const previousChatsDiv = document.getElementById('previousChats');
    previousChatsDiv.innerHTML = ''; // Clear existing chats

    previousChats.forEach(chat => {
        const chatElement = document.createElement('div');
        chatElement.textContent = chat.name;
        chatElement.classList.add('chat-item');
        if (chat.id === currentChat) {
            chatElement.classList.add('current-chat');
        }
        previousChatsDiv.appendChild(chatElement);
    });
}