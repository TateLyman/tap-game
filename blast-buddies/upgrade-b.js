/* ---------- modes, maps, buffs ---------- */
const bbxOldStartRound=startRound;
startRound=function(){
  if(!isHost&&!isSolo)return;
  if(Object.keys(gameState.players).length<2){toast('Add a bot or wait for a friend');return}
  const modeSel=$('#modeSelect'),mapSel=$('#mapSelect');
  gameState.mode=isSolo?'chaos':(modeSel?.value||gameState.mode||'chaos');
  gameState.map=bbxChooseMap(isSolo?'random':(mapSel?.value||gameState.map||'random'));
  gameState.obstacles=bbxBuildArena(gameState.map);gameState.roundNo=(gameState.roundNo||0)+1;
  for(const p of Object.values(gameState.players)){p.streak=0;p.bestStreak=0;p.speedUntil=0;p.damageUntil=0;p.regenUntil=0;p.dashHitIds=[]}
  bbxOldStartRound();
};

const bbxOldRespawn=respawn;
respawn=function(p,instant=false){
  bbxOldRespawn(p,instant);
  p.speedUntil=p.speedUntil||0;p.damageUntil=p.damageUntil||0;p.regenUntil=p.regenUntil||0;p.dashHitIds=[];
  if(gameState?.mode==='gungame'){
    p.weapon=BBX_GUN_LADDER[Math.min(BBX_GUN_LADDER.length-1,p.score||0)]||'blaster';p.weaponUntil=1e9;
  }else if(gameState?.mode==='oneshot'){
    p.weapon='sniper';p.weaponUntil=1e9;p.hp=65;
  }
};

function bbxResolveWallCollision(p){
  for(const o of gameState.obstacles||[]){
    const nx=clamp(p.x,o.x,o.x+o.w),ny=clamp(p.y,o.y,o.y+o.h);let dx=p.x-nx,dy=p.y-ny,d2=dx*dx+dy*dy;
    if(d2>=20*20)continue;
    if(d2<.001){
      const dl=Math.abs(p.x-o.x),dr=Math.abs(o.x+o.w-p.x),dt=Math.abs(p.y-o.y),db=Math.abs(o.y+o.h-p.y),m=Math.min(dl,dr,dt,db);
      if(m===dl)p.x=o.x-20;else if(m===dr)p.x=o.x+o.w+20;else if(m===dt)p.y=o.y-20;else p.y=o.y+o.h+20;
    }else{
      const d=Math.sqrt(d2),push=20-d;p.x+=dx/d*push;p.y+=dy/d*push;
    }
  }
  p.x=clamp(p.x,24,W-24);p.y=clamp(p.y,24,H-24);
}
function bbxPointInWall(x,y,r=0){return (gameState.obstacles||[]).some(o=>x+r>o.x&&x-r<o.x+o.w&&y+r>o.y&&y-r<o.y+o.h)}

