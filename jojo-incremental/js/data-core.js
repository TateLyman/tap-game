window.BZ = window.BZ || {};
BZ.VERSION = 1;

BZ.PARTS = [
  {id:1,name:'Phantom Blood',short:'Phantom Blood',location:"Windknight's Lot",resource:'Hamon Sparks',mechanic:'Hamon',color:'#bdff35',enemies:['Zombie','Vampire Servant','Chimera','Knight of Dio'],bosses:['Bruford','Tarkus','Dio Brando']},
  {id:2,name:'Battle Tendency',short:'Battle Tendency',location:'Swiss Alps',resource:'Aja Shards',mechanic:'Hamon Mastery',color:'#ffcf4a',enemies:['Vampire Soldier','Wire Beast','Pillar Disciple','Ancient Guardian'],bosses:['Esidisi','Wamuu','Ultimate Kars']},
  {id:3,name:'Stardust Crusaders',short:'Stardust Crusaders',location:'Road to Cairo',resource:'Stand Dust',mechanic:'Stands',color:'#56d8ff',enemies:['Stand Thug','Possessed Traveler','Assassin','Mansion Guard'],bosses:['Vanilla Ice','Pet Shop','DIO']},
  {id:4,name:'Diamond Is Unbreakable',short:'Diamond Is Unbreakable',location:'Morioh',resource:'Morioh Tokens',mechanic:'Traits',color:'#ff8fc9',enemies:['Delinquent','Stand User','Rock-Paper Kid','Serial Threat'],bosses:['Akira Otoishi','Yuya Fungami','Yoshikage Kira']},
  {id:5,name:'Golden Wind',short:'Golden Wind',location:'Naples',resource:'Lira Crests',mechanic:'Resolve',color:'#ffd548',enemies:['Gang Scout','Stand Hitman','Passione Guard','Assassin'],bosses:['Ghiaccio','Risotto Nero','Diavolo']},
  {id:6,name:'Stone Ocean',short:'Stone Ocean',location:'Green Dolphin Street',resource:'DISC Fragments',mechanic:'Gravity',color:'#72ffb8',enemies:['Prisoner','Stand Disc User','Guard','Gravity Spawn'],bosses:['Sports Maxx','C-Moon','Enrico Pucci']},
  {id:7,name:'Steel Ball Run',short:'Steel Ball Run',location:'The American Frontier',resource:'Spin Steel',mechanic:'Spin',color:'#ff8a54',enemies:['Racer','Boom Boom Bandit','Government Agent','Rock Insect'],bosses:['Ringo Roadagain','Diego Brando','Funny Valentine']},
  {id:8,name:'JoJolion',short:'JoJolion',location:'Morioh 2011',resource:'Locacaca Sap',mechanic:'Equivalent Exchange',color:'#72e1ff',enemies:['Rock Human','A. Phex Brother','Urban Guerrilla','Calamity Agent'],bosses:['Jobin Higashikata','Poor Tom','Tooru / Wonder of U']},
  {id:9,name:'The JOJOLands',short:'The JOJOLands',location:'Hawaii',resource:'Lava Rock Energy',mechanic:'Mechanisms',color:'#72ff80',enemies:['Wild Cat Size','Gang Rival','Island Stand User','Mechanism Hunter'],bosses:['Charming Man','Bobby Jean','Howler Pursuer']}
];

