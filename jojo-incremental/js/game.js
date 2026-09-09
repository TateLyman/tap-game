window.BZ = window.BZ || {};
BZ.state = BZ.load();
BZ._lastTick=performance.now();
BZ._secondAcc=0;
BZ._autosaveAcc=0;
BZ._audioCtx=null;

BZ.fmt=function(n){
 if(!Number.isFinite(n)) return '∞'; const a=Math.abs(n);
 if(a<1000) return n<10 && n%1? n.toFixed(1):Math.floor(n).toLocaleString();
 const units=['K','M','B','T','Qa','Qi','Sx','Sp','Oc','No']; let u=-1,v=a;
 while(v>=1000&&u<units.length-1){v/=1000;u++}
 if(u===units.length-1&&v>=1000)return n.toExponential(2);
 return (n<0?'-':'')+(v>=100?v.toFixed(0):v>=10?v.toFixed(1):v.toFixed(2))+units[u];
};
BZ.getPart=()=>BZ.PARTS.find(p=>p.id===BZ.state.part);
BZ.getChar=id=>BZ.CHARACTERS.find(c=>c.id===id);
BZ.getStand=id=>BZ.STANDS.find(s=>s.id===id);
BZ.charLevel=id=>BZ.state.characterLevels[id]||1;
BZ.standLevel=id=>BZ.state.standLevels[id]||1;

BZ.upgradeMult=function(id){const u=BZ.UPGRADES.find(x=>x.id===id);return u.effect(BZ.state.upgrades[id]||0)};
BZ.legacyMult=()=>1+BZ.state.legacy*.08+BZ.state.fatePoints*.015+BZ.state.heaven*.25;
BZ.partyPower=function(){
 return BZ.state.party.reduce((sum,id)=>{const c=BZ.getChar(id);return sum+(c?c.base*Math.pow(1.085,BZ.charLevel(id)-1):0)},0);
};
BZ.synergyMult=function(){
 const p=BZ.state.party;
 let m=1;
 const pairs=[['jotaro','joseph',1.18],['joseph','caesar',1.18],['josuke4','okuyasu',1.2],['giorno','bruno',1.2],['johnny','gyro',1.28]];
 pairs.forEach(([a,b,v])=>{if(p.includes(a)&&p.includes(b))m*=v});
 const joestars=p.filter(id=>['jonathan','joseph','jotaro','josuke4','giorno','jolyne','johnny','gappy','jodio'].includes(id)).length;
 if(joestars>=3)m*=1+joestars*.05;
 return m;
};
BZ.itemMult=function(kind){
 const item=BZ.ITEMS.find(i=>i.id===BZ.state.equippedItem); if(!item)return 1;
 if(kind==='boss'&&item.effect==='boss')return 1.35;
 if(kind==='crit'&&item.effect==='crit')return 1.3;
 if(kind==='combo'&&item.effect==='combo')return 1.25;
 if(kind==='fate'&&item.effect==='fate')return 1.5;
 return 1;
};
BZ.clickDamage=function(){
 const s=BZ.state; let d=(2+s.level*.6)*BZ.upgradeMult('fists')*BZ.legacyMult();
 if(s.activeStand){const st=BZ.getStand(s.activeStand);d*=1+(st.power*.06)+(BZ.standLevel(st.id)-1)*.025}
 if(s.party.includes('paco'))d*=1.5;
 d*=BZ.synergyMult()*(1+Math.min(s.combo,100)*.012)*BZ.itemMult('combo');
 if(s.enemy.boss)d*=BZ.itemMult('boss');
 return d;
};
BZ.passiveDps=function(){
 let d=BZ.partyPower()*BZ.upgradeMult('training')*BZ.legacyMult()*BZ.synergyMult();
 if(BZ.state.party.includes('bruno'))d*=1.15;
 if(BZ.state.party.includes('pucci'))d*=1+Math.min(BZ.state.stats.playSeconds%60,40)*.01;
 if(BZ.state.enemy.boss)d*=BZ.itemMult('boss');
 return d;
};
BZ.yenMult=function(){let m=BZ.upgradeMult('fortune')*BZ.legacyMult(); if(BZ.state.party.includes('speedwagon'))m*=1.3;if(BZ.state.equippedItem==='mask')m*=.9;return m};
BZ.critChance=function(){let c=BZ.state.critChance;if(BZ.state.party.includes('caesar'))c+=.08;if(BZ.state.activeStand==='star')c+=.12;return Math.min(.65,c)};
BZ.critMult=function(){let m=BZ.state.critMult*BZ.upgradeMult('focus')*BZ.itemMult('crit');if(BZ.state.party.includes('gyro'))m*=1.2;return m};

