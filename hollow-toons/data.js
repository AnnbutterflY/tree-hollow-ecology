'use strict';
window.HOLLOW={
  chapters:[['苔门初映','MOSS & MANDIBLES','#24483b'],['蜜蜡长廊','HONEY & HAZARDS','#5d4325'],['菌伞深院','SPORES & SPECTACLES','#41412d'],['朽木机关','ROT & RIDDLES','#314d50'],['织网剧院','SILK & SHADOWS','#443447'],['树心终幕','HEART OF THE HOLLOW','#62372b']],
  bosses:[
    {name:'锹甲门卫',subtitle:'THE GATEKEEPER',kind:'stag',sprite:0,w:270,h:280,patterns:['aim','charge','fan'],color:'#b96a42'},
    {name:'双镰绅士',subtitle:'SIR SCYTHE',kind:'mantis',sprite:1,w:240,h:340,patterns:['slash','jump','fan'],color:'#9caa65'},
    {name:'金针蜂后',subtitle:'THE HONEY QUEEN',kind:'hornet',sprite:2,w:280,h:260,patterns:['aim','rain','summon'],color:'#d4ae52',fly:true},
    {name:'绒翼夫人',subtitle:'MADAME VELVET',kind:'moth',sprite:3,w:340,h:280,patterns:['wave','ring','wind'],color:'#c5a07a',fly:true},
    {name:'卷甲车长',subtitle:'THE ROLY EXPRESS',kind:'pillbug',sprite:4,w:290,h:260,patterns:['roll','fan','jump'],color:'#92977e'},
    {name:'红点伯爵',subtitle:'COUNT POLKA',kind:'ladybird',sprite:5,w:280,h:270,patterns:['bounce','ring','charge'],color:'#c56855'},
    {name:'银须幻客',subtitle:'THE SILVER SHADE',kind:'silverfish',sprite:6,w:330,h:250,patterns:['dash','aim','wave'],color:'#acbbb4'},
    {name:'长角匠师',subtitle:'THE ANTLER ENGINEER',kind:'longhorn',sprite:7,w:300,h:300,patterns:['laser','rain','summon'],color:'#d6aa77'},
    {name:'八足织梦者',subtitle:'THE SILKEN PUPPETEER',kind:'spider',sprite:8,w:370,h:310,patterns:['web','ring','summon'],color:'#bc91a9',fly:true},
    {name:'千足巡游',subtitle:'THE MIDNIGHT PARADE',kind:'millipede',sprite:9,w:330,h:300,patterns:['roll','wave','rain'],color:'#b68a58'},
    {name:'蜓翼剑客',subtitle:'THE GLASS DUELLIST',kind:'dragonfly',sprite:10,w:350,h:270,patterns:['dash','laser','fan'],color:'#95c6b4',fly:true},
    {name:'白蚁女王',subtitle:'QUEEN OF THE HOLLOW',kind:'termite',sprite:11,w:360,h:340,patterns:['summon','ring','rain','laser','charge'],color:'#dbbd8c'}
  ],
  runs:[['苔门小径','露珠栈桥'],['蜜蜡回廊','花粉风道'],['菌伞阶梯','孢子深井'],['断枝工坊','朽木齿轮'],['蛛丝回廊','悬根夜行'],['树脂长阶','王庭前夜']],
  difficulty:['舒缓','轻巧','险峻','凶猛','狂热'],
  controls:[['← → / A D','移动'],['↑ / W','向上瞄准'],['Z / J','按住连续射击'],['Space / K','跳跃；空中再次按下反击粉色弹'],['Shift / L','冲刺，短暂无敌'],['X / U','消耗一张能量牌，释放强力弹'],['C / I','站定瞄准'],['Esc / P','暂停'],['F','全屏'],['M','静音']]
};
window.mulberry32=function(seed){return function(){let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}};
window.makeLevels=function(seed){const r=mulberry32(seed),levels=[];for(let ch=0;ch<6;ch++){for(let part=0;part<4;part++){const index=ch*4+part,boss=part%2===1,difficulty=1+Math.floor(r()*5);levels.push({index,chapter:ch,part,boss,difficulty,seed:Math.floor(r()*2**31),name:boss?HOLLOW.bosses[ch*2+Math.floor(part/2)].name:HOLLOW.runs[ch][Math.floor(part/2)],bossId:boss?ch*2+Math.floor(part/2):-1,length:boss?1280:4300+ch*240+Math.floor(part/2)*350})}}return levels};
