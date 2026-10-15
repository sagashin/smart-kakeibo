/**
 * Gemini API 高精度レシート画像解析 & デモスキャナーモジュール
 * Google Gemini 3.5 Flash / 3.8 Flash / 3.5 Flash-Lite を活用して、
 * 日本のレシート特有の記号除去・値引き反映・品目・金額・賞味期限を精密抽出
 */

const SYSTEM_PROMPT = `
あなたは日本のレシート読み取り・OCR解析に特化した最高精度のAIアシスタントです。
提供されたレシート画像から、店舗名・購入日・各品目（商品名・価格・数量・食品判定・カテゴリ・消費目安日数）・値引き額・最終支払合計金額を極めて正確に抽出してください。

【厳格な読み取りルール】
1. 商品名のクレンジング（記号・税区分の完全除去）:
   - 軽減税率や税区分を表す記号（「*」「※」「軽」「外」「内」「#」「八」「8%」「10%」「T」など）は、商品名から完全に除去してください。
   - レシート特有の略称や半角カナは、自然で読みやすい日本語に補正してください。
     例:「CGCｷﾞｭｳﾆｭｳ」→「CGC 牛乳」、「ｺｸｻﾝﾄﾘﾓﾓ」→「国産鶏もも肉」、「ﾊﾟｽｺ ﾁｮｳｼﾞｭｸ」→「パスコ 超熟」
2. 値引き・割引行の吸収:
   - 商品の直下にある「値引」「▲50」「30%引」「半額」などの行は、独立した品目として計上しないでください。
   - 対象商品の金額（price）から値引き分を差し引いた実支払額にするか、レシート全体の「値引き合計（totalDiscount）」に合算してください。
3. 数量・単価・金額の対応:
   - 「@158 × 2」のように単価と個数が並んでいる場合、quantityを2、priceをその品目の支払合計額（単価×数量）として正しく対応づけてください。単価を誤って商品名や総額に混同しないでください。
4. 【最重要】消費税（8%・10%）と外税方式レシートの税込化ルール:
   - 日本のスーパーやドラッグストアの多くは、各品目には「税抜（本体価格）」のみが印字され、末尾に「小計」「消費税等（8%）」「合計（税込）」が記載されています。
   - 家計簿アプリとして正確に記録するため、【各品目の金額（price）は必ず「税込実支払金額」に換算】してください！
     - 飲食料品（isFood: true）の場合: 税抜価格 × 1.08（端数は四捨五入）
     - 日用品等の場合: 税抜価格 × 1.10（端数は四捨五入）
     - すでにレシートが税込表示（内税方式やコンビニなど）の場合は、印字されている税込価格をそのまま使用してください。
   - 【合計金額（totalAmount）の厳格な一致】:
     - totalAmount はレシート最下部の「お買上合計」「領収金額」「お支払い合計」の【実際の最終支払税込金額】と完全に一致させてください。
     - 各品目の price × quantity の合計（- totalDiscount）が、この totalAmount とピッタリ一致するように、端数（1〜2円程度）があれば品目の金額で調整してください。
     - 「小計」「税抜対象額」「お預り額」「釣銭」を合計金額と誤認しないでください。
5. 除外すべき非商品行:
   - 「ポイント利用」「ポイント付与」「チャージ額」「クレジット売上」「お預り」「釣銭」「登録番号」「店舗電話番号」などは購入品目に含めないでください（※レジ袋は日用品として含めて構いません）。
6. 食品判定とカテゴリ・消費目安日数（shelfLifeDays）:
   - isFood: 飲食料品なら true、日用品等は false
   - category: '主食' | 'お肉・魚' | '野菜・果物' | '乳製品・飲料' | '惣菜・お弁当' | 'お菓子・スイーツ' | '日用品' | 'その他'
   - shelfLifeDays: 食品の場合の一般的な冷蔵・冷暗所での消費目安日数（刺身: 1, 挽肉: 2, 豚/牛: 3, 葉物野菜: 4, 根菜: 14, 牛乳: 6, 卵: 14, 食パン: 4, 豆腐: 4, 納豆: 10, スナック/乾物: 90）。日用品は null。

純粋なJSON文字列のみを出力してください（説明文や余分なテキストは不要）。
`;

