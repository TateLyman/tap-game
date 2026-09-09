// Bizarre Legacy emergency boot/runtime fix.
// The old build spawned an enemy before the UI cached DOM nodes, which aborted init.
window.BZ = window.BZ || {};
BZ.init = function(){
  BZ.state.maxResolve = BZ.calcMaxResolve();
  BZ.state.resolve = Math.min(BZ.state.resolve || BZ.state.maxResolve, BZ.state.maxResolve);
  const off = BZ.offlineRewards();
  if(BZ.UI && typeof BZ.UI.init === 'function') BZ.UI.init(off);
  if(!BZ.state.enemy.name || BZ.state.enemy.hp <= 0) BZ.spawnEnemy();
  else {
    BZ.state.enemy.actionTimer = Math.min(BZ.state.enemy.actionTimer || BZ.state.enemy.actionInterval || 6, BZ.state.enemy.actionInterval || 6);
    if(BZ.UI && typeof BZ.UI.renderAll === 'function') BZ.UI.renderAll();
  }
  requestAnimationFrame(BZ.tick);
  window.addEventListener('beforeunload', () => BZ.save(BZ.state));
};
