BZ.applyDamage = function(amount,{crit=false,quiet=false}={}){
  const s = BZ.state;
  if(s.enemy.hp <= 0) return;
  if(s.statuses.timeStop > 0) amount *= 1.25;
  amount *= 1 + (s.statuses.defBreak > 0 ? .25 : 0);
  if(s.statuses.spin > 0) amount *= 1 + Math.min(1, s.statuses.spin * .03);
  if(s.statuses.calamity > 0) amount *= 1.08;
  if(s.enemy.shield > 0){
    const absorb = Math.min(s.enemy.shield, amount);
    s.enemy.shield -= absorb;
    amount -= absorb;
  }
  if(amount <= 0) return;
  s.enemy.hp = Math.max(0, s.enemy.hp - amount);
  s.stats.damageDone += amount;
  if(!quiet && BZ.UI){ BZ.UI.damage(amount, crit); BZ.UI.hit(crit); }
  if(s.enemy.hp <= 0) BZ.defeatEnemy();
};

BZ.applyStatusDamage = function(dt){
  const s = BZ.state;
  if(s.statuses.burn > 0) BZ.applyDamage(BZ.clickDamage() * (.12 + BZ.skillLevel('solar') * .01) * dt, {quiet:true});
  if(s.statuses.poison > 0) BZ.applyDamage(BZ.passiveDps() * .06 * dt, {quiet:true});
  if(s.statuses.bomb > 0) BZ.applyDamage(BZ.clickDamage() * .08 * dt, {quiet:true});
};

BZ.attack = function(){
  const s = BZ.state;
  if(s.enemy.hp <= 0) return;
  s.clicks++;
  s.combo++;
  s.comboTimer = 2.8;
  s.stats.highestCombo = Math.max(s.stats.highestCombo, s.combo);
  let crit = Math.random() < BZ.critChance();
  if(s.party.includes('jotaro') && s.clicks % 20 === 0) crit = true;
  let d = BZ.clickDamage() * (crit ? BZ.critMult() : 1);
  if(crit){ s.stats.crits++; BZ.progressQuest('crits',1); }
  if(s.activeStand === 'hand' && Math.random() < .025) d += s.enemy.maxHp * .08;
  if(s.activeStand === 'beyond' && Math.random() < .08) d *= 4;
  if(s.party.includes('okuyasu') && Math.random() < .012) d += s.enemy.hp * .08;
  if(BZ.skillLevel('solar') > 0) s.statuses.burn = Math.max(s.statuses.burn, 3 + BZ.skillLevel('solar'));
  if(s.activeStand === 'tusk4') s.statuses.spin = Math.max(s.statuses.spin, 7);
  if(s.activeStand === 'killer' && Math.random() < .18) s.statuses.bomb = Math.max(s.statuses.bomb, 5);
  BZ.applyDamage(d,{crit});
  BZ.progressQuest('combo', s.combo, true);
  BZ.tone(crit ? 520 : 260, .035, crit ? 'sawtooth' : 'square');
};

BZ.enemyAttack = function(){
  const s = BZ.state;
  if(s.enemy.hp <= 0) return;
  if(s.statuses.timeStop > 0) return;
  let dmg = (s.enemy.boss ? .22 : .12) * s.maxResolve * (1 + s.part * .02);
  if(s.activeStand === 'ger' && Math.random() < .10) dmg = 0;
  if(s.activeStand === 'wou') s.statuses.calamity = 5;
  if(s.activeStand === 'crimson') s.enemy.actionTimer += 1.0;
  if(s.party.includes('weather')) s.statuses.freeze = 1.2;
  s.resolve = Math.max(0, s.resolve - dmg);
  if(BZ.UI) BZ.UI.toast('ENEMY ATTACK', dmg <= 0 ? 'Return to zero denied the strike.' : `Resolve -${BZ.fmt(dmg)}`);
  if(s.resolve <= 0){
    BZ.failEncounter();
    return;
  }
  if(s.statuses.calamity > 0) BZ.applyDamage(BZ.clickDamage() * .75, {quiet:true});
};

BZ.failEncounter = function(){
  const s = BZ.state;
  if(s.activeStand === 'killer' && Math.random() < .25){
    s.resolve = s.maxResolve * .35;
    s.enemy.hp = s.enemy.maxHp * .45;
    BZ.UI?.reveal('BITES THE DUST', 'A second chance!', 'Killer Queen rewound part of the failed attempt.');
    return;
  }
  s.resolve = s.maxResolve;
  s.combo = 0;
  s.enemy.hp = s.enemy.maxHp;
  s.enemy.shield = s.enemy.maxShield;
  BZ.feed('<b>Resolve shattered.</b> The encounter restarted.', 'rare');
  BZ.UI?.toast('RETRY', 'You were forced to restart the encounter.');
};

