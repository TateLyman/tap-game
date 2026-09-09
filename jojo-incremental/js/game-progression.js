BZ.levelChar = function(id){
  const s = BZ.state, c = BZ.getChar(id);
  if(!c || !s.unlockedCharacters.includes(id)) return;
  const l = BZ.charLevel(id), cost = 35 * c.base * Math.pow(1.19, l - 1);
  if(s.yen < cost) return;
  s.yen -= cost;
  s.characterLevels[id] = l + 1;
  BZ.tone(420,.05);
  BZ.UI?.renderAll();
};

BZ.levelStand = function(id){
  const s = BZ.state, st = BZ.getStand(id);
  if(!st || !s.unlockedStands.includes(id)) return;
  const l = BZ.standLevel(id), cost = 120 * st.power * Math.pow(1.22, l - 1);
  if(s.yen < cost) return;
  s.yen -= cost;
  s.standLevels[id] = l + 1;
  BZ.UI?.renderAll();
};

BZ.upgrade = function(id){
  const s = BZ.state;
  const u = BZ.UPGRADES.find(x => x.id === id);
  if(!u) return;
  const l = s.upgrades[id] || 0;
  const cost = u.baseCost * Math.pow(u.growth, l);
  if(s.yen < cost) return;
  s.yen -= cost;
  s.upgrades[id] = l + 1;
  BZ.tone(360,.04);
  BZ.UI?.renderAll();
};

BZ.buySkill = function(id){
  const s = BZ.state;
  const skill = BZ.SKILL_TREES.find(x => x.id === id);
  if(!skill) return;
  const cost = BZ.skillCost(id);
  if((s[skill.currency] || 0) < cost) return;
  s[skill.currency] -= cost;
  s.skillTree[id] = (s.skillTree[id] || 0) + 1;
  s.maxResolve = BZ.calcMaxResolve();
  s.resolve = Math.min(s.maxResolve, s.resolve + 12);
  BZ.UI?.toast('UPGRADE LEARNED', skill.name);
  BZ.UI?.renderAll();
};

BZ.useAbility = function(slot){
  const s = BZ.state;
  const key = 'a' + slot;
  if((s.cooldowns[key] || 0) > 0) return;
  if(slot === 1){
    s.cooldowns[key] = 6;
    for(let i = 0; i < 8; i++) setTimeout(() => BZ.applyDamage(BZ.clickDamage() * .6, {crit: Math.random() < BZ.critChance()}), i * 55);
    BZ.feed('<b>Barrage!</b> Your main attack tears through the encounter.', 'good');
  }
  if(slot === 2){
    s.cooldowns[key] = 13;
    s.statuses.defBreak = 6;
    s.statuses.spin = Math.max(s.statuses.spin, 5 + BZ.skillLevel('spin'));
    BZ.applyDamage(BZ.clickDamage() * 4.2 * (1 + BZ.challengeWins('glass') * .12), {crit:true});
    BZ.feed('Defense broken by a <b>precision technique</b>.', 'good');
  }
  if(slot === 3){
    s.cooldowns[key] = 28;
    s.statuses.timeStop = 4;
    BZ.applyDamage(BZ.clickDamage() * 10, {crit:true});
    BZ.feed('<b>TIME STOP!</b> Timers freeze for four seconds.', 'rare');
    BZ.UI?.toast('TIME HAS STOPPED','Deal bonus damage before it resumes.');
  }
  if(slot === 4){
    s.cooldowns[key] = 40;
    s.resolve = Math.min(s.maxResolve, s.resolve + s.maxResolve * (.25 + BZ.skillLevel('heal') * .02));
    s.statuses.haste = 8;
    BZ.UI?.toast('RALLY', 'Resolve restored and cooldown flow accelerated.');
  }
  BZ.tone(slot === 3 ? 110 : slot === 4 ? 330 : 440, .12, slot === 3 ? 'sawtooth' : 'square');
  BZ.UI?.renderAbilities();
};

