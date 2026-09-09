window.BZ = window.BZ || {};
BZ.ASSETS = {
  characters: 'assets/characters.webp',
  stands: 'assets/stands.webp',
  items: 'assets/items.webp',
  hero: 'assets/hero.webp',
  poster: 'assets/poster.webp',
  ui: 'assets/ui-kit.webp'
};

BZ.ART = {
  characters: {
    jonathan:[0,1], zeppeli:[2,0], speedwagon:[0,0], dio1:[3,1],
    joseph:[0,0], caesar:[1,0], lisa:[1,1], stroheim:[4,0], wamuu:[3,0], esidisi:[7,1], kars:[4,0],
    jotaro:[1,0], avdol:[0,0], kakyoin:[1,1], polnareff:[4,0], iggy:[3,0], dio3:[7,1],
    josuke4:[0,0], okuyasu:[6,0], koichi:[5,1], rohan:[1,0], shigechi:[3,0], yukako:[5,1], kira:[7,1],
    giorno:[4,0], bruno:[1,0], mista:[6,0], narancia:[3,0], fugo:[2,0], abbacchio:[7,1], trish:[2,0], diavolo:[3,0],
    jolyne:[5,1], ermes:[0,0], ff:[1,1], weather:[1,0], anasui:[2,0], emporio:[1,1], pucci:[7,1],
    johnny:[6,0], gyro:[4,0], diego:[3,0], hotpants:[5,1], mtim:[6,0], wekapipo:[6,0], valentine:[4,0],
    gappy:[7,1], yasuho:[5,1], rai:[6,0], jobin:[2,0], norisuke:[4,0], tooru:[7,1],
    jodio:[3,0], dragona:[2,0], paco:[0,0]
  },
  stands: {
    hermit:[2,0], star:[0,0], world:[5,1], magician:[1,0], hierophant:[2,0], chariot:[5,0],
    crazy:[5,0], hand:[6,0], echoes1:[4,0], echoes2:[4,0], echoes3:[4,0], killer:[7,1],
    gold:[2,0], ger:[7,1], sticky:[6,0], crimson:[7,1], stonefree:[2,0], weatherstand:[1,0],
    whitesnake:[6,0], cmoon:[3,0], mih:[3,0], tusk1:[4,0], tusk2:[4,0], tusk3:[4,0], tusk4:[3,0],
    d4c:[7,1], love:[7,1], soft:[2,0], beyond:[7,1], wou:[3,0], november:[1,0]
  },
  items: {
    mask:[2,0], aja:[1,0], arrowRelic:[0,0], steelball:[0,1], locacaca:[3,0], corpse:[11,0], diary:[6,0],
    fists:[9,2], training:[8,2], fortune:[7,1], focus:[10,2], idle:[6,1],
    breathing:[8,1], overdrive:[0,0], solar:[1,0], heal:[3,0], spin:[0,1], rectangle:[9,2], golden:[11,2], infinite:[10,2],
    autoUpgrade:[7,1], autoBoss:[6,1], autoStand:[5,1], legacy:[9,2], heaven:[6,1], dimension:[11,2]
  },
  parts: {
    1:[0,0],2:[4,0],3:[1,0],4:[0,0],5:[2,0],6:[7,1],7:[6,0],8:[5,1],9:[3,0]
  }
};

BZ.SKILL_TREES = [
  {id:'breathing', name:'Breathing Training', currency:'fatePoints', desc:'Increase click damage and XP gain through Hamon control.', cost:l=>5 + l*4, effect:l=>1 + l*0.08},
  {id:'overdrive', name:'Ripple Overdrive', currency:'fatePoints', desc:'Boost boss damage and critical strikes.', cost:l=>8 + l*5, effect:l=>1 + l*0.10},
  {id:'solar', name:'Solar Conductivity', currency:'fatePoints', desc:'Adds scaling burn damage every hit.', cost:l=>10 + l*6, effect:l=>l*0.04},
  {id:'heal', name:'Hamon Healing', currency:'fatePoints', desc:'Increase max Resolve and passive recovery.', cost:l=>8 + l*6, effect:l=>l*0.12},
  {id:'spin', name:'Basic Spin', currency:'legacy', desc:'Unlock Spin scaling and extra combo damage.', cost:l=>1 + l, effect:l=>1 + l*0.11},
  {id:'rectangle', name:'Golden Rectangle', currency:'legacy', desc:'Increase crit chance and passive DPS.', cost:l=>2 + l, effect:l=>1 + l*0.1},
  {id:'golden', name:'Golden Rotation', currency:'heaven', desc:'Late-game universal multiplier and Spin gain.', cost:l=>1 + l, effect:l=>1 + l*0.18},
  {id:'infinite', name:'Infinite Rotation', currency:'dimensionShards', desc:'Extreme endgame multiplier applied nearly everywhere.', cost:l=>2 + l, effect:l=>1 + l*0.30},
  {id:'autoUpgrade', name:'Auto Upgrades', currency:'legacy', desc:'Automatically buys affordable shop upgrades.', cost:l=>2 + l, effect:l=>l},
  {id:'autoBoss', name:'Auto Boss', currency:'legacy', desc:'Improves boss rushing and auto-advances Parts.', cost:l=>2 + l, effect:l=>l},
  {id:'autoStand', name:'Stand Training', currency:'heaven', desc:'Automatically levels the active Stand over time.', cost:l=>1 + l, effect:l=>l}
];

BZ.CHALLENGES = [
  {id:'nostand', name:'No Stands', desc:'Lose your active Stand, gain +80% Fate and +1 Legacy on completion.', unlockPart:3, reward:'Permanent click damage +12% per win.'},
  {id:'hamon', name:'Only Hamon', desc:'No passive DPS from party members. Hamon skills are doubled.', unlockPart:2, reward:'Permanent crit chance +2% per win.'},
  {id:'villains', name:'Villains Only', desc:'Only villain-tagged vibes. Party size limited to 3.', unlockPart:4, reward:'Permanent Yen +10% per win.'},
  {id:'noclick', name:'No Clicking', desc:'Manual clicks deal zero. Build around passive and automation.', unlockPart:5, reward:'Permanent idle gain +15% per win.'},
  {id:'bossrush', name:'Boss Rush', desc:'Every encounter is a boss. Huge rewards if you can survive.', unlockPart:6, reward:'Permanent boss damage +15% per win.'},
  {id:'glass', name:'Glass Cannon', desc:'Deal more damage, but your Resolve is halved.', unlockPart:7, reward:'Permanent ability damage +12% per win.'}
];

BZ.STORY = {
  1:'Hamon begins your strange journey through a gothic feud of masks and courage.',
  2:'Training escalates into pillar-men chaos and sharper build variety.',
  3:'The Stand era begins: bigger bursts, faster ability loops, stronger bosses.',
  4:'Town mysteries add defense breaks, utility characters and weird luck spikes.',
  5:'Italian chaos rewards aggressive combos, boss kills and stylish rushdowns.',
  6:'Gravity, weather and time ramp systems start warping your scaling.',
  7:'Spin takes over: golden routes, infinite rotation and absurd synergy builds.',
  8:'Alternate logic twists rewards, relic value and multiverse effects.',
  9:'Mechanisms and rain bring the final route and Dimension Shard endgame.'
};
