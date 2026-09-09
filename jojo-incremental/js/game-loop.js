BZ.feed = function(html,type=''){
  const s = BZ.state;
  s.feed.unshift({html,type,t:Date.now()});
  s.feed = s.feed.slice(0,24);
  BZ.UI?.renderFeed();
};

BZ.tone = function(freq=260,dur=.05,type='square'){
  const s = BZ.state;
  if(!s.settings.audio) return;
  try{
    BZ._audioCtx = BZ._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = BZ._audioCtx.createOscillator();
    const g = BZ._audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(.03, BZ._audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, BZ._audioCtx.currentTime + dur);
    o.connect(g); g.connect(BZ._audioCtx.destination); o.start(); o.stop(BZ._audioCtx.currentTime + dur);
  }catch(e){}
};

BZ.offlineRewards = function(){
  const s = BZ.state, now = Date.now(), away = Math.max(0, (now - (s.lastSeen || now)) / 1000);
  if(away < 60) return null;
  const cap = 2 * 3600 + (s.upgrades.idle || 0) * 900;
  const secs = Math.min(away, cap), eff = BZ.upgradeMult('idle');
  const dps = Math.max(1, BZ.passiveDps());
  const avgHp = Math.max(48, 48 * Math.pow(1.22, s.wave - 1) * Math.pow(16, s.part - 1));
  const kills = Math.floor((dps * secs * eff) / avgHp);
  const yen = kills * (10 * Math.pow(1.19, s.wave - 1) * Math.pow(11, s.part - 1)) * BZ.yenMult();
  s.yen += yen;
  s.stats.lifetimeYen += yen;
  s.stats.kills += kills;
  s.xp += kills * 8 * s.part;
  s.standXP += kills * 4;
  s.lastSeen = now;
  BZ.checkLevel();
  BZ.maybeAutoStandXP();
  return {away, secs, kills, yen, xp:kills * 8 * s.part, standXP:kills * 4};
};

BZ.autoSpend = function(){
  const s = BZ.state;
  if(BZ.skillLevel('autoUpgrade') > 0){
    const affordable = [...BZ.UPGRADES].sort((a,b) => BZ.upgradeCost(a.id) - BZ.upgradeCost(b.id)).find(u => s.yen >= BZ.upgradeCost(u.id));
    if(affordable) BZ.upgrade(affordable.id);
  }
  if(BZ.skillLevel('autoStand') > 0 && s.activeStand){
    const cost = 120 * BZ.getStand(s.activeStand).power * Math.pow(1.22, BZ.standLevel(s.activeStand) - 1);
    if(s.yen >= cost) BZ.levelStand(s.activeStand);
  }
};

BZ.tick = function(now){
  const s = BZ.state;
  let dt = Math.min(.1, (now - BZ._lastTick) / 1000);
  BZ._lastTick = now;
  const speed = s.activeStand === 'mih' ? 1 + Math.min(1, (s.stats.playSeconds % 60) / 60) : 1;
  dt *= speed * (s.statuses.haste > 0 ? 1.25 : 1);

  if(!s.enemy || s.enemy.hp <= 0) BZ.spawnEnemy();
  Object.keys(s.statuses).forEach(k => s.statuses[k] = Math.max(0, (s.statuses[k] || 0) - dt));
  Object.keys(s.cooldowns).forEach(k => s.cooldowns[k] = Math.max(0, (s.cooldowns[k] || 0) - dt * (s.activeStand === 'world' ? 1.1 : 1)));
  if(s.comboTimer > 0){ s.comboTimer -= dt; if(s.comboTimer <= 0) s.combo = 0; }

  const passive = BZ.passiveDps() * dt;
  if(passive > 0) BZ.applyDamage(passive, {quiet:true});
  BZ.applyStatusDamage(dt);

  if(s.autoUnlocked && s.autoAttack){
    BZ._autoAcc += dt;
    if(BZ._autoAcc >= .34){ BZ._autoAcc = 0; BZ.attack(); }
  }
  if(s.autoAbilitiesUnlocked && s.autoAbilities){
    BZ._abilityAcc += dt;
    if(BZ._abilityAcc >= .5){
      BZ._abilityAcc = 0;
      [3,2,1,4].forEach(slot => { if((s.cooldowns['a'+slot] || 0) <= 0) BZ.useAbility(slot); });
    }
  }

  s.enemy.actionTimer -= dt * (s.statuses.freeze > 0 ? .35 : 1);
  if(s.enemy.actionTimer <= 0){
    s.enemy.actionTimer = s.enemy.actionInterval;
    BZ.enemyAttack();
  }

  const healRate = (.8 + BZ.skillLevel('heal') * .25) * dt;
  s.maxResolve = BZ.calcMaxResolve();
  s.resolve = Math.min(s.maxResolve, s.resolve + healRate);

  BZ._shopAcc += dt;
  if(BZ._shopAcc >= 1.2){ BZ._shopAcc = 0; BZ.autoSpend(); }

  BZ._secondAcc += dt;
  BZ._autosaveAcc += dt;
  if(BZ._secondAcc >= 1){
    const ticks = Math.floor(BZ._secondAcc);
    s.stats.playSeconds += ticks;
    BZ._secondAcc %= 1;
    BZ.checkAchievements();
    BZ.UI?.renderNumbers();
  }
  if(s.settings.autosave && BZ._autosaveAcc >= 8){ BZ._autosaveAcc = 0; BZ.save(s); }
  BZ.UI?.frame();
  requestAnimationFrame(BZ.tick);
};

BZ.init = function(){
  BZ.state.maxResolve = BZ.calcMaxResolve();
  BZ.state.resolve = Math.min(BZ.state.resolve || BZ.state.maxResolve, BZ.state.maxResolve);
  const off = BZ.offlineRewards();
  if(!BZ.state.enemy.name || BZ.state.enemy.hp <= 0) BZ.spawnEnemy();
  else BZ.state.enemy.actionTimer = Math.min(BZ.state.enemy.actionTimer || BZ.state.enemy.actionInterval || 6, BZ.state.enemy.actionInterval || 6);
  BZ.UI?.init(off);
  requestAnimationFrame(BZ.tick);
  window.addEventListener('beforeunload', () => BZ.save(BZ.state));
};