stepPlayer=function(p,dt,t){
  const input=p.id===myId&&isHost?localInput:p.input||{};let mx=(input.right?1:0)-(input.left?1:0),my=(input.down?1:0)-(input.up?1:0);const mag=Math.hypot(mx,my)||1;mx/=mag;my/=mag;p.angle=Number.isFinite(input.aim)?input.aim:p.angle;
  if(input.dashSeq!==p.lastDashSeq&&t-p.lastDash>1.85){p.lastDashSeq=input.dashSeq;p.lastDash=t;p.dashHitIds=[];let dx=mx,dy=my;if(Math.hypot(dx,dy)<.1){dx=Math.cos(p.angle);dy=Math.sin(p.angle)}p.vx=dx*900;p.vy=dy*900;emitEvent('dash',{player:p.id,x:p.x,y:p.y})}
  const dashing=t-p.lastDash<.17,buffed=t<(p.speedUntil||0),speed=(dashing?760:255)*(buffed?1.34:1),accel=dashing?11:15;const tvx=mx*speed,tvy=my*speed;p.vx+=(tvx-p.vx)*Math.min(1,accel*dt);p.vy+=(tvy-p.vy)*Math.min(1,accel*dt);p.x+=p.vx*dt;p.y+=p.vy*dt;p.x=clamp(p.x,24,W-24);p.y=clamp(p.y,24,H-24);bbxResolveWallCollision(p);
  if(dashing){for(const q of Object.values(gameState.players)){if(q.id===p.id||!q.alive||(p.dashHitIds||[]).includes(q.id))continue;if(dist2(p,q)<43*43){p.dashHitIds.push(q.id);damagePlayer(q,22,p.id,t,360);emitEvent('slam',{player:q.id,owner:p.id,x:q.x,y:q.y})}}}
  const dc=Math.hypot(p.x-CX,p.y-CY);if(dc>gameState.stormRadius)damagePlayer(p,24*dt,null,t,0);
  if(t<(p.regenUntil||0)&&p.hp>0&&p.hp<100)p.hp=Math.min(100,p.hp+7.5*dt);
  if(gameState.mode==='gungame'||gameState.mode==='oneshot'){}else if(p.weapon!=='blaster'&&t>p.weaponUntil)p.weapon='blaster';
  if(input.fire)tryShoot(p,t);
};

tryShoot=function(p,t){
  const w=WEAPONS[p.weapon]||WEAPONS.blaster;if(t-p.lastShot<w.rate)return;p.lastShot=t;const dmgMult=t<(p.damageUntil||0)?1.45:1;
  for(let i=0;i<w.count;i++){
    const offset=w.count===1?rand(-w.spread,w.spread):(-w.spread/2)+(w.spread*(i/(w.count-1)));const a=p.angle+offset+rand(-.012,.012);
    gameState.projectiles.push({id:++projectileCounter,owner:p.id,x:p.x+Math.cos(a)*24,y:p.y+Math.sin(a)*24,vx:Math.cos(a)*w.speed,vy:Math.sin(a)*w.speed,damage:w.damage*dmgMult,life:w.life,radius:w.radius,rocket:!!w.rocket,weapon:p.weapon,pierce:w.pierce||0,splash:w.splash||0,bounces:w.bounces||0,homing:!!w.homing,hitIds:[]});
  }
  emitEvent('shoot',{player:p.id,weapon:p.weapon,x:p.x,y:p.y});
};

function bbxExplodeProjectile(b,t){
  emitEvent('boom',{x:b.x,y:b.y});const radius=b.splash||105;
  for(const p of Object.values(gameState.players)){
    if(!p.alive||p.id===b.owner)continue;const d=Math.hypot(p.x-b.x,p.y-b.y);if(d<radius){const mult=Math.max(.28,1-d/(radius+30));damagePlayer(p,b.damage*mult,b.owner,t,260*mult)}
  }
}
stepProjectiles=function(dt,t){
  for(let i=gameState.projectiles.length-1;i>=0;i--){
    const b=gameState.projectiles[i];b.life-=dt;
    if(b.homing){let target=null,bd=1e18;for(const p of Object.values(gameState.players)){if(!p.alive||p.id===b.owner)continue;const d=(p.x-b.x)**2+(p.y-b.y)**2;if(d<bd){bd=d;target=p}}if(target){const sp=Math.hypot(b.vx,b.vy)||430,cur=Math.atan2(b.vy,b.vx),want=Math.atan2(target.y-b.y,target.x-b.x);let da=((want-cur+Math.PI*3)%(Math.PI*2))-Math.PI;const na=cur+clamp(da,-2.7*dt,2.7*dt);b.vx=Math.cos(na)*sp;b.vy=Math.sin(na)*sp}}
    b.x+=b.vx*dt;b.y+=b.vy*dt;
    let remove=false;
    if(b.x<0||b.x>W){if((b.bounces||0)>0){b.vx*=-1;b.bounces--;b.x=clamp(b.x,2,W-2)}else remove=true}
    if(b.y<0||b.y>H){if((b.bounces||0)>0){b.vy*=-1;b.bounces--;b.y=clamp(b.y,2,H-2)}else remove=true}
    if(bbxPointInWall(b.x,b.y,b.radius||3)){
      if((b.bounces||0)>0){b.vx*=-1;b.vy*=-1;b.bounces--;b.x+=b.vx*dt*2;b.y+=b.vy*dt*2}else remove=true;
    }
    if(b.life<=0)remove=true;
    if(remove){if(b.rocket||b.splash)bbxExplodeProjectile(b,t);gameState.projectiles.splice(i,1);continue}
    let hit=null;for(const p of Object.values(gameState.players)){if(!p.alive||p.id===b.owner||(b.hitIds||[]).includes(p.id))continue;const rr=18+(b.radius||4);if((p.x-b.x)**2+(p.y-b.y)**2<rr*rr){hit=p;break}}
    if(hit){
      if(b.rocket||b.splash){bbxExplodeProjectile(b,t);gameState.projectiles.splice(i,1);continue}
      damagePlayer(hit,b.damage,b.owner,t,150);emitEvent('hit',{player:hit.id,owner:b.owner,x:hit.x,y:hit.y});b.hitIds.push(hit.id);
      if((b.pierce||0)>0){b.pierce--;}else gameState.projectiles.splice(i,1);
    }
  }
};

