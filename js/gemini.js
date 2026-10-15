/**
 * Gemini API レシート画像解析 & デモスキャナーモジュール
 * Google Gemini 1.5 Flash / 2.0 Flash を活用して、
 * レシート写真から店舗名・品目・金額・割引・食品判定・推定カロリー・賞味期限を抽出
 */
import { estimateFoodCalories } from './calorie-db.js';

const SYSTEM_PROMPT = `
あなたは日本のレシート読み取りと栄養カロリー計算の最高峰のAIアシスタントです。
提供されたレシート画像から、次の情報を正確に抽出し、指定のJSON形式でのみ出力してください。余分なMarkdownのバッククォートや説明文は一切含めず、純粋なJSON文字列のみを返してください。

抽出項目:
1. store: 店舗名 (スーパー名、コンビニ名、飲食店名など)
2. date: レシートの発行日 (YYYY-MM-DD形式。不明な場合は今日の日付)
3. totalAmount: 最終支払合計金額 (税込・割引適用後・数値)
4. totalDiscount: 値引きやクーポン・ポイント値引きの合計額 (数値、なければ0)
5. items: 品目ごとの配列
   - name: 商品名 (レシート記載名を自然な日本語に補正)
   - price: 金額 (税込数値)
   - quantity: 数量 (通常は1)
   - isFood: 食べ物または飲み物の場合は true、日用品等は false
   - category: '主食' | 'お肉・魚' | '野菜・果物' | '乳製品・飲料' | '惣菜・お弁当' | 'お菓子・スイーツ' | '日用品' | 'その他'
   - calories: 食品の場合の推定カロリー (kcal・1個または1食または記載分量あたり・数値)。食品でない場合は0
   - shelfLifeDays: 食品の場合の一般的な冷蔵・冷暗所での消費目安日数 (例: 刺身なら1, 牛乳なら6, 野菜なら5, 食パンなら4)

JSONフォーマット例:
{
  "store": "スーパーライフ",
  "date": "2026-10-15",
  "totalAmount": 1540,
  "totalDiscount": 100,
  "items": [
    {
      "name": "牛乳 1000ml",
      "price": 240,
      "quantity": 1,
      "isFood": true,
      "category": "乳製品・飲料",
      "calories": 670,
      "shelfLifeDays": 6
    },
    {
      "name": "サランラップ 22cm",
      "price": 198,
      "quantity": 1,
      "isFood": false,
      "category": "日用品",
      "calories": 0,
      "shelfLifeDays": null
    }
  ]
}
`;

