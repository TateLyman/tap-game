Object.assign(BZ.UI,{
drawCharacters(){
    const s = BZ.state;
    this.el.drawerBody.innerHTML = `<div class="section-title">Build a party of up to 6</div><div class="section-sub">Roles and synergies matter. Tap a recruited unit to add or remove it from the active team.</div><div class="grid">${BZ.CHARACTERS.map(c => {
      const unlocked = s.unlockedCharacters.includes(c.id), selected = s.party.includes(c.id), lvl = BZ.charLevel(c.id), cost = 35 * c.base * Math.pow(1.19, lvl - 1);
      return `<article class="card ${unlocked?'':'locked'} ${selected?'selected':''}"><span class="rarity">${c.rarity} • PART ${c.part}</span>${this.sprite('char', c.id, 'card-art')}<h3>${c.name}</h3><p>${c.passive}</p><div class="card-stats"><span>Role <b>${c.role}</b></span><span>Lv <b>${lvl}</b></span><span>Base <b>${BZ.fmt(c.base)}</b></span><span>Skill <b>${c.skill || 'Fighter'}</b></span></div><div class="card-actions">${unlocked?`<button data-team="${c.id}" class="${selected?'primary':''}">${selected?'ACTIVE':'ADD TEAM'}</button><button data-clvl="${c.id}" ${s.yen<cost?'disabled':''}>LVL ¥${BZ.fmt(cost)}</button>`:'<button disabled>LOCKED</button>'}</div></article>`;
    }).join('')}</div>`;
    this.el.drawerBody.querySelectorAll('[data-team]').forEach(b => b.onclick = () => {
      const id = b.dataset.team, p = s.party, idx = p.indexOf(id);
      if(idx >= 0) p.splice(idx,1);
      else if(p.length < 6) p.push(id);
      else return this.toast('PARTY FULL','Remove a unit first.');
      this.renderAll();
      this.drawCharacters();
    });
    this.el.drawerBody.querySelectorAll('[data-clvl]').forEach(b => b.onclick = () => { BZ.levelChar(b.dataset.clvl); this.drawCharacters(); });
  },

  drawStands(){
    const s = BZ.state;
    this.el.drawerBody.innerHTML = `<div class="section-title">Stand Collection</div><div class="section-sub">Arrows awaken base Stands. Evolution forms require level and boss challenge progress.</div><div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap"><button class="wide-btn" id="drawerArrow">Use Stand Arrow (${s.arrows})</button><div class="skill-node" style="min-width:220px"><h4>Pity System</h4><p>Your current Stand pity is <b>${s.pity.stand || 0}</b>. At 12+ pity, higher rarities become much more likely.</p></div></div><div class="grid">${BZ.STANDS.map(st => {
      const unlocked = s.unlockedStands.includes(st.id), lvl = BZ.standLevel(st.id), cost = 120 * st.power * Math.pow(1.22, lvl - 1);
      return `<article class="card ${unlocked?'':'locked'} ${s.activeStand===st.id?'selected':''}"><span class="rarity">${st.rarity} • PART ${st.part}</span>${this.sprite('stand', st.id, 'card-art')}<h3>${st.name}</h3><p>${st.passive}</p><div class="card-stats"><span>PWR <b>${st.power}</b></span><span>SPD <b>${st.speed}</b></span><span>Lv <b>${lvl}</b></span><span>Owner <b>${st.owner || '?'}</b></span></div><div class="card-actions">${unlocked?`<button data-equip="${st.id}" class="${s.activeStand===st.id?'primary':''}">${s.activeStand===st.id?'EQUIPPED':'EQUIP'}</button><button data-slvl="${st.id}" ${s.yen<cost?'disabled':''}>LVL ¥${BZ.fmt(cost)}</button>${st.evolves?`<button data-evolve="${st.id}">EVOLVE</button>`:''}`:'<button disabled>UNKNOWN</button>'}</div></article>`;
    }).join('')}</div>`;
    document.getElementById('drawerArrow').onclick = () => BZ.rollStand();
    this.el.drawerBody.querySelectorAll('[data-equip]').forEach(b => b.onclick = () => { s.activeStand = b.dataset.equip; this.renderAll(); this.drawStands(); });
    this.el.drawerBody.querySelectorAll('[data-slvl]').forEach(b => b.onclick = () => { BZ.levelStand(b.dataset.slvl); this.drawStands(); });
    this.el.drawerBody.querySelectorAll('[data-evolve]').forEach(b => b.onclick = () => { BZ.evolveStand(b.dataset.evolve); this.drawStands(); });
  }
});