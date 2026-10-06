window.TREE_ROLES = (() => {
  const refs = {
    fungi:{title:'US Forest Service · Wood decay fungi',url:'https://research.fs.usda.gov/treesearch/59550'},
    detritus:{title:'University of Maryland · Pillbugs and sowbugs',url:'https://extension.umd.edu/resource/pillbugs-and-sowbugs'},
    millipede:{title:'University of Minnesota · Millipedes',url:'https://apps.extension.umn.edu/garden/diagnose/insect/garden/relatives/medium/millipedes.html'},
    spider:{title:'University of Minnesota · Spiders',url:'https://extension.umn.edu/garden-and-home/home-maintenance/household-insects/spiders'},
    ant:{title:'University of Minnesota · Carpenter ants',url:'https://extension.umn.edu/garden-and-home/home-maintenance/household-insects/carpenter-ants'},
    slug:{title:'University of Maryland · Slugs and snails',url:'https://www.extension.umd.edu/resource/slugs-and-snails-flowers'},
    soil:{title:'University of Maryland · Soil basics',url:'https://www.extension.umd.edu/resource/soil-basics'},
    termite:{title:'University of Maryland · Termites',url:'https://extension.umd.edu/resource/termites'},
    beetle:{title:'USDA APHIS · Citrus longhorned beetle',url:'https://www.aphis.usda.gov/sites/default/files/citrus_alb_2009_16_1.pdf'}
  };
  const roles=[];
  function add(names, process, text, ref) {names.forEach(species=>roles.push({species,process,text,source:refs[ref]}));}
  add(['真菌','霉菌','胶质真菌','晶粒鬼伞','纯白微皮伞','靴耳'],'木材分解','木腐真菌可参与木材分解。这里将表内真菌记录作为可能参与者；具体腐生能力和树洞内作用须结合物种鉴定与基质确认。','fungi');
  add(['西瓜虫'],'碎屑利用','陆生等足类常利用腐烂有机物；树洞中的碎屑利用是生态角色推测，表格没有记录其取食过程。','detritus');
  add(['马陆'],'碎屑利用','马陆常取食腐败植物材料，可能参与树洞残体的碎化。','millipede');
  add(['蜘蛛','拟蚁蛛'],'捕食','蜘蛛通常捕食小型节肢动物。拟蚁蛛并不因此被认定专门捕食蚂蚁；本表未记录具体捕食事件。','spider');
  add(['弓背蚁'],'栖息 / 可能筑巢','弓背蚁类可利用木材空间筑巢，但不以木材为食。树洞记录本身不足以证明这里已有蚁巢。','ant');
  add(['蚂蚁','大头蚁','举腹蚁'],'栖息 / 活动','原始表记载树洞附近的蚂蚁活动；此连线是对利用树洞空间的解释，不代表已确认筑巢。',null);
  add(['蜗牛','鼻涕虫'],'栖息 / 保湿','蜗牛和蛞蝓需要湿润环境，可能利用树洞遮蔽；天气记录不足以证明湿度偏好，未泛化为木材分解者。','slug');
  add(['白蚁'],'木材取食','白蚁类群可取食木材。原始表主要记载“白蚁痕迹”或“白蚁路径”；这里的木材取食是类群生态角色推测，不是活体计数或正在取食的证据。','termite');
  add(['星天牛','天牛'],'木材取食','天牛幼虫可在木材内钻蛀取食，表内包含蛀孔、蛹壳和羽化孔记录。角色仅表示可能的木材利用；未独立复核物种或证明当时有活体。星天牛参考资料针对 Anoplophora chinensis，不以羽化孔单独确认物种。','beetle');
  roles.sources=refs;
  return roles;
})();
