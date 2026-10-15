/**
 * SmartKakeibo - オールインワン・バンドルスクリプト
 * file:// プロトコルおよび http:// プロトコルの両方で 100% 確実に動作するように
 * 依存関係を自己完結させた完全版スクリプトです。
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. 食品データベース & 賞味期限・カテゴリ判定モジュール
     ========================================================================== */
  const FOOD_DATABASE = [
    // 主食・パン・麺
    { name: 'おにぎり', category: '主食', shelfLifeDays: 1 },
    { name: '白米', category: '主食', shelfLifeDays: 2 },
    { name: '食パン', category: '主食', shelfLifeDays: 4 },
    { name: '菓子パン', category: '主食', shelfLifeDays: 3 },
    { name: 'クロワッサン', category: '主食', shelfLifeDays: 3 },
    { name: 'うどん', category: '主食', shelfLifeDays: 5 },
    { name: 'そば', category: '主食', shelfLifeDays: 5 },
    { name: 'パスタ・スパゲッティ', category: '主食', shelfLifeDays: 365 },
    { name: 'カップ麺・ラーメン', category: '主食', shelfLifeDays: 180 },
    { name: '冷凍チャーハン', category: '主食', shelfLifeDays: 90 },

    // 肉・魚・卵・大豆
    { name: '鶏むね肉', category: 'お肉・魚', shelfLifeDays: 2 },
    { name: '鶏もも肉', category: 'お肉・魚', shelfLifeDays: 2 },
    { name: '豚バラ肉', category: 'お肉・魚', shelfLifeDays: 3 },
    { name: '豚こま肉', category: 'お肉・魚', shelfLifeDays: 3 },
    { name: '牛切り落とし', category: 'お肉・魚', shelfLifeDays: 3 },
    { name: '挽肉・ひき肉', category: 'お肉・魚', shelfLifeDays: 2 },
    { name: 'サーモン・鮭', category: 'お肉・魚', shelfLifeDays: 2 },
    { name: 'マグロ刺身', category: 'お肉・魚', shelfLifeDays: 1 },
    { name: 'サバ・塩サバ', category: 'お肉・魚', shelfLifeDays: 2 },
    { name: 'たまご・卵', category: 'お肉・魚', shelfLifeDays: 14 },
    { name: '納豆', category: 'お肉・魚', shelfLifeDays: 10 },
    { name: '豆腐・木綿豆腐', category: 'お肉・魚', shelfLifeDays: 5 },
    { name: 'ウインナー・ソーセージ', category: 'お肉・魚', shelfLifeDays: 14 },
    { name: 'ハム・ベーコン', category: 'お肉・魚', shelfLifeDays: 10 },

    // 野菜・きのこ・果物
    { name: 'キャベツ', category: '野菜・果物', shelfLifeDays: 7 },
    { name: 'レタス', category: '野菜・果物', shelfLifeDays: 4 },
    { name: 'トマト', category: '野菜・果物', shelfLifeDays: 5 },
    { name: 'ミニトマト', category: '野菜・果物', shelfLifeDays: 6 },
    { name: '玉ねぎ', category: '野菜・果物', shelfLifeDays: 14 },
    { name: 'にんじん', category: '野菜・果物', shelfLifeDays: 14 },
    { name: 'じゃがいも', category: '野菜・果物', shelfLifeDays: 20 },
    { name: 'きゅうり', category: '野菜・果物', shelfLifeDays: 5 },
    { name: 'ブロッコリー', category: '野菜・果物', shelfLifeDays: 4 },
    { name: 'もやし', category: '野菜・果物', shelfLifeDays: 2 },
    { name: 'しめじ・きのこ', category: '野菜・果物', shelfLifeDays: 5 },
    { name: 'バナナ', category: '野菜・果物', shelfLifeDays: 4 },
    { name: 'りんご', category: '野菜・果物', shelfLifeDays: 14 },
    { name: 'アボカド', category: '野菜・果物', shelfLifeDays: 4 },

    // 乳製品・飲料
    { name: '牛乳', category: '乳製品・飲料', shelfLifeDays: 7 },
    { name: 'ヨーグルト', category: '乳製品・飲料', shelfLifeDays: 10 },
    { name: 'スライスチーズ', category: '乳製品・飲料', shelfLifeDays: 30 },
    { name: 'バター', category: '乳製品・飲料', shelfLifeDays: 60 },
    { name: '緑茶・お茶', category: '乳製品・飲料', shelfLifeDays: 180 },
    { name: 'コーヒー・カフェラテ', category: '乳製品・飲料', shelfLifeDays: 60 },
    { name: '野菜ジュース', category: '乳製品・飲料', shelfLifeDays: 90 },
    { name: 'ビール', category: '乳製品・飲料', shelfLifeDays: 180 },
    { name: 'チューハイ・サワー', category: '乳製品・飲料', shelfLifeDays: 180 },

    // 惣菜・お弁当・外食
    { name: 'から揚げ・唐揚げ', category: '惣菜・お弁当', shelfLifeDays: 1 },
    { name: 'コロッケ', category: '惣菜・お弁当', shelfLifeDays: 1 },
    { name: 'とんかつ', category: '惣菜・お弁当', shelfLifeDays: 1 },
    { name: '幕の内弁当', category: '惣菜・お弁当', shelfLifeDays: 1 },
    { name: 'ハンバーガー', category: '惣菜・お弁当', shelfLifeDays: 1 },
    { name: 'ポテトフライ', category: '惣菜・お弁当', shelfLifeDays: 1 },
    { name: '牛丼', category: '惣菜・お弁当', shelfLifeDays: 1 },
    { name: 'ラーメン(外食)', category: '惣菜・お弁当', shelfLifeDays: 1 },
    { name: 'パスタ・ピザ(外食)', category: '惣菜・お弁当', shelfLifeDays: 1 },
    { name: '寿司盛り合わせ', category: '惣菜・お弁当', shelfLifeDays: 1 },

    // お菓子・スイーツ
    { name: 'ポテトチップス', category: 'お菓子・スイーツ', shelfLifeDays: 90 },
    { name: 'チョコレート', category: 'お菓子・スイーツ', shelfLifeDays: 120 },
    { name: 'クッキー・ビスケット', category: 'お菓子・スイーツ', shelfLifeDays: 90 },
    { name: 'アイスクリーム', category: 'お菓子・スイーツ', shelfLifeDays: 180 },
    { name: 'シュークリーム', category: 'お菓子・スイーツ', shelfLifeDays: 2 },
    { name: 'プリン', category: 'お菓子・スイーツ', shelfLifeDays: 5 }
  ];

  /* ==========================================================================
     2. IndexedDB 画像キャッシュ (レシート原本写真用)
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

  /* ==========================================================================
     3. 家計簿 & 冷蔵庫ストック データストア
     ========================================================================== */
  const STORAGE_KEYS = {
    TRANSACTIONS: 'smart_kakeibo_transactions_v2',
    FRIDGE_STOCK: 'smart_kakeibo_fridge_v2',
    SETTINGS: 'smart_kakeibo_settings_v2'
  };

  const DEFAULT_SETTINGS = {
    geminiApiKey: '',
    monthlyBudget: 75000,
    useDemoScanner: true,
    saveReceiptPhotos: false
  };

  class KakeiboStore {
    constructor() {
      this.transactions = [];
      this.fridgeItems = [];
      this.settings = { ...DEFAULT_SETTINGS };
      this.listeners = new Set();
      this.init();
    }

    init() {
      try {
        const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS) || localStorage.getItem('smart_kakeibo_settings_v1');
        if (savedSettings) {
          this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
        }
      } catch (err) {
        console.warn('Settings load error:', err);
      }

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

        return {
          id: 'item_' + Math.random().toString(36).substr(2, 7),
          name: item.name,
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1,
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

    deleteTransaction(id) {
      const target = this.transactions.find(t => t.id === id);
      if (target && target.imageId) {
        ReceiptImageDB.deleteImage(target.imageId);
      }
      this.transactions = this.transactions.filter(t => t.id !== id);
      this.saveTransactions();
    }

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
      const totalDiscount = filtered.reduce((sum, t) => sum + (t.totalDiscount || 0), 0);
      const transactionCount = filtered.length;
      const avgSpendPerShop = transactionCount > 0 ? Math.round(totalExpense / transactionCount) : 0;

      const categoryTotals = {};
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

      const catEntries = Object.entries(categoryTotals).filter(([, val]) => val > 0);
      catEntries.sort((a, b) => b[1] - a[1]);
      const topCategories = catEntries.slice(0, 3).map(([name, amount]) => ({
        name,
        amount,
        pct: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0
      }));

      let timelineLabels = [];
      let timelineExpenses = [];

      if (period === 'monthly') {
        const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
          const dStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          timelineLabels.push(`${day}日`);
          const dayTxs = filtered.filter(t => t.date === dStr);
          timelineExpenses.push(dayTxs.reduce((sum, t) => sum + t.totalAmount, 0));
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
        { id: 'fridge_demo_1', name: 'もやし 1袋', category: '野菜・果物', addedDate: formatPast(0), expiryDate: formatOffset(1), isConsumed: false },
        { id: 'fridge_demo_2', name: '国産 豚ロース生姜焼き用', category: 'お肉・魚', addedDate: formatPast(0), expiryDate: formatOffset(2), isConsumed: false },
        { id: 'fridge_demo_3', name: '長ネギ 2本入', category: '野菜・果物', addedDate: formatPast(0), expiryDate: formatOffset(4), isConsumed: false },
        { id: 'fridge_demo_4', name: '北海道牛乳 1000ml', category: '乳製品・飲料', addedDate: formatPast(0), expiryDate: formatOffset(5), isConsumed: false },
        { id: 'fridge_demo_5', name: '卵 10個入', category: 'お肉・魚', addedDate: formatPast(2), expiryDate: formatOffset(10), isConsumed: false }
      ];
    }

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

    loadDemoData() {
      this.transactions = this.generateInitialDemoData();
      this.fridgeItems = this.generateInitialFridgeData();
      this.saveTransactions();
      this.saveFridge();
      this.notify();
    }
  }

  const store = new KakeiboStore();

  /* ==========================================================================
     4. Gemini API レシート画像解析 & デモスキャナー
     ========================================================================== */
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

  // 利用可能なGeminiモデル（実在する高精度＆最速モデル順）
  const CANDIDATE_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.5-flash-lite',
    'gemini-1.5-flash'
  ];

  const PREFERRED_MODEL_KEY = 'smart_kakeibo_preferred_model';

  function getOrderedCandidateModels() {
    try {
      const preferred = localStorage.getItem(PREFERRED_MODEL_KEY);
      if (preferred && CANDIDATE_MODELS.includes(preferred)) {
        return [preferred, ...CANDIDATE_MODELS.filter(m => m !== preferred)];
      }
    } catch (e) {}
    return [...CANDIDATE_MODELS];
  }

  function sanitizeApiKey(key) {
    return (key || '')
      .trim()
      .replace(/^["']|["']$/g, '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '');
  }

  function formatGeminiErrorMessage(status, rawMessage = '') {
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

  async function testGeminiApiKey(rawApiKey) {
    const apiKey = sanitizeApiKey(rawApiKey);
    if (!apiKey) {
      return { ok: false, message: 'APIキーが入力されていません。' };
    }

    let lastError = null;
    const models = getOrderedCandidateModels();

    for (const modelName of models) {
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

        try {
          localStorage.setItem(PREFERRED_MODEL_KEY, modelName);
        } catch (e) {}

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

  async function parseReceiptWithGemini(base64Image, mimeType = 'image/jpeg', rawApiKey = '') {
    const apiKey = sanitizeApiKey(rawApiKey);
    if (!apiKey) {
      throw new Error('Gemini APIキーが設定されていません。設定画面でAPIキーを入力するか、デモモードをご利用ください。');
    }

    const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
    let lastError = null;
    const models = getOrderedCandidateModels();

    for (const modelName of models) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

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
            temperature: 0.0,
            responseMimeType: 'application/json',
            responseSchema,
            // レシートOCRの即答化（thinkingBudget: 0 で思考遅延を完全排除）
            thinkingConfig: {
              thinkingBudget: 0
            }
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

        if (!response.ok && response.status === 400) {
          console.warn('Request failed with 400, falling back without thinkingConfig/responseSchema');
          delete requestBody.generationConfig.thinkingConfig;
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
        if (!text) throw new Error('Gemini APIから応答が得られませんでした。');

        try {
          localStorage.setItem(PREFERRED_MODEL_KEY, modelName);
        } catch (e) {}

        let cleaned = text.trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
        else if (cleaned.startsWith('```')) cleaned = cleaned.substring(3);
        if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);
        cleaned = cleaned.trim();

        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }

        const data = JSON.parse(cleaned);
        let items = (data.items || []).map(item => {
          let isFood = item.isFood;
          let category = item.category || 'その他';
          if (isFood === undefined) isFood = category !== '日用品' && category !== 'その他';
          return {
            name: item.name || '商品',
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1,
            isFood: !!isFood,
            category,
            shelfLifeDays: item.shelfLifeDays || 3
          };
        });

        const rawTotalAmount = Number(data.totalAmount) || 0;
        const totalDiscount = Number(data.totalDiscount) || 0;
        const itemsSum = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

        // 外税レシート自動検知＆税込自動換算
        const effectiveTotalBeforeDiscount = rawTotalAmount > 0 ? (rawTotalAmount + totalDiscount) : 0;
        if (itemsSum > 0 && effectiveTotalBeforeDiscount > 0) {
          const taxRatio = effectiveTotalBeforeDiscount / itemsSum;
          // 比率が 1.055 〜 1.13 の範囲にある場合、各品目が税抜で印字されていたと判定
          if (taxRatio >= 1.055 && taxRatio <= 1.13) {
            console.log(`[Receipt] 外税レシートを検知（税率比率: ${taxRatio.toFixed(3)}）。品目を税込金額に自動換算します。`);
            let runningSum = 0;
            items = items.map(item => {
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
      } catch (err) {
        console.warn(`Model ${modelName} failed:`, err);
        lastError = err;
        if (err.message && (err.message.includes('APIキーが無効') || err.message.includes('400') || err.message.includes('403'))) {
          throw err;
        }
      }
    }
    throw lastError || new Error('レシートの解析に失敗しました。');
  }

  const DEMO_RECEIPTS = [
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

  async function simulateReceiptScan(demoIndex = 0) {
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

  /* ==========================================================================
     5. Chart.js 可視化モジュール
     ========================================================================== */
  let timelineChartInstance = null;
  let expenseBreakdownChartInstance = null;

  const CATEGORY_COLORS = {
    '主食': '#10B981',
    'お肉・魚': '#F43F5E',
    '野菜・果物': '#84CC16',
    '乳製品・飲料': '#06B6D4',
    '惣菜・お弁当': '#F59E0B',
    'お菓子・スイーツ': '#EC4899',
    '日用品': '#8B5CF6',
    '外食': '#EF4444',
    'その他': '#94A3B8'
  };

  function renderCharts(stats) {
    renderTimelineChart(stats);
    renderExpenseBreakdownChart(stats);
    renderCategoryList(stats);
    renderStoreRanking(stats);
  }

  function renderTimelineChart(stats) {
    const canvas = document.getElementById('timeline-chart');
    if (!canvas || !window.Chart) return;

    if (timelineChartInstance) {
      timelineChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    const expenseGrad = ctx.createLinearGradient(0, 0, 0, 220);
    expenseGrad.addColorStop(0, 'rgba(16, 185, 129, 0.7)');
    expenseGrad.addColorStop(1, 'rgba(16, 185, 129, 0.15)');

    timelineChartInstance = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: stats.timeline.labels,
        datasets: [{
          label: '支出 (円)',
          data: stats.timeline.expenses,
          backgroundColor: expenseGrad,
          borderColor: '#10B981',
          borderWidth: 2,
          borderRadius: 6,
          hoverBackgroundColor: '#10B981'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            padding: 10,
            titleFont: { size: 12, weight: 'bold' },
            bodyFont: { size: 12 },
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => ` 支出: ¥${(ctx.parsed.y || 0).toLocaleString()}`
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#94A3B8', font: { size: 10 } } },
          y: {
            type: 'linear',
            beginAtZero: true,
            grid: { color: 'rgba(226, 232, 240, 0.6)' },
            ticks: {
              color: '#64748B',
              font: { size: 10 },
              callback: (v) => '¥' + (v >= 1000 ? (v / 1000) + 'k' : v)
            }
          }
        }
      }
    });
  }

  function renderExpenseBreakdownChart(stats) {
    const canvas = document.getElementById('expense-breakdown-chart');
    if (!canvas || !window.Chart) return;

    if (expenseBreakdownChartInstance) {
      expenseBreakdownChartInstance.destroy();
    }

    const entries = Object.entries(stats.categoryTotals || {}).filter(([, v]) => v > 0);
    entries.sort((a, b) => b[1] - a[1]);

    let labels = entries.map(([k]) => k);
    let data = entries.map(([, v]) => v);

    if (data.length === 0) {
      labels = ['支出なし'];
      data = [1];
    }

    const colors = labels.map(label => CATEGORY_COLORS[label] || '#94A3B8');
    const ctx = canvas.getContext('2d');

    expenseBreakdownChartInstance = new window.Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#FFFFFF',
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 10,
              usePointStyle: true,
              color: '#64748B',
              font: { size: 11, weight: '600' }
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const label = ctx.label || '';
                const val = ctx.parsed || 0;
                const total = data.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                return ` ${label}: ¥${val.toLocaleString()} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  function renderCategoryList(stats) {
    const container = document.getElementById('stats-category-list');
    if (!container) return;

    const entries = Object.entries(stats.categoryTotals || {}).filter(([, v]) => v > 0);
    entries.sort((a, b) => b[1] - a[1]);

    if (entries.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 12px; padding: 12px;">データがありません</div>`;
      return;
    }

    const total = stats.totalExpense || 1;

    container.innerHTML = entries.map(([cat, amount]) => {
      const color = CATEGORY_COLORS[cat] || '#94A3B8';
      const pct = Math.round((amount / total) * 100);
      return `
        <div class="stats-cat-item">
          <div class="stats-cat-left">
            <span class="stats-cat-badge-dot" style="background-color: ${color};"></span>
            <span>${cat}</span>
          </div>
          <div class="stats-cat-right">
            <span class="stats-cat-amount">¥${amount.toLocaleString()}</span>
            <span class="stats-cat-pct">(${pct}%)</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderStoreRanking(stats) {
    const container = document.getElementById('stats-store-ranking-list');
    if (!container) return;

    const entries = Object.entries(stats.storeTotals || {}).filter(([, d]) => d.amount > 0);
    entries.sort((a, b) => b[1].amount - a[1].amount);

    if (entries.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 12px; padding: 12px;">店舗記録がありません</div>`;
      return;
    }

    const top5 = entries.slice(0, 5);

    container.innerHTML = top5.map(([storeName, data], idx) => {
      const rankClass = idx === 0 ? 'top1' : idx === 1 ? 'top2' : idx === 2 ? 'top3' : '';
      return `
        <div class="stats-store-item">
          <div class="stats-store-info">
            <span class="stats-store-rank ${rankClass}">${idx + 1}</span>
            <span class="stats-store-name">${storeName}</span>
            <span class="stats-store-count">(${data.count}回)</span>
          </div>
          <div class="stats-store-amount">¥${data.amount.toLocaleString()}</div>
        </div>
      `;
    }).join('');
  }

  /* ==========================================================================
     6. UIコントローラー (AppUI)
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
      const fileInput = document.getElementById('receipt-file-input');
      if (fileInput) {
        fileInput.addEventListener('change', (e) => this.handleReceiptUpload(e));
      }

      const saveScanBtn = document.getElementById('save-scan-btn');
      if (saveScanBtn) {
        saveScanBtn.addEventListener('click', () => this.handleSaveScannedDraft());
      }

      const cancelScanBtn = document.getElementById('cancel-scan-btn');
      if (cancelScanBtn) {
        cancelScanBtn.addEventListener('click', () => this.closeScanModal());
      }

      // スキャン結果モーダルの合計金額・値引き手動変更リスナー
      const draftTotalInput = document.getElementById('draft-total-amount');
      if (draftTotalInput) {
        draftTotalInput.addEventListener('input', () => this.renderDraftItems(false));
      }
      const draftDiscountInput = document.getElementById('draft-discount');
      if (draftDiscountInput) {
        draftDiscountInput.addEventListener('input', () => this.renderDraftItems(false));
      }

      const manualForm = document.getElementById('manual-entry-form');
      if (manualForm) {
        manualForm.addEventListener('submit', (e) => this.handleManualSubmit(e));
      }

      const manualAddBtn = document.getElementById('manual-add-item-btn');
      if (manualAddBtn) {
        manualAddBtn.addEventListener('click', () => this.addManualItemRow());
      }

      const editForm = document.getElementById('edit-tx-form');
      if (editForm) {
        editForm.addEventListener('submit', (e) => this.handleEditTxSubmit(e));
      }

      const editAddBtn = document.getElementById('edit-tx-add-item-btn');
      if (editAddBtn) {
        editAddBtn.addEventListener('click', () => this.addEditTxItemRow());
      }

      const settingsForm = document.getElementById('settings-form');
      if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const rawKey = document.getElementById('cfg-api-key').value;
          const apiKey = sanitizeApiKey(rawKey);
          document.getElementById('cfg-api-key').value = apiKey;
          const budget = Number(document.getElementById('cfg-budget').value) || 75000;
          const savePhoto = document.getElementById('cfg-save-photo') ? document.getElementById('cfg-save-photo').checked : false;
          store.saveSettings({
            geminiApiKey: apiKey,
            monthlyBudget: budget,
            saveReceiptPhotos: savePhoto
          });
          this.showToast(apiKey ? '設定を保存しました✨（Gemini AIが有効です）' : '設定を保存しました（デモモードで動作します）');
        });
      }

      // APIキーの表示・非表示切り替え
      const toggleKeyBtn = document.getElementById('btn-toggle-cfg-key');
      const apiKeyInput = document.getElementById('cfg-api-key');
      if (toggleKeyBtn && apiKeyInput) {
        toggleKeyBtn.addEventListener('click', () => {
          if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            toggleKeyBtn.innerHTML = '<i data-lucide="eye-off"></i>';
          } else {
            apiKeyInput.type = 'password';
            toggleKeyBtn.innerHTML = '<i data-lucide="eye"></i>';
          }
          if (window.lucide) window.lucide.createIcons();
        });
      }

      // APIキー疎通テスト
      const testKeyBtn = document.getElementById('btn-test-gemini-key');
      const testResultEl = document.getElementById('cfg-api-key-test-result');
      if (testKeyBtn && apiKeyInput && testResultEl) {
        testKeyBtn.addEventListener('click', async () => {
          const rawKey = apiKeyInput.value;
          const cleanKey = sanitizeApiKey(rawKey);
          apiKeyInput.value = cleanKey;

          if (!cleanKey) {
            testResultEl.className = 'api-test-result error';
            testResultEl.style.display = 'block';
            testResultEl.textContent = '⚠️ APIキーが入力されていません。Google AI Studioから取得したキーを入力してください。';
            return;
          }

          testResultEl.className = 'api-test-result loading';
          testResultEl.style.display = 'block';
          testResultEl.innerHTML = '<span class="loading-spinner-inline"></span> Gemini APIに接続テスト中...';

          try {
            const result = await testGeminiApiKey(cleanKey);
            if (result.ok) {
              testResultEl.className = 'api-test-result success';
              testResultEl.innerHTML = `✅ ${result.message}`;
            } else {
              testResultEl.className = 'api-test-result error';
              testResultEl.innerHTML = `❌ ${result.message}`;
            }
          } catch (err) {
            testResultEl.className = 'api-test-result error';
            testResultEl.textContent = `❌ 通信テスト失敗: ${err.message || err}`;
          }
        });
      }

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

      document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.classList.remove('active');
          }
        });
        modal.querySelectorAll('.modal-close-btn').forEach(btn => {
          btn.addEventListener('click', () => modal.classList.remove('active'));
        });
      });
    }

    renderAll() {
      this.renderHome();
      this.renderFridge();
      this.renderHistory();
      this.renderStats();
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
      const budgetTargetLabel = document.getElementById('home-budget-target-label');

      if (monthSpendEl) monthSpendEl.textContent = `¥${stats.totalExpense.toLocaleString()}`;
      if (monthSpendSubEl) monthSpendSubEl.textContent = `¥${stats.totalExpense.toLocaleString()}`;
      if (budgetTargetLabel) budgetTargetLabel.textContent = `予算目標: ¥${budget.toLocaleString()}`;

      if (budgetRemainEl) {
        budgetRemainEl.textContent = remaining >= 0 ? `残り ¥${remaining.toLocaleString()}` : `超過 ¥${Math.abs(remaining).toLocaleString()}`;
        budgetRemainEl.style.color = remaining >= 0 ? '#10B981' : '#EF4444';
      }
      if (budgetBarEl) {
        budgetBarEl.style.width = `${progress}%`;
        budgetBarEl.style.backgroundColor = progress > 90 ? '#EF4444' : progress > 75 ? '#F59E0B' : '#10B981';
      }

      const shopCountEl = document.getElementById('home-shopping-count');
      const avgShopEl = document.getElementById('home-avg-spend-per-shop');
      if (shopCountEl) shopCountEl.textContent = `${stats.transactionCount} 回`;
      if (avgShopEl) avgShopEl.textContent = `1回平均: ¥${stats.avgSpendPerShop.toLocaleString()}`;

      const topCatListEl = document.getElementById('home-top-categories-list');
      if (topCatListEl) {
        if (!stats.topCategories || stats.topCategories.length === 0) {
          topCatListEl.innerHTML = `<div style="font-size: 11px; color: var(--text-muted); text-align: center; padding: 6px;">今月の支出データがありません</div>`;
        } else {
          topCatListEl.innerHTML = stats.topCategories.map(cat => {
            const color = CATEGORY_COLORS[cat.name] || '#94A3B8';
            return `
              <div class="top-cat-item">
                <div class="top-cat-meta">
                  <span class="top-cat-name">
                    <span class="top-cat-dot" style="background-color: ${color};"></span>
                    ${cat.name}
                  </span>
                  <span class="top-cat-amount">¥${cat.amount.toLocaleString()} <small style="font-size: 10px; color: var(--text-muted); font-weight: normal;">(${cat.pct}%)</small></span>
                </div>
                <div class="top-cat-bar-bg">
                  <div class="top-cat-bar-fill" style="width: ${cat.pct}%; background-color: ${color};"></div>
                </div>
              </div>
            `;
          }).join('');
        }
      }

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
            <button class="alert-action-btn" onclick="document.querySelector('[data-tab=fridge]').click()">見る</button>
          `;
        } else {
          fridgeAlertBox.style.display = 'none';
        }
      }

      if (window.lucide) window.lucide.createIcons();
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
      const statAvgExpenseEl = document.getElementById('stat-avg-expense');
      const statDiscountEl = document.getElementById('stat-discount-total');
      const statCountEl = document.getElementById('stat-record-count');

      if (statExpenseEl) statExpenseEl.textContent = `¥${stats.totalExpense.toLocaleString()}`;
      if (statAvgExpenseEl) statAvgExpenseEl.textContent = `¥${stats.avgSpendPerShop.toLocaleString()}`;
      if (statDiscountEl) statDiscountEl.textContent = `累計節約: ¥${stats.totalDiscount.toLocaleString()}`;
      if (statCountEl) statCountEl.textContent = `${stats.transactionCount} 件の記録`;

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

    clearFridgeConsumed() {
      store.fridgeItems = store.fridgeItems.filter(f => !f.isConsumed);
      store.saveFridge();
      this.renderFridge();
      this.renderHome();
      this.showToast('消費済みの食品を整理しました');
    }

    clearAllFridge() {
      if (confirm('冷蔵庫を空にしますか？')) {
        store.fridgeItems = [];
        store.saveFridge();
        this.renderFridge();
        this.renderHome();
        this.showToast('冷蔵庫を空にしました');
      }
    }

    renderHistory() {
      const listEl = document.getElementById('history-list');
      if (!listEl) return;

      if (store.transactions.length === 0) {
        listEl.innerHTML = `<div class="empty-state">まだ記録がありません。</div>`;
        return;
      }

      listEl.innerHTML = store.transactions.map(tx => this.createTransactionCardHtml(tx, true)).join('');
      if (window.lucide) window.lucide.createIcons();
    }

    createTransactionCardHtml(tx, showDelete = true) {
      const dateFormatted = tx.date ? tx.date.split('-').slice(1).join('/') : '';
      const hasDiscount = (tx.totalDiscount || 0) > 0;
      const items = tx.items || [];

      return `
        <div class="tx-card">
          <div class="tx-card-header">
            <div class="tx-header-left">
              <span class="tx-date">${dateFormatted}</span>
              <span class="tx-store">${this.escapeHtml(tx.store)}</span>
            </div>
            <div class="tx-header-right">
              <span class="tx-amount">¥${(tx.totalAmount || 0).toLocaleString()}</span>
              <button type="button" class="btn-icon-subtle" onclick="event.stopPropagation(); window.appUI.openEditTxModal('${tx.id}')" title="この記録と品目を編集">
                <i data-lucide="edit-2"></i>
              </button>
              ${showDelete ? `
                <button type="button" class="btn-icon-subtle text-danger" onclick="event.stopPropagation(); window.appUI.deleteTx('${tx.id}')" title="この記録全体を削除">
                  <i data-lucide="trash-2"></i>
                </button>
              ` : ''}
            </div>
          </div>

          <div class="tx-badges">
            <span class="pill-badge count-badge">
              <i data-lucide="shopping-cart"></i> ${items.length}品
            </span>
            <span class="pill-badge cat-badge">${tx.category || 'その他'}</span>
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

          <div class="tx-items-preview">
            ${items.map((i, idx) => `
              <span class="tx-item-chip ${idx >= 3 ? 'item-hidden' : ''}" style="${idx >= 3 ? 'display: none;' : ''}" onclick="event.stopPropagation(); window.appUI.openEditTxModal('${tx.id}')" title="タップして品目を編集">
                ${this.escapeHtml(i.name)}
                <span class="chip-delete-btn" onclick="event.stopPropagation(); window.appUI.deleteTxItem('${tx.id}', '${i.id}')" title="この品目を削除">×</span>
              </span>
            `).join('')}
            ${items.length > 3 ? `
              <span class="tx-item-more" onclick="window.appUI.toggleMoreItems(this)">+他${items.length - 3}品を表示</span>
            ` : ''}
          </div>
        </div>
      `;
    }

    toggleMoreItems(target) {
      let container, moreBtn;
      if (typeof target === 'string') {
        container = document.getElementById(`items-${target}`) || document.querySelector(`[data-tx-id="${target}"] .tx-items-preview`);
        moreBtn = document.getElementById(`more-btn-${target}`);
      } else if (target && target.closest) {
        moreBtn = target;
        container = target.closest('.tx-items-preview');
      }
      if (!container) return;

      const hiddenItems = container.querySelectorAll('.item-hidden');
      if (hiddenItems.length === 0) return;
      const isCurrentlyHidden = hiddenItems[0].style.display === 'none';

      hiddenItems.forEach(el => {
        el.style.display = isCurrentlyHidden ? 'inline-flex' : 'none';
      });

      if (moreBtn) {
        moreBtn.textContent = isCurrentlyHidden ? '閉じる' : `+他${hiddenItems.length}品を表示`;
      }
    }

    deleteTx(id) {
      if (confirm('この記録を削除しますか？')) {
        store.deleteTransaction(id);
        this.showToast('記録を削除しました');
        this.renderAll();
      }
    }

    deleteTxItem(txId, itemId) {
      const tx = store.transactions.find(t => t.id === txId);
      const item = tx?.items?.find(i => i.id === itemId);
      const itemName = item ? item.name : 'この品目';

      if (confirm(`「${itemName}」を削除しますか？`)) {
        store.deleteTransactionItem(txId, itemId);
        this.showToast(`「${itemName}」を削除しました`);
        this.renderAll();
      }
    }

    renderSettings() {
      const apiKeyInput = document.getElementById('cfg-api-key');
      const budgetInput = document.getElementById('cfg-budget');
      const savePhotoInput = document.getElementById('cfg-save-photo');

      if (apiKeyInput) apiKeyInput.value = store.settings.geminiApiKey || '';
      if (budgetInput) budgetInput.value = store.settings.monthlyBudget || 75000;
      if (savePhotoInput) savePhotoInput.checked = !!store.settings.saveReceiptPhotos;
    }

    async handleReceiptUpload(e) {
      const file = e.target.files?.[0];
      if (!file) return;

      this.showScanningOverlay();

      try {
        // 高速化最適化（最大1600px・品質0.82・コントラスト補正）で文字鮮明度を保ちつつ通信量を80%削減
        const base64 = await this.compressImage(file, 1600, 0.82) || await this.fileToBase64(file);
        const apiKey = sanitizeApiKey(store.settings.geminiApiKey);

        let parsedData = null;
        if (apiKey) {
          try {
            parsedData = await parseReceiptWithGemini(base64, file.type, apiKey);
          } catch (geminiErr) {
            console.warn('Gemini API call failed, falling back to smart simulation:', geminiErr);
            this.showToast(`⚠️ AI通信エラー: ${geminiErr.message}（撮影写真は保持し、デモ解析に切り替えました）`, 8000);
            parsedData = await simulateReceiptScan(this.selectedDemoIndex++);
          }
        } else {
          parsedData = await simulateReceiptScan(this.selectedDemoIndex++);
        }

        this.scannedDraft = {
          ...parsedData,
          receiptImage: base64,
          receiptMime: file.type
        };

        this.hideScanningOverlay();
        this.openScanResultModal();
      } catch (err) {
        this.hideScanningOverlay();
        alert('レシートの読み込みに失敗しました: ' + err.message);
      } finally {
        e.target.value = '';
      }
    }

    async handleDemoScan() {
      this.showScanningOverlay();
      try {
        const parsedData = await simulateReceiptScan(this.selectedDemoIndex++);
        this.scannedDraft = {
          ...parsedData,
          receiptImage: null
        };
        this.hideScanningOverlay();
        this.openScanResultModal();
      } catch (err) {
        this.hideScanningOverlay();
        alert('デモスキャンに失敗しました: ' + err.message);
      }
    }

    openScanResultModal() {
      const modal = document.getElementById('scan-result-modal');
      if (!modal || !this.scannedDraft) return;

      document.getElementById('draft-store').value = this.scannedDraft.store || '';
      document.getElementById('draft-date').value = this.scannedDraft.date || new Date().toISOString().split('T')[0];
      document.getElementById('draft-discount').value = this.scannedDraft.totalDiscount || 0;

      const totalInput = document.getElementById('draft-total-amount');
      if (totalInput) {
        totalInput.value = this.scannedDraft.totalAmount || 0;
      }

      const previewWrap = document.getElementById('draft-image-preview-wrap');
      const previewImg = document.getElementById('draft-image-preview');
      if (previewWrap && previewImg) {
        if (this.scannedDraft.receiptImage) {
          previewImg.src = this.scannedDraft.receiptImage;
          previewWrap.style.display = 'block';
          previewImg.onclick = () => {
            this.showImageModal(this.scannedDraft.receiptImage, `${this.scannedDraft.store || 'レシート'} の原本写真`);
          };
        } else {
          previewWrap.style.display = 'none';
        }
      }

      this.renderDraftItems(false);
      modal.classList.add('active');
      if (window.lucide) window.lucide.createIcons();
    }

    renderDraftItems(syncTotalInput = false) {
      const container = document.getElementById('draft-items-list');
      if (!container || !this.scannedDraft) return;

      let itemsSum = 0;

      container.innerHTML = this.scannedDraft.items.map((item, idx) => {
        const itemPrice = (item.price || 0) * (item.quantity || 1);
        itemsSum += itemPrice;

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
                <label>金額(税込・円)</label>
                <input type="number" class="input-flat-num item-price" value="${item.price}" onchange="window.appUI.updateDraftItem(${idx}, 'price', this.value)">
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

      // 合計バッジと支払合計額のリアルタイム更新
      const totalDiscount = Number(document.getElementById('draft-discount')?.value) || 0;
      const computedTotal = Math.max(0, itemsSum - totalDiscount);

      const totalInput = document.getElementById('draft-total-amount');
      let finalAmount = computedTotal;

      if (totalInput) {
        const currentInputValue = Number(totalInput.value);
        if (syncTotalInput || (!currentInputValue && currentInputValue !== 0)) {
          totalInput.value = computedTotal;
          finalAmount = computedTotal;
        } else {
          finalAmount = currentInputValue;
        }
      }

      this.scannedDraft.totalAmount = finalAmount;

      const summaryEl = document.getElementById('draft-summary-badge');
      if (summaryEl) {
        const diff = finalAmount - computedTotal;
        let diffNotice = '';
        if (diff > 0) {
          diffNotice = `<span style="font-size: 10px; color: var(--color-primary-dark); margin-left: 6px; font-weight: 700;">(外税/消費税分: +¥${diff.toLocaleString()})</span>`;
        } else if (diff < 0) {
          diffNotice = `<span style="font-size: 10px; color: var(--text-muted); margin-left: 6px;">(品目合算: ¥${computedTotal.toLocaleString()})</span>`;
        }

        summaryEl.innerHTML = `
          <span class="badge-total-price">合計: ¥${finalAmount.toLocaleString()}</span>
          <span class="badge-item-count" id="draft-item-count"><i data-lucide="shopping-cart"></i> ${this.scannedDraft.items.length} 品目</span>
          ${diffNotice}
        `;
      }
      if (window.lucide) window.lucide.createIcons();
    }

    // 外税レシート等の全品目をワンクリックで税込(8%または10%)に換算
    applyTaxToAllDraftItems(taxPercent = 8) {
      if (!this.scannedDraft || !this.scannedDraft.items || !this.scannedDraft.items.length) return;
      const rate = 1 + (taxPercent / 100);
      this.scannedDraft.items.forEach(item => {
        item.price = Math.round((Number(item.price) || 0) * rate);
      });
      this.renderDraftItems(true);
      this.showToast(`全品目の金額に消費税(${taxPercent}%)を一括適用しました✨`);
    }

    updateDraftItem(idx, field, value) {
      if (!this.scannedDraft || !this.scannedDraft.items[idx]) return;
      const item = this.scannedDraft.items[idx];

      if (field === 'price') {
        item[field] = Number(value) || 0;
      } else if (field === 'name') {
        item.name = value;
      } else if (field === 'category') {
        item.category = value;
        item.isFood = value !== '日用品' && value !== 'その他';
      }

      this.renderDraftItems(false);
    }

    removeDraftItem(idx) {
      if (!this.scannedDraft || !this.scannedDraft.items) return;
      this.scannedDraft.items.splice(idx, 1);
      this.renderDraftItems(true);
    }

    async handleSaveScannedDraft() {
      if (!this.scannedDraft) return;

      const storeName = document.getElementById('draft-store').value.trim() || '店舗未記入';
      const date = document.getElementById('draft-date').value || new Date().toISOString().split('T')[0];
      const discount = Number(document.getElementById('draft-discount').value) || 0;
      const totalInput = document.getElementById('draft-total-amount');
      const addToFridge = document.getElementById('draft-add-fridge').checked;
      const savePhoto = document.getElementById('draft-save-photo') ? document.getElementById('draft-save-photo').checked : false;

      this.scannedDraft.store = storeName;
      this.scannedDraft.date = date;
      this.scannedDraft.totalDiscount = discount;
      if (totalInput && totalInput.value) {
        this.scannedDraft.totalAmount = Number(totalInput.value) || this.scannedDraft.totalAmount;
      }

      let imageId = null;
      if (savePhoto && this.scannedDraft.receiptImage) {
        imageId = 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        await ReceiptImageDB.saveImage(imageId, this.scannedDraft.receiptImage);
      }

      const txRecord = {
        store: storeName,
        date,
        totalAmount: this.scannedDraft.totalAmount,
        totalDiscount: discount,
        category: this.scannedDraft.items[0]?.category || 'その他',
        items: this.scannedDraft.items,
        memo: 'レシートAI自動解析による記録',
        hasImage: !!imageId,
        imageId: imageId
      };

      store.addTransaction(txRecord, addToFridge);

      this.closeScanModal();
      this.showToast('レシートから家計簿に記録しました✨');
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

    addManualItemRow(name = '', price = '', category = '主食') {
      const container = document.getElementById('manual-items-container');
      if (!container) return;

      const rowId = 'row_' + Math.random().toString(36).substr(2, 6);
      const div = document.createElement('div');
      div.className = 'manual-item-row';
      div.id = rowId;
      div.innerHTML = `
        <div class="manual-row-top">
          <input type="text" class="input-food-name" placeholder="商品名 (例: 牛乳, パン, 洗剤)" value="${this.escapeHtml(name)}">
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
        const category = row.querySelector('.input-food-cat').value;

        if (name || price > 0) {
          const isFood = category !== '日用品' && category !== 'その他';
          items.push({
            name: name || '支出品目',
            price,
            category,
            isFood,
            shelfLifeDays: 3
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
          this.addEditTxItemRow(item.name, item.price, item.category, item.id);
        });
      } else {
        this.addEditTxItemRow('', tx.totalAmount, tx.category);
      }

      this.updateEditTxSummary();
      modal.classList.add('active');
      if (window.lucide) window.lucide.createIcons();
    }

    addEditTxItemRow(name = '', price = '', category = '主食', itemId = null) {
      const container = document.getElementById('edit-tx-items-container');
      if (!container) return;

      const rowId = 'edit_row_' + Math.random().toString(36).substr(2, 6);
      const div = document.createElement('div');
      div.className = 'manual-item-row';
      div.id = rowId;
      if (itemId) div.dataset.itemId = itemId;

      div.innerHTML = `
        <div class="manual-row-top">
          <input type="text" class="input-food-name" placeholder="商品名 (例: 牛乳, パン, 洗剤)" value="${this.escapeHtml(name)}">
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

      const priceInput = div.querySelector('.input-food-price');
      priceInput.addEventListener('input', () => this.updateEditTxSummary());

      if (window.lucide) window.lucide.createIcons();
      this.updateEditTxSummary();
    }

    updateEditTxSummary() {
      const container = document.getElementById('edit-tx-items-container');
      if (!container) return;

      const discount = Number(document.getElementById('edit-tx-discount')?.value) || 0;
      let totalAmount = 0;
      const rows = container.querySelectorAll('.manual-item-row');

      rows.forEach(row => {
        const price = Number(row.querySelector('.input-food-price')?.value) || 0;
        totalAmount += price;
      });

      const finalAmount = Math.max(0, totalAmount - discount);
      const priceEl = document.getElementById('edit-tx-summary-price');
      const countEl = document.getElementById('edit-tx-summary-count');

      if (priceEl) priceEl.textContent = `合計: ¥${finalAmount.toLocaleString()}`;
      if (countEl) countEl.innerHTML = `<i data-lucide="shopping-cart"></i> ${rows.length} 品`;
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
        const category = row.querySelector('.input-food-cat').value;
        const itemId = row.dataset.itemId;

        if (name || price > 0) {
          items.push({
            ...(itemId ? { id: itemId } : {}),
            name: name || '品目',
            price,
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
      this.renderAll();
    }

    async viewReceiptPhoto(txId) {
      const tx = store.transactions.find(t => t.id === txId);
      if (!tx) return;

      const modal = document.getElementById('receipt-photo-modal');
      const img = document.getElementById('receipt-photo-img');
      const loading = document.getElementById('receipt-photo-loading');
      const caption = document.getElementById('receipt-photo-caption');

      if (!modal || !img) return;

      img.style.display = 'none';
      if (loading) loading.style.display = 'block';
      if (caption) caption.textContent = `${tx.date} ${tx.store} (¥${tx.totalAmount.toLocaleString()})`;

      modal.classList.add('active');

      let dataUrl = tx.receiptImage || null;
      if (!dataUrl && tx.imageId) {
        dataUrl = await ReceiptImageDB.getImage(tx.imageId);
      }

      if (loading) loading.style.display = 'none';
      if (dataUrl) {
        img.src = dataUrl;
        img.style.display = 'inline-block';
      } else {
        if (caption) caption.textContent = '※レシート原本写真は保存されていません（容量節約設定）';
      }
    }

    showImageModal(src, captionText = '') {
      const modal = document.getElementById('receipt-photo-modal');
      const img = document.getElementById('receipt-photo-img');
      const loading = document.getElementById('receipt-photo-loading');
      const caption = document.getElementById('receipt-photo-caption');

      if (!modal || !img) return;
      if (loading) loading.style.display = 'none';
      img.src = src;
      img.style.display = 'inline-block';
      if (caption) caption.textContent = captionText;
      modal.classList.add('active');
    }

    switchTab(tabName) {
      this.currentTab = tabName;

      document.querySelectorAll('.screen-view').forEach(screen => {
        screen.classList.remove('active');
      });

      const targetScreen = document.getElementById(`screen-${tabName}`);
      if (targetScreen) targetScreen.classList.add('active');

      document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
      });

      if (tabName === 'stats') {
        this.renderStats();
      } else if (tabName === 'home') {
        this.renderHome();
      } else if (tabName === 'fridge') {
        this.renderFridge();
      } else if (tabName === 'history') {
        this.renderHistory();
      }

      const contentScroll = document.querySelector('.app-content-scroll');
      if (contentScroll) contentScroll.scrollTop = 0;
      if (window.lucide) window.lucide.createIcons();
    }

    showScanningOverlay() {
      const overlay = document.getElementById('scanning-overlay');
      if (overlay) overlay.style.display = 'flex';
      if (window.lucide) window.lucide.createIcons();
    }

    hideScanningOverlay() {
      const overlay = document.getElementById('scanning-overlay');
      if (overlay) overlay.style.display = 'none';
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

    compressImage(file, maxDimension = 1600, quality = 0.82) {
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

              // レシートの極小文字潰れ防止と高速化:
              // 長辺が maxDimension を超える場合のみ縮小
              if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                  height = Math.round((height * maxDimension) / width);
                  width = maxDimension;
                } else {
                  width = Math.round((width * maxDimension) / height);
                  height = maxDimension;
                }
              }

              // 縦長レシートで横幅が縮みすぎて文字が潰れるのを防ぐ（幅最低750pxを確保）
              const minShortSide = 750;
              if (width < height && width < minShortSide && img.width >= minShortSide) {
                const scale = minShortSide / width;
                width = minShortSide;
                height = Math.round(height * scale);
              }

              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');

              // 感熱紙の薄い文字や背景の影をくっきり浮き立たせるコントラスト最適化
              if (ctx.filter !== undefined) {
                ctx.filter = 'contrast(1.08) brightness(1.02)';
              }

              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', quality));
            } catch (err) {
              console.warn('Image compression fallback:', err);
              resolve(e.target.result);
            }
          };
          img.onerror = () => resolve(null);
          img.src = e.target.result;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    }

    fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    getOffsetDateStr(offsetDays) {
      const d = new Date();
      d.setDate(d.getDate() + offsetDays);
      return d.toISOString().split('T')[0];
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

    clearAllData() {
      if (confirm('すべての取引履歴と冷蔵庫ストックを消去して0件にしますか？\n（この操作は元に戻せません）')) {
        store.clearAllData();
        this.renderAll();
        this.showToast('すべてのデータを初期化しました');
      }
    }

    loadDemoData() {
      if (confirm('デモ用サンプルデータを再読み込みしますか？')) {
        store.loadDemoData();
        this.renderAll();
        this.showToast('デモデータを読み込みました✨');
      }
    }
  }

  // グローバル関数公開
  window.setPeriod = function(period, el) {
    if (window.appUI) {
      window.appUI.currentPeriod = period;
      document.querySelectorAll('.period-pill').forEach(btn => btn.classList.remove('active'));
      if (el) el.classList.add('active');
      window.appUI.renderStats();
    }
  };

  // アプリ起動
  window.addEventListener('DOMContentLoaded', () => {
    window.appUI = new AppUI();
    window.appUI.init();
  });
})();