// 利用可能なGeminiモデル（認識精度と速度順）
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
 * レシート画像をGemini APIで高精度解析
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

      // 高精度 Structured Output スキーマ
      const responseSchema = {
        type: 'OBJECT',
        properties: {
          store: { type: 'STRING', description: '店舗名' },
          date: { type: 'STRING', description: '購入日 YYYY-MM-DD' },
          totalAmount: { type: 'INTEGER', description: '最終支払合計金額（税込・割引後）' },
          totalDiscount: { type: 'INTEGER', description: '値引き・割引の合計額（なければ0）' },
          items: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                name: { type: 'STRING', description: '商品名（記号除去・自然な日本語）' },
                price: { type: 'INTEGER', description: '支払金額（税込数値）' },
                quantity: { type: 'INTEGER', description: '数量' },
                isFood: { type: 'BOOLEAN', description: '食品・飲料ならtrue、日用品等はfalse' },
                category: { type: 'STRING', description: '主食/お肉・魚/野菜・果物/乳製品・飲料/惣菜・お弁当/お菓子・スイーツ/日用品/その他' },
                shelfLifeDays: { type: 'INTEGER', description: '食品の消費目安日数' }
              },
              required: ['name', 'price', 'quantity', 'isFood', 'category']
            }
          }
        },
        required: ['store', 'date', 'totalAmount', 'items']
      };

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
          temperature: 0.0, // 決定論的・ブレを完全排除して精度最大化
          responseMimeType: 'application/json',
          responseSchema
        }
      };

      let response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(requestBody)
      });

      // スキーマ指定に未対応の古いモデル等のフォールバック
      if (!response.ok && response.status === 400) {
        console.warn('responseSchema request failed with 400, falling back to standard JSON generationConfig');
        delete requestBody.generationConfig.responseSchema;
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify(requestBody)
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const status = response.status;
        const rawMsg = errorData.error?.message || response.statusText;
        const formatted = formatGeminiErrorMessage(status, rawMsg);

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
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  cleaned = cleaned.trim();

  // 前後に余計な説明文がある場合、最初の '{' と最後の '}' を抽出
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

  let items = (data.items || []).map(item => {
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

  const rawTotalAmount = Number(data.totalAmount) || 0;
  const totalDiscount = Number(data.totalDiscount) || 0;
  const itemsSum = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  // 外税レシート自動検知＆税込自動換算:
  // レシートの最終支払額 (rawTotalAmount + totalDiscount) と、品目合計 (itemsSum) の比率をチェック
  const effectiveTotalBeforeDiscount = rawTotalAmount > 0 ? (rawTotalAmount + totalDiscount) : 0;
  if (itemsSum > 0 && effectiveTotalBeforeDiscount > 0) {
    const taxRatio = effectiveTotalBeforeDiscount / itemsSum;
    // 比率が 1.055 〜 1.13 の範囲にある場合、各品目が税抜で印字されていたと判定
    if (taxRatio >= 1.055 && taxRatio <= 1.13) {
      console.log(`[Receipt] 外税レシートを検知（税率比率: ${taxRatio.toFixed(3)}）。品目を税込金額に自動換算します。`);
      let runningSum = 0;
      items = items.map(item => {
        // 食品なら8%、日用品なら10%（比率が全体で8%寄りの場合は8%優先）
        const rate = (taxRatio < 1.09) ? 1.08 : (item.isFood ? 1.08 : 1.10);
        const taxIncluded = Math.round(item.price * rate);
        runningSum += taxIncluded * item.quantity;
        return {
          ...item,
          price: taxIncluded
        };
      });

      // 最終支払額と端数（1〜2円）のズレがある場合、最後の品目で微調整してピッタリ合致させる
      const diff = effectiveTotalBeforeDiscount - runningSum;
      if (Math.abs(diff) <= items.length * 2 && items.length > 0) {
        items[items.length - 1].price += diff;
      }
    }
  }

  const finalTotalAmount = rawTotalAmount > 0 
    ? rawTotalAmount 
    : Math.max(0, items.reduce((sum, i) => sum + (i.price * i.quantity), 0) - totalDiscount);

  return {
    store: data.store || '店舗不明',
    date: data.date || new Date().toISOString().split('T')[0],
    totalAmount: finalTotalAmount,
    totalDiscount,
    items
  };
}

/**
 * デモスキャナー用サンプルレシートリスト
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
