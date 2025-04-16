// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDEXAMPLEEXAMPLEEXAMPLEEXAMPLE",
    authDomain: "hackerchat-example.firebaseapp.com",
    databaseURL: "https://hackerchat-example-default-rtdb.firebaseio.com",
    projectId: "hackerchat-example",
    storageBucket: "hackerchat-example.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef1234567890"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// Admin credentials
const ADMIN_CREDENTIALS = {
    email: "root@hackerchat.com",
    password: "toor123"
};

// Main application state
const state = {
    currentUser: null,
    isAdmin: false,
    messages: [],
    users: {},
    activeUsers: []
};

// DOM Elements (same as before)
const elements = { /* ... */ };

// Initialize the app
function init() {
    setupEventListeners();
    
    // Check auth state
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            handleSuccessfulLogin(user.email.replace(/@.*$/, ""));
        } else {
            // No user signed in
            updateUI();
        }
    });
}

function setupEventListeners() {
    // Auth buttons
    elements.loginBtn.addEventListener('click', showLoginForm);
    elements.signupBtn.addEventListener('click', showSignupForm);
    elements.logoutBtn.addEventListener('click', logout);
    
    // Chat functionality
    elements.sendBtn.addEventListener('click', sendMessage);
    elements.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    // Admin functionality
    elements.createChannelBtn.addEventListener('click', createChannel);
}

// Auth functions
function showLoginForm() {
    elements.authForms.innerHTML = `
        <div class="auth-form">
            <h2>LOGIN</h2>
            <input type="text" id="login-email" placeholder="Username or Email" autocomplete="off">
            <input type="password" id="login-password" placeholder="Password" autocomplete="off">
            <button id="submit-login">ACCESS SYSTEM</button>
            <div id="login-error" style="color: #f00; margin-top: 10px;"></div>
        </div>
    `;
    
    document.getElementById('submit-login').addEventListener('click', () => {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        // Check for admin login
        if (email === "root" || email === ADMIN_CREDENTIALS.email) {
            if (password === ADMIN_CREDENTIALS.password) {
                auth.signInWithEmailAndPassword(ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password)
                    .then(() => {})
                    .catch(error => {
                        document.getElementById('login-error').textContent = error.message;
                    });
                return;
            }
        }
        
        // Regular user login
        const emailToUse = email.includes('@') ? email : `${email}@hackerchat.com`;
        auth.signInWithEmailAndPassword(emailToUse, password)
            .then(() => {})
            .catch(error => {
                document.getElementById('login-error').textContent = error.message;
            });
    });
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
    
    document.getElementById('submit-signup').addEventListener('click', () => {
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
        
        if (username.toLowerCase() === "root") {
            errorDiv.textContent = 'Username "root" is reserved';
            return;
        }
        
        auth.createUserWithEmailAndPassword(`${username}@hackerchat.com`, password)
            .then(() => {
                // Add user to database
                database.ref('users/' + username).set({
                    username: username,
                    isAdmin: false,
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                });
            })
            .catch(error => {
                errorDiv.textContent = error.message;
            });
    });
}

function handleSuccessfulLogin(username) {
    state.currentUser = username;
    
    // Check if admin
    database.ref('users/' + username).once('value').then(snapshot => {
        const userData = snapshot.val();
        state.isAdmin = userData && userData.isAdmin;
        
        // Update presence
        const userStatusRef = database.ref('status/' + username);
               
        // Set user to online
        database.ref('.info/connected').on('value', function(snapshot) {
            if (snapshot.val() === false) return;
            
            userStatusRef.onDisconnect().set({
                online: false,
                lastChanged: firebase.database.ServerValue.TIMESTAMP
            }).then(function() {
                userStatusRef.set({
                    online: true,
                    lastChanged: firebase.database.ServerValue.TIMESTAMP
                });
            });
        });
        
        // Load messages and setup listeners
        setupRealTimeListeners();
        updateUI();
    });
}

function setupRealTimeListeners() {
    // Messages listener
    database.ref('messages').limitToLast(100).on('value', snapshot => {
        state.messages = [];
        snapshot.forEach(childSnapshot => {
            state.messages.push(childSnapshot.val());
        });
        updateChatDisplay();
    });
    
    // Active users listener
    database.ref('status').on('value', snapshot => {
        state.activeUsers = [];
        snapshot.forEach(childSnapshot => {
            const userStatus = childSnapshot.val();
            if (userStatus.online) {
                database.ref('users/' + childSnapshot.key).once('value', userSnapshot => {
                    const userData = userSnapshot.val();
                    state.activeUsers.push({
                        username: childSnapshot.key,
                        isAdmin: userData ? userData.isAdmin : false
                    });
                    updateActiveUsersList();
                });
            }
        });
    });
}

function logout() {
    auth.signOut().then(() => {
        state.currentUser = null;
        state.isAdmin = false;
        updateUI();
    });
}

// Chat functions
function sendMessage() {
    if (!state.currentUser) return;
    
    const messageText = elements.messageInput.value.trim();
    if (!messageText) return;
    
    const newMessage = {
        username: state.currentUser,
        text: messageText,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        isAdmin: state.isAdmin
    };
    
    database.ref('messages').push(newMessage);
    elements.messageInput.value = '';
}

// Admin functions
function createChannel() {
    if (!state.isAdmin) return;
    
    const channelName = prompt("Enter new channel name (e.g., #secret):");
    if (!channelName) return;
    
    database.ref('channels/' + channelName.replace('#', '')).set({
        name: channelName,
        createdBy: state.currentUser,
        createdAt: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        alert(`Channel "${channelName}" created!`);
    });
}

// UI Update functions (same as before)
function updateUI() { /* ... */ }
function updateChatDisplay() { /* ... */ }
function updateActiveUsersList() { /* ... */ }

// Initialize the app
window.addEventListener('DOMContentLoaded', init);
