/**
 * SmartKakeibo - オールインワン・バンドルスクリプト
 * file:// プロトコルおよび http:// プロトコルの両方で 100% 確実に動作するように
 * 依存関係を自己完結させた完全版スクリプトです。
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. 食品データベース & カロリー推定モジュール
     ========================================================================== */
  const FOOD_DATABASE = [
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

  function estimateFoodCalories(itemName) {
    if (!itemName || typeof itemName !== 'string') {
      return null;
    }
    const cleanName = itemName.toLowerCase().replace(/[\s\u3000]/g, '');

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

  /* ==========================================================================
     1.5 レシート画像 IndexedDB ストレージ
     LocalStorageの容量制限（約5MB）を回避し、高画質な写真を安全に保存
     ========================================================================== */
  class ReceiptImageDB {
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

  /* ==========================================================================
     2. データストアモジュール
     ========================================================================== */
  const STORAGE_KEYS = {
    TRANSACTIONS: 'smart_kakeibo_transactions_v1',
    FRIDGE_STOCK: 'smart_kakeibo_fridge_v1',
    SETTINGS: 'smart_kakeibo_settings_v1',
    INITIALIZED: 'smart_kakeibo_initialized_v1'
  };

  const DEFAULT_SETTINGS = {
    geminiApiKey: '',
    monthlyBudget: 75000,
    dailyCalorieTarget: 2200,
    useDemoScanner: true,
    saveReceiptPhotos: false // デフォルトOFF: 解析後は写真破棄し家計簿データのみ保存（容量完全ゼロ）
  };

  class AppStore {
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

        const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
        const storedTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        const storedFridge = localStorage.getItem(STORAGE_KEYS.FRIDGE_STOCK);

        if (storedTx !== null) {
          this.transactions = JSON.parse(storedTx);
          // 既存データに receiptImage が残っている場合は IndexedDB へ退避し LocalStorage を軽量化
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
        } else if (!isInit) {
          // 初回アクセス時のみデモデータを生成
          this.transactions = this.generateInitialDemoData();
          this.saveTransactions();
          localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
        } else {
          this.transactions = [];
        }

        if (storedFridge !== null) {
          this.fridgeItems = JSON.parse(storedFridge);
        } else if (!isInit) {
          this.fridgeItems = this.generateInitialFridgeData();
          this.saveFridge();
        } else {
          this.fridgeItems = [];
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
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      this.saveTransactions();
      this.saveFridge();
      ReceiptImageDB.clearAllImages();
      this.notify();
    }

    loadDemoData() {
      this.transactions = this.generateInitialDemoData();
      this.fridgeItems = this.generateInitialFridgeData();
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      this.saveTransactions();
      this.saveFridge();
      this.notify();
    }

    saveTransactions() {
      try {
        // LocalStorageの容量枯渇（QuotaExceededError）を防ぐため、
        // 万一巨大なBase64画像文字列が含まれていても除外して軽量なメタデータのみ保存
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
        console.error('Failed to save transactions to localStorage:', err);
        if (err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014) {
          try {
            const pruned = this.transactions.slice(0, 50).map(({ receiptImage, memo, ...rest }) => ({
              ...rest,
              memo: (memo || '').slice(0, 50)
            }));
            localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(pruned));
            this.notify();
            console.warn('Saved transactions after emergency pruning due to quota limit.');
          } catch (retryErr) {
            alert('ブラウザの保存容量制限により家計簿データを保存できませんでした。');
          }
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
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
      } catch (e) {}
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

    addTransaction(record, addToFridge = true) {
      const id = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      let totalCalories = 0;
      let totalDiscount = Number(record.totalDiscount) || 0;

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

      // レシート写真は IndexedDB に安全に保存（LocalStorageの容量を圧迫しない）
      if (record.receiptImage) {
        ReceiptImageDB.saveImage(id, record.receiptImage);
      }

      this.transactions.unshift(newTx);
      this.saveTransactions();

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

    clearFridgeConsumed() {
      this.fridgeItems = this.fridgeItems.filter(f => !f.isConsumed);
      this.saveFridge();
    }

    clearAllFridge() {
      this.fridgeItems = [];
      this.saveFridge();
    }

    getStats(period = 'monthly', targetDate = new Date()) {
      const now = new Date(targetDate);
      const targetYear = now.getFullYear();
      const targetMonth = now.getMonth() + 1;
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
        filtered = [...this.transactions];
      }

      const totalExpense = filtered.reduce((sum, t) => sum + t.totalAmount, 0);
      const totalCalories = filtered.reduce((sum, t) => sum + (t.totalCalories || 0), 0);
      const totalDiscount = filtered.reduce((sum, t) => sum + (t.totalDiscount || 0), 0);
      const transactionCount = filtered.length;

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

      const calPer100Yen = totalExpense > 0 ? Math.round((totalCalories / totalExpense) * 100) : 0;

      let timelineLabels = [];
      let timelineExpenses = [];
      let timelineCalories = [];

      if (period === 'monthly') {
        const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
          const dStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          timelineLabels.push(`${day}日`);
          const dayTxs = filtered.filter(t => t.date === dStr);
          timelineExpenses.push(dayTxs.reduce((sum, t) => sum + t.totalAmount, 0));
          timelineCalories.push(dayTxs.reduce((sum, t) => sum + (t.totalCalories || 0), 0));
        }
      } else if (period === 'daily') {
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

      let averageDailyCalories = 0;
      if (period === 'daily') {
        averageDailyCalories = totalCalories;
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

  const store = new AppStore();
  window.appStore = store;

  /* ==========================================================================
     3. Gemini API & デモレシートモジュール
     ========================================================================== */
  const DEMO_RECEIPTS = [
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

  async function simulateReceiptScan(demoIndex = 0) {
    await new Promise(resolve => setTimeout(resolve, 1000));
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

  async function parseReceiptWithGemini(base64Image, mimeType = 'image/jpeg', apiKey = '') {
    if (!apiKey) {
      throw new Error('Gemini APIキーが設定されていません。');
    }
    const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

    const candidateModels = [
      'gemini-3.8-flash',
      'gemini-2.5-flash',
      'gemini-1.5-flash'
    ];

    const promptText = `レシートから店舗名(store), 日付(date: YYYY-MM-DD), 合計(totalAmount: 数値), 値引き(totalDiscount: 数値), items: [{name, price, quantity, isFood(真偽値), category, calories(食品の場合の推定kcal), shelfLifeDays(食品の消費目安日数)}] を抽出して純粋なJSONで返してください。`;

    let lastError = null;

    for (const modelName of candidateModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: promptText },
                { inline_data: { mime_type: mimeType, data: cleanBase64 } }
              ]
            }],
            generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
          })
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          const errMsg = err.error?.message || response.statusText;
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

        const items = (parsed.items || []).map(item => {
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

        const totalAmount = Number(parsed.totalAmount) || items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        const totalCalories = items.reduce((sum, i) => sum + (i.calories * i.quantity), 0);

        return {
          store: parsed.store || '店舗不明',
          date: parsed.date || new Date().toISOString().split('T')[0],
          totalAmount,
          totalDiscount: Number(parsed.totalDiscount) || 0,
          totalCalories,
          items
        };
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

  /* ==========================================================================
     4. グラフ可視化モジュール (Chart.js)
     ========================================================================== */
  let timelineChartInstance = null;
  let calorieBreakdownChartInstance = null;
  let expenseBreakdownChartInstance = null;

  function renderCharts(stats) {
    if (!window.Chart) return;
    renderTimelineChart(stats);
    renderCalorieBreakdownChart(stats);
    renderExpenseBreakdownChart(stats);
  }

  function renderTimelineChart(stats) {
    const canvas = document.getElementById('timeline-chart');
    if (!canvas || !window.Chart) return;
    if (timelineChartInstance) timelineChartInstance.destroy();

    const ctx = canvas.getContext('2d');
    const expenseGrad = ctx.createLinearGradient(0, 0, 0, 240);
    expenseGrad.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
    expenseGrad.addColorStop(1, 'rgba(16, 185, 129, 0.02)');

    timelineChartInstance = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: stats.timeline.labels,
        datasets: [
          {
            label: '支出 (円)',
            data: stats.timeline.expenses,
            backgroundColor: expenseGrad,
            borderColor: '#10B981',
            borderWidth: 2,
            borderRadius: 6,
            yAxisID: 'yExpense',
            order: 2
          },
          {
            type: 'line',
            label: 'カロリー (kcal)',
            data: stats.timeline.calories,
            borderColor: '#F59E0B',
            backgroundColor: '#F59E0B',
            pointBackgroundColor: '#F59E0B',
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 2,
            pointRadius: 4,
            borderWidth: 2.5,
            tension: 0.35,
            yAxisID: 'yCalorie',
            order: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 12, usePointStyle: true, font: { size: 11 } }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          yExpense: {
            type: 'linear',
            position: 'left',
            ticks: {
              font: { size: 10 },
              callback: (v) => '¥' + (v >= 1000 ? (v / 1000) + 'k' : v)
            }
          },
          yCalorie: {
            type: 'linear',
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: {
              font: { size: 10 },
              callback: (v) => (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v) + 'c'
            }
          }
        }
      }
    });
  }

  function renderCalorieBreakdownChart(stats) {
    const canvas = document.getElementById('calorie-breakdown-chart');
    if (!canvas || !window.Chart) return;
    if (calorieBreakdownChartInstance) calorieBreakdownChartInstance.destroy();

    const entries = Object.entries(stats.calorieByCategory || {});
    let labels = entries.map(([k]) => k);
    let data = entries.map(([, v]) => v);

    if (data.length === 0 || data.every(v => v === 0)) {
      labels = ['データなし'];
      data = [1];
    }

    const colors = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#64748B'];
    const ctx = canvas.getContext('2d');
    calorieBreakdownChartInstance = new window.Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: colors.slice(0, labels.length), borderWidth: 2 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 10, usePointStyle: true, font: { size: 10 } } }
        }
      }
    });
  }

  function renderExpenseBreakdownChart(stats) {
    const canvas = document.getElementById('expense-breakdown-chart');
    if (!canvas || !window.Chart) return;
    if (expenseBreakdownChartInstance) expenseBreakdownChartInstance.destroy();

    const entries = Object.entries(stats.categoryTotals || {});
    let labels = entries.map(([k]) => k);
    let data = entries.map(([, v]) => v);

    if (data.length === 0 || data.every(v => v === 0)) {
      labels = ['支出なし'];
      data = [1];
    }

    const colors = ['#10B981', '#06B6D4', '#6366F1', '#F43F5E', '#EAB308', '#8B5CF6', '#94A3B8'];
    const ctx = canvas.getContext('2d');
    expenseBreakdownChartInstance = new window.Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: colors.slice(0, labels.length), borderWidth: 2 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 10, usePointStyle: true, font: { size: 10 } } }
        }
      }
    });
  }

  /* ==========================================================================
     5. UI コントローラー & イベント管理
     ========================================================================== */
  class AppUI {
    constructor() {
      this.currentTab = 'home';
      this.currentPeriod = 'monthly';
      this.scannedDraft = null;
      this.selectedDemoIndex = 0;
    }

    init() {
      this.bindEvents();
      this.renderAll();
      store.subscribe(() => {
        this.renderAll();
      });
    }

    bindEvents() {
      // ナビゲーション切り替え
      document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const tab = e.currentTarget.dataset.tab;
          if (tab) this.switchTab(tab);
        });
      });

      // 期間切り替えピル (日別 / 月別 / 累計)
      document.querySelectorAll('.period-pill').forEach(pill => {
        pill.addEventListener('click', (e) => {
          document.querySelectorAll('.period-pill').forEach(p => p.classList.remove('active'));
          e.currentTarget.classList.add('active');
          this.currentPeriod = e.currentTarget.dataset.period;
          this.renderStats();
        });
      });

      // レシートスキャン: ファイル選択
      const receiptInput = document.getElementById('receipt-file-input');
      if (receiptInput) {
        receiptInput.addEventListener('change', (e) => this.handleReceiptUpload(e));
      }

      // デモスキャン実行ボタン
      const demoScanBtn = document.getElementById('demo-scan-btn');
      if (demoScanBtn) {
        demoScanBtn.addEventListener('click', () => this.handleDemoScan());
      }

      // 手入力モーダル起動
      const manualBtn = document.getElementById('open-manual-btn');
      if (manualBtn) {
        manualBtn.addEventListener('click', () => this.openManualModal());
      }

      // 手入力モーダル内の品目追加
      const addItemBtn = document.getElementById('manual-add-item-btn');
      if (addItemBtn) {
        addItemBtn.addEventListener('click', () => this.addManualItemRow());
      }

      // 手入力フォーム保存
      const manualForm = document.getElementById('manual-entry-form');
      if (manualForm) {
        manualForm.addEventListener('submit', (e) => this.handleManualSubmit(e));
      }

      // スキャン確認モーダルの写真サムネイル拡大
      const draftPreviewImg = document.getElementById('draft-image-preview');
      if (draftPreviewImg) {
        draftPreviewImg.addEventListener('click', () => {
          if (this.scannedDraft && this.scannedDraft.receiptImage) {
            this.showImageModal(this.scannedDraft.receiptImage, `${this.scannedDraft.date} ${this.scannedDraft.store}`);
          }
        });
      }

      // スキャン結果保存
      const saveScanBtn = document.getElementById('save-scan-btn');
      if (saveScanBtn) {
        saveScanBtn.addEventListener('click', () => this.saveScanDraft());
      }

      // スキャンキャンセル
      const cancelScanBtn = document.getElementById('cancel-scan-btn');
      if (cancelScanBtn) {
        cancelScanBtn.addEventListener('click', () => this.closeScanModal());
      }

      // モーダル閉じるボタン
      document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const modal = e.currentTarget.closest('.modal-overlay');
          if (modal) modal.classList.remove('active');
        });
      });

      // 記録・アイテム編集フォーム
      const editTxForm = document.getElementById('edit-tx-form');
      if (editTxForm) {
        editTxForm.addEventListener('submit', (e) => this.handleEditTxSubmit(e));
      }

      // 記録編集内の品目追加
      const editAddBtn = document.getElementById('edit-tx-add-item-btn');
      if (editAddBtn) {
        editAddBtn.addEventListener('click', () => this.addEditTxItemRow());
      }

      // 記録編集内の値引き変更時サマリー更新
      const editDiscount = document.getElementById('edit-tx-discount');
      if (editDiscount) {
        editDiscount.addEventListener('input', () => this.updateEditTxSummary());
      }

      // 設定フォーム
      const settingsForm = document.getElementById('settings-form');
      if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const apiKey = document.getElementById('cfg-api-key').value.trim();
          const budget = Number(document.getElementById('cfg-budget').value) || 75000;
          const calTarget = Number(document.getElementById('cfg-cal-target').value) || 2200;
          const savePhoto = document.getElementById('cfg-save-photo') ? document.getElementById('cfg-save-photo').checked : false;
          store.saveSettings({
            geminiApiKey: apiKey,
            monthlyBudget: budget,
            dailyCalorieTarget: calTarget,
            saveReceiptPhotos: savePhoto
          });
          this.showToast('設定を保存しました✨');
        });
      }

      // データリセットボタン
      const resetBtn = document.getElementById('reset-data-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          if (confirm('すべての取引履歴をデモデータの初期状態に戻しますか？')) {
            localStorage.clear();
            location.reload();
          }
        });
      }

      // PCフレームトグル
      const toggleFrameBtn = document.getElementById('toggle-frame-btn');
      if (toggleFrameBtn) {
        toggleFrameBtn.addEventListener('click', () => {
          document.body.classList.toggle('full-width-mode');
          const isFull = document.body.classList.contains('full-width-mode');
          toggleFrameBtn.innerHTML = isFull 
            ? '<i data-lucide="smartphone"></i><span>スマホ枠</span>' 
            : '<i data-lucide="maximize-2"></i><span>全画面</span>';
          if (window.lucide) window.lucide.createIcons();
        });
      }
    }

    switchTab(tabName) {
      this.currentTab = tabName;
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tabName);
      });

      document.querySelectorAll('.screen-view').forEach(screen => {
        screen.classList.toggle('active', screen.id === `screen-${tabName}`);
      });

      if (tabName === 'stats' || tabName === 'home') {
        this.renderStats();
      }
      if (tabName === 'fridge') {
        this.renderFridge();
      }
      if (tabName === 'history') {
        this.renderHistory();
      }

      const scrollArea = document.querySelector('.app-content-scroll');
      if (scrollArea) scrollArea.scrollTo({ top: 0, behavior: 'smooth' });
    }

    renderAll() {
      this.renderHome();
      this.renderStats();
      this.renderFridge();
      this.renderHistory();
      this.renderSettings();
      if (window.lucide) window.lucide.createIcons();
    }

    renderHome() {
      const stats = store.getStats('monthly');
      const budget = store.settings.monthlyBudget || 75000;
      const remaining = budget - stats.totalExpense;
      const progress = Math.min(Math.round((stats.totalExpense / budget) * 100), 100);

      const monthSpendEl = document.getElementById('home-month-spend');
      const monthSpendSubEl = document.getElementById('home-month-spend-sub');
      const budgetRemainEl = document.getElementById('home-budget-remaining');
      const budgetBarEl = document.getElementById('home-budget-bar');

      if (monthSpendEl) monthSpendEl.textContent = `¥${stats.totalExpense.toLocaleString()}`;
      if (monthSpendSubEl) monthSpendSubEl.textContent = `¥${stats.totalExpense.toLocaleString()}`;
      if (budgetRemainEl) {
        budgetRemainEl.textContent = remaining >= 0 ? `残り ¥${remaining.toLocaleString()}` : `超過 ¥${Math.abs(remaining).toLocaleString()}`;
        budgetRemainEl.style.color = remaining >= 0 ? '#10B981' : '#EF4444';
      }
      if (budgetBarEl) {
        budgetBarEl.style.width = `${progress}%`;
        budgetBarEl.style.backgroundColor = progress > 90 ? '#EF4444' : progress > 75 ? '#F59E0B' : '#10B981';
      }

      const totalCalEl = document.getElementById('home-total-calories');
      const avgCalEl = document.getElementById('home-avg-calories');
      const calPer100El = document.getElementById('home-cal-per-100');
      if (totalCalEl) totalCalEl.textContent = `${stats.totalCalories.toLocaleString()} kcal`;
      if (avgCalEl) avgCalEl.textContent = `日平均: ${stats.averageDailyCalories.toLocaleString()} kcal`;
      if (calPer100El) calPer100El.textContent = `${stats.calPer100Yen} kcal / 100円`;

      const discountEl = document.getElementById('home-discount-total');
      if (discountEl) discountEl.textContent = `¥${stats.totalDiscount.toLocaleString()}`;

      const recentList = document.getElementById('home-recent-list');
      if (recentList) {
        const recent = store.transactions.slice(0, 3);
        if (recent.length === 0) {
          recentList.innerHTML = `<div class="empty-state">まだ記録がありません。「レシート撮影」または「手入力」から追加してみましょう！</div>`;
        } else {
          recentList.innerHTML = recent.map(tx => this.createTransactionCardHtml(tx, true)).join('');
        }
      }

      const fridgeAlertBox = document.getElementById('home-fridge-alert');
      if (fridgeAlertBox) {
        const urgent = store.fridgeItems.filter(f => !f.isConsumed && f.expiryDate <= this.getOffsetDateStr(2));
        if (urgent.length > 0) {
          fridgeAlertBox.style.display = 'flex';
          fridgeAlertBox.innerHTML = `
            <div class="alert-icon"><i data-lucide="alert-triangle"></i></div>
            <div class="alert-content">
              <span class="alert-title">賞味期限が近い食材が ${urgent.length}品 あります</span>
              <span class="alert-desc">${urgent.map(u => u.name).slice(0, 2).join('、')}${urgent.length > 2 ? ' など' : ''} を早めに使い切りましょう！</span>
            </div>
            <button class="alert-action-btn" onclick="window.appUI.switchTab('fridge')">見る</button>
          `;
        } else {
          fridgeAlertBox.style.display = 'none';
        }
      }
    }

    renderStats() {
      const stats = store.getStats(this.currentPeriod);
      const periodTitleEl = document.getElementById('stats-period-title');
      if (periodTitleEl) {
        if (this.currentPeriod === 'daily') {
          periodTitleEl.textContent = `直近7日間の推移`;
        } else if (this.currentPeriod === 'monthly') {
          periodTitleEl.textContent = `${stats.year}年 ${stats.month}月の集計`;
        } else {
          periodTitleEl.textContent = `全期間（直近6ヶ月）の推移`;
        }
      }

      const statExpenseEl = document.getElementById('stat-total-expense');
      const statCalorieEl = document.getElementById('stat-total-calorie');
      const statAvgCalEl = document.getElementById('stat-avg-calorie');
      const statCountEl = document.getElementById('stat-record-count');

      if (statExpenseEl) statExpenseEl.textContent = `¥${stats.totalExpense.toLocaleString()}`;
      if (statCalorieEl) statCalorieEl.textContent = `${stats.totalCalories.toLocaleString()} kcal`;
      if (statAvgCalEl) statAvgCalEl.textContent = `${stats.averageDailyCalories.toLocaleString()} kcal/日`;
      if (statCountEl) statCountEl.textContent = `${stats.transactionCount} 件`;

      renderCharts(stats);
    }

    renderFridge() {
      const listEl = document.getElementById('fridge-items-list');
      if (!listEl) return;

      const items = store.fridgeItems;
      if (items.length === 0) {
        listEl.innerHTML = `
          <div class="empty-state">
            <i data-lucide="refrigerator" class="empty-icon"></i>
            <p>冷蔵庫は空っぽです。<br>レシートを撮影すると食品が自動追加されます！</p>
          </div>
        `;
        return;
      }

      const todayStr = new Date().toISOString().split('T')[0];

      listEl.innerHTML = items.map(item => {
        const isExpired = item.expiryDate < todayStr;
        const isUrgent = item.expiryDate === todayStr || item.expiryDate === this.getOffsetDateStr(1);
        
        let badgeClass = 'badge-normal';
        let badgeText = `${item.expiryDate.split('-').slice(1).join('/')}まで`;

        if (item.isConsumed) {
          badgeClass = 'badge-consumed';
          badgeText = '消費済み';
        } else if (isExpired) {
          badgeClass = 'badge-expired';
          badgeText = '期限切れ';
        } else if (isUrgent) {
          badgeClass = 'badge-urgent';
          badgeText = 'お早めに！';
        }

        return `
          <div class="fridge-card ${item.isConsumed ? 'consumed' : ''}" data-id="${item.id}">
            <div class="fridge-checkbox ${item.isConsumed ? 'checked' : ''}" onclick="window.appUI.toggleFridge('${item.id}')">
              ${item.isConsumed ? '<i data-lucide="check"></i>' : ''}
            </div>
            <div class="fridge-info" onclick="window.appUI.toggleFridge('${item.id}')">
              <div class="fridge-name">${this.escapeHtml(item.name)}</div>
              <div class="fridge-meta">
                <span class="fridge-cal">${item.calories ? item.calories + ' kcal' : '食品'}</span>
                <span class="fridge-cat">${item.category}</span>
              </div>
            </div>
            <div class="fridge-badge ${badgeClass}">${badgeText}</div>
            <button class="btn-icon-subtle" onclick="window.appUI.deleteFridge('${item.id}')" title="削除">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        `;
      }).join('');
    }

    toggleFridge(id) {
      store.toggleFridgeConsumed(id);
      this.renderFridge();
      this.renderHome();
      if (window.lucide) window.lucide.createIcons();
    }

    deleteFridge(id) {
      store.deleteFridgeItem(id);
      this.renderFridge();
      this.renderHome();
      if (window.lucide) window.lucide.createIcons();
    }

    renderHistory() {
      const listEl = document.getElementById('history-list');
      if (!listEl) return;

      if (store.transactions.length === 0) {
        listEl.innerHTML = `<div class="empty-state">まだ記録がありません。</div>`;
        return;
      }

      listEl.innerHTML = store.transactions.map(tx => this.createTransactionCardHtml(tx, true)).join('');
    }

    createTransactionCardHtml(tx, showDelete = true) {
      const dateFormatted = tx.date.split('-').slice(1).join('/');
      const hasDiscount = tx.totalDiscount > 0;
      const items = tx.items || [];

      return `
        <div class="tx-card" id="card-${tx.id}">
          <div class="tx-card-header">
            <div class="tx-header-left">
              <span class="tx-date">${dateFormatted}</span>
              <span class="tx-store">${this.escapeHtml(tx.store)}</span>
            </div>
            <div class="tx-header-right">
              <span class="tx-amount">¥${tx.totalAmount.toLocaleString()}</span>
              <button class="btn-icon-subtle" onclick="event.stopPropagation(); window.appUI.openEditTxModal('${tx.id}')" title="この記録と品目を編集">
                <i data-lucide="edit-2"></i>
              </button>
              ${showDelete ? `
                <button class="btn-icon-subtle text-danger" onclick="event.stopPropagation(); window.appUI.deleteTx('${tx.id}')" title="この記録全体を削除">
                  <i data-lucide="trash-2"></i>
                </button>
              ` : ''}
            </div>
          </div>

          <div class="tx-badges">
            <span class="pill-badge cal-badge">
              <i data-lucide="flame"></i> ${tx.totalCalories.toLocaleString()} kcal
            </span>
            <span class="pill-badge cat-badge">${tx.category}</span>
            ${hasDiscount ? `
              <span class="pill-badge discount-badge">
                <i data-lucide="tag"></i> ¥${tx.totalDiscount} 節約
              </span>
            ` : ''}
            ${(tx.hasImage || tx.imageId || tx.receiptImage) ? `
              <button type="button" class="pill-badge photo-badge" onclick="event.stopPropagation(); window.appUI.viewReceiptPhoto('${tx.id}')" title="レシート原本の写真を見る">
                <i data-lucide="image"></i> 写真
              </button>
            ` : ''}
          </div>

          <div class="tx-items-preview" id="items-${tx.id}">
            ${items.map((i, idx) => `
              <span class="tx-item-chip ${idx >= 3 ? 'item-hidden' : ''}" style="${idx >= 3 ? 'display: none;' : ''}" onclick="event.stopPropagation(); window.appUI.openEditTxModal('${tx.id}')" title="タップして品目を編集">
                ${this.escapeHtml(i.name)}
                ${i.isFood && i.calories ? `<small>(${i.calories}c)</small>` : ''}
                <span class="chip-delete-btn" onclick="event.stopPropagation(); window.appUI.deleteTxItem('${tx.id}', '${i.id}', '${this.escapeHtml(i.name)}')" title="この品目を削除">×</span>
              </span>
            `).join('')}
            ${items.length > 3 ? `
              <span class="tx-item-more" id="more-btn-${tx.id}" onclick="window.appUI.toggleMoreItems('${tx.id}')">+他${items.length - 3}品を表示</span>
            ` : ''}
          </div>
        </div>
      `;
    }

    toggleMoreItems(txId) {
      const container = document.getElementById(`items-${txId}`);
      const moreBtn = document.getElementById(`more-btn-${txId}`);
      if (!container) return;

      const hiddenItems = container.querySelectorAll('.item-hidden');
      const isCurrentlyHidden = hiddenItems[0] && hiddenItems[0].style.display === 'none';

      hiddenItems.forEach(el => {
        el.style.display = isCurrentlyHidden ? 'inline-flex' : 'none';
      });

      if (moreBtn) {
        moreBtn.textContent = isCurrentlyHidden ? '閉じる ▲' : `+他${hiddenItems.length}品を表示`;
      }
    }

    deleteTx(id) {
      if (confirm('この記録をすべて削除しますか？')) {
        store.deleteTransaction(id);
        this.showToast('記録を削除しました');
      }
    }

    deleteTxItem(txId, itemId, itemName) {
      if (confirm(`品目「${itemName}」をこの記録から削除しますか？`)) {
        store.deleteTransactionItem(txId, itemId);
        this.showToast(`「${itemName}」を削除しました`);
      }
    }

    clearFridgeConsumed() {
      const count = store.fridgeItems.filter(f => f.isConsumed).length;
      if (count === 0) {
        alert('消費済みのアイテムはありません。');
        return;
      }
      if (confirm(`消費済みの食材 ${count}品 を冷蔵庫から削除しますか？`)) {
        store.clearFridgeConsumed();
        this.renderFridge();
        this.renderHome();
        this.showToast('消費済みの食材を削除しました');
      }
    }

    clearAllFridge() {
      if (store.fridgeItems.length === 0) return;
      if (confirm('冷蔵庫ストックをすべて空にしますか？')) {
        store.clearAllFridge();
        this.renderFridge();
        this.renderHome();
        this.showToast('冷蔵庫を空にしました');
      }
    }

    clearAllData() {
      if (confirm('【注意】すべての家計簿データおよび冷蔵庫ストックを消去して空にしますか？\n（デモデータも消去され、0件から開始できます）')) {
        store.clearAllData();
        this.showToast('すべてのデータを初期化しました（0件）✨');
      }
    }

    loadDemoData() {
      if (confirm('デモデータ（初期サンプルデータ）を読み込みますか？\n現在のデータは上書きされます。')) {
        store.loadDemoData();
        this.showToast('デモデータを読み込みました✨');
      }
    }

    renderSettings() {
      const apiKeyInput = document.getElementById('cfg-api-key');
      const budgetInput = document.getElementById('cfg-budget');
      const calTargetInput = document.getElementById('cfg-cal-target');
      const savePhotoInput = document.getElementById('cfg-save-photo');

      if (apiKeyInput) apiKeyInput.value = store.settings.geminiApiKey || '';
      if (budgetInput) budgetInput.value = store.settings.monthlyBudget || 75000;
      if (calTargetInput) calTargetInput.value = store.settings.dailyCalorieTarget || 2200;
      if (savePhotoInput) savePhotoInput.checked = !!store.settings.saveReceiptPhotos;
    }

    async handleReceiptUpload(e) {
      const file = e.target.files?.[0];
      if (!file) return;

      this.showScanningOverlay();

      try {
        // スマホカメラの高画質写真（数MB〜10MB）をCanvasで軽量化圧縮（約70〜100KB）
        // これにより通信が高速化し、LocalStorageの容量上限エラーを完全に防ぎます
        const base64 = await this.compressImage(file, 1200, 0.8) || await this.fileToBase64(file);
        const apiKey = store.settings.geminiApiKey;

        let result;
        if (apiKey) {
          result = await parseReceiptWithGemini(base64, 'image/jpeg', apiKey);
        } else {
          result = await simulateReceiptScan(this.selectedDemoIndex++);
          this.showToast('※APIキー未設定のためデモAI認識を実行しました', 3500);
        }

        this.hideScanningOverlay();
        this.openScanResultModal(result, base64);
      } catch (err) {
        this.hideScanningOverlay();
        alert(err.message || 'レシートの読み取りに失敗しました。');
      } finally {
        e.target.value = '';
      }
    }

    async handleDemoScan() {
      this.showScanningOverlay();
      try {
        const result = await simulateReceiptScan(this.selectedDemoIndex++);
        this.hideScanningOverlay();
        this.openScanResultModal(result, null);
      } catch (err) {
        this.hideScanningOverlay();
        alert('デモ解析エラー');
      }
    }

    showScanningOverlay() {
      const overlay = document.getElementById('scanning-overlay');
      if (overlay) overlay.classList.add('active');
    }

    hideScanningOverlay() {
      const overlay = document.getElementById('scanning-overlay');
      if (overlay) overlay.classList.remove('active');
    }

    openScanResultModal(data, imageBase64) {
      this.scannedDraft = { ...data, receiptImage: imageBase64 };

      const modal = document.getElementById('scan-result-modal');
      if (!modal) return;

      document.getElementById('draft-store').value = data.store;
      document.getElementById('draft-date').value = data.date;
      document.getElementById('draft-discount').value = data.totalDiscount || 0;

      const draftSavePhoto = document.getElementById('draft-save-photo');
      if (draftSavePhoto) {
        draftSavePhoto.checked = !!store.settings.saveReceiptPhotos;
      }

      // 撮影した写真のサムネイルを表示
      const previewWrap = document.getElementById('draft-image-preview-wrap');
      const previewImg = document.getElementById('draft-image-preview');
      if (previewWrap && previewImg) {
        if (imageBase64) {
          previewImg.src = imageBase64;
          previewWrap.style.display = 'block';
        } else {
          previewWrap.style.display = 'none';
        }
      }

      this.renderDraftItems();
      modal.classList.add('active');
      if (window.lucide) window.lucide.createIcons();
    }

    renderDraftItems() {
      const container = document.getElementById('draft-items-list');
      if (!container || !this.scannedDraft) return;

      let totalAmount = 0;
      let totalCalories = 0;

      container.innerHTML = this.scannedDraft.items.map((item, idx) => {
        const itemPrice = (item.price || 0) * (item.quantity || 1);
        const itemCal = (item.calories || 0) * (item.quantity || 1);
        totalAmount += itemPrice;
        totalCalories += itemCal;

        return `
          <div class="draft-item-row" data-index="${idx}">
            <div class="draft-row-top">
              <input type="text" class="input-flat item-name" value="${this.escapeHtml(item.name)}" placeholder="商品名" onchange="window.appUI.updateDraftItem(${idx}, 'name', this.value)">
              <button class="btn-icon-subtle text-danger" onclick="window.appUI.removeDraftItem(${idx})">
                <i data-lucide="x"></i>
              </button>
            </div>
            <div class="draft-row-bottom">
              <div class="draft-field">
                <label>金額(円)</label>
                <input type="number" class="input-flat-num item-price" value="${item.price}" onchange="window.appUI.updateDraftItem(${idx}, 'price', this.value)">
              </div>
              <div class="draft-field">
                <label>カロリー(kcal)</label>
                <input type="number" class="input-flat-num item-cal" value="${item.calories}" onchange="window.appUI.updateDraftItem(${idx}, 'calories', this.value)">
              </div>
              <div class="draft-field">
                <label>種別</label>
                <select class="input-flat-select" onchange="window.appUI.updateDraftItem(${idx}, 'category', this.value)">
                  <option value="主食" ${item.category === '主食' ? 'selected' : ''}>主食</option>
                  <option value="お肉・魚" ${item.category === 'お肉・魚' ? 'selected' : ''}>肉・魚</option>
                  <option value="野菜・果物" ${item.category === '野菜・果物' ? 'selected' : ''}>野菜・果物</option>
                  <option value="乳製品・飲料" ${item.category === '乳製品・飲料' ? 'selected' : ''}>飲料・乳</option>
                  <option value="惣菜・お弁当" ${item.category === '惣菜・お弁当' ? 'selected' : ''}>惣菜・弁当</option>
                  <option value="お菓子・スイーツ" ${item.category === 'お菓子・スイーツ' ? 'selected' : ''}>お菓子</option>
                  <option value="日用品" ${item.category === '日用品' ? 'selected' : ''}>日用品</option>
                  <option value="その他" ${item.category === 'その他' ? 'selected' : ''}>その他</option>
                </select>
              </div>
            </div>
          </div>
        `;
      }).join('');

      const totalDiscount = Number(document.getElementById('draft-discount')?.value) || 0;
      const finalAmount = Math.max(0, totalAmount - totalDiscount);
      this.scannedDraft.totalAmount = finalAmount;
      this.scannedDraft.totalCalories = totalCalories;

      const summaryEl = document.getElementById('draft-summary-badge');
      if (summaryEl) {
        summaryEl.innerHTML = `
          <span class="badge-total-price">合計: ¥${finalAmount.toLocaleString()}</span>
          <span class="badge-total-cal"><i data-lucide="flame"></i> ${totalCalories.toLocaleString()} kcal</span>
        `;
      }
      if (window.lucide) window.lucide.createIcons();
    }

    updateDraftItem(idx, field, value) {
      if (!this.scannedDraft || !this.scannedDraft.items[idx]) return;
      const item = this.scannedDraft.items[idx];

      if (field === 'price' || field === 'calories') {
        item[field] = Number(value) || 0;
      } else if (field === 'name') {
        item.name = value;
        if (item.calories === 0) {
          const est = estimateFoodCalories(value);
          if (est.isFood) {
            item.calories = est.calories;
            item.category = est.category;
            item.isFood = true;
          }
        }
      } else if (field === 'category') {
        item.category = value;
        item.isFood = value !== '日用品' && value !== 'その他';
      }

      this.renderDraftItems();
    }

    removeDraftItem(idx) {
      if (!this.scannedDraft) return;
      this.scannedDraft.items.splice(idx, 1);
      this.renderDraftItems();
    }

    saveScanDraft() {
      if (!this.scannedDraft) return;

      const storeName = document.getElementById('draft-store').value.trim() || '店舗未登録';
      const date = document.getElementById('draft-date').value || new Date().toISOString().split('T')[0];
      const discount = Number(document.getElementById('draft-discount').value) || 0;
      const addToFridge = document.getElementById('draft-add-fridge').checked;
      const draftSavePhoto = document.getElementById('draft-save-photo');
      const shouldSavePhoto = draftSavePhoto ? draftSavePhoto.checked : !!store.settings.saveReceiptPhotos;

      this.scannedDraft.store = storeName;
      this.scannedDraft.date = date;
      this.scannedDraft.totalDiscount = discount;

      // 写真保存OFFの場合は写真データを破棄（家計簿・カロリーデータのみ軽量保存）
      if (!shouldSavePhoto) {
        this.scannedDraft.receiptImage = null;
      }

      store.addTransaction(this.scannedDraft, addToFridge);

      this.closeScanModal();
      this.showToast('家計簿に記録しました！カロリーも反映されました🔥');
      this.switchTab('home');
    }

    closeScanModal() {
      const modal = document.getElementById('scan-result-modal');
      if (modal) modal.classList.remove('active');
      this.scannedDraft = null;
    }

    openManualModal() {
      const modal = document.getElementById('manual-modal');
      if (!modal) return;

      document.getElementById('manual-date').value = new Date().toISOString().split('T')[0];
      document.getElementById('manual-store').value = '';
      document.getElementById('manual-amount').value = '';
      document.getElementById('manual-discount').value = '';
      document.getElementById('manual-memo').value = '';

      const container = document.getElementById('manual-items-container');
      if (container) {
        container.innerHTML = '';
        this.addManualItemRow();
      }

      modal.classList.add('active');
      if (window.lucide) window.lucide.createIcons();
    }

    addManualItemRow(name = '', price = '', calories = '', category = '主食') {
      const container = document.getElementById('manual-items-container');
      if (!container) return;

      const rowId = 'row_' + Math.random().toString(36).substr(2, 6);
      const div = document.createElement('div');
      div.className = 'manual-item-row';
      div.id = rowId;
      div.innerHTML = `
        <div class="manual-row-top">
          <input type="text" class="input-food-name" placeholder="食品名 (例: おにぎり, 牛乳)" value="${this.escapeHtml(name)}">
          <button type="button" class="btn-icon-subtle text-danger" onclick="document.getElementById('${rowId}').remove()" title="この品目を削除">
            <i data-lucide="minus-circle"></i>
          </button>
        </div>
        <div class="manual-row-bottom">
          <div class="manual-field">
            <span class="manual-field-label">金額(円)</span>
            <input type="number" class="input-food-price" placeholder="¥ 0" value="${price}">
          </div>
          <div class="manual-field">
            <span class="manual-field-label">カロリー</span>
            <input type="number" class="input-food-cal" placeholder="kcal" value="${calories}">
          </div>
          <div class="manual-field">
            <span class="manual-field-label">種別</span>
            <select class="input-food-cat">
              <option value="主食" ${category === '主食' ? 'selected' : ''}>主食</option>
              <option value="お肉・魚" ${category === 'お肉・魚' ? 'selected' : ''}>肉・魚</option>
              <option value="野菜・果物" ${category === '野菜・果物' ? 'selected' : ''}>野菜・果物</option>
              <option value="乳製品・飲料" ${category === '乳製品・飲料' ? 'selected' : ''}>飲料・乳</option>
              <option value="惣菜・お弁当" ${category === '惣菜・お弁当' ? 'selected' : ''}>惣菜・弁当</option>
              <option value="お菓子・スイーツ" ${category === 'お菓子・スイーツ' ? 'selected' : ''}>お菓子</option>
              <option value="日用品" ${category === '日用品' ? 'selected' : ''}>日用品</option>
              <option value="その他" ${category === 'その他' ? 'selected' : ''}>その他</option>
            </select>
          </div>
        </div>
        <div class="calorie-suggestion" style="display: none;"></div>
      `;

      const nameInput = div.querySelector('.input-food-name');
      const calInput = div.querySelector('.input-food-cal');
      const catSelect = div.querySelector('.input-food-cat');
      const suggBox = div.querySelector('.calorie-suggestion');

      nameInput.addEventListener('input', () => {
        const query = nameInput.value.trim();
        if (!query) {
          suggBox.style.display = 'none';
          return;
        }
        const est = estimateFoodCalories(query);
        if (est.isFood) {
          suggBox.style.display = 'flex';
          suggBox.innerHTML = `<span>💡 推定: <strong>${est.calories} kcal</strong> (${est.unit || est.category})</span> <button type="button" class="btn-apply-sugg">適用</button>`;
          suggBox.querySelector('.btn-apply-sugg').onclick = () => {
            calInput.value = est.calories;
            catSelect.value = est.category;
            suggBox.style.display = 'none';
          };
        } else {
          suggBox.style.display = 'none';
        }
      });

      container.appendChild(div);
      if (window.lucide) window.lucide.createIcons();
    }

    handleManualSubmit(e) {
      e.preventDefault();

      const storeName = document.getElementById('manual-store').value.trim() || '店舗未登録';
      const date = document.getElementById('manual-date').value || new Date().toISOString().split('T')[0];
      const discount = Number(document.getElementById('manual-discount').value) || 0;
      const memo = document.getElementById('manual-memo').value.trim();
      const addToFridge = document.getElementById('manual-add-fridge').checked;

      const rows = document.querySelectorAll('.manual-item-row');
      const items = [];

      rows.forEach(row => {
        const name = row.querySelector('.input-food-name').value.trim();
        const price = Number(row.querySelector('.input-food-price').value) || 0;
        const calories = Number(row.querySelector('.input-food-cal').value) || 0;
        const category = row.querySelector('.input-food-cat').value;

        if (name || price > 0) {
          const isFood = category !== '日用品' && category !== 'その他';
          items.push({
            name: name || '支出品目',
            price,
            quantity: 1,
            category,
            isFood,
            calories,
            shelfLifeDays: isFood ? 4 : null
          });
        }
      });

      const totalInputAmount = Number(document.getElementById('manual-amount').value);
      const sumItemPrices = items.reduce((s, i) => s + i.price, 0);
      const finalAmount = totalInputAmount > 0 ? totalInputAmount : Math.max(0, sumItemPrices - discount);

      if (items.length === 0 && finalAmount === 0) {
        alert('金額または品目を入力してください。');
        return;
      }

      if (items.length === 0 && finalAmount > 0) {
        items.push({
          name: storeName !== '店舗未登録' ? `${storeName} での買い物` : '買い物',
          price: finalAmount,
          quantity: 1,
          category: '食費',
          isFood: true,
          calories: 300,
          shelfLifeDays: 3
        });
      }

      store.addTransaction({
        store: storeName,
        date,
        totalAmount: finalAmount,
        totalDiscount: discount,
        memo,
        items
      }, addToFridge);

      document.getElementById('manual-modal').classList.remove('active');
      this.showToast('手入力で記録を保存しました✨');
      this.switchTab('home');
    }

    showToast(message, duration = 2500) {
      const toast = document.getElementById('toast-notification');
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, duration);
    }

    compressImage(file, maxWidth = 1200, quality = 0.8) {
      return new Promise((resolve) => {
        if (!file || !file.type.startsWith('image/')) {
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            try {
              let width = img.width;
              let height = img.height;
              if (width > maxWidth || height > maxWidth) {
                if (width > height) {
                  height = Math.round((height * maxWidth) / width);
                  width = maxWidth;
                } else {
                  width = Math.round((width * maxWidth) / height);
                  height = maxWidth;
                }
              }
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);
              const compressed = canvas.toDataURL('image/jpeg', quality);
              resolve(compressed);
            } catch (err) {
              console.warn('Image compression fallback:', err);
              resolve(e.target.result);
            }
          };
          img.onerror = () => resolve(e.target.result);
          img.src = e.target.result;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    }

    async viewReceiptPhoto(txId) {
      const modal = document.getElementById('receipt-photo-modal');
      const imgEl = document.getElementById('receipt-photo-img');
      const captionEl = document.getElementById('receipt-photo-caption');
      const loadingEl = document.getElementById('receipt-photo-loading');
      if (!modal || !imgEl) return;

      const tx = store.transactions.find(t => t.id === txId);
      if (captionEl) {
        captionEl.textContent = tx ? `${tx.date} ${tx.store} (¥${tx.totalAmount.toLocaleString()})` : '';
      }

      imgEl.style.display = 'none';
      if (loadingEl) loadingEl.style.display = 'block';
      modal.classList.add('active');

      let dataUrl = tx?.receiptImage || null;
      if (!dataUrl) {
        dataUrl = await ReceiptImageDB.getImage(txId);
      }

      if (loadingEl) loadingEl.style.display = 'none';
      if (dataUrl) {
        imgEl.src = dataUrl;
        imgEl.style.display = 'inline-block';
      } else {
        if (captionEl) {
          captionEl.textContent = 'レシート画像が見つかりませんでした（保存されていないか削除されました）';
        }
      }

      if (window.lucide) window.lucide.createIcons();
    }

    showImageModal(dataUrl, title = '') {
      const modal = document.getElementById('receipt-photo-modal');
      const imgEl = document.getElementById('receipt-photo-img');
      const captionEl = document.getElementById('receipt-photo-caption');
      const loadingEl = document.getElementById('receipt-photo-loading');
      if (!modal || !imgEl) return;

      if (loadingEl) loadingEl.style.display = 'none';
      if (captionEl) captionEl.textContent = title;
      imgEl.src = dataUrl;
      imgEl.style.display = 'inline-block';
      modal.classList.add('active');
      if (window.lucide) window.lucide.createIcons();
    }

    openEditTxModal(txId) {
      const tx = store.transactions.find(t => t.id === txId);
      if (!tx) return;

      const modal = document.getElementById('edit-tx-modal');
      if (!modal) return;

      document.getElementById('edit-tx-id').value = tx.id;
      document.getElementById('edit-tx-date').value = tx.date;
      document.getElementById('edit-tx-store').value = tx.store;
      document.getElementById('edit-tx-discount').value = tx.totalDiscount || 0;
      document.getElementById('edit-tx-memo').value = tx.memo || '';

      const container = document.getElementById('edit-tx-items-container');
      container.innerHTML = '';

      if (tx.items && tx.items.length > 0) {
        tx.items.forEach(item => {
          this.addEditTxItemRow(item.name, item.price, item.calories, item.category);
        });
      } else {
        this.addEditTxItemRow('', tx.totalAmount, tx.totalCalories, tx.category);
      }

      this.updateEditTxSummary();
      modal.classList.add('active');
      if (window.lucide) window.lucide.createIcons();
    }

    addEditTxItemRow(name = '', price = '', calories = '', category = '主食') {
      const container = document.getElementById('edit-tx-items-container');
      if (!container) return;

      const rowId = 'edit_row_' + Math.random().toString(36).substr(2, 6);
      const div = document.createElement('div');
      div.className = 'manual-item-row';
      div.id = rowId;
      div.innerHTML = `
        <div class="manual-row-top">
          <input type="text" class="input-food-name" placeholder="食品名 (例: おにぎり, 牛乳)" value="${this.escapeHtml(name)}">
          <button type="button" class="btn-icon-subtle text-danger" onclick="document.getElementById('${rowId}').remove(); window.appUI.updateEditTxSummary();" title="この品目を削除">
            <i data-lucide="minus-circle"></i>
          </button>
        </div>
        <div class="manual-row-bottom">
          <div class="manual-field">
            <span class="manual-field-label">金額(円)</span>
            <input type="number" class="input-food-price" placeholder="¥ 0" value="${price}">
          </div>
          <div class="manual-field">
            <span class="manual-field-label">カロリー</span>
            <input type="number" class="input-food-cal" placeholder="kcal" value="${calories}">
          </div>
          <div class="manual-field">
            <span class="manual-field-label">種別</span>
            <select class="input-food-cat">
              <option value="主食" ${category === '主食' ? 'selected' : ''}>主食</option>
              <option value="お肉・魚" ${category === 'お肉・魚' ? 'selected' : ''}>肉・魚</option>
              <option value="野菜・果物" ${category === '野菜・果物' ? 'selected' : ''}>野菜・果物</option>
              <option value="乳製品・飲料" ${category === '乳製品・飲料' ? 'selected' : ''}>飲料・乳</option>
              <option value="惣菜・お弁当" ${category === '惣菜・お弁当' ? 'selected' : ''}>惣菜・弁当</option>
              <option value="お菓子・スイーツ" ${category === 'お菓子・スイーツ' ? 'selected' : ''}>お菓子</option>
              <option value="日用品" ${category === '日用品' ? 'selected' : ''}>日用品</option>
              <option value="その他" ${category === 'その他' ? 'selected' : ''}>その他</option>
            </select>
          </div>
        </div>
      `;
      container.appendChild(div);

      const nameInput = div.querySelector('.input-food-name');
      const priceInput = div.querySelector('.input-food-price');
      const calInput = div.querySelector('.input-food-cal');
      const catSelect = div.querySelector('.input-food-cat');

      nameInput.addEventListener('blur', () => {
        if (!calInput.value && nameInput.value) {
          const est = estimateFoodCalories(nameInput.value);
          if (est.isFood) {
            calInput.value = est.calories;
            catSelect.value = est.category;
            this.updateEditTxSummary();
          }
        }
      });

      priceInput.addEventListener('input', () => this.updateEditTxSummary());
      calInput.addEventListener('input', () => this.updateEditTxSummary());

      if (window.lucide) window.lucide.createIcons();
      this.updateEditTxSummary();
    }

    updateEditTxSummary() {
      const container = document.getElementById('edit-tx-items-container');
      if (!container) return;

      const discount = Number(document.getElementById('edit-tx-discount')?.value) || 0;
      let totalAmount = 0;
      let totalCalories = 0;

      container.querySelectorAll('.manual-item-row').forEach(row => {
        const price = Number(row.querySelector('.input-food-price')?.value) || 0;
        const cal = Number(row.querySelector('.input-food-cal')?.value) || 0;
        totalAmount += price;
        totalCalories += cal;
      });

      const finalAmount = Math.max(0, totalAmount - discount);
      const priceEl = document.getElementById('edit-tx-summary-price');
      const calEl = document.getElementById('edit-tx-summary-cal');

      if (priceEl) priceEl.textContent = `合計: ¥${finalAmount.toLocaleString()}`;
      if (calEl) calEl.innerHTML = `<i data-lucide="flame"></i> ${totalCalories.toLocaleString()} kcal`;
      if (window.lucide) window.lucide.createIcons();
    }

    handleEditTxSubmit(e) {
      e.preventDefault();
      const txId = document.getElementById('edit-tx-id').value;
      if (!txId) return;

      const date = document.getElementById('edit-tx-date').value || new Date().toISOString().split('T')[0];
      const storeName = document.getElementById('edit-tx-store').value.trim() || '店舗未登録';
      const discount = Number(document.getElementById('edit-tx-discount').value) || 0;
      const memo = document.getElementById('edit-tx-memo').value.trim();

      const items = [];
      document.querySelectorAll('#edit-tx-items-container .manual-item-row').forEach(row => {
        const name = row.querySelector('.input-food-name').value.trim();
        const price = Number(row.querySelector('.input-food-price').value) || 0;
        const calories = Number(row.querySelector('.input-food-cal').value) || 0;
        const category = row.querySelector('.input-food-cat').value;

        if (name || price > 0) {
          items.push({
            name: name || '品目',
            price,
            calories,
            category,
            isFood: category !== '日用品' && category !== 'その他'
          });
        }
      });

      if (items.length === 0) {
        alert('品目を少なくとも1件登録してください。');
        return;
      }

      store.updateTransaction(txId, {
        date,
        store: storeName,
        totalDiscount: discount,
        memo,
        items
      });

      const modal = document.getElementById('edit-tx-modal');
      if (modal) modal.classList.remove('active');

      this.showToast('記録と品目を更新しました✨');
      this.renderHome();
      this.renderHistory();
      this.renderStats();
    }

    fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    getOffsetDateStr(offsetDays) {
      const d = new Date();
      d.setDate(d.getDate() + offsetDays);
      return d.toISOString().split('T')[0];
    }
  }

  const appUI = new AppUI();
  window.appUI = appUI;
  window.switchTab = (tab) => appUI.switchTab(tab);
  window.setPeriod = (period, btn) => {
    document.querySelectorAll('.period-pill').forEach(p => p.classList.remove('active'));
    if (btn) btn.classList.add('active');
    appUI.currentPeriod = period;
    appUI.renderStats();
  };

  /* ==========================================================================
     6. アプリケーション起動
     ========================================================================== */
  function startApplication() {
    console.log('Starting SmartKakeibo App...');
    try {
      appUI.init();
      if (window.lucide) {
        window.lucide.createIcons();
      }
      console.log('SmartKakeibo initialized successfully.');
    } catch (err) {
      console.error('Initialization error:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApplication);
  } else {
    startApplication();
  }

})();
