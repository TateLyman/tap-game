window.BZ = window.BZ || {};
BZ.UI = {
  el:{},

  init(off){
    const ids = [
      'currencies','teamPower','partyList','activeStandMini','resolveFill','resolveText','playerTitle','fateFill','fateText','fateLuck',
      'automationPreview','partArt','partEyebrow','locationName','partSummary','waveText','bossRibbon','enemyTag','enemyButton','enemyGlyph',
      'enemyName','hpText','hpFill','shieldFill','enemyActionText','enemyActionFill','statusRow','damageLayer','comboBadge','abilityRow',
      'autoToggle','autoState','abilityAutoToggle','autoAbilityState','bossRushBtn','bossState','arrowBtn','arrowCount','quickUpgrades','eventFeed',
      'bottomNav','drawer','drawerBody','drawerTitle','drawerEyebrow','drawerClose','audioBtn','saveBtn','offlineModal','offlineStats','offlineClaim',
      'revealModal','revealType','revealName','revealDesc','revealClose','revealBurst','combatCard','toastStack'
    ];
    ids.forEach(id => this.el[id] = document.getElementById(id));
    this.bind();
    this.renderAll();
    if(off) this.showOffline(off);
  },

  bind(){
    this.el.enemyButton.onclick = () => BZ.attack();
    document.addEventListener('keydown',e => {
      if(['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if(e.code === 'Space'){ e.preventDefault(); BZ.attack(); }
      if(e.key === '1') BZ.useAbility(1);
      if(e.key === '2') BZ.useAbility(2);
      if(e.key === '3') BZ.useAbility(3);
      if(e.key === '4') BZ.useAbility(4);
    });
    document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => this.openTab(b.dataset.tab)));
    this.el.bottomNav.onclick = e => { const b = e.target.closest('[data-tab]'); if(b) this.openTab(b.dataset.tab); };
    this.el.drawerClose.onclick = () => this.closeDrawer();
    this.el.autoToggle.onclick = () => {
      if(!BZ.state.autoUnlocked) return this.toast('LOCKED','Reach Level 5 to unlock Auto Attack.');
      BZ.state.autoAttack = !BZ.state.autoAttack;
      this.renderNumbers();
    };
    this.el.abilityAutoToggle.onclick = () => {
      if(!BZ.state.autoAbilitiesUnlocked) return this.toast('LOCKED','Reach Level 12 to unlock Auto Abilities.');
      BZ.state.autoAbilities = !BZ.state.autoAbilities;
      this.renderNumbers();
    };
    this.el.bossRushBtn.onclick = () => {
      BZ.state.bossPush = !BZ.state.bossPush;
      this.toast('BOSS PUSH', BZ.state.bossPush ? 'Advance to new routes automatically.' : 'Manual pacing enabled.');
      this.renderNumbers();
    };
    this.el.arrowBtn.onclick = () => BZ.rollStand();
    this.el.audioBtn.onclick = () => {
      BZ.state.settings.audio = !BZ.state.settings.audio;
      this.el.audioBtn.textContent = BZ.state.settings.audio ? '♪' : '×';
      if(BZ.state.settings.audio) BZ.tone(440,.08);
    };
    this.el.saveBtn.onclick = () => BZ.save(BZ.state,true);
    this.el.offlineClaim.onclick = () => this.el.offlineModal.classList.add('hidden');
    this.el.revealClose.onclick = () => this.el.revealModal.classList.add('hidden');
  },

  artCoords(type, key){
    const src = BZ.ART[type] || {};
    const val = src[key];
    if(!val) return {x:'50%', y:'50%'};
    const [cx, cy] = val;
    const x = ['0%','33.333%','66.666%','100%'][Math.max(0,Math.min(3,cx))] || '0%';
    const y = type === 'items' ? ['0%','50%','100%'][Math.max(0,Math.min(2,cy))] : ['0%','100%'][Math.max(0,Math.min(1,cy))];
    return {x,y};
  },

  sprite(type, key, cls='thumb', extra=''){
    const mapType = type === 'item' ? 'items' : type === 'char' ? 'characters' : type === 'stand' ? 'stands' : type;
    const atlasClass = mapType === 'characters' ? 'atlas-char' : mapType === 'stands' ? 'atlas-stand' : 'atlas-item';
    const pos = this.artCoords(mapType, key);
    return `<div class="${cls} ${atlasClass} ${extra}" style="--x:${pos.x};--y:${pos.y}"></div>`;
  },

  renderAll(){
    this.renderNumbers();
    this.renderParty();
    this.renderCombat();
    this.renderAbilities();
    this.renderUpgrades();
    this.renderFeed();
    if(!this.el.drawer.classList.contains('hidden')) this.renderDrawer();
  },

  renderNumbers(){
    const s = BZ.state;
    const cur = [
      ['¥','Yen',BZ.fmt(s.yen)],
      ['XP','Level',s.level],
      ['➶','Arrows',s.arrows],
      ['★','Legacy',s.legacy],
      ['☼','Fate',BZ.fmt(s.fatePoints)],
      ['∞','Heaven',BZ.fmt(s.heaven)],
      ['◇','Shards',BZ.fmt(s.dimensionShards)],
      ['✦','Stand XP',BZ.fmt(s.standXP)]
    ];
    this.el.currencies.innerHTML = cur.map(x => `<div class="currency"><small>${x[1]}</small><b><i>${x[0]}</i>${x[2]}</b></div>`).join('');
    this.el.teamPower.textContent = BZ.fmt(BZ.partyPower()) + ' PWR';
    const maxResolve = Math.max(1, s.maxResolve || 100);
    this.el.resolveFill.style.width = Math.max(0, Math.min(100, s.resolve / maxResolve * 100)) + '%';
    this.el.resolveText.textContent = `${BZ.fmt(s.resolve)} / ${BZ.fmt(maxResolve)}`;
    this.el.playerTitle.textContent = this.playerTitle();
    const f = Math.min(100, (s.questProgress.fate || 0) % 101);
    this.el.fateFill.style.width = f + '%';
    this.el.fateText.textContent = Math.floor(f) + ' / 100';
    this.el.fateLuck.textContent = 'Luck ×' + (1 + Math.min(.8, s.fatePoints * .01)).toFixed(2);
    this.el.autoState.textContent = s.autoUnlocked ? (s.autoAttack ? 'Enabled' : 'Disabled') : 'Locked';
    this.el.autoToggle.classList.toggle('on', s.autoAttack);
    this.el.autoAbilityState.textContent = s.autoAbilitiesUnlocked ? (s.autoAbilities ? 'Enabled' : 'Disabled') : 'Locked';
    this.el.abilityAutoToggle.classList.toggle('on', s.autoAbilities);
    this.el.arrowCount.textContent = `${s.arrows} available • pity ${s.pity.stand || 0}`;
    this.el.comboBadge.textContent = 'COMBO ×' + (1 + Math.min(s.combo,100) * .012).toFixed(2);
    this.el.bossState.textContent = s.bossPush ? 'Advance when ready' : 'Manual pacing';
    this.el.audioBtn.textContent = s.settings.audio ? '♪' : '×';
    const autoRows = [
      ['Auto Attack', s.autoUnlocked ? (s.autoAttack ? 'ON' : 'OFF') : 'LOCKED'],
      ['Auto Abilities', s.autoAbilitiesUnlocked ? (s.autoAbilities ? 'ON' : 'OFF') : 'LOCKED'],
      ['Auto Upgrades', BZ.skillLevel('autoUpgrade') > 0 ? 'ON' : 'OFF'],
      ['Stand Training', BZ.skillLevel('autoStand') > 0 ? 'ON' : 'OFF']
    ];
    this.el.automationPreview.innerHTML = autoRows.map(([a,b]) => `<div class="auto-chip"><span>${a}</span><b>${b}</b></div>`).join('');
  },

  playerTitle(){
    const s = BZ.state;
    if(s.dimensionShards > 0) return 'Multiverse Driver';
    if(s.heaven > 0) return 'Heaven Candidate';
    if(s.level >= 25) return 'Stand Tactician';
    if(s.level >= 10) return 'Bizarre Fighter';
    return 'Ripple Rookie';
  },

  renderParty(){
    const s = BZ.state;
    this.el.partyList.innerHTML = s.party.map(id => {
      const c = BZ.getChar(id);
      if(!c) return '';
      return `<div class="party-member">${this.sprite('char', id, 'portrait')}<div class="member-meta"><b>${c.name}</b><small>${c.role}</small></div><div class="member-lvl">Lv.${BZ.charLevel(id)}</div></div>`;
    }).join('') || '<div class="feed-item">No active party.</div>';
    const st = BZ.getStand(s.activeStand);
    this.el.activeStandMini.innerHTML = st ? `<div class="stand-mini">${this.sprite('stand', st.id, 'thumb', '')}<div class="stand-mini-text"><b>${st.name}</b><small>Lv.${BZ.standLevel(st.id)} • PWR ${st.power} • SPD ${st.speed}<br>${st.passive}</small></div></div>` : '<div class="stand-mini-text"><b>No Stand</b><small>Use an Arrow to awaken one.</small></div>';
  },

  renderCombat(){
    const s = BZ.state, p = BZ.getPart();
    document.getElementById('app').className = 'part-' + s.part;
    this.el.partEyebrow.textContent = `PART ${p.id} • ${p.name}`;
    this.el.locationName.textContent = p.location;
    this.el.partSummary.textContent = BZ.STORY?.[p.id] || p.mechanic;
    this.el.waveText.textContent = `${Math.min(30, ((s.wave - 1) % 30) + 1)} / 30`;
    this.el.enemyName.textContent = s.enemy.name;
    this.el.enemyGlyph.textContent = s.enemy.glyph;
    this.el.enemyTag.textContent = s.enemy.boss ? 'BOSS' : (p.mechanic || 'ENCOUNTER').toUpperCase();
    this.el.bossRibbon.classList.toggle('hidden', !s.enemy.boss);
    const partCoords = this.artCoords('parts', s.part);
    this.el.partArt.style.backgroundPosition = `${partCoords.x} ${partCoords.y}`;
    this.el.partArt.style.backgroundImage = `url('${BZ.ASSETS.hero}')`;
    const enemyKey = s.enemy.boss ? (s.activeStand || 'star') : (p.id >= 3 ? (s.activeStand || 'magician') : 'jonathan');
    const enemyArt = s.part >= 3 ? this.sprite('stand', enemyKey, 'enemy-art') : this.sprite('char', 'dio1', 'enemy-art');
    this.el.enemyButton.parentElement.querySelectorAll('.enemy-art').forEach(n => n.remove());
    this.el.enemyButton.parentElement.insertAdjacentHTML('afterbegin', enemyArt);
    this.renderCombatBars();
  },

  renderCombatBars(){
    const s = BZ.state;
    const pct = Math.max(0, Math.min(100, s.enemy.hp / s.enemy.maxHp * 100));
    this.el.hpFill.style.width = pct + '%';
    this.el.hpText.textContent = `${BZ.fmt(s.enemy.hp)} / ${BZ.fmt(s.enemy.maxHp)}`;
    this.el.shieldFill.style.width = (s.enemy.maxShield ? Math.max(0, s.enemy.shield / s.enemy.maxHp * 100) : 0) + '%';
    const actPct = Math.max(0, Math.min(100, 100 - (s.enemy.actionTimer / s.enemy.actionInterval * 100)));
    this.el.enemyActionFill.style.width = actPct + '%';
    this.el.enemyActionText.textContent = s.statuses.timeStop > 0 ? 'Time frozen' : `${Math.max(0, s.enemy.actionTimer).toFixed(1)}s`;
    const st = [];
    if(s.statuses.timeStop > 0) st.push('⏱ TIME STOP');
    if(s.statuses.defBreak > 0) st.push('⬇ DEFENSE');
    if(s.statuses.burn > 0) st.push('🔥 BURN');
    if(s.statuses.spin > 0) st.push('⟳ SPIN');
    if(s.statuses.bomb > 0) st.push('💣 BOMB');
    if(s.statuses.calamity > 0) st.push('⚠ CALAMITY');
    if(s.statuses.freeze > 0) st.push('❄ FREEZE');
    this.el.statusRow.innerHTML = st.map(x => `<span class="status">${x}</span>`).join('');
  },

  renderAbilities(){
    const s = BZ.state, stand = BZ.getStand(s.activeStand);
    const names = [stand?.skill || 'Hamon Rush', 'Precision Break', stand?.ultimate || 'Time Distortion', 'Resolve Rally'];
    const desc = ['Rapid multi-hit active attack.', 'Heavy strike + defense reduction + Spin.', 'Massive burst and time distortion.', 'Restore Resolve and increase tempo.'];
    const cds = [6,13,28,40];
    this.el.abilityRow.innerHTML = names.map((n,i) => {
      const k = 'a' + (i+1), left = s.cooldowns[k] || 0, pct = Math.max(0, Math.min(100, left / cds[i] * 100));
      return `<button class="ability" data-ab="${i+1}" ${left>0?'disabled':''}><span class="key">${i+1}</span><b>${n}</b><small>${left>0?left.toFixed(1)+'s':desc[i]}</small>${left>0?`<i class="cd" style="width:${pct}%"></i>`:''}</button>`;
    }).join('');
    this.el.abilityRow.querySelectorAll('[data-ab]').forEach(b => b.onclick = () => BZ.useAbility(+b.dataset.ab));
  },

  renderUpgrades(){
    this.el.quickUpgrades.innerHTML = BZ.UPGRADES.slice(0,5).map(u => {
      const l = BZ.state.upgrades[u.id], cost = BZ.upgradeCost(u.id);
      return `<div class="upgrade">${this.sprite('item', u.id, 'upgrade-icon')}<div><div class="upgrade-head"><b>${u.name}</b><span>Lv.${l}</span></div><p>${u.desc}</p><button data-up="${u.id}" ${BZ.state.yen<cost?'disabled':''}>BUY • ¥${BZ.fmt(cost)}</button></div></div>`;
    }).join('');
    this.el.quickUpgrades.querySelectorAll('[data-up]').forEach(b => b.onclick = () => BZ.upgrade(b.dataset.up));
  },

  renderFeed(){ this.el.eventFeed.innerHTML = BZ.state.feed.map(x => `<div class="feed-item ${x.type}">${x.html}</div>`).join('') || '<div class="feed-item">Your bizarre journey has begun.</div>'; },
  frame(){ this.renderCombatBars(); this.renderAbilities(); this.renderNumbers(); },
  hit(crit){
    if(BZ.state.settings.shake){ this.el.combatCard.classList.remove('shake'); void this.el.combatCard.offsetWidth; this.el.combatCard.classList.add('shake'); }
    if(crit){ this.el.combatCard.classList.remove('flash'); void this.el.combatCard.offsetWidth; this.el.combatCard.classList.add('flash'); }
    this.el.enemyGlyph.classList.add('hit'); setTimeout(() => this.el.enemyGlyph.classList.remove('hit'), 70);
  },
  damage(n,crit){
    if(!BZ.state.settings.damageNumbers) return;
    const d = document.createElement('div'); d.className = 'dmg' + (crit ? ' crit' : ''); d.textContent = (crit ? 'CRIT ' : '') + BZ.fmt(n);
    d.style.left = (42 + Math.random() * 16) + '%'; d.style.top = (34 + Math.random() * 15) + '%'; this.el.damageLayer.appendChild(d); setTimeout(() => d.remove(), 750);
  },
  toast(title,text){ const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = `<b>${title}</b><small>${text}</small>`; this.el.toastStack.appendChild(t); setTimeout(() => t.remove(), 3200); },
  reveal(type,name,desc){
    this.el.revealType.textContent = type; this.el.revealName.textContent = name; this.el.revealDesc.textContent = desc;
    this.el.revealBurst.textContent = type.includes('RELIC') ? '◆' : type.includes('PART') ? '◈' : type.includes('CHALLENGE') ? '★' : '✦';
    this.el.revealModal.classList.remove('hidden'); BZ.tone(660,.22,'sawtooth');
  },
  showOffline(o){
    const rows = [['Time Away',this.time(o.away)],['Effective Idle',this.time(o.secs)],['Enemies Defeated',BZ.fmt(o.kills)],['Yen Earned','¥'+BZ.fmt(o.yen)],['XP Earned',BZ.fmt(o.xp)],['Stand XP',BZ.fmt(o.standXP)]];
    this.el.offlineStats.innerHTML = rows.map(x => `<div class="offline-stat"><small>${x[0]}</small><b>${x[1]}</b></div>`).join(''); this.el.offlineModal.classList.remove('hidden');
  },
  time(sec){ const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=Math.floor(sec%60); if(h)return `${h}h ${m}m`; if(m)return `${m}m ${s}s`; return `${s}s`; },
  openTab(tab){
    document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    if(tab === 'fight'){ this.closeDrawer(); return; }
    this.el.drawer.classList.remove('hidden'); this.el.drawer.dataset.tab = tab; this.renderDrawer();
  },
  closeDrawer(){ this.el.drawer.classList.add('hidden'); document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.tab === 'fight')); },
  renderDrawer(){
    const tab=this.el.drawer.dataset.tab;
    const map={characters:['ROSTER','Characters'],stands:['STAND SYSTEM','Stands'],upgrades:['PROGRESSION','Upgrades & Skills'],items:['EQUIPMENT','Items & Relics'],quests:['FATE OBJECTIVES','Quests'],parts:['WORLD MAP','Parts'],prestige:['ASCENSION','Prestige'],achievements:['RECORDS','Achievements & Challenges'],settings:['SYSTEM','Settings']};
    const m=map[tab]||['SYSTEM','Menu']; this.el.drawerEyebrow.textContent=m[0]; this.el.drawerTitle.textContent=m[1];
    if(tab==='characters')this.drawCharacters(); if(tab==='stands')this.drawStands(); if(tab==='upgrades')this.drawUpgradesTree(); if(tab==='items')this.drawItems(); if(tab==='quests')this.drawQuests(); if(tab==='parts')this.drawParts(); if(tab==='prestige')this.drawPrestige(); if(tab==='achievements')this.drawAchievements(); if(tab==='settings')this.drawSettings();
  }
};
