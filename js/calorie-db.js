/**
 * 食品の標準カロリー辞書 & 推定ヘルパー
 * 日本の一般的なスーパー・コンビニ食品の目安カロリー (kcal) と賞味期限目安 (日)
 */
export const FOOD_DATABASE = [
  // 主食・パン・麺
  { name: 'おにぎり', calories: 180, unit: '1個', category: '主食', shelfLifeDays: 1 },
  { name: '白米', calories: 240, unit: '1膳(150g)', category: '主食', shelfLifeDays: 2 },
  { name: '食パン', calories: 160, unit: '1枚(6枚切)', category: '主食', shelfLifeDays: 4 },
  { name: '菓子パン', calories: 350, unit: '1個', category: '主食', shelfLifeDays: 3 },
  { name: 'クロワッサン', calories: 200, unit: '1個', category: '主食', shelfLifeDays: 3 },
  { name: 'うどん', calories: 270, unit: '1玉', category: '主食', shelfLifeDays: 5 },
  { name: 'そば', calories: 260, unit: '1玉', category: '主食', shelfLifeDays: 5 },
  { name: 'パスタ・スパゲッティ', calories: 370, unit: '1食(100g乾)', category: '主食', shelfLifeDays: 365 },
  { name: 'カップ麺・ラーメン', calories: 430, unit: '1個', category: '主食', shelfLifeDays: 180 },
  { name: '冷凍チャーハン', calories: 480, unit: '1袋(250g)', category: '主食', shelfLifeDays: 90 },

  // 肉・魚・卵・大豆
  { name: '鶏むね肉', calories: 110, unit: '100g', category: 'お肉・魚', shelfLifeDays: 2 },
  { name: '鶏もも肉', calories: 200, unit: '100g', category: 'お肉・魚', shelfLifeDays: 2 },
  { name: '豚バラ肉', calories: 380, unit: '100g', category: 'お肉・魚', shelfLifeDays: 3 },
  { name: '豚こま肉', calories: 230, unit: '100g', category: 'お肉・魚', shelfLifeDays: 3 },
  { name: '牛切り落とし', calories: 280, unit: '100g', category: 'お肉・魚', shelfLifeDays: 3 },
  { name: '挽肉・ひき肉', calories: 250, unit: '100g', category: 'お肉・魚', shelfLifeDays: 2 },
  { name: 'サーモン・鮭', calories: 130, unit: '1切れ(80g)', category: 'お肉・魚', shelfLifeDays: 2 },
  { name: 'マグロ刺身', calories: 110, unit: '1柵(100g)', category: 'お肉・魚', shelfLifeDays: 1 },
  { name: 'サバ・塩サバ', calories: 240, unit: '1切れ(100g)', category: 'お肉・魚', shelfLifeDays: 2 },
  { name: 'たまご・卵', calories: 75, unit: '1個', category: 'お肉・魚', shelfLifeDays: 14 },
  { name: '納豆', calories: 90, unit: '1パック', category: 'お肉・魚', shelfLifeDays: 10 },
  { name: '豆腐・木綿豆腐', calories: 140, unit: '1丁(300g)', category: 'お肉・魚', shelfLifeDays: 5 },
  { name: 'ウインナー・ソーセージ', calories: 320, unit: '1袋(5本)', category: 'お肉・魚', shelfLifeDays: 14 },
  { name: 'ハム・ベーコン', calories: 120, unit: '1パック(4枚)', category: 'お肉・魚', shelfLifeDays: 10 },

  // 野菜・きのこ・果物
  { name: 'キャベツ', calories: 45, unit: '1/4玉', category: '野菜・果物', shelfLifeDays: 7 },
  { name: 'レタス', calories: 30, unit: '1玉', category: '野菜・果物', shelfLifeDays: 4 },
  { name: 'トマト', calories: 40, unit: '1個', category: '野菜・果物', shelfLifeDays: 5 },
  { name: 'ミニトマト', calories: 30, unit: '1パック', category: '野菜・果物', shelfLifeDays: 6 },
  { name: '玉ねぎ', calories: 65, unit: '1個', category: '野菜・果物', shelfLifeDays: 14 },
  { name: 'にんじん', calories: 50, unit: '1本', category: '野菜・果物', shelfLifeDays: 14 },
  { name: 'じゃがいも', calories: 110, unit: '1個', category: '野菜・果物', shelfLifeDays: 20 },
  { name: 'きゅうり', calories: 15, unit: '1本', category: '野菜・果物', shelfLifeDays: 5 },
  { name: 'ブロッコリー', calories: 55, unit: '1株', category: '野菜・果物', shelfLifeDays: 4 },
  { name: 'もやし', calories: 28, unit: '1袋', category: '野菜・果物', shelfLifeDays: 2 },
  { name: 'しめじ・きのこ', calories: 20, unit: '1パック', category: '野菜・果物', shelfLifeDays: 5 },
  { name: 'バナナ', calories: 86, unit: '1本', category: '野菜・果物', shelfLifeDays: 4 },
  { name: 'りんご', calories: 140, unit: '1個', category: '野菜・果物', shelfLifeDays: 14 },
  { name: 'アボカド', calories: 220, unit: '1個', category: '野菜・果物', shelfLifeDays: 4 },

  // 乳製品・飲料
  { name: '牛乳', calories: 135, unit: '200ml(コップ1杯)', category: '乳製品・飲料', shelfLifeDays: 7 },
  { name: 'ヨーグルト', calories: 100, unit: '1個(150g)', category: '乳製品・飲料', shelfLifeDays: 10 },
  { name: 'スライスチーズ', calories: 55, unit: '1枚', category: '乳製品・飲料', shelfLifeDays: 30 },
  { name: 'バター', calories: 150, unit: '20g', category: '乳製品・飲料', shelfLifeDays: 60 },
  { name: '緑茶・お茶', calories: 0, unit: '500ml', category: '乳製品・飲料', shelfLifeDays: 180 },
  { name: 'コーヒー・カフェラテ', calories: 85, unit: '1本(200ml)', category: '乳製品・飲料', shelfLifeDays: 60 },
  { name: '野菜ジュース', calories: 70, unit: '200ml', category: '乳製品・飲料', shelfLifeDays: 90 },
  { name: 'ビール', calories: 140, unit: '350ml缶', category: '乳製品・飲料', shelfLifeDays: 180 },
  { name: 'チューハイ・サワー', calories: 180, unit: '350ml缶', category: '乳製品・飲料', shelfLifeDays: 180 },

  // 惣菜・お弁当・外食
  { name: 'から揚げ・唐揚げ', calories: 320, unit: '1パック(4個)', category: '惣菜・お弁当', shelfLifeDays: 1 },
  { name: 'コロッケ', calories: 180, unit: '1個', category: '惣菜・お弁当', shelfLifeDays: 1 },
  { name: 'とんかつ', calories: 450, unit: '1枚', category: '惣菜・お弁当', shelfLifeDays: 1 },
  { name: '幕の内弁当', calories: 720, unit: '1個', category: '惣菜・お弁当', shelfLifeDays: 1 },
  { name: 'ハンバーガー', calories: 350, unit: '1個', category: '惣菜・お弁当', shelfLifeDays: 1 },
  { name: 'ポテトフライ', calories: 320, unit: 'Mサイズ', category: '惣菜・お弁当', shelfLifeDays: 1 },
  { name: '牛丼', calories: 680, unit: '並盛', category: '惣菜・お弁当', shelfLifeDays: 1 },
  { name: 'ラーメン(外食)', calories: 750, unit: '1杯', category: '惣菜・お弁当', shelfLifeDays: 1 },
  { name: 'パスタ・ピザ(外食)', calories: 650, unit: '1人前', category: '惣菜・お弁当', shelfLifeDays: 1 },
  { name: '寿司盛り合わせ', calories: 550, unit: '8貫', category: '惣菜・お弁当', shelfLifeDays: 1 },

  // お菓子・スイーツ
  { name: 'ポテトチップス', calories: 330, unit: '1袋(60g)', category: 'お菓子・スイーツ', shelfLifeDays: 90 },
  { name: 'チョコレート', calories: 280, unit: '1枚(50g)', category: 'お菓子・スイーツ', shelfLifeDays: 120 },
  { name: 'クッキー・ビスケット', calories: 220, unit: '1袋', category: 'お菓子・スイーツ', shelfLifeDays: 90 },
  { name: 'アイスクリーム', calories: 210, unit: '1個', category: 'お菓子・スイーツ', shelfLifeDays: 180 },
  { name: 'シュークリーム', calories: 230, unit: '1個', category: 'お菓子・スイーツ', shelfLifeDays: 2 },
  { name: 'プリン', calories: 140, unit: '1個', category: 'お菓子・スイーツ', shelfLifeDays: 5 }
];