BZ.CHARACTERS = [
 {id:'jonathan',name:'Jonathan Joestar',part:1,rarity:'Heroic',role:'Hamon DPS',base:5,passive:'Hamon hits deal +25% to bosses.',skill:'Sunlight Yellow Overdrive',ultimate:'Deep Pass Overdrive',glyph:'JJ'},
 {id:'zeppeli',name:'Will A. Zeppeli',part:1,rarity:'Rare',role:'Support',base:4,passive:'Raises all Hamon damage by 18%.',skill:'Zoom Punch',ultimate:'Life Magnetism Overdrive',glyph:'ZP'},
 {id:'speedwagon',name:'Speedwagon',part:1,rarity:'Common',role:'Currency',base:2.5,passive:'Yen drops +30%. Higher rarity? Who needs it.',skill:'Hot-Blooded Commentary',ultimate:'Speedwagon Foundation',glyph:'SP'},
 {id:'dio1',name:'Dio Brando',part:1,rarity:'Legendary',role:'Burst',base:7,passive:'Lifesteal converts overkill into Fate.',skill:'Space Ripper Stingy Eyes',ultimate:'Vampire Frenzy',glyph:'DI'},
 {id:'joseph',name:'Joseph Joestar',part:2,rarity:'Heroic',role:'Combo',base:8,passive:'Combo decays 50% slower.',skill:'Clacker Volley',ultimate:'Your Next Line Is...',glyph:'JO'},
 {id:'caesar',name:'Caesar Zeppeli',part:2,rarity:'Rare',role:'Critical',base:7,passive:'Critical chance +8%.',skill:'Bubble Cutter',ultimate:'Bubble Lens',glyph:'CZ'},
 {id:'lisa',name:'Lisa Lisa',part:2,rarity:'Epic',role:'Support',base:8.5,passive:'Hamon effects last 40% longer.',skill:'Snake Muffler',ultimate:'Hamon Mastery',glyph:'LL'},
 {id:'kars',name:'Kars',part:2,rarity:'Legendary',role:'Boss Killer',base:12,passive:'Damage rises as enemy HP falls.',skill:'Brilliant Bone Blade',ultimate:'Ultimate Lifeform',glyph:'KA'},
 {id:'jotaro',name:'Jotaro Kujo',part:3,rarity:'Heroic',role:'DPS',base:15,passive:'Every 20th hit is guaranteed critical.',skill:'ORA Barrage',ultimate:'Time Stop',glyph:'承'},
 {id:'avdol',name:'Muhammad Avdol',part:3,rarity:'Rare',role:'Burn',base:12,passive:'Burn stacks can critically tick.',skill:'Crossfire Hurricane',ultimate:'Red Bind Inferno',glyph:'AV'},
 {id:'kakyoin',name:'Noriaki Kakyoin',part:3,rarity:'Rare',role:'Debuffer',base:11,passive:'Emerald hits reduce defense.',skill:'Emerald Splash',ultimate:'20m Barrier',glyph:'NK'},
 {id:'polnareff',name:'Jean Pierre Polnareff',part:3,rarity:'Rare',role:'Burst',base:13,passive:'Attack speed rises below 50% enemy HP.',skill:'Armor Off',ultimate:'Silver Chariot Rush',glyph:'JP'},
 {id:'iggy',name:'Iggy',part:3,rarity:'Common',role:'Utility',base:9,passive:'10% chance to dodge boss retaliation.',skill:'Sand Dome',ultimate:'Fool Rush',glyph:'IG'},
 {id:'dio3',name:'DIO',part:3,rarity:'Legendary',role:'Time',base:20,passive:'Time effects deal +40% damage.',skill:'Knife Storm',ultimate:'THE WORLD',glyph:'DIO'},
 {id:'josuke4',name:'Josuke Higashikata',part:4,rarity:'Heroic',role:'Sustain',base:28,passive:'Repairs combo every 8 seconds.',skill:'Crazy Rush',ultimate:'Restoration Break',glyph:'丈'},
 {id:'okuyasu',name:'Okuyasu Nijimura',part:4,rarity:'Common',role:'Defense Break',base:22,passive:'The Hand occasionally erases 8% current HP.',skill:'Space Erasure',ultimate:'Oi, Josuke!',glyph:'億'},
 {id:'koichi',name:'Koichi Hirose',part:4,rarity:'Rare',role:'Debuffer',base:21,passive:'Status effects increase enemy damage taken.',skill:'ACT 2 Sound Trap',ultimate:'Three Freeze',glyph:'広'},
 {id:'rohan',name:'Rohan Kishibe',part:4,rarity:'Epic',role:'Utility',base:25,passive:'Rare drop chance +20%.',skill:"Heaven's Door",ultimate:'Page Rewrite',glyph:'岸'},
 {id:'kira',name:'Yoshikage Kira',part:4,rarity:'Legendary',role:'Bomb',base:34,passive:'Bombs chain on kill.',skill:'Sheer Heart Attack',ultimate:'Bites the Dust',glyph:'吉'},
 {id:'giorno',name:'Giorno Giovanna',part:5,rarity:'Heroic',role:'Scaling',base:45,passive:'Every kill grants temporary Resolve.',skill:'Life Shot',ultimate:'Gold Experience',glyph:'GIO'},
 {id:'bruno',name:'Bruno Bucciarati',part:5,rarity:'Epic',role:'Support',base:42,passive:'Party attack speed +15%.',skill:'ZIP Rush',ultimate:'Arrivederci',glyph:'BB'},
 {id:'mista',name:'Guido Mista',part:5,rarity:'Rare',role:'Critical',base:39,passive:'Every 4th shot ricochets. He hates this.',skill:'Sex Pistols Volley',ultimate:'Bullet Relay',glyph:'M6'},
 {id:'diavolo',name:'Diavolo',part:5,rarity:'Legendary',role:'Time',base:58,passive:'15% chance to erase enemy attacks.',skill:'Epitaph',ultimate:'King Crimson',glyph:'KC'},
 {id:'jolyne',name:'Jolyne Cujoh',part:6,rarity:'Heroic',role:'Combo',base:72,passive:'Combo multiplier caps higher.',skill:'String Barrage',ultimate:'Mobius Strip',glyph:'徐'},
 {id:'weather',name:'Weather Report',part:6,rarity:'Epic',role:'Status',base:76,passive:'Status damage +30%.',skill:'Heavy Weather',ultimate:'Atmospheric Pressure',glyph:'WR'},
 {id:'pucci',name:'Enrico Pucci',part:6,rarity:'Legendary',role:'Acceleration',base:95,passive:'Passive DPS accelerates over time.',skill:'C-Moon Gravity',ultimate:'Made in Heaven',glyph:'MIH'},
 {id:'johnny',name:'Johnny Joestar',part:7,rarity:'Heroic',role:'Spin DPS',base:130,passive:'Spin stacks ignore defense.',skill:'Tusk Nail Shot',ultimate:'Infinite Rotation',glyph:'JO★'},
 {id:'gyro',name:'Gyro Zeppeli',part:7,rarity:'Epic',role:'Support',base:125,passive:'Golden Ratio multiplies crit damage.',skill:'Steel Ball',ultimate:'Ball Breaker',glyph:'GY'},
 {id:'valentine',name:'Funny Valentine',part:7,rarity:'Legendary',role:'Multiverse',base:160,passive:'Duplicates one random party passive.',skill:'D4C Shift',ultimate:'Love Train',glyph:'FV'},
 {id:'gappy',name:'Josuke Higashikata (Gappy)',part:8,rarity:'Heroic',role:'Utility',base:210,passive:'Steals one enemy resistance.',skill:'Plunder Bubble',ultimate:'Go Beyond',glyph:'◉'},
 {id:'yasuho',name:'Yasuho Hirose',part:8,rarity:'Rare',role:'Support',base:180,passive:'Quest progress +20%.',skill:'Paisley Guidance',ultimate:'Path Found',glyph:'YH'},
 {id:'tooru',name:'Tooru',part:8,rarity:'Legendary',role:'Calamity',base:280,passive:'Enemies damage themselves when attacking.',skill:'Calamity Pursuit',ultimate:'Wonder of U',glyph:'WU'},
 {id:'jodio',name:'Jodio Joestar',part:9,rarity:'Heroic',role:'Rain DPS',base:350,passive:'Area damage hits twice.',skill:'November Rain',ultimate:'Mechanism Collapse',glyph:'J9'},
 {id:'dragona',name:'Dragona Joestar',part:9,rarity:'Epic',role:'Utility',base:330,passive:'Item effects +25%.',skill:'Smooth Operators',ultimate:'Total Rearrangement',glyph:'DJ'},
 {id:'paco',name:'Paco Laburantes',part:9,rarity:'Rare',role:'Burst',base:300,passive:'Click damage +50%.',skill:'THE Hustle',ultimate:'Muscle Control',glyph:'PL'}
];

