Object.assign(BZ.UI,{
drawUpgradesTree(){
    const s = BZ.state;
    const upgradeCards = BZ.UPGRADES.map(u => {
      const l = s.upgrades[u.id], cost = BZ.upgradeCost(u.id);
      return `<article class="card"><span class="rarity">SHOP UPGRADE</span>${this.sprite('item', u.id, 'card-art')}<h3>${u.name}</h3><p>${u.desc}</p><div class="card-stats"><span>Level <b>${l}</b></span><span>Effect <b>×${BZ.upgradeMult(u.id).toFixed(2)}</b></span></div><div class="card-actions"><button data-up="${u.id}" ${s.yen<cost?'disabled':''}>BUY • ¥${BZ.fmt(cost)}</button></div></article>`;
    }).join('');
    const skills = BZ.SKILL_TREES.map(sk => {
      const lvl = BZ.skillLevel(sk.id), cost = BZ.skillCost(sk.id), wallet = s[sk.currency] || 0;
      return `<div class="skill-node"><h4>${sk.name}</h4><p>${sk.desc}</p><div class="cost">${sk.currency}: ${wallet} • next cost ${cost}</div><div class="card-stats" style="margin-top:10px"><span>Level <b>${lvl}</b></span><span>Effect <b>${sk.effect(lvl).toFixed(2)}×</b></span></div><div class="card-actions" style="margin-top:10px"><button data-skill="${sk.id}" ${wallet<cost?'disabled':''}>LEARN</button></div></div>`;
    }).join('');
    this.el.drawerBody.innerHTML = `<div class="section-title">Core Upgrades</div><div class="grid">${upgradeCards}</div><div class="section-title" style="margin-top:22px">Hamon, Spin, Automation, Endgame Skills</div><div class="section-sub">These skill trees spend prestige currencies instead of Yen.</div><div class="resource-grid">${skills}</div>`;
    this.el.drawerBody.querySelectorAll('[data-up]').forEach(b => b.onclick = () => { BZ.upgrade(b.dataset.up); this.drawUpgradesTree(); this.renderUpgrades(); });
    this.el.drawerBody.querySelectorAll('[data-skill]').forEach(b => b.onclick = () => { BZ.buySkill(b.dataset.skill); this.drawUpgradesTree(); });
  },

  drawItems(){
    const s = BZ.state;
    this.el.drawerBody.innerHTML = `<div class="section-title">Relics & Equipment</div><div class="section-sub">These items dramatically alter builds. Only one relic is equipped at a time in this build.</div><div class="resource-grid" style="margin-bottom:18px"><div class="stat-panel"><h4>Current Relic</h4><p>${BZ.getItem(s.equippedItem)?.name || 'None equipped'}</p></div><div class="stat-panel"><h4>Materials</h4><p>Blood ${BZ.fmt(s.materials.blood)} • Spin ${BZ.fmt(s.materials.spin)} • DISC ${BZ.fmt(s.materials.disc)} • Corpse ${BZ.fmt(s.materials.corpse)} • Locacaca ${BZ.fmt(s.materials.locacaca)} • Mechanism ${BZ.fmt(s.materials.mechanism)}</p></div></div><div class="grid">${BZ.ITEMS.map(i => {
      const got = s.items.includes(i.id);
      return `<article class="card ${got?'':'locked'} ${s.equippedItem===i.id?'selected':''}"><span class="rarity">${i.rarity}</span>${this.sprite('item', i.id, 'card-art')}<h3>${i.name}</h3><p>${i.desc}</p><div class="card-actions"><button data-item="${i.id}" ${got?'':'disabled'}>${s.equippedItem===i.id?'EQUIPPED':got?'EQUIP':'UNKNOWN'}</button></div></article>`;
    }).join('')}</div>`;
    this.el.drawerBody.querySelectorAll('[data-item]').forEach(b => b.onclick = () => { BZ.equipItem(b.dataset.item); this.drawItems(); });
  },

  drawQuests(){
    const s = BZ.state;
    this.el.drawerBody.innerHTML = `<div class="section-title">Quests</div><div class="grid">${BZ.QUESTS.map(q => {
      const p = Math.min(q.goal, s.questProgress[q.id] || 0), done = p >= q.goal, claimed = s.claimedQuests.includes(q.id);
      return `<article class="card quest"><span class="rarity">${claimed?'CLAIMED':done?'COMPLETE':'ACTIVE'}</span><h3>${q.name}</h3><p>${q.desc}</p><div class="progress"><i style="width:${p/q.goal*100}%"></i></div><small>${BZ.fmt(p)} / ${BZ.fmt(q.goal)}</small><div class="reward">${Object.entries(q.reward).map(([k,v]) => `${k} +${v}`).join('<br>')}</div><div class="card-actions"><button data-claim="${q.id}" ${!done||claimed?'disabled':''}>CLAIM</button></div></article>`;
    }).join('')}</div><div class="section-title" style="margin-top:24px">Story Notes</div><div class="split-grid">${BZ.PARTS.map(p => `<div class="story-panel"><h4>Part ${p.id}: ${p.name}</h4><p class="story-line">${BZ.STORY?.[p.id] || p.mechanic}</p></div>`).join('')}</div>`;
    this.el.drawerBody.querySelectorAll('[data-claim]').forEach(b => b.onclick = () => { BZ.claimQuest(b.dataset.claim); this.drawQuests(); });
  },

  drawParts(){
    const s = BZ.state;
    this.el.drawerBody.innerHTML = `<div class="section-title">Travel the JoJo eras</div><div class="section-sub">Each Part has 30 encounters, distinct bosses, resources and mechanics.</div><div class="grid">${BZ.PARTS.map(p => {
      const unlocked = p.id <= s.unlockedPart, done = s.completedParts.includes(p.id), prog = p.id === s.part ? Math.min(100, ((s.wave - 1) % 30) / 30 * 100) : (done ? 100 : 0), artPos = this.artCoords('parts', p.id);
      return `<article class="card part-card ${unlocked?'':'locked'} ${s.part===p.id?'selected':''}"><div class="part-num">${p.id}</div><span class="rarity">PART ${p.id}</span><div class="card-art" style="background-image:url('${BZ.ASSETS.hero}');background-size:400% 200%;background-position:${artPos.x} ${artPos.y}"></div><h3>${p.name}</h3><p>${p.location} • ${p.mechanic}<br>${p.bosses.join(' • ')}</p><div class="progress"><i style="width:${prog}%"></i></div><div class="card-actions"><button data-part="${p.id}" ${unlocked?'':'disabled'}>${s.part===p.id?'CURRENT':unlocked?'TRAVEL':'LOCKED'}</button></div></article>`;
    }).join('')}</div>`;
    this.el.drawerBody.querySelectorAll('[data-part]').forEach(b => b.onclick = () => { BZ.travelTo(+b.dataset.part); this.closeDrawer(); });
  }
});