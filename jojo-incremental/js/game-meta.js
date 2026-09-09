BZ.progressQuest = function(type, val, absolute=false){
  const s = BZ.state;
  BZ.QUESTS.filter(q => q.type === type).forEach(q => {
    const cur = s.questProgress[q.id] || 0;
    s.questProgress[q.id] = absolute ? Math.max(cur, val) : cur + val;
  });
};

BZ.claimQuest = function(id){
  const s = BZ.state, q = BZ.QUESTS.find(q => q.id === id);
  if(!q || s.claimedQuests.includes(id)) return;
  const prog = s.questProgress[id] || 0;
  if(prog < q.goal) return;
  s.claimedQuests.push(id);
  const r = q.reward || {};
  s.yen += r.yen || 0;
  s.arrows += r.arrows || 0;
  s.legacy += r.legacy || 0;
  s.fatePoints += r.fate || 0;
  BZ.UI?.toast('QUEST COMPLETE', q.name);
  BZ.UI?.renderAll();
};

BZ.startChallenge = function(id){
  const ch = BZ.getChallenge(id);
  if(!ch || BZ.state.unlockedPart < ch.unlockPart) return;
  if(BZ.state.challenge === id){
    BZ.state.challenge = null;
    BZ.UI?.toast('CHALLENGE OFF','Returned to normal mode.');
    BZ.spawnEnemy();
    BZ.UI?.renderAll();
    return;
  }
  BZ.state.challenge = id;
  BZ.state.questProgress['challenge_' + id] = 0;
  BZ.state.resolve = BZ.state.maxResolve = BZ.calcMaxResolve();
  BZ.spawnEnemy();
  BZ.UI?.toast('CHALLENGE ON', ch.name);
  BZ.UI?.renderAll();
};

BZ.completeChallenge = function(id){
  const s = BZ.state;
  s.challengeWins[id] = (s.challengeWins[id] || 0) + 1;
  s.challenge = null;
  s.legacy += 1;
  s.fatePoints += 3;
  BZ.feed(`<b>Challenge complete:</b> ${BZ.getChallenge(id)?.name || id}.`, 'rare');
  BZ.UI?.reveal('CHALLENGE COMPLETE', BZ.getChallenge(id)?.name || 'Challenge', BZ.getChallenge(id)?.reward || 'Permanent bonus earned.');
  BZ.spawnEnemy();
};

BZ.checkAchievements = function(){
  const s = BZ.state;
  BZ.ACHIEVEMENTS.forEach(a => {
    if(!s.achievements.includes(a.id) && a.test(s)){
      s.achievements.push(a.id);
      s.fatePoints += 1;
      BZ.UI?.toast('ACHIEVEMENT', a.name);
      BZ.feed(`Achievement unlocked: <b>${a.name}</b>.`, 'rare');
    }
  });
};

BZ.maybeFateEvent = function(){
  const s = BZ.state;
  const chance = .015 + Math.min(.08, (s.questProgress.fate || 0) / 5000);
  if(Math.random() > chance) return;
  s.stats.events++;
  BZ.progressQuest('events',1);
  const events = [
    () => { const amount = 80 * Math.pow(5, s.part); s.yen += amount; BZ.UI?.toast('HARVEST', `Shigechi found ¥${BZ.fmt(amount)}.`); BZ.feed('<b>Harvest</b> swept the area for bonus currency.', 'rare'); },
    () => { s.fatePoints += 2; BZ.UI?.toast('ROHAN ENCOUNTER', 'Heaven’s Door rewrote your Fate: +2 Fate.'); BZ.feed('<b>Rohan Encounter</b> altered the route.', 'rare'); },
    () => { const dmg = s.enemy?.maxHp ? s.enemy.maxHp * .45 : 0; if(dmg) BZ.applyDamage(dmg, {crit:true}); BZ.UI?.toast('ROAD ROLLER!', 'A completely unreasonable amount of damage.'); BZ.feed('<b>ROAD ROLLER</b> crashed into the fight.', 'rare'); },
    () => { s.arrows++; BZ.UI?.toast('LUCKY ARROW', 'Fate delivered a Stand Arrow.'); BZ.feed('A <b>Lucky Arrow</b> appeared.', 'rare'); },
    () => { s.stats.secrets++; BZ.UI?.toast('THUNDER CROSS SPLIT ATTACK', 'It accomplished almost nothing. Tradition maintained.'); BZ.feed('<b>Thunder Cross Split Attack</b> happened. Somehow.', 'rare'); },
    () => { s.resolve = Math.min(s.maxResolve, s.resolve + s.maxResolve * .3); BZ.UI?.toast('TONIO BUFF', 'Resolve and morale restored.'); BZ.feed('<b>Tonio</b> cooked something suspiciously perfect.', 'good'); },
    () => { s.dimensionShards += s.unlockedPart >= 9 ? 1 : 0; BZ.UI?.toast('ALT-UNIVERSE PORTAL', s.unlockedPart >= 9 ? '+1 Dimension Shard.' : 'You glimpsed a future route.'); BZ.feed('<b>D4C</b> opened a strange portal.', 'rare'); }
  ];
  events[Math.floor(Math.random() * events.length)]();
  BZ.checkAchievements();
};