BZ.STANDS = [
 {id:'hermit',name:'Hermit Purple',part:2,rarity:'Common',owner:'Joseph',power:3,speed:4,passive:'Fate gain +25%.',skill:'Spirit Photo',ultimate:'Hamon Conduction'},
 {id:'star',name:'Star Platinum',part:3,rarity:'Legendary',owner:'Jotaro',power:8,speed:9,passive:'Clicks have +12% crit chance.',skill:'ORA Barrage',ultimate:'Time Stop'},
 {id:'world',name:'The World',part:3,rarity:'Legendary',owner:'DIO',power:9,speed:8,passive:'Abilities recharge 10% faster.',skill:'Muda Barrage',ultimate:'ZA WARUDO'},
 {id:'magician',name:"Magician's Red",part:3,rarity:'Rare',owner:'Avdol',power:7,speed:5,passive:'Adds burning damage.',skill:'Red Bind',ultimate:'Crossfire Hurricane Special'},
 {id:'hierophant',name:'Hierophant Green',part:3,rarity:'Rare',owner:'Kakyoin',power:5,speed:6,passive:'Defense reduction lasts longer.',skill:'Emerald Splash',ultimate:'20m Emerald Barrier'},
 {id:'chariot',name:'Silver Chariot',part:3,rarity:'Rare',owner:'Polnareff',power:6,speed:8,passive:'Combo gains faster.',skill:'Rapier Flurry',ultimate:'Armor Off'},
 {id:'crazy',name:'Crazy Diamond',part:4,rarity:'Epic',owner:'Josuke',power:8,speed:8,passive:'Combo loss is partially repaired.',skill:'DORARA Barrage',ultimate:'Restoration'},
 {id:'hand',name:'The Hand',part:4,rarity:'Rare',owner:'Okuyasu',power:9,speed:4,passive:'Small chance to erase enemy HP.',skill:'Swipe',ultimate:'Space Erasure'},
 {id:'echoes1',name:'Echoes ACT 1',part:4,rarity:'Rare',owner:'Koichi',power:3,speed:5,evolves:'echoes2',passive:'Status duration +15%.',skill:'Sound Effect',ultimate:'Resounding Word'},
 {id:'echoes2',name:'Echoes ACT 2',part:4,rarity:'Epic',owner:'Koichi',power:5,speed:6,evolves:'echoes3',passive:'Status damage +20%.',skill:'SFX Trap',ultimate:'Heat Word'},
 {id:'echoes3',name:'Echoes ACT 3',part:4,rarity:'Legendary',owner:'Koichi',power:6,speed:7,passive:'Boss attack speed -10%.',skill:'Three Freeze',ultimate:'ACT 3 Beatdown'},
 {id:'killer',name:'Killer Queen',part:4,rarity:'Legendary',owner:'Kira',power:8,speed:7,passive:'Kills plant delayed bombs.',skill:'Sheer Heart Attack',ultimate:'Bites the Dust'},
 {id:'gold',name:'Gold Experience',part:5,rarity:'Epic',owner:'Giorno',power:7,speed:7,evolves:'ger',passive:'Kill streaks grant Resolve.',skill:'Life Giver',ultimate:'Life Shot'},
 {id:'ger',name:'Gold Experience Requiem',part:5,rarity:'Mythic',owner:'Giorno',power:10,speed:10,passive:'10% of incoming boss attacks return to zero.',skill:'Return to Zero',ultimate:'Infinite Death'},
 {id:'sticky',name:'Sticky Fingers',part:5,rarity:'Epic',owner:'Bruno',power:7,speed:8,passive:'Party speed +10%.',skill:'Zipper Ambush',ultimate:'ARI Barrage'},
 {id:'crimson',name:'King Crimson',part:5,rarity:'Legendary',owner:'Diavolo',power:9,speed:8,passive:'Periodically erases 1 second of boss actions.',skill:'Epitaph',ultimate:'Time Erasure'},
 {id:'stonefree',name:'Stone Free',part:6,rarity:'Epic',owner:'Jolyne',power:7,speed:8,passive:'Combo cap +50%.',skill:'String Net',ultimate:'ORA String Barrage'},
 {id:'weatherstand',name:'Weather Report',part:6,rarity:'Legendary',owner:'Weather',power:8,speed:7,passive:'Random weather status every 12s.',skill:'Storm Front',ultimate:'Heavy Weather'},
 {id:'whitesnake',name:'Whitesnake',part:6,rarity:'Epic',owner:'Pucci',power:7,speed:6,evolves:'cmoon',passive:'Stand XP +20%.',skill:'DISC Steal',ultimate:'Melt Your Heart'},
 {id:'cmoon',name:'C-Moon',part:6,rarity:'Legendary',owner:'Pucci',power:8,speed:7,evolves:'mih',passive:'Gravity doubles defense break.',skill:'Gravity Inversion',ultimate:'Surface Inversion'},
 {id:'mih',name:'Made in Heaven',part:6,rarity:'Mythic',owner:'Pucci',power:9,speed:10,passive:'Game speed ramps to ×2 in combat.',skill:'Accelerate',ultimate:'Universe Reset'},
 {id:'tusk1',name:'Tusk ACT 1',part:7,rarity:'Rare',owner:'Johnny',power:4,speed:6,evolves:'tusk2',passive:'Spin stacks +1.',skill:'Nail Shot',ultimate:'Spin Nail'},
 {id:'tusk2',name:'Tusk ACT 2',part:7,rarity:'Epic',owner:'Johnny',power:6,speed:7,evolves:'tusk3',passive:'Spin ignores 5% defense.',skill:'Golden Nail',ultimate:'Moving Hole'},
 {id:'tusk3',name:'Tusk ACT 3',part:7,rarity:'Legendary',owner:'Johnny',power:7,speed:8,evolves:'tusk4',passive:'Spin ignores 10% defense.',skill:'Wormhole Nail',ultimate:'Spatial Shot'},
 {id:'tusk4',name:'Tusk ACT 4',part:7,rarity:'Mythic',owner:'Johnny',power:10,speed:9,passive:'Infinite Rotation stacks never expire on bosses.',skill:'Infinite Nail',ultimate:'Infinite Rotation'},
 {id:'d4c',name:'D4C',part:7,rarity:'Legendary',owner:'Valentine',power:9,speed:8,evolves:'love',passive:'Chance to duplicate rewards.',skill:'Parallel Shift',ultimate:'D4C'},
 {id:'love',name:'D4C Love Train',part:7,rarity:'Mythic',owner:'Valentine',power:10,speed:9,passive:'Misfortune redirects into bonus damage.',skill:'Dimensional Wall',ultimate:'Love Train'},
 {id:'soft',name:'Soft & Wet',part:8,rarity:'Epic',owner:'Gappy',power:7,speed:7,evolves:'beyond',passive:'Steals 8% enemy defense.',skill:'Plunder',ultimate:'Explosive Bubble'},
 {id:'beyond',name:'Soft & Wet: Go Beyond',part:8,rarity:'Mythic',owner:'Gappy',power:10,speed:9,passive:'Clicks can ignore all defenses.',skill:'Invisible Spin',ultimate:'Go Beyond'},
 {id:'wou',name:'Wonder of U',part:8,rarity:'Mythic',owner:'Tooru',power:10,speed:7,passive:'Calamity retaliates against bosses.',skill:'Pursuit',ultimate:'Flow of Calamity'},
 {id:'november',name:'November Rain',part:9,rarity:'Legendary',owner:'Jodio',power:9,speed:6,passive:'Rain hits every enemy action.',skill:'Heavy Rain',ultimate:'Localized Downpour'}
];

