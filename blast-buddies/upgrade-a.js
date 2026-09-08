/* Blast Buddies Upgrade Layer v2 — additive, loaded after core/sim/render and before input */
const BBX = {
  version: 2,
  reconnectTries: 0,
  reconnectTimer: 0,
  joinTimer: 0,
  closingNet: false,
  disconnectGrace: new Map(),
  floating: [],
  padDashHeld: false,
  lastPadSeen: 0,
  roomAutoStarted: false
};

/* ---------- new content ---------- */
Object.assign(WEAPONS, {
  burst:   {name:'BURST',rate:.36,speed:980,damage:12,life:1.08,count:3,spread:.09,radius:4},
  minigun: {name:'MINIGUN',rate:.058,speed:940,damage:5.8,life:.95,count:1,spread:.09,radius:3},
  sniper:  {name:'SNIPER',rate:1.02,speed:1550,damage:72,life:.82,count:1,spread:0,radius:3,pierce:2},
  plasma:  {name:'PLASMA',rate:.34,speed:670,damage:16,life:1.45,count:1,spread:.02,radius:10,splash:62,bounces:1},
  seeker:  {name:'SEEKER',rate:.92,speed:430,damage:32,life:2.2,count:1,spread:0,radius:7,rocket:true,homing:true,splash:105}
});
Object.assign(PICKUP_COLORS, {
  burst:'#b8ff74',minigun:'#ffe66d',sniper:'#f8f9ff',plasma:'#b28dff',seeker:'#ff6f59',
  speed:'#50e3ff',damage:'#ff4d9d',regen:'#7dff9a'
});
const BBX_GUN_LADDER=['blaster','rapid','burst','scatter','plasma','minigun','rocket','sniper','seeker'];
const BBX_MAPS={
  neon:[],
  cross:[
    {x:455,y:250,w:105,h:42},{x:640,y:250,w:105,h:42},
    {x:455,y:428,w:105,h:42},{x:640,y:428,w:105,h:42}
  ],
  pillars:[
    {x:330,y:200,w:58,h:58},{x:812,y:200,w:58,h:58},{x:330,y:462,w:58,h:58},{x:812,y:462,w:58,h:58},
    {x:570,y:150,w:60,h:60},{x:570,y:510,w:60,h:60}
  ],
  gates:[
    {x:365,y:160,w:38,h:155},{x:365,y:405,w:38,h:155},
    {x:797,y:160,w:38,h:155},{x:797,y:405,w:38,h:155},
    {x:500,y:335,w:200,h:38}
  ]
};
const BBX_MODE_NAMES={chaos:'Chaos',gungame:'Gun Game',oneshot:'One Shot'};
const BBX_MAP_NAMES={random:'Random',neon:'Neon Ring',cross:'Crossfire',pillars:'Pillars',gates:'Gates'};

function bbxBuildArena(name){
  const src=BBX_MAPS[name]||[];
  return src.map((o,i)=>({id:'wall-'+i,x:o.x,y:o.y,w:o.w,h:o.h}));
}
function bbxChooseMap(value){
  if(value&&value!=='random'&&BBX_MAPS[value])return value;
  const keys=Object.keys(BBX_MAPS);return keys[Math.floor(Math.random()*keys.length)];
}
function bbxInviteLink(){
  try{
    const u=new URL(location.href);
    u.hash='';u.search='';
    if(u.hostname==='raw.githack.com')u.pathname='/TateLyman/tap-game/main/g.html';
    u.searchParams.set('r',roomCode);
    u.searchParams.set('j','1');
    return u.toString();
  }catch{return roomCode}
}
function bbxGuestName(){return 'Guest'+String(Math.floor(100+Math.random()*900))}
function bbxPersistName(){try{localStorage.setItem('bb-name',cleanName())}catch{}}

/* ---------- state extensions ---------- */
const bbxOldNewState=newState;
newState=function(){
  const s=bbxOldNewState();
  s.mode='chaos';s.map='neon';s.obstacles=[];s.roundNo=0;
  return s;
};

const bbxOldAddPlayer=addPlayer;
addPlayer=function(id,name,opts={}){
  const ok=bbxOldAddPlayer(id,name,opts);
  if(ok&&gameState?.players?.[id]){
    const p=gameState.players[id];
    p.streak=0;p.bestStreak=0;p.speedUntil=0;p.damageUntil=0;p.regenUntil=0;p.dashHitIds=[];
  }
  return ok;
};

