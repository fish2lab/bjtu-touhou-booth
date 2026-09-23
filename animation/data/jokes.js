'use strict';
// 笑话段用的笑话。原文节选自 /Users/fish2lab/Downloads/奇妙的东方笑话（Full Ver.）.docx（纯文本在 out/ref/jokes.txt），不改字。
// 顺序就是出场顺序：前四则逐个被 WASTED 淘汰，champion 最后亮出。想换哪则，只改这里。
// lines 每项一行：who 是说话人（可空），text 是这一行的原文；note 是原文里括号内的小字说明。
const JOKES = [
  {
    id: 'suika', cast: ['伊吹萃香'], src: 'jokes.txt 第 44–47 行',
    lines: [
      { text: '伊吹萃香的戒酒打卡记录：' },
      { text: '第1天。' },
      { text: '第1天。' },
      { text: '第1天。' },
    ],
  },
  {
    id: 'reimu-fortune', cast: ['博丽灵梦'], src: 'jokes.txt 第 140–144 行',
    lines: [
      { text: '灵梦摆摊算命，招牌写着“不灵不要钱”。' },
      { text: '第一个客人坐下：“大师，看看我最近的财运。”' },
      { text: '灵梦伸出手：“先给十块。”' },
      { text: '客人给了。' },
      { text: '灵梦掐指一算，摇头：“不行，你财运很差——刚刚又少了十块。”' },
    ],
  },
  {
    id: 'rin-carpool', cast: ['火焰猫燐'], src: 'jokes.txt 第 126–127 行',
    lines: [
      { text: '火焰猫燐的拼车评分4.9。' },
      { text: '唯一一条差评：“车里有股怪味，而且总觉得乘客越坐越多。”' },
    ],
  },
  {
    id: 'satori-npy', cast: ['古明地觉', '蕾米莉亚'], src: 'jokes.txt 第 178–181 行',
    lines: [
      { text: '（并非笑话）姐姐组为了建立威严，打算拿群友开刀，古明地觉找到群友最想要的东西，蕾米莉亚再用冈格尼尔当面毁掉。' },
      { who: '古明地觉', text: '“群友最想要的东西是npy。”' },
      { who: '蕾米莉亚', text: '“哈哈哈，亲眼看着你将来最重要的东西毁在……现在？”' },
      { who: '冈格尼尔', text: '“您无法选中不存在的目标。”' },
    ],
  },
];
const JOKE_CHAMPION = {
  id: 'yukari-1970', cast: ['八云紫', '河城荷取'], src: 'jokes.txt 第 54–59 行',
  lines: [
    { text: '用户名：八云紫' },
    { text: '注册时间：1970年1月1日' },
    { text: '生日：1970年1月1日' },
    { who: '河城荷取', text: '“这很明显是Unix时间戳归零导致的显示bug。”' },
    { who: '匿名用户6657', text: '“并非，紫摩尼教7 96u可通过v一部分如此\t等XJYH7\t4”', note: '（以上为脸滚键盘实际产物）' },
    { text: '该用户已注销' },
  ],
};
// 片尾觉对观众说的话，出自规则说明（jokes.txt 第 20 行）
const JOKE_OUTRO = '你刚才在脑袋里笑了';
