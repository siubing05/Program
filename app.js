// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyAYlpbZ4q5KqHL9eGh2tCMul1T4wynnOKo",
    authDomain: "football-signup-9a591.firebaseapp.com",
    databaseURL: "https://football-signup-9a591-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "football-signup-9a591",
    storageBucket: "football-signup-9a591.firebasestorage.app",
    messagingSenderId: "338089800203",
    appId: "1:338089800203:web:2e09e2948f9ab60a7e0d0e"
};

// Init Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// State
let currentEventId = null;
let editingPlayerId = null;

// DOM Elements
const homePage = document.getElementById('homePage');
const eventPage = document.getElementById('eventPage');
const createForm = document.getElementById('createForm');
const eventsList = document.getElementById('eventsList');
const noEvents = document.getElementById('noEvents');
const backBtn = document.getElementById('backBtn');
const deleteEventBtn = document.getElementById('deleteEventBtn');
const eventInfo = document.getElementById('eventInfo');
const signupForm = document.getElementById('signupForm');
const playerList = document.getElementById('playerList');
const playerCount = document.getElementById('playerCount');
const noPlayers = document.getElementById('noPlayers');
const editModal = document.getElementById('editModal');
const editName = document.getElementById('editName');
const cancelEdit = document.getElementById('cancelEdit');
const saveEdit = document.getElementById('saveEdit');

// Show/Hide Pages
function showHome() {
    homePage.classList.remove('hidden');
    eventPage.classList.add('hidden');
    currentEventId = null;
    window.location.hash = '';
}

function showEvent(eventId) {
    homePage.classList.add('hidden');
    eventPage.classList.remove('hidden');
    currentEventId = eventId;
    window.location.hash = eventId;
    loadEvent(eventId);
}

// Create Event
createForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const date = document.getElementById('eventDate').value.trim();
    const time = document.getElementById('eventTime').value.trim();
    const location = document.getElementById('eventLocation').value.trim();
    
    if (!date || !time || !location) return;
    
    const newEvent = db.ref('events').push();
    newEvent.set({
        date,
        time,
        location,
        createdAt: Date.now()
    });
    
    createForm.reset();
});

// Load Events List
db.ref('events').on('value', (snapshot) => {
    eventsList.innerHTML = '';
    const events = snapshot.val();
    
    if (!events) {
        noEvents.classList.remove('hidden');
        return;
    }
    
    noEvents.classList.add('hidden');
    
    // Sort by createdAt desc
    const sorted = Object.entries(events).sort((a, b) => b[1].createdAt - a[1].createdAt);
    
    sorted.forEach(([id, event]) => {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.onclick = () => showEvent(id);
        
        // Count players
        const playerCount = event.players ? Object.keys(event.players).length : 0;
        
        card.innerHTML = `
            <div class="date">📅 ${event.date}</div>
            <div class="details">⏰ ${event.time} | 📍 ${event.location}</div>
            <div class="count">👥 ${playerCount} 人已報名</div>
        `;
        eventsList.appendChild(card);
    });
});

// Load Single Event
function loadEvent(eventId) {
    db.ref(`events/${eventId}`).on('value', (snapshot) => {
        const event = snapshot.val();
        if (!event) {
            showHome();
            return;
        }
        
        eventInfo.innerHTML = `
            <div class="date">📅 ${event.date}</div>
            <div class="time">⏰ ${event.time}</div>
            <div class="location">📍 ${event.location}</div>
        `;
        
        // Load players
        playerList.innerHTML = '';
        const players = event.players;
        
        if (!players) {
            playerCount.textContent = '0';
            noPlayers.classList.remove('hidden');
            return;
        }
        
        noPlayers.classList.add('hidden');
        const playerArray = Object.entries(players).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
        playerCount.textContent = playerArray.length;
        
        playerArray.forEach(([id, player], index) => {
            const li = document.createElement('li');
            li.className = 'player-item';
            li.innerHTML = `
                <span class="number">${index + 1}.</span>
                <span class="name">${escapeHtml(player.name)}</span>
                <div class="actions">
                    <button class="edit-btn" onclick="openEdit('${id}', '${escapeHtml(player.name)}')">✏️</button>
                    <button class="delete-btn" onclick="deletePlayer('${id}')">❌</button>
                </div>
            `;
            playerList.appendChild(li);
        });
    });
}

// Sign Up
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('playerName').value.trim();
    if (!name || !currentEventId) return;
    
    db.ref(`events/${currentEventId}/players`).push({
        name,
        joinedAt: Date.now()
    });
    
    document.getElementById('playerName').value = '';
});

// Delete Player
function deletePlayer(playerId) {
    if (!currentEventId) return;
    if (confirm('確定要刪除？')) {
        db.ref(`events/${currentEventId}/players/${playerId}`).remove();
    }
}

// Edit Player
function openEdit(playerId, currentName) {
    editingPlayerId = playerId;
    editName.value = currentName;
    editModal.classList.remove('hidden');
    editName.focus();
}

cancelEdit.addEventListener('click', () => {
    editModal.classList.add('hidden');
    editingPlayerId = null;
});

saveEdit.addEventListener('click', () => {
    const newName = editName.value.trim();
    if (!newName || !currentEventId || !editingPlayerId) return;
    
    db.ref(`events/${currentEventId}/players/${editingPlayerId}`).update({
        name: newName
    });
    
    editModal.classList.add('hidden');
    editingPlayerId = null;
});

// Delete Event
deleteEventBtn.addEventListener('click', () => {
    if (!currentEventId) return;
    if (confirm('確定要刪除成個場次？')) {
        db.ref(`events/${currentEventId}`).remove();
        showHome();
    }
});

// Back Button
backBtn.addEventListener('click', showHome);

// Handle URL Hash
function checkHash() {
    const hash = window.location.hash.slice(1);
    if (hash) {
        showEvent(hash);
    } else {
        showHome();
    }
}

window.addEventListener('hashchange', checkHash);
window.addEventListener('load', checkHash);

// Generate date options (next 60 days)
function generateDateOptions() {
    const dateSelect = document.getElementById('eventDate');
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    
    for (let i = 0; i < 60; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekday = weekdays[date.getDay()];
        
        const label = `${month}月${day}日 (星期${weekday})`;
        const option = document.createElement('option');
        option.value = label;
        option.textContent = label;
        dateSelect.appendChild(option);
    }
}

// Generate time options (08:00 - 23:30)
function generateTimeOptions() {
    const timeSelect = document.getElementById('eventTime');
    
    for (let h = 7; h <= 23; h++) {
        for (let m = 0; m < 60; m += 30) {
            const hour = h.toString().padStart(2, '0');
            const min = m.toString().padStart(2, '0');
            const time = `${hour}:${min}`;
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            timeSelect.appendChild(option);
        }
    }
}

generateDateOptions();
generateTimeOptions();

// Utility
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
