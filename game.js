// ========== SOL Tap - Game Logic ==========

const SAVE_KEY = 'soltap_save_v1';
const ENERGY_MAX = 100;
const ENERGY_REGEN_MS = 3000; // 1 energy every 3 seconds
const COMBO_TIMEOUT_MS = 800;
const LEVEL_THRESHOLD = 1000; // points per level
const DAILY_BONUS_BASE = 50;

// Boost definitions (price in Telegram Stars)
const BOOSTS = {
  multiplier2x: { name: '2x Multiplier', desc: '2x points for 1 hour', price: 50, duration: 3600000, icon: '\u26A1' },
  energyRefill: { name: 'Energy Refill', desc: 'Instantly refill all energy', price: 25, duration: 0, icon: '\uD83D\uDD0B' },
  autoTap:      { name: 'Auto-Tap', desc: 'Auto-tap for 30 minutes', price: 100, duration: 1800000, icon: '\uD83E\uDD16' },
  megaTap:      { name: 'Mega Tap', desc: '5x tap power for 30 min', price: 200, duration: 1800000, icon: '\uD83D\uDD25' }
};

// Simulated leaderboard names
const FAKE_NAMES = [
  'CryptoKing', 'SolWhale', 'DiamondHands', 'MoonBoi', 'DeFiDegen',
  'AlphaHunter', 'TokenMaster', 'BlockRunner', 'ChainGang', 'StakeKing',
  'YieldFarmer', 'LiquidApe', 'GasOptimizer', 'MEVBot', 'ValidatorX',
  'RektProof', 'BullishAF', 'BearSlayer', 'PumpItUp', 'WagmiWizard'
];

// ========== State ==========
let state = {
  points: 0,
  totalTaps: 0,
  energy: ENERGY_MAX,
  level: 1,
  combo: 0,
  lastTapTime: 0,
  lastEnergyRegen: Date.now(),
  lastDailyBonus: null,
  loginStreak: 0,
  boosts: {
    multiplier2x: null,  // expiry timestamp or null
    autoTap: null
  },
  megaTapExpiry: null,
  leaderboardSeed: null // for consistent fake leaderboard
};

let autoTapInterval = null;
let comboTimeout = null;

// ========== Telegram WebApp ==========
const tg = window.Telegram?.WebApp;

function initTelegram() {
  if (!tg) return;
  tg.ready();
  tg.expand();
  tg.setHeaderColor('#0f0f1a');
  tg.setBackgroundColor('#0f0f1a');
  // Disable closing confirmation when game is active
  if (tg.enableClosingConfirmation) tg.enableClosingConfirmation();
}

function getTelegramUser() {
  if (tg?.initDataUnsafe?.user) {
    return {
      id: tg.initDataUnsafe.user.id,
      name: tg.initDataUnsafe.user.first_name || 'Player',
      username: tg.initDataUnsafe.user.username || ''
    };
  }
  return { id: 0, name: 'Player', username: '' };
}

// ========== Save / Load ==========
function saveState() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch(e) {}
}

function loadState() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      state = { ...state, ...parsed };
    }
  } catch(e) {}
  // Generate consistent leaderboard seed if none
  if (!state.leaderboardSeed) {
    state.leaderboardSeed = Math.floor(Math.random() * 100000);
    saveState();
  }
}

// ========== Core Game ==========
function getLevel() {
  return Math.floor(state.points / LEVEL_THRESHOLD) + 1;
}

function getBaseTapValue() {
  return Math.floor(1 + (state.level - 1) * 0.5);
}

function getMultiplier() {
  let mult = 1;
  // Boost: 2x
  if (state.boosts.multiplier2x && Date.now() < state.boosts.multiplier2x) {
    mult *= 2;
  }
  // Boost: mega tap 5x
  if (state.megaTapExpiry && Date.now() < state.megaTapExpiry) {
    mult *= 5;
  }
  // Combo multiplier
  if (state.combo >= 20) mult *= 3;
  else if (state.combo >= 10) mult *= 2;
  else if (state.combo >= 5) mult *= 1.5;
  return mult;
}