BZ.spawnEnemy=function(){
 const s=BZ.state,p=BZ.getPart(); const boss=s.wave%10===0;
 const idx=Math.floor((s.wave-1)/3)%p.enemies.length;
 const scale=Math.pow(1.22,s.wave-1)*Math.pow(16,p.id-1);
 const bossName=p.bosses[Math.min(p.bosses.length-1,Math.floor((s.wave/10-1)%p.bosses.length))];
 const name=boss?bossName:p.enemies[idx];
 const hp=(boss?380:48)*scale*(1+s.unlockedPart*.03);
 s.enemy={name,hp,maxHp:hp,shield:boss&&p.id>=4?hp*.18:0,maxShield:boss&&p.id>=4?hp*.18:0,boss,tag:boss?'BOSS':p.mechanic.toUpperCase(),glyph:boss?'♛':['☠','◆','✦','♠','◉'][idx%5]};
 s.bossMode=boss;
 if(BZ.UI)BZ.UI.renderCombat();
};

BZ.applyDamage=function(amount,{crit=false,source='hit',quiet=false}={}){
 const s=BZ.state; if(s.statuses.timeStop>0)amount*=1.25;
 amount*=1+(s.statuses.defBreak>0?.25:0);
 if(s.enemy.shield>0){const absorb=Math.min(s.enemy.shield,amount);s.enemy.shield-=absorb;amount-=absorb}
 s.enemy.hp=Math.max(0,s.enemy.hp-amount);
 if(!quiet&&BZ.UI){BZ.UI.damage(amount,crit);BZ.UI.hit(crit)}
 if(s.enemy.hp<=0)BZ.defeatEnemy();
};

BZ.attack=function(){
 const s=BZ.state;if(s.enemy.hp<=0)return;
 s.clicks++;s.combo++;s.comboTimer=2.8;s.stats.highestCombo=Math.max(s.stats.highestCombo,s.combo);
 let crit=Math.random()<BZ.critChance();
 if(s.party.includes('jotaro')&&s.clicks%20===0)crit=true;
 let d=BZ.clickDamage()*(crit?BZ.critMult():1);
 if(crit){s.stats.crits++;BZ.progressQuest('crits',1)}
 if(s.activeStand==='hand'&&Math.random()<.025)d+=s.enemy.maxHp*.08;
 if(s.activeStand==='beyond'&&Math.random()<.08)d*=4;
 if(s.party.includes('okuyasu')&&Math.random()<.012)d+=s.enemy.hp*.08;
 BZ.applyDamage(d,{crit,source:'click'}); BZ.progressQuest('combo',s.combo,true);
 BZ.tone(crit?520:260,.035,crit?'sawtooth':'square');
};

BZ.defeatEnemy=function(){
 const s=BZ.state,p=BZ.getPart(); const boss=s.enemy.boss;
 s.stats.kills++;BZ.progressQuest('kills',1);
 if(boss){s.stats.bossKills++; if(!s.defeatedBosses.includes(s.enemy.name))s.defeatedBosses.push(s.enemy.name);BZ.feed(`Defeated <b>${s.enemy.name}</b>.`,'good')}
 const base=(boss?95:10)*Math.pow(1.19,s.wave-1)*Math.pow(11,p.id-1);
 const yen=base*BZ.yenMult();s.yen+=yen;s.stats.lifetimeYen+=yen;
 s.xp+=(boss?40:8)*p.id;
 s.fatePoints+=boss?1:0;
 const fateGain=(boss?7:1)*BZ.itemMult('fate');s.questProgress.fate=(s.questProgress.fate||0)+fateGain;
 if(Math.random()<(s.equippedItem==='arrowRelic'?.018:.009)+(boss?.035:0)){s.arrows++;BZ.feed('A <b>Stand Arrow</b> dropped!','rare');BZ.UI?.toast('RARE DROP','Stand Arrow acquired!')}
 if(Math.random()<.006+(boss?.018:0))BZ.dropItem();
 if(s.equippedItem==='locacaca'&&s.stats.kills%12===0){s.yen+=yen;BZ.feed('Locacaca caused an <b>Equivalent Exchange</b>: double reward.','rare')}
 s.wave++;
 if(boss&&s.wave>30){BZ.completePart();return}
 BZ.checkLevel();BZ.checkAchievements();BZ.maybeFateEvent();BZ.spawnEnemy();
};

