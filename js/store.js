/**
 * 家計簿 & 冷蔵庫ストックのデータストア
 * LocalStorageと連携し、永続化・集計・初期デモデータを提供
 */

const STORAGE_KEYS = {
  TRANSACTIONS: 'smart_kakeibo_transactions_v2',
  FRIDGE_STOCK: 'smart_kakeibo_fridge_v2',
  SETTINGS: 'smart_kakeibo_settings_v2'
};

const DEFAULT_SETTINGS = {
  geminiApiKey: '',
  monthlyBudget: 75000,
  useDemoScanner: true,
  saveReceiptPhotos: false // デフォルトOFF: 解析後は写真破棄し家計簿データのみ保存（容量完全ゼロ）
};

export class ReceiptImageDB {
  static DB_NAME = 'SmartKakeiboDB';
  static STORE_NAME = 'receipt_images';
  static DB_VERSION = 1;

  static openDB() {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        resolve(null);
        return;
      }
      try {
        const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(this.STORE_NAME)) {
            db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = () => resolve(null);
      } catch (e) {
        console.warn('IndexedDB open error:', e);
        resolve(null);
      }
    });
  }

  static async saveImage(id, dataUrl) {
    if (!id || !dataUrl) return false;
    try {
      const db = await this.openDB();
      if (!db) return false;
      return new Promise((resolve) => {
        const tx = db.transaction([this.STORE_NAME], 'readwrite');
        const store = tx.objectStore(this.STORE_NAME);
        store.put({ id, dataUrl, createdAt: Date.now() });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch (e) {
      console.warn('IndexedDB saveImage error:', e);
      return false;
    }
  }

  static async getImage(id) {
    if (!id) return null;
    try {
      const db = await this.openDB();
      if (!db) return null;
      return new Promise((resolve) => {
        const tx = db.transaction([this.STORE_NAME], 'readonly');
        const store = tx.objectStore(this.STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result ? req.result.dataUrl : null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      console.warn('IndexedDB getImage error:', e);
      return null;
    }
  }

  static async deleteImage(id) {
    if (!id) return;
    try {
      const db = await this.openDB();
      if (!db) return;
      const tx = db.transaction([this.STORE_NAME], 'readwrite');
      tx.objectStore(this.STORE_NAME).delete(id);
    } catch (e) {
      console.warn('IndexedDB deleteImage error:', e);
    }
  }

  static async clearAll() {
    try {
      const db = await this.openDB();
      if (!db) return;
      const tx = db.transaction([this.STORE_NAME], 'readwrite');
      tx.objectStore(this.STORE_NAME).clear();
    } catch (e) {
      console.warn('IndexedDB clearAll error:', e);
    }
  }
}

export class KakeiboStore {
  constructor() {
    this.transactions = [];
    this.fridgeItems = [];
    this.settings = { ...DEFAULT_SETTINGS };
    this.listeners = new Set();

    this.init();
  }

  init() {
    // 設定読み込み
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS) || localStorage.getItem('smart_kakeibo_settings_v1');
      if (savedSettings) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      }
    } catch (err) {
      console.warn('Settings load error:', err);
    }

    // 取引データ読み込み
    try {
      const savedTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || localStorage.getItem('smart_kakeibo_transactions_v1');
      if (savedTx) {
        this.transactions = JSON.parse(savedTx);
      } else {
        this.transactions = this.generateInitialDemoData();
        this.saveTransactions();
      }
    } catch (err) {
      console.warn('Transactions load error:', err);
      this.transactions = this.generateInitialDemoData();
    }

    // 冷蔵庫ストック読み込み
    try {
      const savedFridge = localStorage.getItem(STORAGE_KEYS.FRIDGE_STOCK) || localStorage.getItem('smart_kakeibo_fridge_v1');
      if (savedFridge) {
        this.fridgeItems = JSON.parse(savedFridge);
      } else {
        this.fridgeItems = this.generateInitialFridgeData();
        this.saveFridge();
      }
    } catch (err) {
      console.warn('Fridge load error:', err);
      this.fridgeItems = this.generateInitialFridgeData();
    }
  }

  saveTransactions() {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(this.transactions));
      this.notify();
    } catch (err) {
      console.error('Failed to save transactions:', err);
    }
  }

  saveFridge() {
    try {
      localStorage.setItem(STORAGE_KEYS.FRIDGE_STOCK, JSON.stringify(this.fridgeItems));
      this.notify();
    } catch (err) {
      console.error('Failed to save fridge items:', err);
    }
  }

  saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this);
      } catch (e) {
        console.error(e);
      }
    }
  }

  /**
   * 取引レコードの追加
   */
  addTransaction(record, addToFridge = true) {
    const id = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const totalDiscount = record.totalDiscount || 0;

    const items = (record.items || []).map(item => {
      let isFood = item.isFood;
      let category = item.category || 'その他';
      let shelfLife = item.shelfLifeDays;

      if (isFood === undefined) {
        isFood = category !== '日用品' && category !== 'その他';
      }

      const qty = Number(item.quantity) || 1;

      return {
        id: 'item_' + Math.random().toString(36).substr(2, 7),
        name: item.name,
        price: Number(item.price) || 0,
        quantity: qty,
        category,
        isFood,
        shelfLifeDays: shelfLife || 3
      };
    });

    const newTx = {
      id,
      date: record.date || new Date().toISOString().split('T')[0],
      store: record.store || '店舗未記入',
      totalAmount: record.totalAmount,
      totalDiscount,
      category: record.category || (items[0] ? items[0].category : 'その他'),
      items,
      memo: record.memo || '',
      hasImage: !!record.hasImage,
      imageId: record.imageId || null,
      createdAt: new Date().toISOString()
    };

    this.transactions.unshift(newTx);
    this.saveTransactions();

    // 食品であれば冷蔵庫ストックに自動追加
    if (addToFridge) {
      items.filter(i => i.isFood).forEach(food => {
        this.addFridgeItem({
          name: food.name,
          category: food.category,
          addedDate: newTx.date,
          expiryDate: this.calculateExpiry(newTx.date, food.shelfLifeDays),
          transactionId: id
        });
      });
    }

    return newTx;
  }

  /**
   * 取引レコードの削除
   */
  deleteTransaction(id) {
    const target = this.transactions.find(t => t.id === id);
    if (target && target.imageId) {
      ReceiptImageDB.deleteImage(target.imageId);
    }
    this.transactions = this.transactions.filter(t => t.id !== id);
    this.saveTransactions();
  }

  /**
   * 取引明細から特定品目を削除
   */
  deleteTransactionItem(txId, itemId) {
    const tx = this.transactions.find(t => t.id === txId);
    if (!tx || !tx.items) return null;

    tx.items = tx.items.filter(i => i.id !== itemId);
    const itemsSum = tx.items.reduce((sum, i) => sum + (i.price * (i.quantity || 1)), 0);
    tx.totalAmount = Math.max(0, itemsSum - (tx.totalDiscount || 0));

    if (tx.items.length === 0) {
      this.deleteTransaction(txId);
      return null;
    }

    this.saveTransactions();
    return tx;
  }

  /**
   * 取引レコードの更新
   */
  updateTransaction(id, updatedData) {
    const tx = this.transactions.find(t => t.id === id);
    if (!tx) return null;

    if (updatedData.date) tx.date = updatedData.date;
    if (updatedData.store) tx.store = updatedData.store;
    if (updatedData.memo !== undefined) tx.memo = updatedData.memo;
    if (updatedData.totalDiscount !== undefined) tx.totalDiscount = Number(updatedData.totalDiscount) || 0;

    if (updatedData.items) {
      tx.items = updatedData.items.map(i => {
        let isFood = i.isFood;
        if (isFood === undefined) {
          isFood = i.category !== '日用品' && i.category !== 'その他';
        }
        return {
          id: i.id || ('item_' + Math.random().toString(36).substr(2, 7)),
          name: i.name || '品目',
          price: Number(i.price) || 0,
          quantity: Number(i.quantity) || 1,
          category: i.category || 'その他',
          isFood,
          shelfLifeDays: i.shelfLifeDays || 3
        };
      });
    }

    // 合計金額を再計算
    const itemsSum = (tx.items || []).reduce((sum, i) => sum + (i.price * (i.quantity || 1)), 0);
    tx.totalAmount = Math.max(0, itemsSum - (tx.totalDiscount || 0));
    if (tx.items && tx.items[0]) {
      tx.category = tx.items[0].category;
    }

    this.saveTransactions();
    return tx;
  }

  calculateExpiry(baseDateStr, days) {
    const d = new Date(baseDateStr);
    d.setDate(d.getDate() + (days || 3));
    return d.toISOString().split('T')[0];
  }

  // --- 冷蔵庫ストック操作 ---
  addFridgeItem(item) {
    const newItem = {
      id: 'fridge_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: item.name,
      category: item.category || 'その他',
      addedDate: item.addedDate || new Date().toISOString().split('T')[0],
      expiryDate: item.expiryDate,
      isConsumed: false,
      transactionId: item.transactionId || null
    };
    this.fridgeItems.unshift(newItem);
    this.saveFridge();
    return newItem;
  }

  toggleFridgeConsumed(id) {
    const target = this.fridgeItems.find(f => f.id === id);
    if (target) {
      target.isConsumed = !target.isConsumed;
      this.saveFridge();
    }
  }

  deleteFridgeItem(id) {
    this.fridgeItems = this.fridgeItems.filter(f => f.id !== id);
    this.saveFridge();
  }

  // --- 統計・分析集計ロジック (日別・月別・累計) ---
  getStats(period = 'monthly', targetDate = new Date()) {
    const now = new Date(targetDate);
    const targetYear = now.getFullYear();
    const targetMonth = now.getMonth() + 1; // 1-12
    const targetDateStr = now.toISOString().split('T')[0];

    let filtered = [];

    if (period === 'daily') {
      filtered = this.transactions.filter(t => t.date === targetDateStr);
    } else if (period === 'monthly') {
      filtered = this.transactions.filter(t => {
        const [y, m] = t.date.split('-').map(Number);
        return y === targetYear && m === targetMonth;
      });
    } else {
      // 累計 (all)
      filtered = [...this.transactions];
    }

    const totalExpense = filtered.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalDiscount = filtered.reduce((sum, t) => sum + (t.totalDiscount || 0), 0);
    const transactionCount = filtered.length;
    const avgSpendPerShop = transactionCount > 0 ? Math.round(totalExpense / transactionCount) : 0;

    // カテゴリ別集計
    const categoryTotals = {};
    // 店舗別集計
    const storeTotals = {};

    filtered.forEach(t => {
      const storeName = t.store || '店舗未記入';
      if (!storeTotals[storeName]) {
        storeTotals[storeName] = { amount: 0, count: 0 };
      }
      storeTotals[storeName].amount += t.totalAmount;
      storeTotals[storeName].count += 1;

      (t.items || []).forEach(item => {
        const cat = item.category || 'その他';
        const cost = (item.price || 0) * (item.quantity || 1);
        categoryTotals[cat] = (categoryTotals[cat] || 0) + cost;
      });
    });

    // 主な支出カテゴリ TOP3 の算出
    const catEntries = Object.entries(categoryTotals).filter(([, val]) => val > 0);
    catEntries.sort((a, b) => b[1] - a[1]);
    const topCategories = catEntries.slice(0, 3).map(([name, amount]) => ({
      name,
      amount,
      pct: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0
    }));

    // 日別推移データの作成 (グラフ用)
    let timelineLabels = [];
    let timelineExpenses = [];

    if (period === 'monthly') {
      // その月の1日〜末日
      const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        timelineLabels.push(`${day}日`);
        const dayTxs = filtered.filter(t => t.date === dStr);
        timelineExpenses.push(dayTxs.reduce((sum, t) => sum + t.totalAmount, 0));
      }
    } else if (period === 'daily') {
      // 直近7日間の日別推移
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const dayLabel = `${d.getMonth() + 1}/${d.getDate()}`;
        timelineLabels.push(dayLabel);

        const dayTxs = this.transactions.filter(t => t.date === dStr);
        timelineExpenses.push(dayTxs.reduce((sum, t) => sum + t.totalAmount, 0));
      }
    } else {
      // 累計: 直近6ヶ月の月別推移
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        timelineLabels.push(`${m}月`);

        const monthTxs = this.transactions.filter(t => {
          const [ty, tm] = t.date.split('-').map(Number);
          return ty === y && tm === m;
        });
        timelineExpenses.push(monthTxs.reduce((sum, t) => sum + t.totalAmount, 0));
      }
    }

    return {
      period,
      year: targetYear,
      month: targetMonth,
      dateStr: targetDateStr,
      totalExpense,
      totalDiscount,
      transactionCount,
      avgSpendPerShop,
      categoryTotals,
      topCategories,
      storeTotals,
      timeline: {
        labels: timelineLabels,
        expenses: timelineExpenses
      }
    };
  }

  // 初期デモデータの生成（今日を基準に直近の日付で生成）
  generateInitialDemoData() {
    const today = new Date();
    const formatDate = (offsetDays) => {
      const d = new Date(today);
      d.setDate(d.getDate() - offsetDays);
      return d.toISOString().split('T')[0];
    };

    return [
      {
        id: 'tx_demo_1',
        date: formatDate(0),
        store: 'ライフ スーパーマーケット',
        totalAmount: 3420,
        totalDiscount: 150,
        category: '食費',
        memo: '夕食用の食材買い出し。豚肉がお買い得でした。',
        items: [
          { id: 'it_1', name: '国産 豚ロース生姜焼き用', price: 498, quantity: 1, isFood: true, category: 'お肉・魚', shelfLifeDays: 3 },
          { id: 'it_2', name: '長ネギ 2本入', price: 158, quantity: 1, isFood: true, category: '野菜・果物', shelfLifeDays: 5 },
          { id: 'it_3', name: 'もやし 1袋', price: 38, quantity: 2, isFood: true, category: '野菜・果物', shelfLifeDays: 2 },
          { id: 'it_4', name: '北海道牛乳 1000ml', price: 238, quantity: 1, isFood: true, category: '乳製品・飲料', shelfLifeDays: 6 },
          { id: 'it_5', name: 'こしひかり 5kg', price: 2480, quantity: 1, isFood: true, category: '主食', shelfLifeDays: 90 }
        ]
      },
      {
        id: 'tx_demo_2',
        date: formatDate(1),
        store: 'セブン-イレブン',
        totalAmount: 640,
        totalDiscount: 0,
        category: '惣菜・お弁当',
        memo: '出社時ランチ',
        items: [
          { id: 'it_6', name: '具だくさん豚汁', price: 340, quantity: 1, isFood: true, category: '惣菜・お弁当', shelfLifeDays: 1 },
          { id: 'it_7', name: '手巻おにぎり 昆布', price: 160, quantity: 1, isFood: true, category: '主食', shelfLifeDays: 1 },
          { id: 'it_8', name: 'お茶 600ml', price: 140, quantity: 1, isFood: true, category: '乳製品・飲料', shelfLifeDays: 90 }
        ]
      },
      {
        id: 'tx_demo_3',
        date: formatDate(3),
        store: 'マツモトキヨシ',
        totalAmount: 2180,
        totalDiscount: 200,
        category: '日用品',
        memo: '生活消耗品まとめ買い',
        items: [
          { id: 'it_9', name: 'トイレットペーパー 12ロール', price: 498, quantity: 1, isFood: false, category: '日用品', shelfLifeDays: null },
          { id: 'it_10', name: '洗濯洗剤 詰替特大', price: 798, quantity: 1, isFood: false, category: '日用品', shelfLifeDays: null },
          { id: 'it_11', name: '食器用洗剤', price: 198, quantity: 1, isFood: false, category: '日用品', shelfLifeDays: null },
          { id: 'it_12', name: 'デンタルハミガキ', price: 386, quantity: 1, isFood: false, category: '日用品', shelfLifeDays: null },
          { id: 'it_13', name: '除菌ウェットシート', price: 500, quantity: 1, isFood: false, category: '日用品', shelfLifeDays: null }
        ]
      },
      {
        id: 'tx_demo_4',
        date: formatDate(5),
        store: 'イオン フードスタイル',
        totalAmount: 4890,
        totalDiscount: 350,
        category: 'お肉・魚',
        memo: '週末の作り置き用まとめ買い（見切りシールで節約！）',
        items: [
          { id: 'it_14', name: '生サーモン切り身', price: 680, quantity: 1, isFood: true, category: 'お肉・魚', shelfLifeDays: 2 },
          { id: 'it_15', name: '鶏むね肉 2枚(約600g)', price: 420, quantity: 1, isFood: true, category: 'お肉・魚', shelfLifeDays: 2 },
          { id: 'it_16', name: 'ブロッコリー 1株', price: 198, quantity: 1, isFood: true, category: '野菜・果物', shelfLifeDays: 4 },
          { id: 'it_17', name: '卵 10個入', price: 238, quantity: 1, isFood: true, category: 'お肉・魚', shelfLifeDays: 14 },
          { id: 'it_18', name: '食パン 6枚切', price: 168, quantity: 1, isFood: true, category: '主食', shelfLifeDays: 4 },
          { id: 'it_19', name: '無糖ヨーグルト 400g', price: 188, quantity: 1, isFood: true, category: '乳製品・飲料', shelfLifeDays: 7 },
          { id: 'it_20', name: 'オリーブオイル 400g', price: 798, quantity: 1, isFood: true, category: 'その他', shelfLifeDays: 365 },
          { id: 'it_21', name: '納豆 3パック', price: 98, quantity: 2, isFood: true, category: 'お肉・魚', shelfLifeDays: 10 },
          { id: 'it_22', name: 'ミックスナッツ大袋', price: 980, quantity: 1, isFood: true, category: 'お菓子・スイーツ', shelfLifeDays: 180 },
          { id: 'it_23', name: 'キャベツ 1/2カット', price: 128, quantity: 1, isFood: true, category: '野菜・果物', shelfLifeDays: 5 },
          { id: 'it_24', name: '玉ねぎ 3個ネット', price: 198, quantity: 1, isFood: true, category: '野菜・果物', shelfLifeDays: 14 }
        ]
      }
    ];
  }

  // 初期冷蔵庫デモデータ
  generateInitialFridgeData() {
    const today = new Date();
    const formatOffset = (days) => {
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };
    const formatPast = (days) => {
      const d = new Date(today);
      d.setDate(d.getDate() - days);
      return d.toISOString().split('T')[0];
    };

    return [
      {
        id: 'fridge_demo_1',
        name: 'もやし 1袋',
        category: '野菜・果物',
        addedDate: formatPast(0),
        expiryDate: formatOffset(1), // 明日切れ！
        isConsumed: false
      },
      {
        id: 'fridge_demo_2',
        name: '国産 豚ロース生姜焼き用',
        category: 'お肉・魚',
        addedDate: formatPast(0),
        expiryDate: formatOffset(2),
        isConsumed: false
      },
      {
        id: 'fridge_demo_3',
        name: '長ネギ 2本入',
        category: '野菜・果物',
        addedDate: formatPast(0),
        expiryDate: formatOffset(4),
        isConsumed: false
      },
      {
        id: 'fridge_demo_4',
        name: '北海道牛乳 1000ml',
        category: '乳製品・飲料',
        addedDate: formatPast(0),
        expiryDate: formatOffset(5),
        isConsumed: false
      },
      {
        id: 'fridge_demo_5',
        name: '卵 10個入',
        category: 'お肉・魚',
        addedDate: formatPast(2),
        expiryDate: formatOffset(10),
        isConsumed: false
      }
    ];
  }

  // データを完全消去（0件にする）
  clearAllData() {
    this.transactions = [];
    this.fridgeItems = [];
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.FRIDGE_STOCK);
    localStorage.removeItem('smart_kakeibo_transactions_v1');
    localStorage.removeItem('smart_kakeibo_fridge_v1');
    ReceiptImageDB.clearAll();
    this.saveTransactions();
    this.saveFridge();
    this.notify();
  }

  // デモデータを再読み込み
  loadDemoData() {
    this.transactions = this.generateInitialDemoData();
    this.fridgeItems = this.generateInitialFridgeData();
    this.saveTransactions();
    this.saveFridge();
    this.notify();
  }
}

export const store = new KakeiboStore();