BZ.rollStand = function(){
  const s = BZ.state;
  if(s.arrows < 1){ BZ.UI?.toast('NO ARROWS','Defeat bosses and chase Fate events.'); return; }
  s.arrows--;
  s.pity.stand = (s.pity.stand || 0) + 1;
  const blocked = ['ger','echoes2','echoes3','cmoon','mih','tusk2','tusk3','tusk4','love','beyond'];
  const pool = BZ.STANDS.filter(st => st.part <= s.unlockedPart && !s.unlockedStands.includes(st.id) && !blocked.includes(st.id));
  if(!pool.length){ s.arrows++; BZ.UI?.toast('ARROW REJECTED','No new base Stands are available in your unlocked Parts.'); return; }
  const weighted = [];
  pool.forEach(st => {
    let n = st.rarity === 'Mythic' ? 1 : st.rarity === 'Legendary' ? 2 : st.rarity === 'Epic' ? 4 : st.rarity === 'Rare' ? 7 : 10;
    if(s.pity.stand >= 12 && ['Legendary','Mythic'].includes(st.rarity)) n += 8;
    for(let i = 0; i < n; i++) weighted.push(st);
  });
  let st = weighted[Math.floor(Math.random() * weighted.length)];
  if(s.pity.stand >= 18){
    const high = pool.filter(x => ['Legendary','Mythic','Epic'].includes(x.rarity));
    if(high.length) st = high[Math.floor(Math.random() * high.length)];
  }
  s.pity.stand = 0;
  s.unlockedStands.push(st.id);
  s.standLevels[st.id] = 1;
  s.stats.standAwakenings++;
  BZ.progressQuest('stands', s.unlockedStands.length, true);
  if(!s.activeStand) s.activeStand = st.id;
  BZ.UI?.reveal('STAND AWAKENED', st.name, `${st.rarity} • ${st.passive}`);
  BZ.feed(`Stand awakened: <b>${st.name}</b>.`, 'rare');
  BZ.checkAchievements();
  BZ.save(s);
};

BZ.evolveStand = function(id){
  const s = BZ.state, st = BZ.getStand(id);
  if(!st || !st.evolves) return;
  const next = BZ.getStand(st.evolves);
  const req = 25 + (next.part * 5);
  if(BZ.standLevel(id) < req || s.stats.bossKills < next.part * 2){
    BZ.UI?.toast('EVOLUTION LOCKED', `Requires Stand Lv.${req} and ${next.part * 2} boss defeats.`);
    return;
  }
  if(!s.unlockedStands.includes(next.id)) s.unlockedStands.push(next.id);
  s.standLevels[next.id] = 1;
  s.activeStand = next.id;
  BZ.UI?.reveal('STAND EVOLVED', next.name, next.passive);
  BZ.feed(`<b>${st.name}</b> evolved into <b>${next.name}</b>.`, 'rare');
};

BZ.dropItem = function(){
  const s = BZ.state;
  const pool = BZ.ITEMS.filter(i => !s.items.includes(i.id));
  if(!pool.length) return;
  const item = pool[Math.floor(Math.random() * pool.length)];
  s.items.push(item.id);
  BZ.UI?.reveal('RELIC FOUND', item.name, item.desc);
  BZ.feed(`Rare relic: <b>${item.name}</b>.`, 'rare');
};

BZ.equipItem = function(id){
  if(!BZ.state.items.includes(id)) return;
  BZ.state.equippedItem = id;
  BZ.UI?.toast('RELIC EQUIPPED', BZ.getItem(id)?.name || 'Relic');
  BZ.UI?.renderAll();
};

BZ.unlockPartCharacters = function(part){
  const s = BZ.state;
  const pool = BZ.CHARACTERS.filter(c => c.part === part);
  pool.slice(0,3).forEach(c => {
    if(!s.unlockedCharacters.includes(c.id)){
      s.unlockedCharacters.push(c.id);
      s.characterLevels[c.id] = s.characterLevels[c.id] || 1;
    }
  });
};

BZ.completePart = function(){
  const s = BZ.state, p = BZ.getPart();
  if(!s.completedParts.includes(p.id)) s.completedParts.push(p.id);
  BZ.CHARACTERS.filter(c => c.part === p.id).forEach(c => {
    if(!s.unlockedCharacters.includes(c.id)){
      s.unlockedCharacters.push(c.id);
      s.characterLevels[c.id] = 1;
    }
  });
  s.fatePoints += 5;
  BZ.progressQuest('part', p.id + 1, true);
  if(p.id < 9){
    s.unlockedPart = Math.max(s.unlockedPart, p.id + 1);
    BZ.unlockPartCharacters(p.id + 1);
    s.part = p.id + 1;
    s.wave = 1;
    BZ.UI?.reveal('NEW PART UNLOCKED', BZ.getPart().name, `${BZ.getPart().mechanic} now enters the buildcraft.`);
    BZ.spawnEnemy();
  }else{
    s.wave = 1;
    s.dimensionShards += 2;
    BZ.UI?.reveal('MULTIVERSE UNLOCKED', 'All Parts Cleared', 'Dimension Shards and randomized routes now appear from boss kills.');
    BZ.spawnEnemy();
  }
};

BZ.travelTo = function(part){
  const s = BZ.state;
  if(part > s.unlockedPart) return;
  s.part = part;
  s.wave = 1;
  s.combo = 0;
  s.resolve = s.maxResolve;
  BZ.spawnEnemy();
  BZ.UI?.renderAll();
};