BZ.checkLevel=function(){const s=BZ.state;let need=40*Math.pow(1.18,s.level-1);while(s.xp>=need){s.xp-=need;s.level++;need=40*Math.pow(1.18,s.level-1);if(s.level===5){s.autoUnlocked=true;BZ.UI?.toast('AUTOMATION UNLOCKED','Auto Attack can now be enabled.')}if(s.level%5===0)BZ.feed(`Reached <b>Level ${s.level}</b>.`,'good')}};
BZ.levelChar=function(id){const s=BZ.state,c=BZ.getChar(id);if(!c)return;const l=BZ.charLevel(id),cost=35*c.base*Math.pow(1.19,l-1);if(s.yen<cost)return;s.yen-=cost;s.characterLevels[id]=l+1;BZ.tone(420,.05);BZ.UI?.renderAll()};
BZ.levelStand=function(id){const s=BZ.state,st=BZ.getStand(id);if(!st)return;const l=BZ.standLevel(id),cost=120*st.power*Math.pow(1.22,l-1);if(s.yen<cost)return;s.yen-=cost;s.standLevels[id]=l+1;BZ.UI?.renderAll()};
BZ.upgrade=function(id){const s=BZ.state,u=BZ.UPGRADES.find(x=>x.id===id),l=s.upgrades[id],cost=u.baseCost*Math.pow(u.growth,l);if(s.yen<cost)return;s.yen-=cost;s.upgrades[id]++;BZ.tone(360,.04);BZ.UI?.renderAll()};
BZ.upgradeCost=function(id){const u=BZ.UPGRADES.find(x=>x.id===id);return u.baseCost*Math.pow(u.growth,BZ.state.upgrades[id])};

BZ.useAbility=function(slot){
 const s=BZ.state,key='a'+slot;if(s.cooldowns[key]>0)return;
 if(slot===1){s.cooldowns[key]=6;for(let i=0;i<8;i++)setTimeout(()=>BZ.applyDamage(BZ.clickDamage()*.6,{crit:Math.random()<BZ.critChance(),source:'ability'}),i*55);BZ.feed('<b>ORA Barrage</b> tears through the encounter.','good')}
 if(slot===2){s.cooldowns[key]=13;s.statuses.defBreak=6;BZ.applyDamage(BZ.clickDamage()*4,{crit:true,source:'ability'});BZ.feed('Defense broken by a <b>precision technique</b>.','good')}
 if(slot===3){s.cooldowns[key]=28;s.statuses.timeStop=4;BZ.applyDamage(BZ.clickDamage()*10,{crit:true,source:'ultimate'});BZ.feed('<b>TIME STOP!</b> Timers freeze for four seconds.','rare');BZ.UI?.toast('TIME HAS STOPPED','Deal bonus damage before it resumes.')}
 BZ.tone(slot===3?110:440,.12,slot===3?'sawtooth':'square');BZ.UI?.renderAbilities();
};

