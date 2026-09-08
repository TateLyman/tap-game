const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const homeScreen=$('#homeScreen'), lobbyScreen=$('#lobbyScreen'), gameScreen=$('#gameScreen');
const canvas=$('#gameCanvas'), ctx=canvas.getContext('2d');
const W=1200,H=720,CX=W/2,CY=H/2,MAX_PLAYERS=8,ROUND_TIME=90,WIN_SCORE=8;
const COLORS=['#7cf7c8','#ff7aa5','#6bc7ff','#ffd166','#c79aff','#ff9f43','#8ce99a','#f783ac'];
const WEAPONS={
  blaster:{name:'BLASTER',rate:.27,speed:900,damage:18,life:1.25,count:1,spread:0,radius:5},
  rapid:{name:'RAPID',rate:.095,speed:930,damage:9,life:1.05,count:1,spread:.03,radius:4},
  scatter:{name:'SCATTER',rate:.62,speed:800,damage:8,life:.62,count:7,spread:.62,radius:4},
  rocket:{name:'ROCKET',rate:.78,speed:520,damage:38,life:1.65,count:1,spread:0,radius:8,rocket:true}
};
const PICKUP_COLORS={rapid:'#ffd166',scatter:'#ff8fab',rocket:'#ff6b35',shield:'#63d7ff',heal:'#8cff98'};
let peer=null, hostConn=null, conns=new Map(), isHost=false, isSolo=false, roomCode='', myId='', gameState=null, localInput={up:false,down:false,left:false,right:false,fire:false,aim:0,dashSeq:0}, lastInputSend=0;
let simRAF=0, renderRAF=0, lastSim=0, lastRender=0, broadcastAcc=0, eventSeq=0, botCounter=0, projectileCounter=0, pickupCounter=0, meteorCounter=0;
let visualPlayers=new Map(), particles=[], shake=0, flash=0, centerTimer=0, muted=false, audioCtx=null;
let feedItems=[];

