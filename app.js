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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentEventId = null;
let currentEventData = null;
let editingPlayerId = null;

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
    generateDateOptions('eventDate');
    generateTimeOptions('eventTime');
    setupEventListeners();
    checkHash();
});

function setupEventListeners() {
    // Create Event Form
    document.getElementById('createForm').addEventListener('submit', createEvent);
    document.getElementById('eventLocation').addEventListener('change', handleLocationChange);
    
    // Signup Form
    document.getElementById('signupForm').addEventListener('submit', signupPlayer);
    
    // Navigation
    document.getElementById('backBtn').addEventListener('click', showHome);
    
    // Event Actions
    document.getElementById('editEventBtn').addEventListener('click', openEditEvent);
    document.getElementById('deleteEventBtn').addEventListener('click', deleteEvent);
    
    // Edit Event Modal
    document.getElementById('editEventLocation').addEventListener('change', handleEditLocationChange);
    document.getElementById('cancelEventEdit').addEventListener('click', closeEditEventModal);
    document.getElementById('saveEventEdit').addEventListener('click', saveEventEdit);
    
    // Edit Player Modal
    document.getElementById('cancelEdit').addEventListener('click', closeEditPlayerModal);
    document.getElementById('saveEdit').addEventListener('click', savePlayerEdit);
    
    // Hash change
    window.addEventListener('hashchange', checkHash);
}

// === DATE/TIME GENERATORS ===
function generateDateOptions(selectId) {
    const select = document.getElementById(selectId);
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    
    for (let i = 0; i < 60; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const label = `${date.getMonth() + 1}月${date.getDate()}日 (星期${weekdays[date.getDay()]})`;
        const option = document.createElement('option');
        option.value = label;
        option.textContent = label;
        select.appendChild(option);
    }
}

function generateTimeOptions(selectId) {
    const select = document.getElementById(selectId);
    
    for (let h = 7; h <= 23; h++) {
        for (let m = 0; m < 60; m += 30) {
            const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            select.appendChild(option);
        }
    }
}

// === NAVIGATION ===
function showHome() {
    document.getElementById('homePage').classList.remove('hidden');
    document.getElementById('eventPage').classList.add('hidden');
    currentEventId = null;
    currentEventData = null;
    window.location.hash = '';
}

function showEvent(eventId) {
    document.getElementById('homePage').classList.add('hidden');
    document.getElementById('eventPage').classList.remove('hidden');
    currentEventId = eventId;
    window.location.hash = eventId;
    loadEvent(eventId);
}

function checkHash() {
    const hash = window.location.hash.slice(1);
    if (hash) {
        showEvent(hash);
    } else {
        showHome();
    }
}

// === CREATE EVENT ===
function handleLocationChange() {
    const select = document.getElementById('eventLocation');
    const custom = document.getElementById('customLocation');
    if (select.value === 'other') {
        custom.classList.remove('hidden');
        custom.required = true;
    } else {
        custom.classList.add('hidden');
        custom.required = false;
    }
}

function createEvent(e) {
    e.preventDefault();
    const date = document.getElementById('eventDate').value;
    const time = document.getElementById('eventTime').value;
    let location = document.getElementById('eventLocation').value;
    
    if (location === 'other') {
        location = document.getElementById('customLocation').value.trim();
    }
    
    if (!date || !time || !location) return;
    
    const remark = document.getElementById('eventRemark').value.trim();
    
    db.ref('events').push({
        date,
        time,
        location,
        remark: remark || '',
        createdAt: Date.now()
    });
    
    document.getElementById('createForm').reset();
    document.getElementById('customLocation').classList.add('hidden');
}

// === LOAD EVENTS ===
db.ref('events').on('value', (snapshot) => {
    const eventsList = document.getElementById('eventsList');
    const noEvents = document.getElementById('noEvents');
    eventsList.innerHTML = '';
    
    const events = snapshot.val();
    if (!events) {
        noEvents.classList.remove('hidden');
        return;
    }
    
    noEvents.classList.add('hidden');
    const sorted = Object.entries(events).sort((a, b) => b[1].createdAt - a[1].createdAt);
    
    sorted.forEach(([id, event]) => {
        const count = event.players ? Object.keys(event.players).length : 0;
        const card = document.createElement('div');
        card.className = 'event-card';
        card.onclick = () => showEvent(id);
        card.innerHTML = `
            <div class="date">📅 ${event.date}</div>
            <div class="details">⏰ ${event.time} | 📍 ${event.location}</div>
            ${event.remark ? `<div class="remark">📝 ${escapeHtml(event.remark)}</div>` : ''}
            <div class="count">👥 ${count} 人已報名</div>
        `;
        eventsList.appendChild(card);
    });
});

// === LOAD SINGLE EVENT ===
function loadEvent(eventId) {
    db.ref(`events/${eventId}`).on('value', (snapshot) => {
        const event = snapshot.val();
        if (!event) {
            showHome();
            return;
        }
        
        currentEventData = event;
        
        document.getElementById('eventInfo').innerHTML = `
            <div class="date">📅 ${event.date}</div>
            <div class="time">⏰ ${event.time}</div>
            <div class="location">📍 ${event.location}</div>
            ${event.remark ? `<div class="remark">📝 ${escapeHtml(event.remark)}</div>` : ''}
        `;
        
        loadPlayers(event.players);
    });
}

