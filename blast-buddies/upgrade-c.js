/* ---------- timestamp-safe snapshots + extra sync ---------- */
const bbxOldSerializeState=serializeState;
serializeState=function(){
  const s=bbxOldSerializeState();const t=nowS();s.mode=gameState.mode||'chaos';s.map=gameState.map||'neon';s.obstacles=gameState.obstacles||[];s.roundNo=gameState.roundNo||0;s.v=BBX.version;
  for(const q of s.players){const p=gameState.players[q.id];q.streak=p.streak||0;q.bestStreak=p.bestStreak||0;q.dashLeft=Math.max(0,1.85-(t-(p.lastDash||-99)));q.weaponLeft=Math.max(0,(p.weaponUntil||0)-t);q.speedLeft=Math.max(0,(p.speedUntil||0)-t);q.damageLeft=Math.max(0,(p.damageUntil||0)-t);q.regenLeft=Math.max(0,(p.regenUntil||0)-t)}
  return s;
};
const bbxOldApplySnapshot=applySnapshot;
applySnapshot=function(s){
  if(!s)return;const t=nowS();const s2={...s,players:(s.players||[]).map(p=>({...p,lastDash:(p.dashLeft||0)>0?t-(1.85-(p.dashLeft||0)):-99,weaponUntil:t+(p.weaponLeft||0),speedUntil:t+(p.speedLeft||0),damageUntil:t+(p.damageLeft||0),regenUntil:t+(p.regenLeft||0)}))};
  bbxOldApplySnapshot(s2);if(gameState){gameState.mode=s.mode||gameState.mode||'chaos';gameState.map=s.map||gameState.map||'neon';gameState.obstacles=s.obstacles||[];gameState.roundNo=s.roundNo||0}
};

/* ---------- presentation extras ---------- */
const bbxOldHandleEvent=handleEvent;
handleEvent=function(e){
  bbxOldHandleEvent(e);if(!e)return;
  if(e.kind==='streak'){
    const words={2:'DOUBLE KO!',3:'TRIPLE KO!',5:'RAMPAGE!',7:'UNSTOPPABLE!'};centerMessage((e.name||'PLAYER')+' — '+(words[e.streak]||e.streak+' STREAK'),1100);shake=Math.max(shake,8);
  }else if(e.kind==='slam'){shake=Math.max(shake,7);burst(e.x,e.y,16);if(e.player===myId)flash=.22}
  else if(e.kind==='pickup'){BBX.floating.push({x:e.x,y:e.y,text:String(e.pickupKind||'POWER').toUpperCase(),life:1.0})}
};
const bbxOldDraw=draw;
draw=function(dt,t){
  bbxOldDraw(dt,t);
  ctx.save();
  for(const o of gameState?.obstacles||[]){
    const g=ctx.createLinearGradient(o.x,o.y,o.x+o.w,o.y+o.h);g.addColorStop(0,'rgba(83,103,150,.96)');g.addColorStop(1,'rgba(28,35,55,.98)');ctx.fillStyle=g;ctx.strokeStyle='rgba(194,213,255,.28)';ctx.lineWidth=2;ctx.shadowBlur=12;ctx.shadowColor='rgba(77,125,255,.28)';roundRect(ctx,o.x,o.y,o.w,o.h,10);ctx.fill();ctx.shadowBlur=0;ctx.stroke();
  }
  const me=gameState?.players?.[myId];if(me?.alive&&me.weapon==='sniper'){
    ctx.save();ctx.globalAlpha=.22;ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.setLineDash([5,7]);ctx.beginPath();ctx.moveTo(me.x,me.y);ctx.lineTo(me.x+Math.cos(me.angle)*900,me.y+Math.sin(me.angle)*900);ctx.stroke();ctx.restore();
  }
  for(let i=BBX.floating.length-1;i>=0;i--){const f=BBX.floating[i];f.life-=dt;f.y-=24*dt;if(f.life<=0){BBX.floating.splice(i,1);continue}ctx.globalAlpha=Math.min(1,f.life*2);ctx.textAlign='center';ctx.font='900 12px system-ui';ctx.fillStyle='#fff';ctx.fillText(f.text,f.x,f.y-20)}ctx.globalAlpha=1;
  ctx.restore();
};

const bbxOldRenderHUD=renderHUD;
renderHUD=function(t){
  bbxOldRenderHUD(t);const p=gameState?.players?.[myId];
  const mode=$('#modeHud');if(mode)mode.textContent=(BBX_MODE_NAMES[gameState?.mode]||'Chaos')+' · '+(BBX_MAP_NAMES[gameState?.map]||gameState?.map||'Arena');
  const buffs=[];const n=nowS();if(p){if(n<(p.speedUntil||0))buffs.push('⚡ SPEED');if(n<(p.damageUntil||0))buffs.push('💢 DAMAGE');if(n<(p.regenUntil||0))buffs.push('✚ REGEN');if((p.streak||0)>=2)buffs.push('🔥 '+p.streak+' STREAK')}
  const b=$('#buffHud');if(b){b.textContent=buffs.join('   ');b.style.display=buffs.length?'block':'none'}
};
