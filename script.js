// Main application state
const state = {
    currentUser: null,
    currentGroup: '#general',
    messages: [],
    lastReset: new Date(),
    users: {},
    groups: ['#general', '#code-sharing', '#off-topic']
};

// DOM Elements
const elements = {
    loginBtn: document.getElementById('login-btn'),
    signupBtn: document.getElementById('signup-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    authForms: document.getElementById('auth-forms'),
    chatContainer: document.getElementById('chat-container'),
    usernameDisplay: document.getElementById('username-display'),
    groupList: document.getElementById('group-list'),
    chatMessages: document.getElementById('chat-messages'),
    messageInput: document.getElementById('message-input'),
    sendBtn: document.getElementById('send-btn'),
    createGroupBtn: document.getElementById('create-group-btn'),
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
}

function loadData() {
    // Load users and messages from localStorage
    const savedUsers = localStorage.getItem('hackerChatUsers');
    const savedMessages = localStorage.getItem('hackerChatMessages');
    const savedReset = localStorage.getItem('hackerChatLastReset');
    const savedGroups = localStorage.getItem('hackerChatGroups');
    
    if (savedUsers) {
        state.users = JSON.parse(savedUsers);
    }
    
    if (savedMessages) {
        state.messages = JSON.parse(savedMessages);
    }
    
    if (savedReset) {
        state.lastReset = new Date(savedReset);
    }
    
    if (savedGroups) {
        state.groups = JSON.parse(savedGroups);
    }
    
    // Check if user is already logged in
    const loggedInUser = localStorage.getItem('hackerChatCurrentUser');
    if (loggedInUser && state.users[loggedInUser]) {
        state.currentUser = loggedInUser;
    }
}

function saveData() {
    localStorage.setItem('hackerChatUsers', JSON.stringify(state.users));
    localStorage.setItem('hackerChatMessages', JSON.stringify(state.messages));
    localStorage.setItem('hackerChatLastReset', state.lastReset.toISOString());
    localStorage.setItem('hackerChatGroups', JSON.stringify(state.groups));
    
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
    
    // Group functionality
    elements.createGroupBtn.addEventListener('click', createGroup);
    
    // Group selection
    elements.groupList.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI') {
            // Remove active class from all groups
            document.querySelectorAll('#group-list li').forEach(li => {
                li.classList.remove('active');
            });
            
            // Add active class to clicked group
            e.target.classList.add('active');
            
            // Update current group
            state.currentGroup = e.target.textContent;
            updateChatDisplay();
        }
    });
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
    } else {
        elements.authForms.classList.remove('hidden');
        elements.chatContainer.classList.add('hidden');
        elements.loginBtn.style.display = 'block';
        elements.signupBtn.style.display = 'block';
        elements.logoutBtn.style.display = 'none';
    }
    
    // Update last reset time display
    elements.lastReset.textContent = state.lastReset.toLocaleString();
    
    // Update group list
    updateGroupList();
    
    // Update chat display
    updateChatDisplay();
}

function updateGroupList() {
    elements.groupList.innerHTML = '';
    state.groups.forEach(group => {
        const li = document.createElement('li');
        li.textContent = group;
        if (group === state.currentGroup) {
            li.classList.add('active');
        }
        elements.groupList.appendChild(li);
    });
}

function updateChatDisplay() {
    elements.chatMessages.innerHTML = '';
    
    // Add system message about reset
    const systemMsg = document.createElement('div');
    systemMsg.className = 'system-message';
    systemMsg.textContent = `System: Chat history resets every 24 hours. Last reset: ${state.lastReset.toLocaleString()}`;
    elements.chatMessages.appendChild(systemMsg);
    
    // Filter messages for current group
    const groupMessages = state.messages.filter(msg => msg.group === state.currentGroup);
    
    // Add messages to chat
    groupMessages.forEach(msg => {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message';
        
        if (msg.type === 'system') {
            msgDiv.className = 'system-message';
            msgDiv.textContent = msg.text;
        } else {
            const timestamp = new Date(msg.timestamp).toLocaleTimeString();
            msgDiv.innerHTML = `
                <span class="username">${msg.username}</span>
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
            <input type="text" id="login-username" placeholder="Username">
            <input type="password" id="login-password" placeholder="Password">
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
            <input type="text" id="signup-username" placeholder="Username">
            <input type="password" id="signup-password" placeholder="Password">
            <input type="password" id="signup-confirm" placeholder="Confirm Password">
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
    state.users[username] = { password };
    state.currentUser = username;
    saveData();
    updateUI();
}

function logout() {
    state.currentUser = null;
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
        group: state.currentGroup
    };
    
    state.messages.push(newMessage);
    saveData();
    updateChatDisplay();
    
    // Clear input
    elements.messageInput.value = '';
}

// Group functions
function createGroup() {
    if (!state.currentUser) return;
    
    const groupName = prompt('Enter new group name (start with #):');
    if (!groupName) return;
    
    if (!groupName.startsWith('#')) {
        alert('Group names must start with #');
        return;
    }
    
    if (state.groups.includes(groupName)) {
        alert('Group already exists');
        return;
    }
    
    state.groups.push(groupName);
    saveData();
    updateGroupList();
}

// Initialize the app when the page loads
window.addEventListener('DOMContentLoaded', init);