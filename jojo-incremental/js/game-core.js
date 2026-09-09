window.BZ = window.BZ || {};
BZ.state = BZ.load();
BZ._lastTick = performance.now();
BZ._secondAcc = 0;
BZ._autosaveAcc = 0;
BZ._audioCtx = null;
BZ._autoAcc = 0;
BZ._enemyAcc = 0;
BZ._abilityAcc = 0;
BZ._shopAcc = 0;
BZ._standTrainAcc = 0;

BZ.fmt = function(n){
  if(!Number.isFinite(n)) return '∞';
  const abs = Math.abs(n);
  const notation = BZ.state?.settings?.notation || 'short';
  if(notation === 'scientific' && abs >= 1e6) return n.toExponential(2);
  if(abs < 1000) return n < 10 && n % 1 ? n.toFixed(1) : Math.floor(n).toLocaleString();
  const units = ['K','M','B','T','Qa','Qi','Sx','Sp','Oc','No'];
  let u = -1, v = abs;
  while(v >= 1000 && u < units.length - 1){ v /= 1000; u++; }
  if(u === units.length - 1 && v >= 1000) return n.toExponential(2);
  return (n < 0 ? '-' : '') + (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)) + units[u];
};

BZ.getPart = () => BZ.PARTS.find(p => p.id === BZ.state.part) || BZ.PARTS[0];
BZ.getChar = id => BZ.CHARACTERS.find(c => c.id === id) || null;
BZ.getStand = id => BZ.STANDS.find(s => s.id === id) || null;
BZ.getItem = id => BZ.ITEMS.find(i => i.id === id) || null;
BZ.getChallenge = id => BZ.CHALLENGES.find(c => c.id === id) || null;
BZ.charLevel = id => BZ.state.characterLevels[id] || 1;
BZ.standLevel = id => BZ.state.standLevels[id] || 1;
BZ.challengeWins = id => BZ.state.challengeWins[id] || 0;

BZ.upgradeCost = function(id){
  const u = BZ.UPGRADES.find(x => x.id === id);
  return u ? u.baseCost * Math.pow(u.growth, BZ.state.upgrades[id] || 0) : Infinity;
};
BZ.upgradeMult = function(id){
  const u = BZ.UPGRADES.find(x => x.id === id);
  return u ? u.effect(BZ.state.upgrades[id] || 0) : 1;
};
BZ.skillLevel = id => BZ.state.skillTree[id] || 0;
BZ.skillCost = function(id){
  const skill = BZ.SKILL_TREES.find(s => s.id === id);
  return skill ? skill.cost(BZ.skillLevel(id)) : Infinity;
};
BZ.skillEffect = function(id){
  const skill = BZ.SKILL_TREES.find(s => s.id === id);
  return skill ? skill.effect(BZ.skillLevel(id)) : 1;
};

BZ.challengeMod = function(kind){
  const ch = BZ.state.challenge;
  if(!ch) return 1;
  if(ch === 'hamon' && kind === 'passive') return 0;
  if(ch === 'noclick' && kind === 'click') return 0;
  if(ch === 'glass' && kind === 'resolve') return .5;
  if(ch === 'bossrush' && kind === 'bossEvery') return 1;
  if(ch === 'nostand' && kind === 'stand') return 0;
  return 1;
};

BZ.legacyMult = function(){
  let m = 1 + BZ.state.legacy * .08 + BZ.state.fatePoints * .015 + BZ.state.heaven * .25 + BZ.state.dimensionShards * .12;
  m *= BZ.skillEffect('golden') * BZ.skillEffect('infinite');
  return m;
};

BZ.partyPower = function(){
  return BZ.state.party.reduce((sum,id) => {
    const c = BZ.getChar(id);
    return sum + (c ? c.base * Math.pow(1.085, BZ.charLevel(id) - 1) : 0);
  }, 0);
};

BZ.synergyMult = function(){
  const p = BZ.state.party;
  let m = 1;
  const pairs = [
    ['jotaro','joseph',1.18], ['joseph','caesar',1.18], ['josuke4','okuyasu',1.20], ['giorno','bruno',1.20], ['johnny','gyro',1.28],
    ['jolyne','ff',1.17], ['gappy','yasuho',1.17], ['dio3','pucci',1.16], ['kira','koichi',1.12]
  ];
  pairs.forEach(([a,b,v]) => { if(p.includes(a) && p.includes(b)) m *= v; });
  const joestars = p.filter(id => ['jonathan','joseph','jotaro','josuke4','giorno','jolyne','johnny','gappy','jodio'].includes(id)).length;
  if(joestars >= 3) m *= 1 + joestars * .05;
  if(BZ.state.challenge === 'villains') m *= 1.5;
  return m;
};