function setScreen(which){[homeScreen,lobbyScreen,gameScreen].forEach(s=>s.classList.remove('active'));which.classList.add('active')}
function cleanName(){return ($('#nameInput').value.trim().replace(/[<>]/g,'').slice(0,16)||'Player')}
function cleanRoom(v){return (v||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,5)}
function randomRoom(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<5;i++)s+=chars[Math.floor(Math.random()*chars.length)];return s}
function hostPeerId(code){return 'blast-buddies-host-'+code.toLowerCase()}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('show'),1800)}
function status(el,msg,kind=''){el.textContent=msg;el.className='status '+kind}
function esc(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function rand(a,b){return a+Math.random()*(b-a)}
function dist2(a,b){const dx=a.x-b.x,dy=a.y-b.y;return dx*dx+dy*dy}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function nowS(){return performance.now()/1000}

function ensureAudio(){if(muted)return;try{if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume()}catch{}}
function beep(type){if(muted)return;ensureAudio();if(!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain(),t=audioCtx.currentTime;let f=220,d=.06,v=.035,w='square';
  if(type==='shoot'){f=170;d=.035;v=.024}else if(type==='rocket'){f=75;d=.12;v=.055;w='sawtooth'}else if(type==='hit'){f=110;d=.05;v=.025}else if(type==='pickup'){f=520;d=.12;v=.035;w='sine'}else if(type==='kill'){f=85;d=.22;v=.06;w='sawtooth'}else if(type==='dash'){f=330;d=.06;v=.026;w='triangle'}else if(type==='start'){f=700;d=.16;v=.035;w='sine'}
  o.type=w;o.frequency.setValueAtTime(f,t);if(type==='pickup')o.frequency.exponentialRampToValueAtTime(900,t+d);else if(type==='kill')o.frequency.exponentialRampToValueAtTime(45,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(audioCtx.destination);o.start(t);o.stop(t+d+.02)
}

function newState(){return {phase:'lobby',players:{},projectiles:[],pickups:[],meteors:[],timeLeft:ROUND_TIME,startedAt:0,stormRadius:325,winner:null,lastPickup:0,lastMeteor:0}}
function spawnPoint(){const a=Math.random()*Math.PI*2,r=rand(40,225);return {x:CX+Math.cos(a)*r,y:CY+Math.sin(a)*r}}
function addPlayer(id,name,{bot=false,host=false}={}){if(!gameState)gameState=newState();if(Object.keys(gameState.players).length>=MAX_PLAYERS)return false;const p=spawnPoint();gameState.players[id]={id,name:name.slice(0,16),x:p.x,y:p.y,vx:0,vy:0,angle:0,hp:100,shield:0,score:0,deaths:0,alive:true,respawnAt:0,color:COLORS[Object.keys(gameState.players).length%COLORS.length],weapon:'blaster',weaponUntil:0,lastShot:-99,lastDash:-99,lastDashSeq:-1,lastHitBy:null,lastHitAt:0,bot,host,input:{up:false,down:false,left:false,right:false,fire:false,aim:0,dashSeq:0}};broadcastLobby();return true}
function removePlayer(id){if(gameState?.players[id]){delete gameState.players[id];broadcastLobby()}}
function lobbyPayload(){return {type:'lobby',room:roomCode,players:Object.values(gameState?.players||{}).map(p=>({id:p.id,name:p.name,color:p.color,bot:p.bot,host:p.host})),isHost}}
function sendAll(msg){for(const c of conns.values())if(c.open)try{c.send(msg)}catch{}}
function broadcastLobby(){if(!isHost&&!isSolo)return;updateLobbyUI();if(isHost)sendAll(lobbyPayload())}
function emitEvent(kind,data={}){const ev={type:'event',eid:++eventSeq,kind,...data};handleEvent(ev);if(isHost)sendAll(ev)}

function hostRoom(){cleanupNet();ensureAudio();isSolo=false;isHost=true;roomCode=randomRoom();myId='host';gameState=newState();addPlayer(myId,cleanName(),{host:true});status($('#homeStatus'),'Creating room…');
  if(typeof Peer==='undefined'){status($('#homeStatus'),'Multiplayer library failed to load. Check your internet.', 'error');isHost=false;return}
  peer=new Peer(hostPeerId(roomCode));
  peer.on('open',()=>{setScreen(lobbyScreen);$('#roomCodeText').textContent=roomCode;$('#roomHud').textContent='ROOM '+roomCode;$('#hostControls').style.display='flex';status($('#lobbyStatus'),'Room is live. Send the code to your friends.','good');updateLobbyUI();updateInviteURL()});
  peer.on('connection',conn=>{if(Object.keys(gameState.players).length>=MAX_PLAYERS){conn.on('open',()=>{conn.send({type:'reject',reason:'Room is full'});setTimeout(()=>conn.close(),250)});return} setupIncoming(conn)});
  peer.on('error',e=>{const m=e.type==='unavailable-id'?'That room code collided. Try Create Room again.':('Network error: '+e.type);status($('#homeStatus'),m,'error');status($('#lobbyStatus'),m,'error')});
}
function setupIncoming(conn){conns.set(conn.peer,conn);conn.on('data',data=>handleHostData(conn,data));conn.on('close',()=>{removePlayer(conn.peer);conns.delete(conn.peer)});conn.on('error',()=>{removePlayer(conn.peer);conns.delete(conn.peer)})}
function handleHostData(conn,d){if(!d||typeof d!=='object')return;if(d.type==='hello'){const name=String(d.name||'Player').replace(/[<>]/g,'').slice(0,16);if(!gameState.players[conn.peer])addPlayer(conn.peer,name);conn.send(lobbyPayload());if(gameState.phase==='playing')conn.send({type:'state',state:serializeState()})}
  else if(d.type==='input'){const p=gameState.players[conn.peer];if(p&&!p.bot){const q=d.input||{};p.input={up:!!q.up,down:!!q.down,left:!!q.left,right:!!q.right,fire:!!q.fire,aim:Number.isFinite(q.aim)?q.aim:0,dashSeq:Number.isFinite(q.dashSeq)?q.dashSeq:0}}}}
function joinRoom(){cleanupNet();ensureAudio();isSolo=false;isHost=false;roomCode=cleanRoom($('#roomInput').value);if(roomCode.length!==5){status($('#homeStatus'),'Enter the 5-letter room code.','error');return} if(typeof Peer==='undefined'){status($('#homeStatus'),'Multiplayer library failed to load.','error');return}
  status($('#homeStatus'),'Connecting…');peer=new Peer();peer.on('open',id=>{myId=id;hostConn=peer.connect(hostPeerId(roomCode),{reliable:false,metadata:{game:'blast-buddies'}});hostConn.on('open',()=>{hostConn.send({type:'hello',name:cleanName()});setScreen(lobbyScreen);$('#roomCodeText').textContent=roomCode;$('#roomHud').textContent='ROOM '+roomCode;$('#hostControls').style.display='none';status($('#lobbyStatus'),'Connected. Waiting for host…','good')});hostConn.on('data',handleClientData);hostConn.on('close',()=>connectionLost());hostConn.on('error',()=>connectionLost())});peer.on('error',e=>{status($('#homeStatus'),'Could not join: '+e.type,'error');status($('#lobbyStatus'),'Connection error: '+e.type,'error')})}
function handleClientData(d){if(!d||typeof d!=='object')return;if(d.type==='reject'){status($('#lobbyStatus'),d.reason||'Could not join','error')}else if(d.type==='lobby'){gameState=gameState||newState();for(const p of d.players){if(!gameState.players[p.id])gameState.players[p.id]={...p};else Object.assign(gameState.players[p.id],p)}for(const id of Object.keys(gameState.players))if(!d.players.some(p=>p.id===id))delete gameState.players[id];updateLobbyUI()}else if(d.type==='start'){setScreen(gameScreen);$('#endOverlay').classList.remove('show');beep('start');centerMessage('GO!',900)}else if(d.type==='state'){applySnapshot(d.state)}else if(d.type==='event'){handleEvent(d)}else if(d.type==='backLobby'){gameState=newState();for(const p of d.players){gameState.players[p.id]={...p}}setScreen(lobbyScreen);updateLobbyUI()}}
function connectionLost(){if(gameScreen.classList.contains('active')||lobbyScreen.classList.contains('active')){toast('Host disconnected');setTimeout(leaveToHome,400)}}
function cleanupNet(){cancelAnimationFrame(simRAF);cancelAnimationFrame(renderRAF);simRAF=renderRAF=0;try{hostConn?.close()}catch{};hostConn=null;for(const c of conns.values())try{c.close()}catch{};conns.clear();try{peer?.destroy()}catch{};peer=null}
function leaveToHome(){cleanupNet();localInput={up:false,down:false,left:false,right:false,fire:false,aim:0,dashSeq:0};isHost=false;isSolo=false;roomCode='';gameState=null;visualPlayers.clear();particles=[];feedItems=[];setScreen(homeScreen);status($('#homeStatus'),'')}
