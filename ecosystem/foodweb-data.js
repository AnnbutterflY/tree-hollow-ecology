/* Knowledge layer: never mutates spreadsheet records or their occurrence counts. */
(() => {
 const refs={
  soil:['明尼苏达大学 · 土壤中的生命','https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/living-soil-healthy-garden'],
  matter:['马里兰大学 · 土壤有机质与养分','https://www.extension.umd.edu/resource/soil-basics'],
  litter:['明尼苏达大学 · 等足类与马陆','https://extension.umn.edu/garden-and-home/home-maintenance/household-insects/sowbugs-millipedes-and-centipedes'],
  spring:['明尼苏达大学 · 弹尾虫','https://extension.umn.edu/garden-and-home/home-maintenance/household-insects/springtails'],
  predator:['加州大学 IPM · 捕食性天敌','https://ipm.ucanr.edu/home-and-landscape/beneficial-predators/'],
  aphid:['加州大学 IPM · 蚜虫','https://ipm.ucanr.edu/home-and-landscape/aphids/'],
  ant:['加州大学 IPM · 生物防治与蚂蚁','https://ipm.ucanr.edu/home-and-landscape/biological-control-and-natural-enemies-of-invertebrates/'],
  lace:['加州大学 IPM · 网蝽','https://ipm.ucanr.edu/home-and-landscape/lace-bugs/']
 };
 const nodes=[
  ['plant','悬铃木与周边植物','生产者',70,185,[], '植物通过光合作用把光能转为有机物中的化学能。叶片、木材、根系分泌物和枯落物，把树冠与树洞、土壤的食物网连接起来。','soil'],
  ['herb','网蝽等植食者','知识补充',320,90,[], '网蝽刺吸叶片组织。此处以网蝽类群示意植食通道；表格没有网蝽记录，不据这张示意图增加校园物种记录。具体物种与取食部位需要补充鉴定。','lace'],
  ['aphid','蚜虫 / 蜜露','知识补充',320,240,[], '蚜虫取食植物汁液并排出含糖蜜露，可为某些蚂蚁提供食物。它是解释蚁类关系的延伸节点，表格没有蚜虫记录。','aphid'],
  ['pred','蜘蛛 / 拟蚁蛛','捕食者',590,90,['蜘蛛','拟蚁蛛'], '蜘蛛捕食小型节肢动物，把多条食物路径连接起来。拟蚁外形不等于专吃蚂蚁；这里不指定本项目未观察到的猎物组合。','predator'],
  ['enemy','草蛉等捕食者','知识补充',590,235,[], '草蛉幼虫可以捕食蚜虫等小型猎物；成虫的食性可能不同。未把参考图中的瓢虫、红纹螨直接认定为已记录物种或已确认天敌。','predator'],
  ['ants','弓背蚁等蚂蚁','杂食 / 活动',845,240,['弓背蚁','蚂蚁','大头蚁','举腹蚁'], '表格记录了蚁类活动。某些蚂蚁利用蜜露并保护产蜜露昆虫，但本项目没有记录这种互作；不能由蚂蚁和网蝽共同出现推出保护关系。','ant'],
  ['dead','枯叶 / 腐木 / 残体','有机物入口',70,440,[], '植物枯落物、动物残体与排泄物进入碎屑食物网。此处是生态过程节点，不是表格中额外统计的样本。','matter'],
  ['det','西瓜虫 / 马陆','碎屑取食者',320,420,['西瓜虫','马陆'], '它们利用腐败植物材料，取食和碎化有机残体。与真菌、细菌的分解相互衔接，但不能把碎化与矿化视为同一个过程。','litter'],
  ['fungi','腐生真菌 / 细菌','分解者',590,440,['真菌','霉菌','胶质真菌','晶粒鬼伞','纯白微皮伞','靴耳'], '微生物分解有机物，部分养分转成植物可利用的无机形式。表内有真菌标签，但不是所有真菌都可直接认定为木腐菌；细菌为知识补充，未经项目检测。','soil'],
  ['spring','弹尾虫','微食物网',590,610,['弹尾虫'], '弹尾虫可以取食真菌、藻类、花粉和腐败有机物。它连接微生物资源与小型动物食物网，具体食谱因种类而异。','spring'],
  ['nutrient','可利用养分','矿化与吸收',845,440,[], '分解释放的部分养分可被根系和微生物吸收，另一些会固定、流失或暂存于有机质中。返回植物的是物质；能量在呼吸等过程中逐步散失。','matter'],
  ['wood','白蚁 / 天牛幼虫','木材利用',320,610,['白蚁','天牛','星天牛'], '白蚁与一些天牛幼虫可利用木材资源。天牛幼虫还可能利用活树组织，并非都属于腐食者。表格中的蛀孔、羽化孔或路径首先是痕迹，不自动等同于活体或正在取食。',null]
 ].map(([id,label,role,x,y,taxa,text,ref])=>({id,label,role,x,y,taxa,text,ref}));
 const edges=[
  ['plant','herb','叶片取食','活体植物 → 植食者','网蝽取食叶片组织。此箭头表达一般取食关系，不代表已在这些树洞中观察到。','lace','green'],
  ['plant','aphid','汁液取食','植物汁液 → 蚜虫','蚜虫利用植物汁液；这一节点用于补充食物网背景。','aphid','green'],
  ['herb','pred','潜在捕食','植食性小虫 → 捕食者','蜘蛛是广食性捕食者。该箭头仅表示可能通道，不指定本地网蝽与某一种蜘蛛的实际捕食事件。','predator','green'],
  ['aphid','enemy','捕食','蚜虫 → 草蛉幼虫','草蛉幼虫可捕食蚜虫；角色需要区分生活史阶段。','predator','green'],
  ['aphid','ants','蜜露资源','蜜露 → 蚂蚁','某些蚂蚁取食产蜜露昆虫提供的含糖分泌物。这里不是给所有蚁种规定食谱。','ant','mutual'],
  ['ants','aphid','保护互作','蚂蚁 → 产蜜露昆虫','部分蚁类会干扰天敌，保护产蜜露昆虫。这不是能量流向，也不是已确认的弓背蚁—网蝽关系。','ant','mutual'],
  ['plant','dead','枯落','植物 → 有机残体','枯叶、死亡组织等为碎屑食物网提供资源。','matter','brown'],
  ['dead','det','碎屑取食','腐败植物材料 → 碎屑取食者','西瓜虫和马陆利用腐烂植物材料，促进残体碎化。','litter','brown'],
  ['dead','fungi','分解基质','有机残体 → 分解者','腐生微生物利用有机物；这条路线可以与动物碎化并行，并不是必须先经过动物。','soil','brown'],
  ['det','fungi','碎化衔接','碎化与排泄 → 微生物分解','碎屑取食产生的细小残体与排泄物可继续进入微生物处理过程。箭头表示过程衔接，不是“真菌捕食西瓜虫”。','matter','brown'],
  ['fungi','spring','菌食','真菌资源 → 弹尾虫','部分弹尾虫取食真菌；也可能利用藻类、花粉等其他资源。','spring','brown'],
  ['spring','pred','潜在捕食','微型动物 → 捕食者','将微食物网连接到广食性捕食者的概念通道；具体捕食对象仍需现场观察。','predator','brown'],
  ['fungi','nutrient','矿化','有机养分 → 可利用无机养分','微生物分解伴随养分转化，也伴随微生物自身吸收和暂时固定。','matter','cycle'],
  ['nutrient','plant','根系吸收','养分 → 植物','养分经根系吸收重新进入植物体。这是物质循环，不是能量循环，也不代表测得了某棵树的养分通量。','soil','cycle'],
  ['dead','wood','部分木材利用','木质资源 → 木材利用者','白蚁和一些天牛幼虫可利用木材。天牛也可能从活体组织取食，所以此线不把所有天牛归为碎屑消费者。',null,'brown']
 ].map(([from,to,label,title,text,ref,path],i)=>({id:'edge'+i,from,to,label,title,text,ref,path}));
 window.FOOD_WEB={nodes,edges,refs};
})();