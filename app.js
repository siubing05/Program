// ===== State =====
const state = {
    match: {
        date: '2026年2月8日 (六)',
        time: '19:30 - 21:30',
        location: '上水足球場',
        fee: '$50/人',
        maxPlayers: 16
    },
    players: []
};

// ===== LocalStorage Keys =====
const STORAGE_KEYS = {
    MATCH: 'football_match',
    PLAYERS: 'football_players'
};

// ===== DOM Elements =====
const elements = {
    // Match info
    matchDate: document.getElementById('matchDate'),
    matchTime: document.getElementById('matchTime'),
    matchLocation: document.getElementById('matchLocation'),
    matchFee: document.getElementById('matchFee'),
    currentCount: document.getElementById('currentCount'),
    maxCount: document.getElementById('maxCount'),
    listCount: document.getElementById('listCount'),
    
    // Form
    signupForm: document.getElementById('signupForm'),
    playerName: document.getElementById('playerName'),
    submitBtn: document.getElementById('submitBtn'),
    formHint: document.getElementById('formHint'),
    
    // List
    playerList: document.getElementById('playerList'),
    emptyState: document.getElementById('emptyState'),
    
    // Actions
    shareBtn: document.getElementById('shareBtn'),
    clearBtn: document.getElementById('clearBtn'),
    editMatchBtn: document.getElementById('editMatchBtn'),
    
    // Modal
    editModal: document.getElementById('editModal'),
    editForm: document.getElementById('editForm'),
    cancelEdit: document.getElementById('cancelEdit'),
    editDate: document.getElementById('editDate'),
    editTime: document.getElementById('editTime'),
    editLocation: document.getElementById('editLocation'),
    editFee: document.getElementById('editFee'),
    editMax: document.getElementById('editMax'),
    
    // Match card
    matchCard: document.querySelector('.match-card')
};

// ===== Initialize =====
function init() {
    loadFromStorage();
    renderMatchInfo();
    renderPlayerList();
    setupEventListeners();
}

// ===== Storage =====
function loadFromStorage() {
    const savedMatch = localStorage.getItem(STORAGE_KEYS.MATCH);
    const savedPlayers = localStorage.getItem(STORAGE_KEYS.PLAYERS);
    
    if (savedMatch) {
        state.match = JSON.parse(savedMatch);
    }
    if (savedPlayers) {
        state.players = JSON.parse(savedPlayers);
    }
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEYS.MATCH, JSON.stringify(state.match));
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(state.players));
}

// ===== Render =====
function renderMatchInfo() {
    elements.matchDate.textContent = state.match.date;
    elements.matchTime.textContent = state.match.time;
    elements.matchLocation.textContent = state.match.location;
    elements.matchFee.textContent = state.match.fee;
    elements.maxCount.textContent = state.match.maxPlayers;
    updatePlayerCount();
}

function renderPlayerList() {
    const count = state.players.length;
    
    // Update counts
    updatePlayerCount();
    
    // Show/hide empty state
    if (count === 0) {
        elements.emptyState.classList.remove('hidden');
        elements.playerList.innerHTML = '';
        return;
    }
    
    elements.emptyState.classList.add('hidden');
    
    // Render players
    elements.playerList.innerHTML = state.players.map((player, index) => `
        <li class="player-item" data-id="${player.id}">
            <span class="number">${index + 1}</span>
            <span class="name">${escapeHtml(player.name)}</span>
            <span class="time">${formatTime(player.timestamp)}</span>
            <button class="btn-remove" onclick="removePlayer('${player.id}')" title="移除">✕</button>
        </li>
    `).join('');
}

function updatePlayerCount() {
    const count = state.players.length;
    const max = state.match.maxPlayers;
    
    elements.currentCount.textContent = count;
    elements.listCount.textContent = count;
    
    // Check if full
    if (count >= max) {
        elements.matchCard.classList.add('full');
        elements.submitBtn.disabled = true;
        elements.submitBtn.textContent = '已滿';
    } else {
        elements.matchCard.classList.remove('full');
        elements.submitBtn.disabled = false;
        elements.submitBtn.textContent = '報名';
    }
}