function getComboLabel() {
  if (state.combo >= 20) return 'INSANE x3';
  if (state.combo >= 10) return 'FIRE x2';
  if (state.combo >= 5) return 'COMBO x1.5';
  return '';
}

function tap() {
  if (state.energy <= 0) {
    showToast('No energy! Wait to recharge or buy a refill.');
    vibrateShort();
    return 0;
  }

  const now = Date.now();

  // Combo logic
  if (now - state.lastTapTime < COMBO_TIMEOUT_MS) {
    state.combo++;
  } else {
    state.combo = 1;
  }
  state.lastTapTime = now;

  // Reset combo timeout
  clearTimeout(comboTimeout);
  comboTimeout = setTimeout(() => {
    state.combo = 0;
    updateComboDisplay();
  }, COMBO_TIMEOUT_MS);

  // Calculate points earned
  const base = getBaseTapValue();
  const mult = getMultiplier();
  const earned = Math.floor(base * mult);

  state.points += earned;
  state.totalTaps++;
  state.energy = Math.max(0, state.energy - 1);

  // Level check
  const newLevel = getLevel();
  if (newLevel > state.level) {
    state.level = newLevel;
    showToast(`Level Up! You're now level ${state.level}`);
    vibrateHeavy();
  }

  saveState();
  return earned;
}

// ========== Energy Regen ==========
function regenEnergy() {
  const now = Date.now();
  const elapsed = now - state.lastEnergyRegen;
  const regenCount = Math.floor(elapsed / ENERGY_REGEN_MS);

  if (regenCount > 0 && state.energy < ENERGY_MAX) {
    state.energy = Math.min(ENERGY_MAX, state.energy + regenCount);
    state.lastEnergyRegen = now - (elapsed % ENERGY_REGEN_MS);
    saveState();
  }
}

// ========== Daily Bonus ==========
function checkDailyBonus() {
  const today = new Date().toDateString();
  if (state.lastDailyBonus === today) return false;

  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (state.lastDailyBonus === yesterday) {
    state.loginStreak++;
  } else {
    state.loginStreak = 1;
  }

  state.lastDailyBonus = today;
  const bonus = DAILY_BONUS_BASE * state.loginStreak;
  state.points += bonus;
  saveState();
  return { bonus, streak: state.loginStreak };
}

// ========== Boosts ==========
function purchaseBoost(boostId) {
  const boost = BOOSTS[boostId];
  if (!boost) return;

  if (tg) {
    // Send purchase request to bot backend
    // The bot will create a Stars invoice and send it back
    const payload = JSON.stringify({
      action: 'buy_boost',
      boost: boostId,
      price: boost.price,
      userId: getTelegramUser().id
    });

    // Try direct invoice if available
    if (tg.openInvoice) {
      // Create invoice URL via bot - for now send data to bot
      tg.sendData(payload);
      showToast('Opening payment...');
    } else {
      tg.sendData(payload);
      showToast('Purchase request sent to bot!');
    }
  } else {
    // Dev mode - apply boost directly
    applyBoost(boostId);
  }
}

function applyBoost(boostId) {
  const now = Date.now();

  switch(boostId) {
    case 'multiplier2x':
      state.boosts.multiplier2x = now + BOOSTS.multiplier2x.duration;
      showToast('2x Multiplier activated for 1 hour!');
      break;
    case 'energyRefill':
      state.energy = ENERGY_MAX;
      showToast('Energy fully restored!');
      break;
    case 'autoTap':
      state.boosts.autoTap = now + BOOSTS.autoTap.duration;
      startAutoTap();
      showToast('Auto-Tap activated for 30 minutes!');
      break;
    case 'megaTap':
      state.megaTapExpiry = now + BOOSTS.megaTap.duration;
      showToast('MEGA TAP! 5x power for 30 minutes!');
      break;
  }

  vibrateHeavy();
  saveState();
  updateUI();
}