const bbxOldLobbyPayload=lobbyPayload;
lobbyPayload=function(){
  const p=bbxOldLobbyPayload();
  p.mode=gameState?.mode||'chaos';p.map=gameState?.map||'neon';p.v=BBX.version;
  return p;
};

/* ---------- faster / tougher networking ---------- */
function bbxRegisterIncoming(conn){
  const metaName=String(conn.metadata?.name||'').replace(/[<>]/g,'').slice(0,16);
  const oldTimer=BBX.disconnectGrace.get(conn.peer);if(oldTimer){clearTimeout(oldTimer);BBX.disconnectGrace.delete(conn.peer)}
  if(!gameState.players[conn.peer])addPlayer(conn.peer,metaName||'Player');
  else if(metaName)gameState.players[conn.peer].name=metaName;
  try{conn.send(lobbyPayload());if(gameState.phase==='playing'||gameState.phase==='ended')conn.send({type:'state',state:serializeState()})}catch{}
  broadcastLobby();
}
setupIncoming=function(conn){
  const prior=conns.get(conn.peer);if(prior&&prior!==conn)try{prior.close()}catch{}
  conns.set(conn.peer,conn);
  conn.on('open',()=>bbxRegisterIncoming(conn));
  conn.on('data',data=>handleHostData(conn,data));
  const gone=()=>{
    if(conns.get(conn.peer)===conn)conns.delete(conn.peer);
    if(BBX.closingNet)return;
    const timer=setTimeout(()=>{BBX.disconnectGrace.delete(conn.peer);removePlayer(conn.peer)},5200);
    BBX.disconnectGrace.set(conn.peer,timer);
  };
  conn.on('close',gone);conn.on('error',gone);
  if(conn.open)bbxRegisterIncoming(conn);
};

handleHostData=function(conn,d){
  if(!d||typeof d!=='object')return;
  if(d.type==='hello'){
    const name=String(d.name||conn.metadata?.name||'Player').replace(/[<>]/g,'').slice(0,16);
    if(!gameState.players[conn.peer])addPlayer(conn.peer,name);else gameState.players[conn.peer].name=name;
    const timer=BBX.disconnectGrace.get(conn.peer);if(timer){clearTimeout(timer);BBX.disconnectGrace.delete(conn.peer)}
    try{conn.send(lobbyPayload());if(gameState.phase==='playing'||gameState.phase==='ended')conn.send({type:'state',state:serializeState()})}catch{}
    broadcastLobby();
  }else if(d.type==='input'){
    const p=gameState.players[conn.peer];if(p&&!p.bot){const q=d.input||{};p.input={up:!!q.up,down:!!q.down,left:!!q.left,right:!!q.right,fire:!!q.fire,aim:Number.isFinite(q.aim)?q.aim:0,dashSeq:Number.isFinite(q.dashSeq)?q.dashSeq:0}}
  }
};

hostRoom=function(){
  cleanupNet();ensureAudio();bbxPersistName();isSolo=false;isHost=true;gameState=newState();myId='host';addPlayer(myId,cleanName(),{host:true});
  if(typeof Peer==='undefined'){status($('#homeStatus'),'Multiplayer failed to load. Refresh once.','error');isHost=false;return}
  let attempts=0;
  const openHost=()=>{
    roomCode=randomRoom();status($('#homeStatus'),'Opening room…');
    peer=new Peer(hostPeerId(roomCode),{debug:0});
    peer.on('open',()=>{
      setScreen(lobbyScreen);$('#roomCodeText').textContent=roomCode;$('#roomHud').textContent='ROOM '+roomCode;$('#hostControls').style.display='flex';
      status($('#lobbyStatus'),'LIVE — invite links join automatically.','good');updateLobbyUI();updateInviteURL();
    });
    peer.on('connection',conn=>{
      if(Object.keys(gameState.players).length>=MAX_PLAYERS){conn.on('open',()=>{try{conn.send({type:'reject',reason:'Room is full'})}catch{};setTimeout(()=>conn.close(),200)});return}
      setupIncoming(conn);
    });
    peer.on('error',e=>{
      if(e.type==='unavailable-id'&&attempts++<4){try{peer.destroy()}catch{};setTimeout(openHost,90);return}
      const m=e.type==='unavailable-id'?'Could not reserve a room code. Try again.':'Network error: '+e.type;
      status($('#homeStatus'),m,'error');status($('#lobbyStatus'),m,'error');
    });
  };
  openHost();
};

