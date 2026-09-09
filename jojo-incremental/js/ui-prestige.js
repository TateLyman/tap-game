Object.assign(BZ.UI,{
drawPrestige(){
    const s = BZ.state, rebirth = BZ.rebirthGain(), heaven = BZ.heavenGain(), dim = BZ.infiniteGain();
    this.el.drawerBody.innerHTML = `
      <div class="resource-grid">
        <div class="prestige-panel"><div class="headline"><h4>Joestar Legacy</h4><b>${s.legacy}</b></div><p>Reset basic Yen, levels, upgrades and waves. Keep characters, Stands, relics and achievements.</p><div class="card-stats"><span>Gain now <b>+${rebirth}</b></span><span>Multiplier <b>×${BZ.legacyMult().toFixed(2)}</b></span></div><button class="wide-btn" id="rebirthBtn">REBIRTH FOR +${rebirth}</button></div>
        <div class="prestige-panel"><div class="headline"><h4>Heaven Ascension</h4><b>${s.heaven}</b></div><p>Late-game prestige unlocked after Part 6. A much deeper reset for huge universal power.</p><div class="card-stats"><span>Gain now <b>+${heaven}</b></span><span>Requirement <b>Part 6+</b></span></div><button class="wide-btn" id="heavenBtn">ASCEND FOR +${heaven}</button></div>
        <div class="prestige-panel"><div class="headline"><h4>Infinite Rotation</h4><b>${s.dimensionShards}</b></div><p>Extreme endgame reset after Part 9 that grants Dimension Shards and multiverse scaling.</p><div class="card-stats"><span>Gain now <b>+${dim}</b></span><span>Requirement <b>Part 9+</b></span></div><button class="wide-btn" id="infiniteBtn">RESET FOR +${dim}</button></div>
      </div>
      <div class="section-title" style="margin-top:22px">Challenge Modes</div>
      <div class="section-sub">Complete 3 boss defeats while a challenge is active to lock in a permanent bonus.</div>
      <div class="resource-grid">${BZ.CHALLENGES.map(ch => {
        const wins = BZ.challengeWins(ch.id), active = s.challenge === ch.id;
        return `<div class="challenge ${active?'active':''}"><div class="tagline"><span>Unlock Part ${ch.unlockPart}</span><span>Wins ${wins}</span></div><h4>${ch.name}</h4><p>${ch.desc}</p><div class="rewardline">Reward: ${ch.reward}</div><button data-challenge="${ch.id}" ${s.unlockedPart<ch.unlockPart?'disabled':''}>${active?'END CHALLENGE':'START CHALLENGE'}</button></div>`;
      }).join('')}</div>`;
    document.getElementById('rebirthBtn').onclick = () => BZ.rebirth();
    document.getElementById('heavenBtn').onclick = () => BZ.heavenAscend();
    document.getElementById('infiniteBtn').onclick = () => BZ.infiniteReset();
    this.el.drawerBody.querySelectorAll('[data-challenge]').forEach(b => b.onclick = () => { BZ.startChallenge(b.dataset.challenge); this.drawPrestige(); });
  },

  drawAchievements(){
    const s = BZ.state;
    const stats = [
      ['Kills', s.stats.kills], ['Boss Kills', s.stats.bossKills], ['Critical Hits', s.stats.crits], ['Events', s.stats.events],
      ['Secrets', s.stats.secrets], ['Highest Combo', s.stats.highestCombo], ['Rebirths', s.stats.rebirths], ['Damage Done', s.stats.damageDone]
    ];
    this.el.drawerBody.innerHTML = `<div class="section-title">Achievements</div><div class="grid">${BZ.ACHIEVEMENTS.map((a,i) => `<article class="card achievement ${s.achievements.includes(a.id)?'done':''}"><span class="rarity">${s.achievements.includes(a.id)?'UNLOCKED':'LOCKED'}</span>${this.sprite('item', i%2===0?'legacy':'dimension', 'card-art')}<h3>${a.name}</h3><p>${a.desc}</p></article>`).join('')}</div><div class="section-title" style="margin-top:22px">Run Statistics</div><div class="resource-grid">${stats.map(([n,v]) => `<div class="stat-panel"><h4>${n}</h4><p>${typeof v==='number'?BZ.fmt(v):v}</p></div>`).join('')}</div>`;
  },

  drawSettings(){
    const s = BZ.state;
    const opts = [['audio','Original SFX'],['particles','Particles'],['shake','Screen shake'],['damageNumbers','Damage numbers'],['autosave','Autosave'],['performance','Performance mode'],['animations','Animations'],['darkFx','Dark effects']];
    this.el.drawerBody.innerHTML = `<div class="settings-grid">${opts.map(([k,n]) => `<div class="setting"><label><span>${n}</span><input type="checkbox" data-set="${k}" ${s.settings[k]?'checked':''}></label></div>`).join('')}<div class="setting"><label><span>Notation</span><select data-set="notation"><option value="short" ${s.settings.notation==='short'?'selected':''}>Short</option><option value="scientific" ${s.settings.notation==='scientific'?'selected':''}>Scientific</option></select></label></div></div><div class="section-title" style="margin-top:24px">Save Tools</div><div class="settings-grid"><div class="setting"><label>Export / Import</label><textarea class="savebox" id="saveBox" placeholder="Exported save appears here, or paste one to import."></textarea><div class="card-actions" style="margin-top:8px"><button id="exportBtn">EXPORT</button><button id="importBtn">IMPORT</button></div></div><div class="setting"><label>Danger Zone</label><p class="section-sub" style="margin-top:10px">Hard reset permanently deletes this browser save.</p><div class="card-actions"><button id="resetBtn">HARD RESET</button></div></div></div>`;
    this.el.drawerBody.querySelectorAll('input[data-set]').forEach(i => i.onchange = () => { s.settings[i.dataset.set] = i.checked; BZ.save(s); this.renderAll(); });
    const select = this.el.drawerBody.querySelector('select[data-set="notation"]');
    if(select) select.onchange = () => { s.settings.notation = select.value; BZ.save(s); this.renderAll(); this.drawSettings(); };
    document.getElementById('exportBtn').onclick = () => document.getElementById('saveBox').value = BZ.exportSave(s);
    document.getElementById('importBtn').onclick = () => {
      try{
        BZ.state = BZ.importSave(document.getElementById('saveBox').value);
        BZ.state.maxResolve = BZ.calcMaxResolve();
        BZ.state.resolve = Math.min(BZ.state.resolve, BZ.state.maxResolve);
        BZ.spawnEnemy();
        BZ.save(BZ.state);
        this.renderAll();
        this.toast('SAVE IMPORTED','Your timeline has been restored.');
      }catch(e){ this.toast('IMPORT FAILED','That save string is invalid.'); }
    };
    document.getElementById('resetBtn').onclick = () => {
      if(confirm('Delete ALL Bizarre Legacy progress on this browser?')){
        localStorage.removeItem(BZ.SAVE_KEY);
        location.reload();
      }
    };
  }
});