/**
 * 商品名からカロリーと食品情報を推定する関数
 */
export function estimateFoodCalories(itemName) {
  if (!itemName || typeof itemName !== 'string') {
    return null;
  }
  const cleanName = itemName.toLowerCase().replace(/[\s\u3000]/g, '');

  // 1. 完全一致・部分一致検索
  for (const item of FOOD_DATABASE) {
    const dbName = item.name.toLowerCase().replace(/[\s\u3000]/g, '');
    const keywords = dbName.split(/[・/]/);
    for (const kw of keywords) {
      if (cleanName.includes(kw) || kw.includes(cleanName)) {
        return {
          isFood: true,
          calories: item.calories,
          category: item.category,
          shelfLifeDays: item.shelfLifeDays,
          unit: item.unit,
          matchedName: item.name
        };
      }
    }
  }

  // 2. 一般的なキーワードでの推測
  const foodKeywords = [
    { pattern: /(飯|米|ごはん|ライス|丼)/, cal: 250, cat: '主食', life: 2 },
    { pattern: /(パン|サンド|トースト|バゲット)/, cal: 220, cat: '主食', life: 3 },
    { pattern: /(麺|ラーメン|うどん|そば|パスタ|焼そば)/, cal: 350, cat: '主食', life: 4 },
    { pattern: /(肉|牛|豚|鶏|チキン|ポーク|ビーフ|ミンチ)/, cal: 240, cat: 'お肉・魚', life: 3 },
    { pattern: /(魚|鮭|サーモン|マグロ|刺身|サバ|エビ|イカ)/, cal: 160, cat: 'お肉・魚', life: 2 },
    { pattern: /(菜|サラダ|トマト|ネギ|キャベツ|レタス|野菜)/, cal: 40, cat: '野菜・果物', life: 5 },
    { pattern: /(果|リンゴ|バナナ|みかん|イチゴ|ぶどう)/, cal: 80, cat: '野菜・果物', life: 6 },
    { pattern: /(乳|ミルク|チーズ|ヨーグルト|バター)/, cal: 120, cat: '乳製品・飲料', life: 10 },
    { pattern: /(茶|水|コーヒー|ジュース|コーラ|ソーダ|酒|ビール)/, cal: 80, cat: '乳製品・飲料', life: 90 },
    { pattern: /(弁|惣菜|カツ|フライ|唐揚|揚|弁当)/, cal: 450, cat: '惣菜・お弁当', life: 1 },
    { pattern: /(チョコ|菓子|スナック|アイス|ケーキ|クッキー)/, cal: 260, cat: 'お菓子・スイーツ', life: 60 }
  ];

  for (const { pattern, cal, cat, life } of foodKeywords) {
    if (pattern.test(cleanName)) {
      return {
        isFood: true,
        calories: cal,
        category: cat,
        shelfLifeDays: life,
        unit: '1個/パック',
        matchedName: itemName
      };
    }
  }

  return {
    isFood: false,
    calories: 0,
    category: 'その他',
    shelfLifeDays: null,
    unit: '',
    matchedName: itemName
  };
}