BZ.rebirthGain = function(){ return Math.floor(Math.sqrt(BZ.state.stats.lifetimeYen / 25000)); };
BZ.heavenGain = function(){ return Math.floor(BZ.state.completedParts.length / 2 + BZ.state.legacy / 10); };
BZ.infiniteGain = function(){ return Math.floor(Math.max(0, BZ.state.heaven - 4) / 3 + BZ.state.completedParts.length / 3); };

BZ.rebirth = function(){
  const s = BZ.state, gain = BZ.rebirthGain();
  if(gain < 1){ BZ.UI?.toast('NOT YET', 'Earn more lifetime Yen first.'); return; }
  if(!confirm(`Rebirth for ${gain} Joestar Legacy Points?`)) return;
  const keep = {
    legacy: s.legacy + gain,
    fatePoints: s.fatePoints,
    heaven: s.heaven,
    dimensionShards: s.dimensionShards,
    unlockedPart: s.unlockedPart,
    completedParts: [...s.completedParts],
    unlockedCharacters: [...s.unlockedCharacters],
    unlockedStands: [...s.unlockedStands],
    standLevels: {...s.standLevels},
    items: [...s.items],
    equippedItem: s.equippedItem,
    achievements: [...s.achievements],
    defeatedBosses: [...s.defeatedBosses],
    stats: {...s.stats},
    skillTree: {...s.skillTree},
    challengeWins: {...s.challengeWins}
  };
  const n = BZ.freshState();
  Object.assign(n, keep);
  n.stats.rebirths++;
  n.part = Math.max(1, Math.min(n.unlockedPart, s.part));
  n.party = n.unlockedCharacters.filter(id => ['jonathan','zeppeli','speedwagon'].includes(id)).slice(0,6);
  if(!n.party.length) n.party = ['jonathan'];
  n.characterLevels = {};
  n.unlockedCharacters.forEach(id => n.characterLevels[id] = 1);
  n.activeStand = n.unlockedStands[0] || null;
  BZ.state = n;
  n.maxResolve = BZ.calcMaxResolve();
  n.resolve = n.maxResolve;
  BZ.feed(`Reborn with <b>${gain} Legacy Points</b>.`, 'rare');
  BZ.spawnEnemy();
  BZ.save(n);
  BZ.UI?.renderAll();
};

BZ.heavenAscend = function(){
  const s = BZ.state, gain = BZ.heavenGain();
  if(gain < 1 || s.unlockedPart < 6){ BZ.UI?.toast('LOCKED','Reach Part 6 and build more Legacy first.'); return; }
  if(!confirm(`Ascend to Heaven for +${gain} Heaven? This is a deeper reset.`)) return;
  const keep = {
    heaven: s.heaven + gain,
    dimensionShards: s.dimensionShards,
    achievements: [...s.achievements],
    items: [...s.items],
    equippedItem: s.equippedItem,
    challengeWins: {...s.challengeWins},
    stats: {...s.stats}
  };
  const n = BZ.freshState();
  Object.assign(n, keep);
  n.stats.heavenAscensions++;
  n.unlockedCharacters = ['jonathan','zeppeli','speedwagon'];
  n.party = ['jonathan','zeppeli','speedwagon'];
  n.characterLevels = {jonathan:1, zeppeli:1, speedwagon:1};
  n.skillTree.golden = s.skillTree.golden;
  n.skillTree.autoStand = s.skillTree.autoStand;
  BZ.state = n;
  BZ.spawnEnemy();
  BZ.UI?.reveal('HEAVEN ASCENSION', `+${gain} Heaven`, 'Universal power rose. Some deeper systems persist.');
  BZ.save(n);
  BZ.UI?.renderAll();
};

BZ.infiniteReset = function(){
  const s = BZ.state, gain = BZ.infiniteGain();
  if(gain < 1 || s.unlockedPart < 9){ BZ.UI?.toast('ENDGAME LOCKED','Reach Part 9 and earn more Heaven.'); return; }
  if(!confirm(`Begin an Infinite Rotation reset for +${gain} Dimension Shards?`)) return;
  const keep = {
    dimensionShards: s.dimensionShards + gain,
    achievements: [...s.achievements],
    challengeWins: {...s.challengeWins},
    stats: {...s.stats}
  };
  const n = BZ.freshState();
  Object.assign(n, keep);
  n.stats.infiniteResets++;
  n.skillTree.infinite = s.skillTree.infinite;
  BZ.state = n;
  BZ.spawnEnemy();
  BZ.UI?.reveal('INFINITE ROTATION', `+${gain} Dimension Shards`, 'The multiverse loop tightens and scaling explodes.');
  BZ.save(n);
  BZ.UI?.renderAll();
};
