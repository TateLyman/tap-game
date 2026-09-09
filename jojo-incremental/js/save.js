window.BZ = window.BZ || {};
BZ.SAVE_KEY = 'bizarreLegacySave_v2';

BZ.freshState = function(){
  const now = Date.now();
  return {
    version: 2,
    yen: 0,
    xp: 0,
    level: 1,
    arrows: 1,
    legacy: 0,
    fatePoints: 0,
    heaven: 0,
    dimensionShards: 0,
    standXP: 0,
    skillPoints: 0,
    part: 1,
    unlockedPart: 1,
    wave: 1,
    bossMode: false,
    enemy: { name:'', hp:1, maxHp:1, shield:0, maxShield:0, boss:false, tag:'ENEMY', glyph:'☠', actionInterval:6, actionTimer:6 },
    combo: 0,
    comboTimer: 0,
    clicks: 0,
    critChance: .08,
    critMult: 2,
    resolve: 100,
    maxResolve: 100,
    cooldowns: { a1:0, a2:0, a3:0, a4:0 },
    statuses: { burn:0, defBreak:0, timeStop:0, spin:0, poison:0, calamity:0, freeze:0, bomb:0, haste:0 },
    autoUnlocked: false,
    autoAttack: false,
    autoAbilitiesUnlocked: false,
    autoAbilities: false,
    bossPush: true,
    upgrades: { fists:0, training:0, fortune:0, focus:0, idle:0 },
    skillTree: { breathing:0, overdrive:0, solar:0, heal:0, spin:0, rectangle:0, golden:0, infinite:0, autoUpgrade:0, autoBoss:0, autoStand:0 },
    unlockedCharacters: ['jonathan','zeppeli','speedwagon'],
    party: ['jonathan','zeppeli','speedwagon'],
    characterLevels: { jonathan:1, zeppeli:1, speedwagon:1 },
    unlockedStands: [],
    standLevels: {},
    activeStand: null,
    items: [],
    equippedItem: null,
    equipment: { hat:null, outfit:null, weapon:null, accessory:null, relic:null },
    materials: { blood:0, spin:0, disc:0, corpse:0, locacaca:0, mechanism:0 },
    defeatedBosses: [],
    completedParts: [],
    claimedQuests: [],
    achievements: [],
    challenge: null,
    challengeWins: {},
    questProgress: {},
    settings: {
      audio: true,
      particles: true,
      shake: true,
      damageNumbers: true,
      autosave: true,
      performance: false,
      animations: true,
      darkFx: true,
      notation: 'short'
    },
    stats: {
      kills: 0,
      bossKills: 0,
      crits: 0,
      events: 0,
      secrets: 0,
      spin: 0,
      lifetimeYen: 0,
      highestCombo: 0,
      rebirths: 0,
      standAwakenings: 0,
      heavenAscensions: 0,
      infiniteResets: 0,
      playSeconds: 0,
      damageDone: 0
    },
    pity: { stand:0 },
    lastSave: now,
    lastSeen: now,
    feed: []
  };
};

BZ.normalizeState = function(raw){
  const base = BZ.freshState();
  if(!raw || typeof raw !== 'object') return base;
  const s = Object.assign(base, raw);
  s.enemy = Object.assign({}, base.enemy, raw.enemy || {});
  s.cooldowns = Object.assign({}, base.cooldowns, raw.cooldowns || {});
  s.statuses = Object.assign({}, base.statuses, raw.statuses || {});
  s.upgrades = Object.assign({}, base.upgrades, raw.upgrades || {});
  s.skillTree = Object.assign({}, base.skillTree, raw.skillTree || {});
  s.settings = Object.assign({}, base.settings, raw.settings || {});
  s.stats = Object.assign({}, base.stats, raw.stats || {});
  s.pity = Object.assign({}, base.pity, raw.pity || {});
  s.equipment = Object.assign({}, base.equipment, raw.equipment || {});
  s.materials = Object.assign({}, base.materials, raw.materials || {});
  s.characterLevels = Object.assign({}, raw.characterLevels || {});
  s.standLevels = Object.assign({}, raw.standLevels || {});
  s.challengeWins = Object.assign({}, raw.challengeWins || {});
  if(!Array.isArray(s.feed)) s.feed = [];
  if(!Array.isArray(s.party)) s.party = [...base.party];
  if(!Array.isArray(s.unlockedCharacters)) s.unlockedCharacters = [...base.unlockedCharacters];
  if(!Array.isArray(s.unlockedStands)) s.unlockedStands = [];
  if(!Array.isArray(s.items)) s.items = [];
  if(!Array.isArray(s.completedParts)) s.completedParts = [];
  if(!Array.isArray(s.achievements)) s.achievements = [];
  if(!Array.isArray(s.defeatedBosses)) s.defeatedBosses = [];
  if(!Array.isArray(s.claimedQuests)) s.claimedQuests = [];
  if(typeof s.resolve !== 'number') s.resolve = s.maxResolve || 100;
  if(typeof s.maxResolve !== 'number') s.maxResolve = 100;
  return s;
};

BZ.save = function(s, toast=false){
  s.lastSave = Date.now();
  s.lastSeen = s.lastSave;
  localStorage.setItem(BZ.SAVE_KEY, JSON.stringify(s));
  if(toast && BZ.UI) BZ.UI.toast('Fate recorded','Game saved locally.');
};

BZ.load = function(){
  try{
    return BZ.normalizeState(JSON.parse(localStorage.getItem(BZ.SAVE_KEY) || 'null'));
  }catch(e){
    return BZ.freshState();
  }
};

BZ.exportSave = s => btoa(unescape(encodeURIComponent(JSON.stringify(s))));
BZ.importSave = str => BZ.normalizeState(JSON.parse(decodeURIComponent(escape(atob(str.trim())))));