maybeSpawnPickup=function(t){
  if(t-gameState.lastPickup<4.0||gameState.pickups.length>=5)return;gameState.lastPickup=t;
  let kinds=gameState.mode==='gungame'||gameState.mode==='oneshot'?['shield','heal','speed','damage','regen']:['rapid','scatter','rocket','burst','minigun','sniper','plasma','seeker','shield','heal','speed','damage','regen'];
  const kind=kinds[Math.floor(Math.random()*kinds.length)],s=spawnPoint();if(bbxPointInWall(s.x,s.y,20))return;gameState.pickups.push({id:++pickupCounter,kind,x:s.x,y:s.y});
};
stepPickups=function(t){
  for(let i=gameState.pickups.length-1;i>=0;i--){const u=gameState.pickups[i];let got=null;for(const p of Object.values(gameState.players)){if(!p.alive)continue;if((p.x-u.x)**2+(p.y-u.y)**2<36*36){got=p;break}}if(!got)continue;
    if(u.kind==='shield')got.shield=Math.min(80,got.shield+50);else if(u.kind==='heal')got.hp=Math.min(100,got.hp+48);else if(u.kind==='speed')got.speedUntil=t+9;else if(u.kind==='damage')got.damageUntil=t+8;else if(u.kind==='regen')got.regenUntil=t+10;else if(gameState.mode!=='gungame'&&gameState.mode!=='oneshot'){got.weapon=u.kind;got.weaponUntil=t+14}
    emitEvent('pickup',{player:got.id,pickupKind:u.kind,x:u.x,y:u.y});gameState.pickups.splice(i,1);
  }
};

const bbxOldKillPlayer=killPlayer;
killPlayer=function(p,owner,t){
  if(!p.alive)return;const killerId=(owner&&owner!==p.id)?owner:((!owner&&p.lastHitBy&&t-p.lastHitAt<4&&p.lastHitBy!==p.id)?p.lastHitBy:null);const killer=killerId?gameState.players[killerId]:null;bbxOldKillPlayer(p,owner,t);p.streak=0;
  if(killer){killer.streak=(killer.streak||0)+1;killer.bestStreak=Math.max(killer.bestStreak||0,killer.streak);killer.hp=Math.min(100,killer.hp+12);
    if(gameState.mode==='gungame'){killer.weapon=BBX_GUN_LADDER[Math.min(BBX_GUN_LADDER.length-1,killer.score||0)]||'seeker';killer.weaponUntil=1e9}
    if([2,3,5,7].includes(killer.streak))emitEvent('streak',{player:killer.id,streak:killer.streak,name:killer.name,x:killer.x,y:killer.y});
  }
};
