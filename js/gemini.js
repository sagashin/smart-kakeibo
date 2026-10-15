/**
 * Gemini API レシート画像解析 & デモスキャナーモジュール
 * Google Gemini 3.5 Flash / 3.8 Flash / 3.5 Flash-Lite / 2.5 Flash を活用して、
 * レシート写真から店舗名・品目・金額・割引・食品判定・カテゴリ・賞味期限を抽出
 */

const SYSTEM_PROMPT = `
あなたは日本のレシート読み取りの最高峰のAIアシスタントです。
提供されたレシート画像から、次の情報を正確に抽出し、指定のJSON形式でのみ出力してください。余分なMarkdownのバッククォートや説明文は一切含めず、純粋なJSON文字列のみを返してください。

抽出項目:
1. store: 店舗名 (スーパー名、コンビニ名、ドラッグストア名、飲食店名など)
2. date: レシートの発行日 (YYYY-MM-DD形式。不明な場合は今日の日付)
3. totalAmount: 最終支払合計金額 (税込・割引適用後・数値)
4. totalDiscount: 値引きやクーポン・ポイント値引きの合計額 (数値、なければ0)
5. items: 品目ごとの配列
   - name: 商品名 (レシート記載名を自然な日本語に補正)
   - price: 金額 (税込数値)
   - quantity: 数量 (通常は1)
   - isFood: 食べ物または飲み物の場合は true、日用品等は false
   - category: '主食' | 'お肉・魚' | '野菜・果物' | '乳製品・飲料' | '惣菜・お弁当' | 'お菓子・スイーツ' | '日用品' | 'その他'
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
      "shelfLifeDays": 6
    },
    {
      "name": "サランラップ 22cm",
      "price": 198,
      "quantity": 1,
      "isFood": false,
      "category": "日用品",
      "shelfLifeDays": null
    }
  ]
}
`;

// 利用可能なGeminiモデル（優先順）
export const CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash'
];

/**
 * APIキーのサニタイズ（前後の空白、引用符、不可視文字を除去）
 */
export function sanitizeApiKey(key) {
  return (key || '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '');
}

/**
 * Gemini APIエラーメッセージの日本語整形
 */
export function formatGeminiErrorMessage(status, rawMessage = '') {
  if (status === 400) {
    return 'APIキーが無効、またはリクエスト形式が不正です。APIキーを再確認してください。';
  }
  if (status === 403) {
    return 'アクセス権限がありません(403)。APIキーの利用制限やGoogle AI Studioの設定を確認してください。';
  }
  if (status === 404) {
    return '指定されたAIモデルが見つかりません(404)。';
  }
  if (status === 429) {
    return 'リクエスト上限(レートリミット)に達しました(429)。数十秒おいて再試行してください。';
  }
  if (status >= 500) {
    return `GoogleのAIサーバー側で一時的なエラーが発生しました(${status})。少し待ってから再試行してください。`;
  }
  return rawMessage ? `APIエラー(${status}): ${rawMessage}` : `通信エラーが発生しました(${status})`;
}

/**
 * Gemini APIキーの疎通テスト
 */
export async function testGeminiApiKey(rawApiKey) {
  const apiKey = sanitizeApiKey(rawApiKey);
  if (!apiKey) {
    return { ok: false, message: 'APIキーが入力されていません。' };
  }

  let lastError = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'ping' }] }],
          generationConfig: { maxOutputTokens: 5 }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const status = response.status;
        const msg = errorData.error?.message || response.statusText;

        if (status === 404) {
          lastError = new Error(`モデル ${modelName} は利用できません (${msg})`);
          continue;
        }
        return {
          ok: false,
          message: formatGeminiErrorMessage(status, msg)
        };
      }

      return {
        ok: true,
        model: modelName,
        message: `接続成功！モデル「${modelName}」で正常にAI通信が確認できました✨`
      };
    } catch (err) {
      lastError = err;
    }
  }

  return {
    ok: false,
    message: lastError ? (lastError.message || '通信に失敗しました') : 'Gemini APIへの接続に失敗しました。インターネット接続をご確認ください。'
  };
}

/**
 * レシート画像をGemini APIで解析
 */
export async function parseReceiptWithGemini(base64Image, mimeType = 'image/jpeg', rawApiKey = '') {
  const apiKey = sanitizeApiKey(rawApiKey);
  if (!apiKey) {
    throw new Error('Gemini APIキーが設定されていません。設定画面でAPIキーを入力するか、デモモードをご利用ください。');
  }

  // Base64プレフィックスの除去
  const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

  let lastError = null;

  for (const modelName of CANDIDATE_MODELS) {
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
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const status = response.status;
        const rawMsg = errorData.error?.message || response.statusText;
        const formatted = formatGeminiErrorMessage(status, rawMsg);

        // 404の場合は次のモデルを試行
        if (status === 404) {
          console.warn(`Model ${modelName} returned 404, trying next...`);
          lastError = new Error(formatted);
          continue;
        }

        throw new Error(formatted);
      }

      const resData = await response.json();
      const text = resData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Gemini APIから応答が得られませんでした。');
      }

      return cleanAndParseJson(text);
    } catch (err) {
      console.warn(`Model ${modelName} failed, trying next...`, err);
      lastError = err;
      // 400(キー無効)などの致命的エラーの場合は次を試さず中断
      if (err.message && (err.message.includes('APIキーが無効') || err.message.includes('400') || err.message.includes('403'))) {
        throw err;
      }
    }
  }

  throw lastError || new Error('レシートの解析に失敗しました。');
}