BZ.itemMult = function(kind){
  const item = BZ.getItem(BZ.state.equippedItem);
  if(!item) return 1;
  if(kind === 'boss' && item.effect === 'boss') return 1.35;
  if(kind === 'crit' && item.effect === 'crit') return 1.3;
  if(kind === 'combo' && item.effect === 'combo') return 1.25;
  if(kind === 'fate' && item.effect === 'fate') return 1.5;
  if(kind === 'heaven' && item.effect === 'heaven') return 1.2;
  return 1;
};

BZ.calcMaxResolve = function(){
  const base = 100 + BZ.state.level * 4 + BZ.skillLevel('heal') * 12 + BZ.state.heaven * 10;
  return Math.max(40, base * BZ.challengeMod('resolve'));
};

BZ.clickDamage = function(){
  const s = BZ.state;
  let d = (2 + s.level * .6) * BZ.upgradeMult('fists') * BZ.legacyMult() * BZ.skillEffect('breathing') * BZ.challengeMod('click');
  if(s.activeStand && BZ.challengeMod('stand')){
    const st = BZ.getStand(s.activeStand);
    if(st) d *= 1 + (st.power * .06) + (BZ.standLevel(st.id) - 1) * .025;
  }
  if(s.party.includes('paco')) d *= 1.5;
  if(s.party.includes('jodio')) d *= 1.25;
  d *= BZ.synergyMult() * (1 + Math.min(s.combo,100) * .012) * BZ.itemMult('combo') * BZ.skillEffect('spin');
  if(s.enemy.boss) d *= BZ.itemMult('boss');
  d *= 1 + BZ.challengeWins('nostand') * .12;
  return d;
};

BZ.passiveDps = function(){
  let d = BZ.partyPower() * BZ.upgradeMult('training') * BZ.legacyMult() * BZ.synergyMult() * BZ.challengeMod('passive');
  if(BZ.state.party.includes('bruno')) d *= 1.15;
  if(BZ.state.party.includes('pucci')) d *= 1 + Math.min(BZ.state.stats.playSeconds % 60, 40) * .01;
  if(BZ.state.enemy.boss) d *= BZ.itemMult('boss');
  d *= BZ.skillEffect('rectangle');
  if(BZ.state.challenge === 'hamon') d *= 0;
  return d;
};

BZ.yenMult = function(){
  let m = BZ.upgradeMult('fortune') * BZ.legacyMult();
  if(BZ.state.party.includes('speedwagon')) m *= 1.3;
  if(BZ.state.equippedItem === 'mask') m *= .9;
  m *= 1 + BZ.challengeWins('villains') * .10;
  return m;
};

BZ.critChance = function(){
  let c = BZ.state.critChance + BZ.challengeWins('hamon') * .02;
  if(BZ.state.party.includes('caesar')) c += .08;
  if(BZ.state.activeStand === 'star') c += .12;
  c += BZ.skillLevel('rectangle') * .01;
  return Math.min(.75, c);
};

BZ.critMult = function(){
  let m = BZ.state.critMult * BZ.upgradeMult('focus') * BZ.itemMult('crit') * BZ.skillEffect('overdrive');
  if(BZ.state.party.includes('gyro')) m *= 1.2;
  return m;
};

BZ.enemyThemeForPart = function(partId){
  const map = {1:'vampire',2:'pillar',3:'stand',4:'mystery',5:'gang',6:'prison',7:'spin',8:'wall',9:'mechanism'};
  return map[partId] || 'oddity';
};

BZ.spawnEnemy = function(){
  const s = BZ.state;
  const p = BZ.getPart();
  const challengeRush = s.challenge === 'bossrush';
  const boss = challengeRush || (s.wave % 10 === 0);
  const idx = Math.floor((s.wave - 1) / 3) % p.enemies.length;
  const scale = Math.pow(1.22, s.wave - 1) * Math.pow(16, p.id - 1) * (1 + s.heaven * .08 + s.dimensionShards * .04);
  const bossName = p.bosses[Math.min(p.bosses.length - 1, Math.floor(((Math.max(10,s.wave)) / 10 - 1) % p.bosses.length))];
  const name = boss ? bossName : p.enemies[idx];
  const hpBase = boss ? 380 : 48;
  let hp = hpBase * scale * (1 + s.unlockedPart * .03);
  if(s.challenge === 'glass') hp *= 1.20;
  const interval = Math.max(1.7, (boss ? 7.5 : 6.2) - p.id * .18 - (s.activeStand === 'echoes3' ? .4 : 0));
  s.enemy = {
    name,
    hp,
    maxHp: hp,
    shield: boss && p.id >= 4 ? hp * .18 : 0,
    maxShield: boss && p.id >= 4 ? hp * .18 : 0,
    boss,
    tag: boss ? 'BOSS' : p.mechanic.toUpperCase(),
    glyph: boss ? '♛' : ['☠','◆','✦','♠','◉'][idx % 5],
    actionInterval: interval,
    actionTimer: interval
  };
  s.bossMode = boss;
  if(BZ.UI) BZ.UI.renderCombat();
};