export async function parseReceiptWithGemini(base64Image, mimeType = 'image/jpeg', apiKey = '') {
  if (!apiKey) {
    throw new Error('Gemini APIキーが設定されていません。設定画面でAPIキーを入力するか、デモモードをご利用ください。');
  }

  // Base64プレフィックスの除去
  const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

  const candidateModels = [
    'gemini-3.8-flash',
    'gemini-2.5-flash',
    'gemini-1.5-flash'
  ];

  let lastError = null;

  for (const modelName of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      const requestBody = {
        contents: [
          {
            parts: [
              { text: SYSTEM_PROMPT },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: cleanBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData.error?.message || response.statusText;
        if (response.status === 404 || errMsg.includes('no longer available') || errMsg.includes('not found')) {
          lastError = new Error(`Gemini APIエラー (${modelName}): ${errMsg}`);
          continue;
        }
        throw new Error(`Gemini APIエラー: ${errMsg}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('AIから応答を受信できませんでした。画像が鮮明か確認してください。');
      }

      const parsed = JSON.parse(text);
      return normalizeParsedData(parsed);
    } catch (err) {
      lastError = err;
      if (err.message && (err.message.includes('no longer available') || err.message.includes('not found'))) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('利用可能なGeminiモデルが見つかりませんでした。');
}

/**
 * データの正規化と補正
 */
function normalizeParsedData(data) {
  const items = (data.items || []).map(item => {
    let cal = Number(item.calories) || 0;
    let isFood = item.isFood;
    let shelfLife = item.shelfLifeDays;
    let category = item.category || '食費';

    if (isFood && cal === 0) {
      const est = estimateFoodCalories(item.name);
      cal = est.calories;
      shelfLife = shelfLife || est.shelfLifeDays;
    }

    return {
      name: item.name || '商品',
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      isFood: !!isFood,
      category,
      calories: cal,
      shelfLifeDays: shelfLife || 3
    };
  });

  const totalAmount = Number(data.totalAmount) || items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const totalCalories = items.reduce((sum, i) => sum + (i.calories * i.quantity), 0);

  return {
    store: data.store || '店舗不明',
    date: data.date || new Date().toISOString().split('T')[0],
    totalAmount,
    totalDiscount: Number(data.totalDiscount) || 0,
    totalCalories,
    items
  };
}

/**
 * デモスキャナー用サンプルレシートリスト
 * APIキーがなくてもリアルな認識結果を体験できるプリセット
 */
export const DEMO_RECEIPTS = [
  {
    name: 'スーパー（自炊・食材まとめ買い）',
    store: 'オーケーストア 銀座店',
    date: new Date().toISOString().split('T')[0],
    totalDiscount: 310,
    items: [
      { name: '国産 豚ロース生姜焼き用 300g', price: 468, quantity: 1, isFood: true, category: 'お肉・魚', calories: 690, shelfLifeDays: 3 },
      { name: '高原レタス 1玉', price: 128, quantity: 1, isFood: true, category: '野菜・果物', calories: 30, shelfLifeDays: 4 },
      { name: '成分無調整牛乳 1000ml', price: 218, quantity: 1, isFood: true, category: '乳製品・飲料', calories: 670, shelfLifeDays: 6 },
      { name: '超熟 6枚切', price: 168, quantity: 1, isFood: true, category: '主食', calories: 960, shelfLifeDays: 4 },
      { name: 'お徳用たまご 10個入', price: 248, quantity: 1, isFood: true, category: 'お肉・魚', calories: 750, shelfLifeDays: 14 },
      { name: 'キッチン泡ハイター 詰替', price: 198, quantity: 1, isFood: false, category: '日用品', calories: 0, shelfLifeDays: null }
    ]
  },
  {
    name: 'コンビニ（ランチ・デザート）',
    store: 'ローソン 渋谷駅前店',
    date: new Date().toISOString().split('T')[0],
    totalDiscount: 50,
    items: [
      { name: 'からあげクン レギュラー', price: 248, quantity: 1, isFood: true, category: '惣菜・お弁当', calories: 220, shelfLifeDays: 1 },
      { name: '金しゃりおにぎり 焼さけハラス', price: 246, quantity: 1, isFood: true, category: '主食', calories: 215, shelfLifeDays: 1 },
      { name: 'プレミアムロールケーキ', price: 214, quantity: 1, isFood: true, category: 'お菓子・スイーツ', calories: 285, shelfLifeDays: 2 },
      { name: '緑茶 600ml', price: 138, quantity: 1, isFood: true, category: '乳製品・飲料', calories: 0, shelfLifeDays: 90 }
    ]
  },
  {
    name: 'ドラッグストア（日用品＆健康食品）',
    store: 'ウエルシア薬局',
    date: new Date().toISOString().split('T')[0],
    totalDiscount: 180,
    items: [
      { name: 'inバー プロテイン ベイクドチョコ', price: 170, quantity: 2, isFood: true, category: 'お菓子・スイーツ', calories: 418, shelfLifeDays: 120 },
      { name: 'トマトジュース食塩無添加 900g', price: 238, quantity: 1, isFood: true, category: '乳製品・飲料', calories: 180, shelfLifeDays: 60 },
      { name: 'バブ 薬用入浴剤 12錠', price: 428, quantity: 1, isFood: false, category: '日用品', calories: 0, shelfLifeDays: null }
    ]
  }
];

/**
 * デモスキャンシミュレーション
 */
export async function simulateReceiptScan(demoIndex = 0) {
  // スキャン演出のため少し待機 (1.2秒)
  await new Promise(resolve => setTimeout(resolve, 1200));
  const preset = DEMO_RECEIPTS[demoIndex % DEMO_RECEIPTS.length];
  const items = preset.items.map(i => ({ ...i }));
  const totalAmount = items.reduce((sum, i) => sum + (i.price * i.quantity), 0) - preset.totalDiscount;
  const totalCalories = items.reduce((sum, i) => sum + (i.calories * i.quantity), 0);

  return {
    store: preset.store,
    date: preset.date,
    totalAmount,
    totalDiscount: preset.totalDiscount,
    totalCalories,
    items
  };
}