BZ.rollStand=function(){
 const s=BZ.state;if(s.arrows<1){BZ.UI?.toast('NO ARROWS','Defeat bosses and chase Fate events.');return}
 s.arrows--;
 const pool=BZ.STANDS.filter(st=>st.part<=s.unlockedPart&&!s.unlockedStands.includes(st.id)&&(!['ger','echoes2','echoes3','cmoon','mih','tusk2','tusk3','tusk4','love','beyond'].includes(st.id)));
 if(!pool.length){s.arrows++;BZ.UI?.toast('ARROW REJECTED','No new base Stands are available in your unlocked Parts.');return}
 const weighted=[];pool.forEach(st=>{const n=st.rarity==='Mythic'?1:st.rarity==='Legendary'?2:st.rarity==='Epic'?4:st.rarity==='Rare'?7:10;for(let i=0;i<n;i++)weighted.push(st)});
 const st=weighted[Math.floor(Math.random()*weighted.length)];
 s.unlockedStands.push(st.id);s.standLevels[st.id]=1;s.stats.standAwakenings++;BZ.progressQuest('stands',s.unlockedStands.length,true);
 if(!s.activeStand)s.activeStand=st.id;BZ.UI?.reveal('STAND AWAKENED',st.name,`${st.rarity} • ${st.passive}`);BZ.feed(`Stand awakened: <b>${st.name}</b>.`,'rare');BZ.checkAchievements();BZ.save(s);
};

BZ.evolveStand=function(id){
 const s=BZ.state,st=BZ.getStand(id);if(!st?.evolves)return;const next=BZ.getStand(st.evolves);const req=25+(next.part*5);if(BZ.standLevel(id)<req||s.stats.bossKills<next.part*2){BZ.UI?.toast('EVOLUTION LOCKED',`Requires Stand Lv.${req} and ${next.part*2} boss defeats.`);return}
 if(!s.unlockedStands.includes(next.id))s.unlockedStands.push(next.id);s.standLevels[next.id]=1;s.activeStand=next.id;BZ.UI?.reveal('STAND EVOLVED',next.name,next.passive);BZ.feed(`<b>${st.name}</b> evolved into <b>${next.name}</b>.`,'rare');
};

BZ.dropItem=function(){const s=BZ.state,pool=BZ.ITEMS.filter(i=>!s.items.includes(i.id));if(!pool.length)return;const item=pool[Math.floor(Math.random()*pool.length)];s.items.push(item.id);BZ.UI?.reveal('RELIC FOUND',item.name,item.desc);BZ.feed(`Rare relic: <b>${item.name}</b>.`,'rare')};
BZ.equipItem=function(id){if(!BZ.state.items.includes(id))return;BZ.state.equippedItem=id;BZ.UI?.toast('RELIC EQUIPPED',BZ.ITEMS.find(i=>i.id===id).name);BZ.UI?.renderAll()};

BZ.completePart=function(){
 const s=BZ.state,p=BZ.getPart();if(!s.completedParts.includes(p.id))s.completedParts.push(p.id);
 if(p.id<9){s.unlockedPart=Math.max(s.unlockedPart,p.id+1);BZ.unlockPartCharacters(p.id+1);s.part=p.id+1;s.wave=1;BZ.progressQuest('part',s.unlockedPart,true);BZ.UI?.reveal('NEW PART UNLOCKED',BZ.getPart().name,`${BZ.getPart().mechanic} now enters the buildcraft.`);BZ.spawnEnemy();}
 else{BZ.UI?.reveal('MULTIVERSE UNLOCKED','All Parts Cleared','Dimension Shards can now appear from boss kills.');s.wave=1;BZ.spawnEnemy()}
};
BZ.unlockPartCharacters=function(part){const pool=BZ.CHARACTERS.filter(c=>c.part===part);pool.slice(0,3).forEach(c=>{if(!BZ.state.unlockedCharacters.includes(c.id)){BZ.state.unlockedCharacters.push(c.id);BZ.state.characterLevels[c.id]=1}});BZ.feed(`New allies from <b>${BZ.PARTS[part-1].name}</b> joined your roster.`,'good')};
BZ.travelTo=function(part){const s=BZ.state;if(part>s.unlockedPart)return;s.part=part;s.wave=1;s.combo=0;BZ.spawnEnemy();BZ.UI?.renderAll()};