BZ.UPGRADES = [
 {id:'fists',name:'Fighting Spirit',desc:'Multiply click damage.',baseCost:25,growth:1.22,effect:l=>1+l*.35},
 {id:'training',name:'Training Room',desc:'Multiply passive DPS.',baseCost:60,growth:1.25,effect:l=>1+l*.28},
 {id:'fortune',name:'Fortune Route',desc:'Increase Yen from enemies.',baseCost:100,growth:1.29,effect:l=>1+l*.22},
 {id:'focus',name:'Combat Focus',desc:'Increase critical damage.',baseCost:175,growth:1.32,effect:l=>1+l*.18},
 {id:'idle',name:'Idle Discipline',desc:'Improve offline efficiency.',baseCost:260,growth:1.36,effect:l=>Math.min(.95,.25+l*.04)}
];

BZ.ITEMS = [
 {id:'mask',name:'Stone Mask',rarity:'Legendary',desc:'Boss damage +35%, Yen -10%.',effect:'boss'},
 {id:'aja',name:'Red Stone of Aja',rarity:'Mythic',desc:'Hamon and critical damage +30%.',effect:'crit'},
 {id:'arrowRelic',name:'Stand Arrow Relic',rarity:'Epic',desc:'Stand Arrow drop chance doubled.',effect:'arrow'},
 {id:'steelball',name:'Steel Ball',rarity:'Epic',desc:'Spin and combo damage +25%.',effect:'combo'},
 {id:'locacaca',name:'Locacaca',rarity:'Legendary',desc:'Every 12th kill doubles its reward.',effect:'exchange'},
 {id:'corpse',name:"Saint's Corpse Part",rarity:'Mythic',desc:'Fate gain +50%; unlocks stranger events.',effect:'fate'},
 {id:'diary',name:"DIO's Diary",rarity:'Mythic',desc:'Heaven prestige gains +20%.',effect:'heaven'}
];