function startAutoTap() {
  stopAutoTap();
  autoTapInterval = setInterval(() => {
    if (state.boosts.autoTap && Date.now() < state.boosts.autoTap) {
      if (state.energy > 0) {
        const earned = tap();
        if (earned > 0) {
          showFloatingPoints(earned);
          updateUI();
        }
      }
    } else {
      stopAutoTap();
      state.boosts.autoTap = null;
      saveState();
      updateUI();
    }
  }, 500);
}

function stopAutoTap() {
  if (autoTapInterval) {
    clearInterval(autoTapInterval);
    autoTapInterval = null;
  }
}

function getActiveBoosts() {
  const now = Date.now();
  const active = [];
  if (state.boosts.multiplier2x && now < state.boosts.multiplier2x) {
    const remaining = Math.ceil((state.boosts.multiplier2x - now) / 60000);
    active.push({ label: `2x (${remaining}m)`, icon: '\u26A1' });
  }
  if (state.boosts.autoTap && now < state.boosts.autoTap) {
    const remaining = Math.ceil((state.boosts.autoTap - now) / 60000);
    active.push({ label: `Auto (${remaining}m)`, icon: '\uD83E\uDD16' });
  }
  if (state.megaTapExpiry && now < state.megaTapExpiry) {
    const remaining = Math.ceil((state.megaTapExpiry - now) / 60000);
    active.push({ label: `Mega (${remaining}m)`, icon: '\uD83D\uDD25' });
  }
  return active;
}

// ========== Leaderboard ==========
function generateLeaderboard() {
  // Seeded random for consistency
  let seed = state.leaderboardSeed;
  function seededRandom() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  const entries = FAKE_NAMES.map((name, i) => ({
    name,
    score: Math.floor(seededRandom() * 50000 + 5000 + (20 - i) * 2000),
    avatar: name.charAt(0)
  }));

  // Add player
  const user = getTelegramUser();
  entries.push({
    name: user.name + ' (You)',
    score: state.points,
    avatar: user.name.charAt(0),
    isPlayer: true
  });

  // Sort descending
  entries.sort((a, b) => b.score - a.score);

  return entries.slice(0, 20);
}

// ========== Haptics ==========
function vibrateShort() {
  if (tg?.HapticFeedback) {
    tg.HapticFeedback.impactOccurred('light');
  } else if (navigator.vibrate) {
    navigator.vibrate(10);
  }
}

function vibrateHeavy() {
  if (tg?.HapticFeedback) {
    tg.HapticFeedback.notificationOccurred('success');
  } else if (navigator.vibrate) {
    navigator.vibrate(30);
  }
}

// ========== UI Updates ==========
function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function updateUI() {
  // Points
  const pointsEl = document.getElementById('points-value');
  if (pointsEl) pointsEl.textContent = formatNumber(state.points);

  // Per tap info
  const perTapEl = document.getElementById('per-tap');
  if (perTapEl) {
    const base = getBaseTapValue();
    const mult = getMultiplier();
    perTapEl.textContent = `+${Math.floor(base * mult)} per tap`;
  }

  // Level
  state.level = getLevel();
  const levelEl = document.getElementById('stat-level');
  if (levelEl) levelEl.textContent = state.level;

  // Update header level
  const headerLevel = document.getElementById('header-level');
  if (headerLevel) headerLevel.textContent = `Level ${state.level}`;

  // Total taps
  const tapsEl = document.getElementById('stat-taps');
  if (tapsEl) tapsEl.textContent = formatNumber(state.totalTaps);

  // Multiplier
  const multEl = document.getElementById('stat-mult');
  if (multEl) multEl.textContent = getMultiplier() + 'x';

  // Energy
  updateEnergyBar();

  // Combo
  updateComboDisplay();

  // Active boosts
  updateActiveBoosts();

  // User info
  const user = getTelegramUser();
  const avatarEl = document.getElementById('user-avatar');
  if (avatarEl) avatarEl.textContent = user.name.charAt(0);
  const nameEl = document.getElementById('user-name');
  if (nameEl) nameEl.textContent = user.name;

  // Streak
  const streakEl = document.getElementById('streak-count');
  if (streakEl) streakEl.textContent = state.loginStreak;
}

