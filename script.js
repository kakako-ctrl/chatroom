// Main application state
const state = {
    currentUser: null,
    isAdmin: false,
    messages: [],
    lastReset: new Date(),
    users: {
        // Default admin account
        "admin": { password: "admin123", isAdmin: true },
        // Sample regular user
        "user": { password: "user123", isAdmin: false }
    },
    activeUsers: []
};

// DOM Elements
const elements = {
    loginBtn: document.getElementById('login-btn'),
    signupBtn: document.getElementById('signup-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    authForms: document.getElementById('auth-forms'),
    chatContainer: document.getElementById('chat-container'),
    usernameDisplay: document.getElementById('username-display'),
    userRole: document.getElementById('user-role'),
    adminControls: document.getElementById('admin-controls'),
    createChannelBtn: document.getElementById('create-channel-btn'),
    userList: document.getElementById('user-list'),
    chatMessages: document.getElementById('chat-messages'),
    messageInput: document.getElementById('message-input'),
    sendBtn: document.getElementById('send-btn'),
    lastReset: document.getElementById('last-reset')
};

// Initialize the app
function init() {
    // Load saved data from localStorage
    loadData();
    
    // Check if chat needs to be reset
    checkReset();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update UI based on current state
    updateUI();
    
    // Simulate active users (in a real app, this would come from a server)
    simulateActiveUsers();
}

function loadData() {
    // Load users and messages from localStorage
    const savedUsers = localStorage.getItem('hackerChatUsers');
    const savedMessages = localStorage.getItem('hackerChatMessages');
    const savedReset = localStorage.getItem('hackerChatLastReset');
    
    if (savedUsers) {
        state.users = JSON.parse(savedUsers);
    }
    
    if (savedMessages) {
        state.messages = JSON.parse(savedMessages);
    }
    
    if (savedReset) {
        state.lastReset = new Date(savedReset);
    }
    
    // Check if user is already logged in
    const loggedInUser = localStorage.getItem('hackerChatCurrentUser');
    if (loggedInUser && state.users[loggedInUser]) {
        state.currentUser = loggedInUser;
        state.isAdmin = state.users[loggedInUser].isAdmin || false;
        addActiveUser(loggedInUser, state.isAdmin);
    }
}

function saveData() {
    localStorage.setItem('hackerChatUsers', JSON.stringify(state.users));
    localStorage.setItem('hackerChatMessages', JSON.stringify(state.messages));
    localStorage.setItem('hackerChatLastReset', state.lastReset.toISOString());
    
    if (state.currentUser) {
        localStorage.setItem('hackerChatCurrentUser', state.currentUser);
    } else {
        localStorage.removeItem('hackerChatCurrentUser');
    }
}

function checkReset() {
    const now = new Date();
    const hoursSinceReset = (now - state.lastReset) / (1000 * 60 * 60);
    
    if (hoursSinceReset >= 24) {
        // Reset messages
        state.messages = [];
        state.lastReset = now;
        
        // Add system message about reset
        state.messages.push({
            type: 'system',
            text: 'System: Chat history has been reset as part of the 24-hour cycle.',
            timestamp: now
        });
        
        saveData();
    }
}

function setupEventListeners() {
    // Auth buttons
    elements.loginBtn.addEventListener('click', showLoginForm);
    elements.signupBtn.addEventListener('click', showSignupForm);
    elements.logoutBtn.addEventListener('click', logout);
    
    // Chat functionality
    elements.sendBtn.addEventListener('click', sendMessage);
    elements.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Admin functionality
    elements.createChannelBtn.addEventListener('click', createChannel);
}

function updateUI() {
    // Show/hide auth and chat based on login state
    if (state.currentUser) {
        elements.authForms.classList.add('hidden');
        elements.chatContainer.classList.remove('hidden');
        elements.loginBtn.style.display = 'none';
        elements.signupBtn.style.display = 'none';
        elements.logoutBtn.style.display = 'block';
        
        // Update username display
        elements.usernameDisplay.textContent = `${state.currentUser}@hackerchat:~$`;
        elements.userRole.textContent = state.isAdmin ? '[ADMIN]' : '';
        
        // Show admin controls if user is admin
        if (state.isAdmin) {
            elements.adminControls.classList.remove('hidden');
        } else {
            elements.adminControls.classList.add('hidden');
        }
    } else {
        elements.authForms.classList.remove('hidden');
        elements.chatContainer.classList.add('hidden');
        elements.loginBtn.style.display = 'block';
        elements.signupBtn.style.display = 'block';
        elements.logoutBtn.style.display = 'none';
    }
    
    // Update last reset time display
    elements.lastReset.textContent = state.lastReset.toLocaleString();
    
    // Update chat display
    updateChatDisplay();
    
    // Update active users list
    updateActiveUsersList();
}

function updateChatDisplay() {
    elements.chatMessages.innerHTML = '';
    
    // Add system message about reset
    const systemMsg = document.createElement('div');
    systemMsg.className = 'system-message';
    systemMsg.textContent = `System: Chat history resets every 24 hours. Last reset: ${state.lastReset.toLocaleString()}`;
    elements.chatMessages.appendChild(systemMsg);
    
    // Add messages to chat
    state.messages.forEach(msg => {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message';
        
        if (msg.type === 'system') {
            msgDiv.className = 'system-message';
            msgDiv.textContent = msg.text;
        } else {
            const timestamp = new Date(msg.timestamp).toLocaleTimeString();
            const usernameClass = msg.isAdmin ? 'username admin' : 'username';
            msgDiv.innerHTML = `
                <span class="${usernameClass}">${msg.username}${msg.isAdmin ? ' [ADMIN]' : ''}</span>
                <span class="timestamp">${timestamp}</span>: ${msg.text}
            `;
        }
        
        elements.chatMessages.appendChild(msgDiv);
    });
    
    // Scroll to bottom
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

// Auth functions
function showLoginForm() {
    elements.authForms.innerHTML = `
        <div class="auth-form">
            <h2>LOGIN</h2>
            <input type="text" id="login-username" placeholder="Username" autocomplete="off">
            <input type="password" id="login-password" placeholder="Password" autocomplete="off">
            <button id="submit-login">ACCESS SYSTEM</button>
            <div id="login-error" style="color: #f00; margin-top: 10px;"></div>
        </div>
    `;
    
    document.getElementById('submit-login').addEventListener('click', login);
}

function showSignupForm() {
    elements.authForms.innerHTML = `
        <div class="auth-form">
            <h2>SIGN UP</h2>
            <input type="text" id="signup-username" placeholder="Username" autocomplete="off">
            <input type="password" id="signup-password" placeholder="Password" autocomplete="off">
            <input type="password" id="signup-confirm" placeholder="Confirm Password" autocomplete="off">
            <button id="submit-signup">CREATE ACCOUNT</button>
            <div id="signup-error" style="color: #f00; margin-top: 10px;"></div>
        </div>
    `;
    
    document.getElementById('submit-signup').addEventListener('click', signup);
}

function login() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    
    if (!username || !password) {
        errorDiv.textContent = 'Username and password are required';
        return;
    }
    
    if (!state.users[username]) {
        errorDiv.textContent = 'User not found';
        return;
    }
    
    // In a real app, you would use proper password hashing and comparison
    if (state.users[username].password !== password) {
        errorDiv.textContent = 'Incorrect password';
        return;
    }
    
    // Login successful
    state.currentUser = username;
    state.isAdmin = state.users[username].isAdmin || false;
    addActiveUser(username, state.isAdmin);
    saveData();
    updateUI();
}

function signup() {
    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    const errorDiv = document.getElementById('signup-error');
    
    if (!username || !password) {
        errorDiv.textContent = 'Username and password are required';
        return;
    }
    
    if (password !== confirm) {
        errorDiv.textContent = 'Passwords do not match';
        return;
    }
    
    if (state.users[username]) {
        errorDiv.textContent = 'Username already exists';
        return;
    }
    
    // In a real app, you would hash the password before storing it
    state.users[username] = { password, isAdmin: false };
    state.currentUser = username;
    state.isAdmin = false;
    addActiveUser(username, false);
    saveData();
    updateUI();
}

function logout() {
    removeActiveUser(state.currentUser);
    state.currentUser = null;
    state.isAdmin = false;
    saveData();
    updateUI();
}

// Chat functions
function sendMessage() {
    if (!state.currentUser) return;
    
    const messageText = elements.messageInput.value.trim();
    if (!messageText) return;
    
    const newMessage = {
        username: state.currentUser,
        text: messageText,
        timestamp: new Date().toISOString(),
        isAdmin: state.isAdmin
    };
    
    state.messages.push(newMessage);
    saveData();
    updateChatDisplay();
    
    // Clear input
    elements.messageInput.value = '';
}

// Admin functions
function createChannel() {
    if (!state.isAdmin) return;
    
    const channelName = prompt("Enter new channel name (e.g., #secret):");
    if (!channelName) return;
    
    // In a real implementation, this would create a new channel
    alert(`Admin: Channel "${channelName}" created! (Note: This demo only has one global chat)`);
}

// Active users functions
function addActiveUser(username, isAdmin) {
    // Remove if already exists
    removeActiveUser(username);
    
    state.activeUsers.push({ username, isAdmin });
    updateActiveUsersList();
}

function removeActiveUser(username) {
    state.activeUsers = state.activeUsers.filter(user => user.username !== username);
    updateActiveUsersList();
}

function updateActiveUsersList() {
    elements.userList.innerHTML = '';
    
    state.activeUsers.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user.username;
        if (user.isAdmin) {
            li.classList.add('admin');
        }
        elements.userList.appendChild(li);
    });
}

// Simulate some active users (for demo purposes)
function simulateActiveUsers() {
    if (state.currentUser) {
        // Add some fake users to make it look active
        const demoUsers = [
            { username: "hacker42", isAdmin: false },
            { username: "cyberghost", isAdmin: false },
            { username: "root", isAdmin: true }
        ];
        
        demoUsers.forEach(user => {
            if (user.username !== state.currentUser) {
                state.activeUsers.push(user);
            }
        });
        
        updateActiveUsersList();
    }
}

// Initialize the app when the page loads
window.addEventListener('DOMContentLoaded', init);
