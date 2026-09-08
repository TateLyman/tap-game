/* Blast Buddies Upgrade Layer v2 — post-input hooks */
const bbxOldUpdateLobbyUI=updateLobbyUI;
updateLobbyUI=function(){
  bbxOldUpdateLobbyUI();
  const r=$('#lobbyRules');if(r)r.textContent=(BBX_MODE_NAMES[gameState?.mode]||'Chaos')+' · '+(BBX_MAP_NAMES[gameState?.map]||gameState?.map||'Arena');
};

const bbxOldClientAfterInput=handleClientData;
handleClientData=function(d){
  bbxOldClientAfterInput(d);
  if(d?.type==='lobby'){
    const r=$('#lobbyRules');if(r)r.textContent=(BBX_MODE_NAMES[d.mode||gameState?.mode]||'Chaos')+' · '+(BBX_MAP_NAMES[d.map||gameState?.map]||d.map||'Arena');
  }
};

updateInviteURL=function(){
  try{const u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('r',roomCode);u.searchParams.set('j','1');history.replaceState(null,'',u)}catch{}
};

function bbxFastCopyInvite(){
  const link=bbxInviteLink();
  if(navigator.clipboard?.writeText)navigator.clipboard.writeText(link).then(()=>toast('One-tap invite copied')).catch(()=>toast('Room '+roomCode));else toast('Room '+roomCode);
}
async function bbxShareInvite(){
  const link=bbxInviteLink();
  if(navigator.share){try{await navigator.share({title:'Blast Buddies',text:'Join my Blast Buddies room '+roomCode,url:link});return}catch{}}
  bbxFastCopyInvite();
}
$('#copyBtn')?.addEventListener('click',e=>{e.stopImmediatePropagation();bbxFastCopyInvite()},{capture:true});
$('#shareBtn')?.addEventListener('click',bbxShareInvite);

const modeSel=$('#modeSelect'),mapSel=$('#mapSelect');
modeSel?.addEventListener('change',e=>{if(isHost&&gameState){gameState.mode=e.target.value;const r=$('#lobbyRules');if(r)r.textContent=(BBX_MODE_NAMES[gameState.mode]||'Chaos')+' · '+(BBX_MAP_NAMES[gameState.map]||'Arena');broadcastLobby()}});
mapSel?.addEventListener('change',e=>{if(isHost&&gameState){gameState.map=e.target.value;const r=$('#lobbyRules');if(r)r.textContent=(BBX_MODE_NAMES[gameState.mode]||'Chaos')+' · '+(BBX_MAP_NAMES[gameState.map]||gameState.map);broadcastLobby()}});

function bbxClearInput(){
  localInput.up=localInput.down=localInput.left=localInput.right=localInput.fire=false;
  if(typeof sendInputMaybe==='function')sendInputMaybe(performance.now());
}
window.addEventListener('blur',bbxClearInput);
window.addEventListener('pointerup',()=>{if(localInput.fire){localInput.fire=false;if(typeof sendInputMaybe==='function')sendInputMaybe(performance.now())}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)bbxClearInput()});

function bbxPollGamepad(){
  if(gameScreen.classList.contains('active')&&navigator.getGamepads){
    const gp=[...navigator.getGamepads()].find(Boolean);
    if(gp){
      const dz=.22,lx=Math.abs(gp.axes[0]||0)>dz?(gp.axes[0]||0):0,ly=Math.abs(gp.axes[1]||0)>dz?(gp.axes[1]||0):0,rx=Math.abs(gp.axes[2]||0)>dz?(gp.axes[2]||0):0,ry=Math.abs(gp.axes[3]||0)>dz?(gp.axes[3]||0):0;
      localInput.left=lx<-.2;localInput.right=lx>.2;localInput.up=ly<-.2;localInput.down=ly>.2;
      if(Math.hypot(rx,ry)>.3)localInput.aim=Math.atan2(ry,rx);
      localInput.fire=!!(gp.buttons[7]?.pressed||gp.buttons[5]?.pressed);
      const dash=!!(gp.buttons[0]?.pressed||gp.buttons[4]?.pressed);if(dash&&!BBX.padDashHeld)localInput.dashSeq++;BBX.padDashHeld=dash;
      if(typeof sendInputMaybe==='function')sendInputMaybe(performance.now());
    }
  }
  requestAnimationFrame(bbxPollGamepad);
}
requestAnimationFrame(bbxPollGamepad);

try{const saved=localStorage.getItem('bb-name');if(saved&&$('#nameInput'))$('#nameInput').value=saved}catch{}
$('#nameInput')?.addEventListener('change',bbxPersistName);

window.addEventListener('load',()=>{
  try{
    const u=new URL(location.href),code=cleanRoom(u.searchParams.get('r')||u.searchParams.get('room'));
    if(code.length===5){
      $('#roomInput').value=code;
      const shouldAuto=u.searchParams.get('j')!=='0';
      if(shouldAuto&&homeScreen.classList.contains('active')&&!BBX.roomAutoStarted){
        BBX.roomAutoStarted=true;let saved='';try{saved=localStorage.getItem('bb-name')||''}catch{}
        if(!saved&&($('#nameInput').value==='Player'||!$('#nameInput').value.trim()))$('#nameInput').value=bbxGuestName();
        status($('#homeStatus'),'Invite detected — joining '+code+'…','good');setTimeout(joinRoom,80);
      }
    }
  }catch{}
});