function bbxConnectToHost(reconnecting=false){
  if(!peer||peer.destroyed||!roomCode)return;
  clearTimeout(BBX.joinTimer);
  try{hostConn?.close()}catch{}
  hostConn=peer.connect(hostPeerId(roomCode),{reliable:true,metadata:{game:'blast-buddies',name:cleanName(),v:BBX.version}});
  BBX.joinTimer=setTimeout(()=>{if(!hostConn?.open){try{hostConn?.close()}catch{};connectionLost()}},reconnecting?2800:4200);
  hostConn.on('open',()=>{
    clearTimeout(BBX.joinTimer);BBX.reconnectTries=0;bbxPersistName();
    try{hostConn.send({type:'hello',name:cleanName(),v:BBX.version})}catch{}
    if(!gameScreen.classList.contains('active'))setScreen(lobbyScreen);
    $('#roomCodeText').textContent=roomCode;$('#roomHud').textContent='ROOM '+roomCode;$('#hostControls').style.display='none';
    status($('#lobbyStatus'),reconnecting?'Reconnected!':'Connected — waiting for host…','good');
    if(reconnecting)toast('Reconnected');
  });
  hostConn.on('data',handleClientData);
  hostConn.on('close',()=>connectionLost());hostConn.on('error',()=>connectionLost());
}

joinRoom=function(){
  cleanupNet();ensureAudio();bbxPersistName();isSolo=false;isHost=false;roomCode=cleanRoom($('#roomInput').value);
  if(roomCode.length!==5){status($('#homeStatus'),'Paste a 5-character room code or open an invite link.','error');return}
  if(typeof Peer==='undefined'){status($('#homeStatus'),'Multiplayer failed to load. Refresh once.','error');return}
  status($('#homeStatus'),'Joining '+roomCode+'…');
  peer=new Peer(undefined,{debug:0});
  peer.on('open',id=>{myId=id;bbxConnectToHost(false)});
  peer.on('error',e=>{
    if(BBX.closingNet)return;
    const msg=e.type==='peer-unavailable'?'Room not found — retrying…':'Join error: '+e.type;
    status($('#homeStatus'),msg,'error');status($('#lobbyStatus'),msg,'error');
    if(e.type==='peer-unavailable')connectionLost();
  });
};

const bbxOldHandleClientData=handleClientData;
handleClientData=function(d){
  if(d?.type==='lobby'){
    if(!gameState)gameState=newState();gameState.mode=d.mode||gameState.mode||'chaos';gameState.map=d.map||gameState.map||'neon';
  }
  if(d?.type==='state'&&d.state?.phase==='playing'&&!gameScreen.classList.contains('active')){
    setScreen(gameScreen);$('#endOverlay').classList.remove('show');$('#roomHud').textContent='ROOM '+roomCode;centerMessage('JOINED!',650);
  }
  bbxOldHandleClientData(d);
};

connectionLost=function(){
  if(BBX.closingNet||isHost||isSolo||!roomCode)return;
  clearTimeout(BBX.reconnectTimer);
  if(BBX.reconnectTries>=4){toast('Could not reconnect');setTimeout(leaveToHome,350);return}
  const delays=[220,650,1250,2200];const delay=delays[BBX.reconnectTries++]||2200;
  status($('#lobbyStatus'),'Connection hiccup — reconnecting…');
  BBX.reconnectTimer=setTimeout(()=>{
    if(BBX.closingNet)return;
    if(peer&&!peer.destroyed&&peer.open){bbxConnectToHost(true);return}
    try{peer?.destroy()}catch{}
    peer=new Peer(undefined,{debug:0});peer.on('open',id=>{myId=id;bbxConnectToHost(true)});peer.on('error',()=>connectionLost());
  },delay);
};

const bbxOldCleanupNet=cleanupNet;
cleanupNet=function(){
  BBX.closingNet=true;clearTimeout(BBX.reconnectTimer);clearTimeout(BBX.joinTimer);BBX.reconnectTries=0;
  for(const t of BBX.disconnectGrace.values())clearTimeout(t);BBX.disconnectGrace.clear();
  bbxOldCleanupNet();
  setTimeout(()=>{BBX.closingNet=false},0);
};
