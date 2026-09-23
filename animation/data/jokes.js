'use strict';
// 笑话段用的笑话。原文节选自 /Users/fish2lab/Downloads/奇妙的东方笑话（Full Ver.）.docx（纯文本在 out/ref/jokes.txt）。
// 整段只有 20 秒，所以只留铺垫的最后一句和包袱：每行都是原文里连续的一段，不改字、不加字，删掉的是中间的行或整句。
// 顺序就是出场顺序：前四则逐个被 WASTED 淘汰，champion 最后亮出。想换哪则，只改这里。
// lines 每项一行：who 是说话人（可空，画面上可以用来配剪影），text 是这一行的原文；note 是原文里括号内的小字说明。
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
    id: 'rin-carpool', cast: ['火焰猫燐'], src: 'jokes.txt 第 126–127 行',
    lines: [
      { text: '火焰猫燐的拼车评分4.9。' },
      { text: '唯一一条差评：“车里有股怪味，而且总觉得乘客越坐越多。”' },
    ],
  },
  {
    id: 'reimu-fortune', cast: ['博丽灵梦'], src: 'jokes.txt 第 140、142、144 行',
    lines: [
      { text: '灵梦摆摊算命，招牌写着“不灵不要钱”。' },
      { who: '博丽灵梦', text: '灵梦伸出手：“先给十块。”' },
      { who: '博丽灵梦', text: '灵梦掐指一算，摇头：“不行，你财运很差——刚刚又少了十块。”' },
    ],
  },
  {
    id: 'satori-npy', cast: ['古明地觉', '蕾米莉亚'], src: 'jokes.txt 第 178 行（后半句）、179、181 行',
    lines: [
      { text: '古明地觉找到群友最想要的东西，蕾米莉亚再用冈格尼尔当面毁掉。' },
      { who: '古明地觉', text: '古明地觉：“群友最想要的东西是npy。”' },
      { who: '冈格尼尔', text: '冈格尼尔：“您无法选中不存在的目标。”' },
    ],
  },
];
const JOKE_CHAMPION = {
  id: 'yukari-1970', cast: ['八云紫', '河城荷取'], src: 'jokes.txt 第 54–55、57–59 行',
  lines: [
    { text: '用户名：八云紫' },
    { text: '注册时间：1970年1月1日' },
    { who: '河城荷取', text: '河城荷取：“这很明显是Unix时间戳归零导致的显示bug。”' },
    { who: '匿名用户6657', text: '匿名用户6657：“并非，紫摩尼教7 96u可通过v一部分如此\t等XJYH7\t4”', note: '（以上为脸滚键盘实际产物）' },
    { text: '该用户已注销' },
  ],
};
// 片尾觉对观众说的话，出自规则说明（jokes.txt 第 20 行）
const JOKE_OUTRO = '你刚才在脑袋里笑了';