BZ.partMaterialId = function(partId){
  return ({1:'blood',2:'blood',3:'disc',4:'disc',5:'locacaca',6:'disc',7:'spin',8:'corpse',9:'mechanism'})[partId] || 'blood';
};

BZ.defeatEnemy = function(){
  const s = BZ.state;
  const p = BZ.getPart();
  const boss = s.enemy.boss;
  s.stats.kills++;
  BZ.progressQuest('kills',1);
  if(boss){
    s.stats.bossKills++;
    if(!s.defeatedBosses.includes(s.enemy.name)) s.defeatedBosses.push(s.enemy.name);
    BZ.feed(`Defeated <b>${s.enemy.name}</b>.`, 'good');
  }
  const base = (boss ? 95 : 10) * Math.pow(1.19, s.wave - 1) * Math.pow(11, p.id - 1);
  let yen = base * BZ.yenMult();
  if(s.activeStand === 'd4c' && Math.random() < .08) yen *= 2;
  if(s.activeStand === 'love' && boss) yen *= 2.25;
  s.yen += yen;
  s.stats.lifetimeYen += yen;
  s.xp += (boss ? 40 : 8) * p.id;
  s.standXP += (boss ? 20 : 6) * Math.max(1, p.id - 1);
  if(boss) s.fatePoints += 1;
  const fateGain = (boss ? 7 : 1) * BZ.itemMult('fate') * (s.challenge === 'nostand' ? 1.8 : 1);
  s.questProgress.fate = (s.questProgress.fate || 0) + fateGain;
  const mat = BZ.partMaterialId(p.id);
  s.materials[mat] = (s.materials[mat] || 0) + (boss ? 4 : 1);

  if(Math.random() < ((s.equippedItem === 'arrowRelic' ? .018 : .009) + (boss ? .035 : 0))){
    s.arrows++;
    BZ.feed('A <b>Stand Arrow</b> dropped!', 'rare');
    BZ.UI?.toast('RARE DROP', 'Stand Arrow acquired!');
  }
  if(Math.random() < .006 + (boss ? .018 : 0)) BZ.dropItem();
  if(s.equippedItem === 'locacaca' && s.stats.kills % 12 === 0){
    s.yen += yen;
    BZ.feed('Locacaca caused an <b>Equivalent Exchange</b>: double reward.', 'rare');
  }
  if(s.party.includes('shigechi')) s.yen += yen * .08;
  if(s.party.includes('yasuho')) BZ.progressQuest('story',1);
  if(s.party.includes('gyro')) s.stats.spin += boss ? 20 : 5;

  if(s.challenge){
    const key = 'challenge_' + s.challenge;
    s.questProgress[key] = (s.questProgress[key] || 0) + (boss ? 1 : 0);
    if((s.questProgress[key] || 0) >= 3) BZ.completeChallenge(s.challenge);
  }

  s.wave++;
  if(boss && s.wave > 30){
    BZ.completePart();
    return;
  }
  BZ.checkLevel();
  BZ.checkAchievements();
  BZ.unlockPartCharacters(p.id);
  BZ.spawnEnemy();
  BZ.maybeFateEvent();
  BZ.maybeAutoStandXP();
};

BZ.maybeAutoStandXP = function(){
  const s = BZ.state;
  if(!s.activeStand) return;
  const id = s.activeStand;
  while(s.standXP >= 20 + BZ.standLevel(id) * 8){
    s.standXP -= 20 + BZ.standLevel(id) * 8;
    s.standLevels[id] = BZ.standLevel(id) + 1;
  }
};

BZ.checkLevel = function(){
  const s = BZ.state;
  let need = 40 * Math.pow(1.18, s.level - 1);
  while(s.xp >= need){
    s.xp -= need;
    s.level++;
    s.skillPoints++;
    need = 40 * Math.pow(1.18, s.level - 1);
    if(s.level === 5){ s.autoUnlocked = true; BZ.UI?.toast('AUTOMATION UNLOCKED','Auto Attack can now be enabled.'); }
    if(s.level === 12){ s.autoAbilitiesUnlocked = true; BZ.UI?.toast('ABILITY AUTO','Auto abilities are now available.'); }
    if(s.level % 5 === 0) BZ.feed(`Reached <b>Level ${s.level}</b>.`, 'good');
  }
  s.maxResolve = BZ.calcMaxResolve();
  s.resolve = Math.min(s.resolve, s.maxResolve);
};
