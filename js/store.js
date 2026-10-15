/**
 * 家計簿 & カロリー & 冷蔵庫ストックのデータストア
 * LocalStorageと連携し、永続化・集計・初期デモデータを提供
 */
import { estimateFoodCalories } from './calorie-db.js';

const STORAGE_KEYS = {
  TRANSACTIONS: 'smart_kakeibo_transactions_v1',
  FRIDGE_STOCK: 'smart_kakeibo_fridge_v1',
  SETTINGS: 'smart_kakeibo_settings_v1'
};

const DEFAULT_SETTINGS = {
  geminiApiKey: '',
  monthlyBudget: 75000,
  dailyCalorieTarget: 2200,
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
      console.warn('Failed to save image to IndexedDB:', e);
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
      console.warn('Failed to get image from IndexedDB:', e);
      return null;
    }
  }

  static async deleteImage(id) {
    if (!id) return false;
    try {
      const db = await this.openDB();
      if (!db) return false;
      return new Promise((resolve) => {
        const tx = db.transaction([this.STORE_NAME], 'readwrite');
        const store = tx.objectStore(this.STORE_NAME);
        store.delete(id);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch (e) {
      console.warn('Failed to delete image from IndexedDB:', e);
      return false;
    }
  }

  static async clearAllImages() {
    try {
      const db = await this.openDB();
      if (!db) return false;
      return new Promise((resolve) => {
        const tx = db.transaction([this.STORE_NAME], 'readwrite');
        const store = tx.objectStore(this.STORE_NAME);
        store.clear();
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch (e) {
      console.warn('Failed to clear IndexedDB images:', e);
      return false;
    }
  }
}

export class AppStore {
  constructor() {
    this.transactions = [];
    this.fridgeItems = [];
    this.settings = { ...DEFAULT_SETTINGS };
    this.listeners = new Set();
    this.load();
  }

  load() {
    try {
      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (storedSettings) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) };
      }

      const storedTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (storedTx) {
        this.transactions = JSON.parse(storedTx);
        let migrated = false;
        this.transactions.forEach(tx => {
          if (tx.receiptImage) {
            ReceiptImageDB.saveImage(tx.id, tx.receiptImage);
            tx.hasImage = true;
            tx.imageId = tx.id;
            delete tx.receiptImage;
            migrated = true;
          }
        });
        if (migrated) {
          this.saveTransactions();
        }
      } else {
        // 初回ロード時はリアルなデモデータをシード
        this.transactions = this.generateInitialDemoData();
        this.saveTransactions();
      }

      const storedFridge = localStorage.getItem(STORAGE_KEYS.FRIDGE_STOCK);
      if (storedFridge) {
        this.fridgeItems = JSON.parse(storedFridge);
      } else {
        this.fridgeItems = this.generateInitialFridgeData();
        this.saveFridge();
      }
    } catch (err) {
      console.error('Failed to load from storage:', err);
      this.transactions = [];
      this.fridgeItems = [];
    }
  }

  clearAllData() {
    this.transactions = [];
    this.fridgeItems = [];
    this.saveTransactions();
    this.saveFridge();
    ReceiptImageDB.clearAllImages();
    this.notify();
  }

  saveTransactions() {
    try {
      const safeTransactions = this.transactions.map(tx => {
        if (tx.receiptImage) {
          const { receiptImage, ...rest } = tx;
          return { ...rest, hasImage: true, imageId: tx.id };
        }
        return tx;
      });
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(safeTransactions));
      this.notify();
    } catch (err) {
      console.error('Failed to save transactions:', err);
      if (err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014) {
        try {
          const pruned = this.transactions.slice(0, 50).map(({ receiptImage, memo, ...rest }) => ({
            ...rest,
            memo: (memo || '').slice(0, 50)
          }));
          localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(pruned));
          this.notify();
        } catch (e) {}
      }
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
    
    // 合計カロリーと金額を再計算
    let totalCalories = 0;
    let totalDiscount = record.totalDiscount || 0;

    const items = (record.items || []).map(item => {
      let isFood = item.isFood;
      let calories = Number(item.calories) || 0;
      let category = item.category || 'その他';
      let shelfLife = item.shelfLifeDays;

      if (isFood === undefined) {
        const est = estimateFoodCalories(item.name);
        isFood = est.isFood;
        calories = calories || est.calories;
        category = est.category || category;
        shelfLife = shelfLife || est.shelfLifeDays;
      }

      const qty = Number(item.quantity) || 1;
      const itemTotalCal = calories * qty;
      totalCalories += itemTotalCal;

      return {
        id: 'item_' + Math.random().toString(36).substr(2, 7),
        name: item.name,
        price: Number(item.price) || 0,
        quantity: qty,
        category,
        isFood,
        calories: itemTotalCal,
        shelfLifeDays: shelfLife || 3
      };
    });

    const newTx = {
      id,
      date: record.date || new Date().toISOString().split('T')[0],
      store: record.store || '店舗未登録',
      totalAmount: Number(record.totalAmount) || items.reduce((sum, i) => sum + (i.price * i.quantity), 0),
      totalDiscount,
      totalCalories,
      category: record.category || (items[0] ? items[0].category : '食費'),
      items,
      memo: record.memo || '',
      hasImage: !!record.receiptImage,
      imageId: record.receiptImage ? id : null,
      createdAt: new Date().toISOString()
    };

    if (record.receiptImage) {
      ReceiptImageDB.saveImage(id, record.receiptImage);
    }

    this.transactions.unshift(newTx);
    this.saveTransactions();

    // 食品かつ冷蔵庫追加フラグがONならストックへ登録
    if (addToFridge) {
      items.filter(i => i.isFood).forEach(food => {
        this.addFridgeItem({
          name: food.name,
          category: food.category,
          calories: food.calories,
          addedDate: newTx.date,
          expiryDate: this.calculateExpiry(newTx.date, food.shelfLifeDays || 4),
          transactionId: id
        });
      });
    }

    return newTx;
  }

  deleteTransaction(id) {
    this.transactions = this.transactions.filter(t => t.id !== id);
    this.saveTransactions();
    ReceiptImageDB.deleteImage(id);
  }

  deleteTransactionItem(txId, itemId) {
    const tx = this.transactions.find(t => t.id === txId);
    if (!tx) return;

    tx.items = (tx.items || []).filter(i => i.id !== itemId);
    if (tx.items.length === 0) {
      this.deleteTransaction(txId);
      return;
    }

    // 合計金額・合計カロリーを再計算
    const itemsSum = tx.items.reduce((sum, i) => sum + (i.price * (i.quantity || 1)), 0);
    tx.totalAmount = Math.max(0, itemsSum - (tx.totalDiscount || 0));
    tx.totalCalories = tx.items.reduce((sum, i) => sum + ((i.calories || 0) * (i.quantity || 1)), 0);

    this.saveTransactions();
  }

  updateTransaction(id, updatedData) {
    const tx = this.transactions.find(t => t.id === id);
    if (!tx) return null;

    if (updatedData.store !== undefined) tx.store = updatedData.store;
    if (updatedData.date !== undefined) tx.date = updatedData.date;
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
          calories: Number(i.calories) || 0,
          category: i.category || '主食',
          isFood,
          shelfLifeDays: i.shelfLifeDays || 3
        };
      });
    }

    // 合計金額・合計カロリーを再計算
    const itemsSum = (tx.items || []).reduce((sum, i) => sum + (i.price * (i.quantity || 1)), 0);
    tx.totalAmount = Math.max(0, itemsSum - (tx.totalDiscount || 0));
    tx.totalCalories = (tx.items || []).reduce((sum, i) => sum + ((i.calories || 0) * (i.quantity || 1)), 0);
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
      calories: item.calories || 0,
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
    const totalCalories = filtered.reduce((sum, t) => sum + (t.totalCalories || 0), 0);
    const totalDiscount = filtered.reduce((sum, t) => sum + (t.totalDiscount || 0), 0);
    const transactionCount = filtered.length;

    // カテゴリ別集計
    const categoryTotals = {};
    const calorieByCategory = {};
    filtered.forEach(t => {
      t.items.forEach(item => {
        const cat = item.category || 'その他';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + (item.price * item.quantity);
        if (item.isFood && item.calories) {
          calorieByCategory[cat] = (calorieByCategory[cat] || 0) + item.calories;
        }
      });
    });

    // カロパ（100円あたりのカロリー: kcal / (expense / 100)）
    const calPer100Yen = totalExpense > 0 ? Math.round((totalCalories / totalExpense) * 100) : 0;

    // 日別推移データの作成 (グラフ用)
    let timelineLabels = [];
    let timelineExpenses = [];
    let timelineCalories = [];

    if (period === 'monthly') {
      // その月の1日〜末日
      const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        timelineLabels.push(`${day}日`);
        const dayTxs = filtered.filter(t => t.date === dStr);
        timelineExpenses.push(dayTxs.reduce((sum, t) => sum + t.totalAmount, 0));
        timelineCalories.push(dayTxs.reduce((sum, t) => sum + (t.totalCalories || 0), 0));
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
        timelineCalories.push(dayTxs.reduce((sum, t) => sum + (t.totalCalories || 0), 0));
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
        timelineCalories.push(monthTxs.reduce((sum, t) => sum + (t.totalCalories || 0), 0));
      }
    }

    // 1日あたりの平均カロリー
    let averageDailyCalories = 0;
    if (period === 'daily') {
      averageDailyCalories = totalCalories;
    } else if (period === 'monthly') {
      const activeDays = new Set(filtered.map(t => t.date)).size || 1;
      averageDailyCalories = Math.round(totalCalories / activeDays);
    } else {
      const activeDays = new Set(filtered.map(t => t.date)).size || 1;
      averageDailyCalories = Math.round(totalCalories / activeDays);
    }

    return {
      period,
      year: targetYear,
      month: targetMonth,
      dateStr: targetDateStr,
      totalExpense,
      totalCalories,
      totalDiscount,
      transactionCount,
      calPer100Yen,
      averageDailyCalories,
      categoryTotals,
      calorieByCategory,
      timeline: {
        labels: timelineLabels,
        expenses: timelineExpenses,
        calories: timelineCalories
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
        totalAmount: 2680,
        totalDiscount: 240,
        totalCalories: 1850,
        category: '食費',
        memo: '週末の自炊用まとめ買い（見切り品割引あり）',
        items: [
          { id: 'i1', name: '国産 豚こま切れ肉 250g', price: 420, quantity: 1, category: 'お肉・魚', isFood: true, calories: 575, shelfLifeDays: 3 },
          { id: 'i2', name: 'キャベツ 1/2カット', price: 98, quantity: 1, category: '野菜・果物', isFood: true, calories: 90, shelfLifeDays: 7 },
          { id: 'i3', name: 'おいしい牛乳 1000ml', price: 238, quantity: 1, category: '乳製品・飲料', isFood: true, calories: 675, shelfLifeDays: 6 },
          { id: 'i4', name: '絹ごし豆腐 3個パック', price: 108, quantity: 1, category: 'お肉・魚', isFood: true, calories: 180, shelfLifeDays: 5 },
          { id: 'i5', name: '特売バナナ 1袋(4本)', price: 158, quantity: 1, category: '野菜・果物', isFood: true, calories: 330, shelfLifeDays: 4 },
          { id: 'i6', name: 'アルミホイル 8m', price: 168, quantity: 1, category: '日用品', isFood: false, calories: 0, shelfLifeDays: null }
        ],
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_demo_2',
        date: formatDate(1),
        store: 'セブン-イレブン',
        totalAmount: 890,
        totalDiscount: 0,
        totalCalories: 620,
        category: '外食・中食',
        memo: '出先でのランチ',
        items: [
          { id: 'i7', name: 'ツナマヨおにぎり', price: 160, quantity: 1, category: '主食', isFood: true, calories: 220, shelfLifeDays: 1 },
          { id: 'i8', name: 'サラダチキン プレーン', price: 238, quantity: 1, category: 'お肉・魚', isFood: true, calories: 115, shelfLifeDays: 10 },
          { id: 'i9', name: 'カフェラテ レギュラー', price: 190, quantity: 1, category: '乳製品・飲料', isFood: true, calories: 105, shelfLifeDays: 1 },
          { id: 'i10', name: 'シュークリーム', price: 168, quantity: 1, category: 'お菓子・スイーツ', isFood: true, calories: 180, shelfLifeDays: 2 }
        ],
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_demo_3',
        date: formatDate(2),
        store: 'マツモトキヨシ',
        totalAmount: 1980,
        totalDiscount: 150,
        totalCalories: 210,
        category: '日用品',
        memo: 'シャンプー補充と常備サプリ',
        items: [
          { id: 'i11', name: '詰め替え用シャンプー', price: 680, quantity: 1, category: '日用品', isFood: false, calories: 0, shelfLifeDays: null },
          { id: 'i12', name: 'ボックスティッシュ 5箱', price: 348, quantity: 1, category: '日用品', isFood: false, calories: 0, shelfLifeDays: null },
          { id: 'i13', name: 'プロテインバー チョコ味', price: 160, quantity: 1, category: 'お菓子・スイーツ', isFood: true, calories: 210, shelfLifeDays: 90 }
        ],
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_demo_4',
        date: formatDate(4),
        store: 'イオン スタイル',
        totalAmount: 3820,
        totalDiscount: 380,
        totalCalories: 2600,
        category: '食費',
        memo: '平日の食材仕入れ',
        items: [
          { id: 'i14', name: '若鶏もも肉 2枚(400g)', price: 480, quantity: 1, category: 'お肉・魚', isFood: true, calories: 800, shelfLifeDays: 2 },
          { id: 'i15', name: '玉ねぎ 3個ネット', price: 198, quantity: 1, category: '野菜・果物', isFood: true, calories: 195, shelfLifeDays: 14 },
          { id: 'i16', name: '食パン 6枚切り', price: 158, quantity: 1, category: '主食', isFood: true, calories: 960, shelfLifeDays: 4 },
          { id: 'i17', name: 'ミニトマト 1パック', price: 218, quantity: 1, category: '野菜・果物', isFood: true, calories: 30, shelfLifeDays: 5 },
          { id: 'i18', name: 'ミックスナッツ 1袋', price: 498, quantity: 1, category: 'お菓子・スイーツ', isFood: true, calories: 615, shelfLifeDays: 60 }
        ],
        createdAt: new Date().toISOString()
      }
    ];
  }

  generateInitialFridgeData() {
    const today = new Date();
    const addDays = (d, count) => {
      const dt = new Date(d);
      dt.setDate(dt.getDate() + count);
      return dt.toISOString().split('T')[0];
    };

    return [
      {
        id: 'fridge_1',
        name: '国産 豚こま切れ肉 250g',
        category: 'お肉・魚',
        calories: 575,
        addedDate: today.toISOString().split('T')[0],
        expiryDate: addDays(today, 2),
        isConsumed: false
      },
      {
        id: 'fridge_2',
        name: 'おいしい牛乳 1000ml',
        category: '乳製品・飲料',
        calories: 675,
        addedDate: today.toISOString().split('T')[0],
        expiryDate: addDays(today, 4),
        isConsumed: false
      },
      {
        id: 'fridge_3',
        name: 'キャベツ 1/2カット',
        category: '野菜・果物',
        calories: 90,
        addedDate: today.toISOString().split('T')[0],
        expiryDate: addDays(today, 5),
        isConsumed: false
      },
      {
        id: 'fridge_4',
        name: '絹ごし豆腐 3個パック',
        category: 'お肉・魚',
        calories: 180,
        addedDate: today.toISOString().split('T')[0],
        expiryDate: addDays(today, 1),
        isConsumed: false
      }
    ];
  }
}

export const store = new AppStore();