/**
 * AIの返却したJSONをクレンジングしてパース
 */
function cleanAndParseJson(rawText) {
  let cleaned = rawText.trim();
  // Markdownコードブロック記法の除去
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  cleaned = cleaned.trim();

  // 前後にテキストが混入している場合、最初の '{' と最後の '}' を抽出
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    const data = JSON.parse(cleaned);
    return validateAndFormatReceiptData(data);
  } catch (err) {
    console.error('JSON Parse Error:', err, rawText);
    throw new Error('レシートデータの解析フォーマットが正しくありませんでした。もう一度撮影してください。');
  }
}

/**
 * データのバリデーションとフォーマット補正
 */
function validateAndFormatReceiptData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('解析結果が無効です。');
  }

  const items = (data.items || []).map(item => {
    let isFood = item.isFood;
    let category = item.category || 'その他';
    let shelfLife = item.shelfLifeDays;

    if (isFood === undefined) {
      isFood = category !== '日用品' && category !== 'その他';
    }

    return {
      name: item.name || '商品',
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      isFood: !!isFood,
      category,
      shelfLifeDays: shelfLife || 3
    };
  });

  const totalAmount = Number(data.totalAmount) || items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  return {
    store: data.store || '店舗不明',
    date: data.date || new Date().toISOString().split('T')[0],
    totalAmount,
    totalDiscount: Number(data.totalDiscount) || 0,
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
      { name: '国産 豚ロース生姜焼き用 300g', price: 468, quantity: 1, isFood: true, category: 'お肉・魚', shelfLifeDays: 3 },
      { name: '高原レタス 1玉', price: 128, quantity: 1, isFood: true, category: '野菜・果物', shelfLifeDays: 4 },
      { name: '成分無調整牛乳 1000ml', price: 218, quantity: 1, isFood: true, category: '乳製品・飲料', shelfLifeDays: 6 },
      { name: '超熟 6枚切', price: 168, quantity: 1, isFood: true, category: '主食', shelfLifeDays: 4 },
      { name: 'お徳用たまご 10個入', price: 248, quantity: 1, isFood: true, category: 'お肉・魚', shelfLifeDays: 14 },
      { name: 'キッチン泡ハイター 詰替', price: 198, quantity: 1, isFood: false, category: '日用品', shelfLifeDays: null }
    ]
  },
  {
    name: 'コンビニ（ランチ・デザート）',
    store: 'ローソン 渋谷駅前店',
    date: new Date().toISOString().split('T')[0],
    totalDiscount: 50,
    items: [
      { name: 'からあげクン レギュラー', price: 248, quantity: 1, isFood: true, category: '惣菜・お弁当', shelfLifeDays: 1 },
      { name: '金しゃりおにぎり 焼さけハラス', price: 246, quantity: 1, isFood: true, category: '主食', shelfLifeDays: 1 },
      { name: 'プレミアムロールケーキ', price: 214, quantity: 1, isFood: true, category: 'お菓子・スイーツ', shelfLifeDays: 2 },
      { name: '緑茶 600ml', price: 138, quantity: 1, isFood: true, category: '乳製品・飲料', shelfLifeDays: 90 }
    ]
  },
  {
    name: 'ドラッグストア（日用品＆健康食品）',
    store: 'ウエルシア薬局',
    date: new Date().toISOString().split('T')[0],
    totalDiscount: 180,
    items: [
      { name: 'inバー プロテイン ベイクドチョコ', price: 170, quantity: 2, isFood: true, category: 'お菓子・スイーツ', shelfLifeDays: 120 },
      { name: 'トマトジュース食塩無添加 900g', price: 238, quantity: 1, isFood: true, category: '乳製品・飲料', shelfLifeDays: 60 },
      { name: 'バブ 薬用入浴剤 12錠', price: 428, quantity: 1, isFood: false, category: '日用品', shelfLifeDays: null }
    ]
  }
];

/**
 * デモスキャンシミュレーション
 */
export async function simulateReceiptScan(demoIndex = 0) {
  // スキャン演出のため少し待機 (1.0秒)
  await new Promise(resolve => setTimeout(resolve, 1000));
  const preset = DEMO_RECEIPTS[demoIndex % DEMO_RECEIPTS.length];
  const items = preset.items.map(i => ({ ...i }));
  const totalAmount = items.reduce((sum, i) => sum + (i.price * i.quantity), 0) - preset.totalDiscount;

  return {
    store: preset.store,
    date: preset.date,
    totalAmount,
    totalDiscount: preset.totalDiscount,
    items
  };
}
