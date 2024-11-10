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

function displayMessage(text, sender) {
    const messagesDiv = document.getElementById('messages');

    // Create message wrapper
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);

    // Avatar div
    const avatarDiv = document.createElement('div');
    avatarDiv.classList.add('avatar');

    // Message content
    const messageContentDiv = document.createElement('div');
    messageContentDiv.classList.add('message-content');
    messageContentDiv.textContent = text;

    // Append elements based on sender (user or bot)
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(messageContentDiv);

    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll to the latest message
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