function loadPlayers(players) {
    const list = document.getElementById('playerList');
    const countEl = document.getElementById('playerCount');
    const noPlayers = document.getElementById('noPlayers');
    
    list.innerHTML = '';
    
    if (!players) {
        countEl.textContent = '0';
        noPlayers.classList.remove('hidden');
        return;
    }
    
    noPlayers.classList.add('hidden');
    const arr = Object.entries(players).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
    countEl.textContent = arr.length;
    
    arr.forEach(([id, player], index) => {
        const li = document.createElement('li');
        li.className = 'player-item';
        
        let label = escapeHtml(player.name);
        if (player.type) {
            const typeClass = player.type === '主簽' ? 'player-type main-sign' : 'player-type';
            label += ` <span class="${typeClass}">[${player.type}]</span>`;
        }
        if (player.remark) label += ` <span class="player-remark">(${escapeHtml(player.remark)})</span>`;
        
        li.innerHTML = `
            <span class="number">${index + 1}.</span>
            <span class="name">${label}</span>
            <div class="actions">
                <button class="edit-btn" onclick="openEditPlayer('${id}')">✏️</button>
                <button class="delete-btn" onclick="deletePlayer('${id}')">❌</button>
            </div>
        `;
        list.appendChild(li);
    });
}

// === SIGNUP ===
function signupPlayer(e) {
    e.preventDefault();
    if (!currentEventId) return;
    
    const name = document.getElementById('playerName').value.trim();
    if (!name) return;
    
    const type = document.getElementById('playerType').value;
    const remark = document.getElementById('playerRemark').value.trim();
    
    db.ref(`events/${currentEventId}/players`).push({
        name,
        type: type || '',
        remark: remark || '',
        joinedAt: Date.now()
    });
    
    document.getElementById('signupForm').reset();
}

// === DELETE PLAYER ===
function deletePlayer(playerId) {
    if (!currentEventId) return;
    if (confirm('確定要刪除？')) {
        db.ref(`events/${currentEventId}/players/${playerId}`).remove();
    }
}

// === EDIT PLAYER ===
function openEditPlayer(playerId) {
    if (!currentEventData || !currentEventData.players) return;
    const player = currentEventData.players[playerId];
    if (!player) return;
    
    editingPlayerId = playerId;
    document.getElementById('editName').value = player.name;
    document.getElementById('editType').value = player.type || '';
    document.getElementById('editPlayerRemark').value = player.remark || '';
    document.getElementById('editModal').classList.remove('hidden');
}

function closeEditPlayerModal() {
    document.getElementById('editModal').classList.add('hidden');
    editingPlayerId = null;
}

function savePlayerEdit() {
    if (!currentEventId || !editingPlayerId) return;
    
    const name = document.getElementById('editName').value.trim();
    if (!name) return;
    
    const type = document.getElementById('editType').value;
    const remark = document.getElementById('editPlayerRemark').value.trim();
    
    db.ref(`events/${currentEventId}/players/${editingPlayerId}`).update({
        name,
        type: type || '',
        remark: remark || ''
    });
    
    closeEditPlayerModal();
}

// === EDIT EVENT ===
function openEditEvent() {
    if (!currentEventData) return;
    
    const dateSelect = document.getElementById('editEventDate');
    const timeSelect = document.getElementById('editEventTime');
    
    // Clear and regenerate
    dateSelect.innerHTML = '';
    timeSelect.innerHTML = '';
    generateDateOptions('editEventDate');
    generateTimeOptions('editEventTime');
    
    // Set values
    dateSelect.value = currentEventData.date;
    timeSelect.value = currentEventData.time;
    
    const locSelect = document.getElementById('editEventLocation');
    const customLoc = document.getElementById('editEventCustomLocation');
    const locations = ['北區運動場', '大埔廣福(細)', '大埔廣福公園(大)', '大埔運動場(太和)', '石門'];
    
    if (locations.includes(currentEventData.location)) {
        locSelect.value = currentEventData.location;
        customLoc.classList.add('hidden');
    } else {
        locSelect.value = 'other';
        customLoc.value = currentEventData.location;
        customLoc.classList.remove('hidden');
    }
    
    document.getElementById('editEventRemark').value = currentEventData.remark || '';
    document.getElementById('editEventModal').classList.remove('hidden');
}

function handleEditLocationChange() {
    const select = document.getElementById('editEventLocation');
    const custom = document.getElementById('editEventCustomLocation');
    if (select.value === 'other') {
        custom.classList.remove('hidden');
    } else {
        custom.classList.add('hidden');
    }
}

function closeEditEventModal() {
    document.getElementById('editEventModal').classList.add('hidden');
}

function saveEventEdit() {
    if (!currentEventId) return;
    
    const date = document.getElementById('editEventDate').value;
    const time = document.getElementById('editEventTime').value;
    let location = document.getElementById('editEventLocation').value;
    
    if (location === 'other') {
        location = document.getElementById('editEventCustomLocation').value.trim();
    }
    
    if (!date || !time || !location) return;
    
    const remark = document.getElementById('editEventRemark').value.trim();
    
    db.ref(`events/${currentEventId}`).update({
        date,
        time,
        location,
        remark: remark || ''
    });
    
    closeEditEventModal();
}

// === DELETE EVENT ===
function deleteEvent() {
    if (!currentEventId) return;
    if (confirm('確定要刪除成個場次？')) {
        db.ref(`events/${currentEventId}`).remove();
        showHome();
    }
}

// === UTILITY ===
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