// ===== Event Listeners =====
function setupEventListeners() {
    // Sign up form
    elements.signupForm.addEventListener('submit', handleSignup);
    
    // Edit modal
    elements.editMatchBtn.addEventListener('click', openEditModal);
    elements.cancelEdit.addEventListener('click', closeEditModal);
    elements.editForm.addEventListener('submit', handleEditSave);
    elements.editModal.addEventListener('click', (e) => {
        if (e.target === elements.editModal) closeEditModal();
    });
    
    // Actions
    elements.shareBtn.addEventListener('click', handleShare);
    elements.clearBtn.addEventListener('click', handleClear);
}

// ===== Handlers =====
function handleSignup(e) {
    e.preventDefault();
    
    const name = elements.playerName.value.trim();
    
    if (!name) {
        showHint('請輸入名字', 'error');
        return;
    }
    
    if (state.players.length >= state.match.maxPlayers) {
        showHint('已經滿人喇！', 'error');
        return;
    }
    
    // Check duplicate
    if (state.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        showHint('呢個名已經報咗名', 'error');
        return;
    }
    
    // Add player
    const player = {
        id: generateId(),
        name: name,
        timestamp: Date.now()
    };
    
    state.players.push(player);
    saveToStorage();
    renderPlayerList();
    
    // Clear form
    elements.playerName.value = '';
    showHint(`${name} 報名成功！🎉`, 'success');
}

function removePlayer(id) {
    const player = state.players.find(p => p.id === id);
    if (!player) return;
    
    if (confirm(`確定要移除 ${player.name}？`)) {
        state.players = state.players.filter(p => p.id !== id);
        saveToStorage();
        renderPlayerList();
        showHint(`已移除 ${player.name}`, '');
    }
}

function openEditModal() {
    elements.editDate.value = state.match.date;
    elements.editTime.value = state.match.time;
    elements.editLocation.value = state.match.location;
    elements.editFee.value = state.match.fee;
    elements.editMax.value = state.match.maxPlayers;
    elements.editModal.classList.add('active');
}

function closeEditModal() {
    elements.editModal.classList.remove('active');
}

function handleEditSave(e) {
    e.preventDefault();
    
    state.match.date = elements.editDate.value || state.match.date;
    state.match.time = elements.editTime.value || state.match.time;
    state.match.location = elements.editLocation.value || state.match.location;
    state.match.fee = elements.editFee.value || state.match.fee;
    state.match.maxPlayers = parseInt(elements.editMax.value) || state.match.maxPlayers;
    
    saveToStorage();
    renderMatchInfo();
    renderPlayerList();
    closeEditModal();
}

function handleShare() {
    const text = generateShareText();
    
    if (navigator.share) {
        navigator.share({
            title: '⚽ 踢波報名',
            text: text
        }).catch(() => {
            copyToClipboard(text);
        });
    } else {
        copyToClipboard(text);
    }
}

function handleClear() {
    if (state.players.length === 0) {
        showHint('冇嘢要清除', '');
        return;
    }
    
    if (confirm(`確定要清除全部 ${state.players.length} 個報名？`)) {
        state.players = [];
        saveToStorage();
        renderPlayerList();
        showHint('已清除全部報名', '');
    }
}

// ===== Utilities =====
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${mins}`;
}

function showHint(message, type) {
    elements.formHint.textContent = message;
    elements.formHint.className = 'hint ' + type;
    
    if (type === 'success') {
        setTimeout(() => {
            elements.formHint.textContent = '';
        }, 3000);
    }
}

function generateShareText() {
    const m = state.match;
    const count = state.players.length;
    const names = state.players.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
    
    return `⚽ 踢波報名

📅 ${m.date}
⏰ ${m.time}
📍 ${m.location}
💰 ${m.fee}

👥 已報名 (${count}/${m.maxPlayers}):
${names || '(未有人報名)'}

快啲報名啦！💪`;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showHint('已複製到剪貼簿！', 'success');
    }).catch(() => {
        showHint('複製失敗', 'error');
    });
}

// ===== Start =====
init();