BZ.rebirthGain=function(){return Math.floor(Math.sqrt(BZ.state.stats.lifetimeYen/25000))};
BZ.rebirth=function(){const s=BZ.state,gain=BZ.rebirthGain();if(gain<1){BZ.UI?.toast('NOT YET','Earn more lifetime Yen first.');return}if(!confirm(`Rebirth for ${gain} Joestar Legacy Points? Basic Yen, levels, upgrades and waves reset.`))return;
 const keep={legacy:s.legacy+gain,fatePoints:s.fatePoints,heaven:s.heaven,dimensionShards:s.dimensionShards,unlockedPart:s.unlockedPart,completedParts:[...s.completedParts],unlockedCharacters:[...s.unlockedCharacters],unlockedStands:[...s.unlockedStands],standLevels:{...s.standLevels},items:[...s.items],equippedItem:s.equippedItem,achievements:[...s.achievements],stats:{...s.stats}};
 const n=BZ.freshState();Object.assign(n,keep);n.stats.rebirths++;n.part=s.unlockedPart;n.party=s.party.filter(id=>n.unlockedCharacters.includes(id)).slice(0,6);if(!n.party.length)n.party=['jonathan'];n.characterLevels={};n.unlockedCharacters.forEach(id=>n.characterLevels[id]=1);n.activeStand=n.unlockedStands[0]||null;BZ.state=n;BZ.feed(`Reborn with <b>${gain} Legacy Points</b>.`,'rare');BZ.spawnEnemy();BZ.save(n);BZ.UI?.renderAll()};

BZ.progressQuest=function(type,val,absolute=false){const s=BZ.state;BZ.QUESTS.filter(q=>q.type===type).forEach(q=>{const cur=s.questProgress[q.id]||0;s.questProgress[q.id]=absolute?Math.max(cur,val):cur+val})};
BZ.claimQuest=function(id){const s=BZ.state,q=BZ.QUESTS.find(q=>q.id===id);if(!q||s.claimedQuests.includes(id))return;const prog=s.questProgress[id]||0;if(prog<q.goal)return;s.claimedQuests.push(id);const r=q.reward||{};s.yen+=r.yen||0;s.arrows+=r.arrows||0;s.legacy+=r.legacy||0;s.fatePoints+=r.fate||0;BZ.UI?.toast('QUEST COMPLETE',q.name);BZ.UI?.renderAll()};
BZ.checkAchievements=function(){const s=BZ.state;BZ.ACHIEVEMENTS.forEach(a=>{if(!s.achievements.includes(a.id)&&a.test(s)){s.achievements.push(a.id);s.fatePoints+=1;BZ.UI?.toast('ACHIEVEMENT',a.name);BZ.feed(`Achievement unlocked: <b>${a.name}</b>.`,'rare')}})};

BZ.maybeFateEvent=function(){const s=BZ.state;const chance=.015+Math.min(.08,(s.questProgress.fate||0)/5000);if(Math.random()>chance)return;s.stats.events++;BZ.progressQuest('events',1);const events=[
 ()=>{const amount=80*Math.pow(5,s.part);s.yen+=amount;BZ.UI?.toast('HARVEST',`Shigechi's Harvest found ¥${BZ.fmt(amount)}.`);BZ.feed('<b>Harvest</b> swept the area for bonus currency.','rare')},
 ()=>{s.fatePoints+=2;BZ.UI?.toast('ROHAN ENCOUNTER','Heaven’s Door rewrote your Fate: +2 Fate.');BZ.feed('<b>Rohan Encounter</b> altered the route.','rare')},
 ()=>{const dmg=s.enemy?.maxHp? s.enemy.maxHp*.45:0;if(dmg)BZ.applyDamage(dmg,{crit:true});BZ.UI?.toast('ROAD ROLLER!','A completely unreasonable amount of damage.');BZ.feed('<b>ROAD ROLLER</b> crashed into the fight.','rare')},
 ()=>{s.arrows++;BZ.UI?.toast('LUCKY ARROW','Fate delivered a Stand Arrow.');BZ.feed('A <b>Lucky Arrow</b> appeared.','rare')},
 ()=>{s.stats.secrets++;BZ.UI?.toast('THUNDER CROSS SPLIT ATTACK','It accomplished almost nothing. Tradition maintained.');BZ.feed('<b>Thunder Cross Split Attack</b> happened. Somehow.','rare')}
 ];events[Math.floor(Math.random()*events.length)]();BZ.checkAchievements()};

