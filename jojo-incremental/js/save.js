window.BZ = window.BZ || {};
BZ.SAVE_KEY = 'bizarreLegacySave_v1';

BZ.freshState = function(){
  const now=Date.now();
  return {
    version:BZ.VERSION,
    yen:0,xp:0,level:1,arrows:1,legacy:0,fatePoints:0,heaven:0,dimensionShards:0,
    part:1,unlockedPart:1,wave:1,enemyIndex:0,bossMode:false,
    enemy:{name:'',hp:1,maxHp:1,shield:0,maxShield:0,boss:false,tag:'VAMPIRE',glyph:'☠'},
    combo:0,comboTimer:0,clicks:0,critChance:.08,critMult:2,
    cooldowns:{a1:0,a2:0,a3:0},statuses:{burn:0,defBreak:0,timeStop:0,spin:0},
    autoUnlocked:false,autoAttack:false,bossPush:true,
    upgrades:{fists:0,training:0,fortune:0,focus:0,idle:0},
    unlockedCharacters:['jonathan','zeppeli','speedwagon'],
    party:['jonathan','zeppeli','speedwagon'],
    characterLevels:{jonathan:1,zeppeli:1,speedwagon:1},
    unlockedStands:[],standLevels:{},activeStand:null,
    items:[],equippedItem:null,
    defeatedBosses:[],completedParts:[],claimedQuests:[],achievements:[],
    questProgress:{},
    settings:{audio:true,particles:true,shake:true,damageNumbers:true,autosave:true,performance:false},
    stats:{kills:0,bossKills:0,crits:0,events:0,secrets:0,spin:0,lifetimeYen:0,highestCombo:0,rebirths:0,standAwakenings:0,playSeconds:0},
    lastSave:now,lastSeen:now,feed:[]
  };
};

BZ.normalizeState = function(raw){
  const base=BZ.freshState();
  if(!raw || typeof raw!=='object') return base;
  const s=Object.assign(base,raw);
  s.enemy=Object.assign(base.enemy,raw.enemy||{});
  s.cooldowns=Object.assign(base.cooldowns,raw.cooldowns||{});
  s.statuses=Object.assign(base.statuses,raw.statuses||{});
  s.upgrades=Object.assign(base.upgrades,raw.upgrades||{});
  s.settings=Object.assign(base.settings,raw.settings||{});
  s.stats=Object.assign(base.stats,raw.stats||{});
  s.characterLevels=Object.assign({},raw.characterLevels||{});
  s.standLevels=Object.assign({},raw.standLevels||{});
  return s;
};

BZ.save = function(s,toast=false){
  s.lastSave=Date.now(); s.lastSeen=s.lastSave;
  localStorage.setItem(BZ.SAVE_KEY,JSON.stringify(s));
  if(toast && BZ.UI) BZ.UI.toast('Fate recorded','Game saved locally.');
};
BZ.load = function(){
  try{return BZ.normalizeState(JSON.parse(localStorage.getItem(BZ.SAVE_KEY)||'null'));}
  catch(e){return BZ.freshState();}
};
BZ.exportSave = s=>btoa(unescape(encodeURIComponent(JSON.stringify(s))));
BZ.importSave = str=>BZ.normalizeState(JSON.parse(decodeURIComponent(escape(atob(str.trim())))));