function updateEnergyBar() {
  const fillEl = document.getElementById('energy-fill');
  const valEl = document.getElementById('energy-value');
  if (fillEl) {
    const pct = (state.energy / ENERGY_MAX) * 100;
    fillEl.style.width = pct + '%';
    fillEl.classList.toggle('low', state.energy < 20);
  }
  if (valEl) {
    valEl.textContent = `${state.energy}/${ENERGY_MAX}`;
  }
}

function updateComboDisplay() {
  const comboEl = document.getElementById('combo-display');
  if (!comboEl) return;
  const label = getComboLabel();
  if (label) {
    comboEl.innerHTML = `<span class="combo-text">${label}</span>`;
  } else {
    comboEl.innerHTML = '';
  }
}

function updateActiveBoosts() {
  const container = document.getElementById('active-boosts');
  if (!container) return;
  const active = getActiveBoosts();
  container.innerHTML = active.map(b =>
    `<div class="boost-pill">${b.icon} ${b.label}</div>`
  ).join('');
}

function showFloatingPoints(amount) {
  const tapBtn = document.getElementById('tap-button');
  if (!tapBtn) return;
  const el = document.createElement('div');
  el.className = 'float-points';
  el.textContent = '+' + amount;
  // Random x offset
  const offsetX = (Math.random() - 0.5) * 80;
  el.style.left = `calc(50% + ${offsetX}px)`;
  el.style.top = '50%';

  const area = document.querySelector('.tap-area');
  if (area) {
    area.appendChild(el);
    setTimeout(() => el.remove(), 800);
  }
}