BZ.QUESTS = [
 {id:'q1',name:'Ripple Rookie',desc:'Defeat 25 enemies.',type:'kills',goal:25,reward:{yen:500}},
 {id:'q2',name:'Perfect Timing',desc:'Land 15 critical hits.',type:'crits',goal:15,reward:{arrows:1}},
 {id:'q3',name:'Good Grief',desc:'Reach a 25-hit combo.',type:'combo',goal:25,reward:{legacy:1}},
 {id:'q4',name:'Fated Encounter',desc:'Trigger 3 random Fate events.',type:'events',goal:3,reward:{yen:2500}},
 {id:'q5',name:'Arrow Collector',desc:'Awaken 3 different Stands.',type:'stands',goal:3,reward:{arrows:2}},
 {id:'q6',name:'Across the World',desc:'Unlock Part 3.',type:'part',goal:3,reward:{legacy:3}},
 {id:'q7',name:'Steel Ball Run',desc:'Unlock Part 7.',type:'part',goal:7,reward:{fate:50}},
 {id:'q8',name:'Beyond the Wall',desc:'Reach Part 9.',type:'part',goal:9,reward:{legacy:10}}
];

BZ.ACHIEVEMENTS = [
 {id:'a1',name:'A Bizarre Beginning',desc:'Defeat your first enemy.',test:s=>s.stats.kills>=1},
 {id:'a2',name:'Good Grief',desc:'Defeat 1,000 enemies.',test:s=>s.stats.kills>=1000},
 {id:'a3',name:'OH MY GOD!',desc:'Trigger your first rare event.',test:s=>s.stats.events>=1},
 {id:'a4',name:'Is That a JoJo Reference?',desc:'Discover 5 secrets or rare interactions.',test:s=>s.stats.secrets>=5},
 {id:'a5',name:'Kono Dio Da!',desc:'Unlock DIO.',test:s=>s.unlockedCharacters.includes('dio3')},
 {id:'a6',name:'Arrivederci',desc:'Defeat Diavolo.',test:s=>s.defeatedBosses.includes('Diavolo')},
 {id:'a7',name:'Pizza Mozzarella',desc:'Accumulate 1,000 Spin stacks.',test:s=>s.stats.spin>=1000},
 {id:'a8',name:'Across Eras',desc:'Unlock all nine Parts.',test:s=>s.unlockedPart>=9},
 {id:'a9',name:'Arrowhead',desc:'Awaken 10 Stands.',test:s=>s.unlockedStands.length>=10},
 {id:'a10',name:'Infinite',desc:'Reach 1e12 lifetime Yen.',test:s=>s.stats.lifetimeYen>=1e12}
];