BZ.feed=function(html,type=''){const s=BZ.state;s.feed.unshift({html,type,t:Date.now()});s.feed=s.feed.slice(0,16);BZ.UI?.renderFeed()};
BZ.tone=function(freq=260,dur=.05,type='square'){
 const s=BZ.state;if(!s.settings.audio)return;try{BZ._audioCtx=BZ._audioCtx||new (AudioContext||webkitAudioContext)();const o=BZ._audioCtx.createOscillator(),g=BZ._audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.025,BZ._audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,BZ._audioCtx.currentTime+dur);o.connect(g);g.connect(BZ._audioCtx.destination);o.start();o.stop(BZ._audioCtx.currentTime+dur)}catch(e){}
};

BZ.offlineRewards=function(){
 const s=BZ.state,now=Date.now(),away=Math.max(0,(now-(s.lastSeen||now))/1000);if(away<60)return null;
 const cap=2*3600+(s.upgrades.idle||0)*900,secs=Math.min(away,cap),eff=BZ.upgradeMult('idle');const dps=Math.max(1,BZ.passiveDps());const avgHp=Math.max(48,48*Math.pow(1.22,s.wave-1)*Math.pow(16,s.part-1));const kills=Math.floor((dps*secs*eff)/avgHp);const yen=kills*(10*Math.pow(1.19,s.wave-1)*Math.pow(11,s.part-1))*BZ.yenMult();s.yen+=yen;s.stats.lifetimeYen+=yen;s.stats.kills+=kills;s.xp+=kills*8*s.part;s.lastSeen=now;BZ.checkLevel();return{away,secs,kills,yen,xp:kills*8*s.part}
};

BZ.tick=function(now){
 const s=BZ.state;let dt=Math.min(.1,(now-BZ._lastTick)/1000);BZ._lastTick=now;const speed=s.activeStand==='mih'?1+Math.min(1,(s.stats.playSeconds%60)/60):1;dt*=speed;
 if(s.enemy.hp<=0)BZ.spawnEnemy();
 if(s.statuses.timeStop>0)s.statuses.timeStop=Math.max(0,s.statuses.timeStop-dt);
 ['burn','defBreak','spin'].forEach(k=>s.statuses[k]=Math.max(0,(s.statuses[k]||0)-dt));
 Object.keys(s.cooldowns).forEach(k=>s.cooldowns[k]=Math.max(0,s.cooldowns[k]-dt));
 if(s.comboTimer>0){s.comboTimer-=dt;if(s.comboTimer<=0)s.combo=0}
 const passive=BZ.passiveDps()*dt;if(passive>0)BZ.applyDamage(passive,{source:'passive',quiet:true});
 if(s.autoUnlocked&&s.autoAttack){BZ._autoAcc=(BZ._autoAcc||0)+dt;if(BZ._autoAcc>=.34){BZ._autoAcc=0;BZ.attack()}}
 if(s.statuses.burn>0)BZ.applyDamage(BZ.clickDamage()*.12*dt,{source:'burn',quiet:true});
 BZ._secondAcc+=dt;BZ._autosaveAcc+=dt;if(BZ._secondAcc>=1){s.stats.playSeconds+=Math.floor(BZ._secondAcc);BZ._secondAcc%=1;BZ.checkAchievements();BZ.UI?.renderNumbers()}
 if(s.settings.autosave&&BZ._autosaveAcc>=8){BZ._autosaveAcc=0;BZ.save(s)}
 BZ.UI?.frame();requestAnimationFrame(BZ.tick)
};

BZ.init=function(){
 const off=BZ.offlineRewards();if(!BZ.state.enemy.name)BZ.spawnEnemy();else if(BZ.state.enemy.hp<=0)BZ.spawnEnemy();BZ.UI?.init(off);requestAnimationFrame(BZ.tick);window.addEventListener('beforeunload',()=>BZ.save(BZ.state));
};