function showRipple() {
  const area = document.querySelector('.tap-area');
  if (!area) return;
  const ripple = document.createElement('div');
  ripple.className = 'tap-ripple';
  ripple.style.left = '50%';
  ripple.style.top = '50%';
  ripple.style.transform = 'translate(-50%, -50%)';
  area.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ========== Leaderboard UI ==========
function renderLeaderboard() {
  const list = document.getElementById('lb-list');
  if (!list) return;

  const entries = generateLeaderboard();
  const playerRank = entries.findIndex(e => e.isPlayer) + 1;

  // Update rank display
  const rankVal = document.getElementById('lb-rank-val');
  const rankPts = document.getElementById('lb-rank-pts');
  if (rankVal) rankVal.textContent = '#' + playerRank;
  if (rankPts) rankPts.textContent = formatNumber(state.points) + ' pts';

  list.innerHTML = entries.slice(0, 15).map((e, i) => {
    const pos = i + 1;
    const topClass = pos <= 3 ? ` top-${pos}` : '';
    const medals = ['', '\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49'];
    const posText = pos <= 3 ? medals[pos] : pos;
    return `
      <div class="lb-entry${topClass}${e.isPlayer ? ' is-player' : ''}">
        <div class="lb-pos">${posText}</div>
        <div class="lb-avatar">${e.avatar}</div>
        <div class="lb-name">${e.name}</div>
        <div class="lb-score">${formatNumber(e.score)}</div>
      </div>
    `;
  }).join('');
}

// ========== Shop UI ==========
function renderShop() {
  const grid = document.getElementById('shop-grid');
  if (!grid) return;

  const items = Object.entries(BOOSTS).map(([id, boost]) => {
    const iconClass = id === 'multiplier2x' ? 'boost-2x' :
                      id === 'energyRefill' ? 'boost-energy' :
                      id === 'autoTap' ? 'boost-auto' : 'boost-mega';
    return `
      <div class="shop-item" onclick="purchaseBoost('${id}')">
        <div class="shop-item-icon ${iconClass}">${boost.icon}</div>
        <div class="shop-item-info">
          <div class="shop-item-name">${boost.name}</div>
          <div class="shop-item-desc">${boost.desc}</div>
        </div>
        <button class="shop-item-btn">
          <span class="star-icon">\u2B50</span> ${boost.price}
        </button>
      </div>
    `;
  }).join('');

  grid.innerHTML = items;
}

// ========== Tab Navigation ==========
function switchTab(tabName) {
  // Update content
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  const targetTab = document.getElementById('tab-' + tabName);
  if (targetTab) targetTab.classList.add('active');

  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  const activeBtn = document.querySelector(`.nav-btn[data-tab="${tabName}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  // Render tab-specific content
  if (tabName === 'leaderboard') renderLeaderboard();
  if (tabName === 'shop') renderShop();
}

// ========== Daily Bonus Modal ==========
function showDailyBonusModal(bonus, streak) {
  const overlay = document.getElementById('daily-modal');
  if (!overlay) return;

  const streakEl = document.getElementById('modal-streak');
  const bonusEl = document.getElementById('modal-bonus');
  if (streakEl) streakEl.textContent = `${streak} day streak!`;
  if (bonusEl) bonusEl.textContent = `+${bonus} points`;

  overlay.classList.add('show');
}

function closeDailyModal() {
  const overlay = document.getElementById('daily-modal');
  if (overlay) overlay.classList.remove('show');
}

// ========== Main Loop ==========
function gameLoop() {
  regenEnergy();
  updateEnergyBar();
  updateActiveBoosts();

  // Clean expired boosts
  const now = Date.now();
  if (state.boosts.multiplier2x && now >= state.boosts.multiplier2x) {
    state.boosts.multiplier2x = null;
    showToast('2x Multiplier expired');
    saveState();
  }
  if (state.boosts.autoTap && now >= state.boosts.autoTap) {
    state.boosts.autoTap = null;
    stopAutoTap();
    showToast('Auto-Tap expired');
    saveState();
  }
  if (state.megaTapExpiry && now >= state.megaTapExpiry) {
    state.megaTapExpiry = null;
    showToast('Mega Tap expired');
    saveState();
  }

  requestAnimationFrame(gameLoop);
}

// ========== Init ==========
function init() {
  initTelegram();
  loadState();

  // Tap button handler
  const tapBtn = document.getElementById('tap-button');
  if (tapBtn) {
    tapBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const earned = tap();
      if (earned > 0) {
        showFloatingPoints(earned);
        showRipple();
        vibrateShort();
        updateUI();
      }
    });
  }

  // Nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  // Daily modal close
  const modalBtn = document.getElementById('modal-claim-btn');
  if (modalBtn) modalBtn.addEventListener('click', closeDailyModal);

  // Resume auto-tap if active
  if (state.boosts.autoTap && Date.now() < state.boosts.autoTap) {
    startAutoTap();
  }

  // Initial render
  renderShop();
  updateUI();

  // Check daily bonus
  const dailyResult = checkDailyBonus();
  if (dailyResult) {
    setTimeout(() => showDailyBonusModal(dailyResult.bonus, dailyResult.streak), 500);
  }

  // Start game loop
  requestAnimationFrame(gameLoop);

  // Periodic save
  setInterval(saveState, 5000);
}

// Listen for boost confirmations from bot
if (tg) {
  // Handle invoice closed event
  tg.onEvent('invoiceClosed', (event) => {
    if (event.status === 'paid') {
      // Extract boost info from the invoice payload
      try {
        const payload = JSON.parse(event.url || '{}');
        if (payload.boost) {
          applyBoost(payload.boost);
        }
      } catch(e) {
        showToast('Boost activated!');
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
