/**
 * UI操作・レンダリング・インタラクションコントローラー
 */
import { store, ReceiptImageDB } from './store.js';
import { parseReceiptWithGemini, simulateReceiptScan, DEMO_RECEIPTS } from './gemini.js';
import { renderCharts } from './charts.js';
import { estimateFoodCalories, FOOD_DATABASE } from './calorie-db.js';

export class AppUI {
  constructor() {
    this.currentTab = 'home';
    this.currentPeriod = 'monthly'; // 'daily' | 'monthly' | 'all'
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
    // ボトムナビゲーション切り替え
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.switchTab(tab);
      });
    });

    // 期間切り替えタブ (日別 / 月別 / 累計)
    document.querySelectorAll('.period-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        document.querySelectorAll('.period-pill').forEach(p => p.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentPeriod = e.currentTarget.dataset.period;
        this.renderStats();
      });
    });

    // レシートスキャン: ファイル選択 / カメラ撮影
    const receiptInput = document.getElementById('receipt-file-input');
    if (receiptInput) {
      receiptInput.addEventListener('change', (e) => this.handleReceiptUpload(e));
    }

    // デモスキャン実行ボタン
    const demoScanBtn = document.getElementById('demo-scan-btn');
    if (demoScanBtn) {
      demoScanBtn.addEventListener('click', () => this.handleDemoScan());
    }

    // 手入力モーダル起動ボタン
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

    // スキャン結果確認ボトムシートの写真サムネイル拡大
    const draftPreviewImg = document.getElementById('draft-image-preview');
    if (draftPreviewImg) {
      draftPreviewImg.addEventListener('click', () => {
        if (this.scannedDraft && this.scannedDraft.receiptImage) {
          this.showImageModal(this.scannedDraft.receiptImage, `${this.scannedDraft.date} ${this.scannedDraft.store}`);
        }
      });
    }

    // スキャン結果確認ボトムシートの保存ボタン
    const saveScanBtn = document.getElementById('save-scan-btn');
    if (saveScanBtn) {
      saveScanBtn.addEventListener('click', () => this.saveScanDraft());
    }

    // スキャンキャンセル
    const cancelScanBtn = document.getElementById('cancel-scan-btn');
    if (cancelScanBtn) {
      cancelScanBtn.addEventListener('click', () => this.closeScanModal());
    }

    // 各種モーダルの閉じるボタン
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

    // 設定フォームの保存
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

    // PC表示用：スマホ枠とフルスクリーンの切り替え
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

    // タブ切り替え時に再描画が必要な場合
    if (tabName === 'stats' || tabName === 'home') {
      this.renderStats();
    }
    if (tabName === 'fridge') {
      this.renderFridge();
    }
    if (tabName === 'history') {
      this.renderHistory();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderAll() {
    this.renderHome();
    this.renderStats();
    this.renderFridge();
    this.renderHistory();
    this.renderSettings();
    if (window.lucide) window.lucide.createIcons();
  }

  // --- ホーム画面描画 ---
  renderHome() {
    const stats = store.getStats('monthly');
    const budget = store.settings.monthlyBudget || 75000;
    const remaining = budget - stats.totalExpense;
    const progress = Math.min(Math.round((stats.totalExpense / budget) * 100), 100);

    // 金額カード
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

    // カロリーカード
    const totalCalEl = document.getElementById('home-total-calories');
    const avgCalEl = document.getElementById('home-avg-calories');
    const calPer100El = document.getElementById('home-cal-per-100');
    if (totalCalEl) totalCalEl.textContent = `${stats.totalCalories.toLocaleString()} kcal`;
    if (avgCalEl) avgCalEl.textContent = `日平均: ${stats.averageDailyCalories.toLocaleString()} kcal`;
    if (calPer100El) calPer100El.textContent = `${stats.calPer100Yen} kcal / 100円`;

    // 節約スコア
    const discountEl = document.getElementById('home-discount-total');
    if (discountEl) discountEl.textContent = `¥${stats.totalDiscount.toLocaleString()}`;

    // 直近の履歴リスト（3件）
    const recentList = document.getElementById('home-recent-list');
    if (recentList) {
      const recent = store.transactions.slice(0, 3);
      if (recent.length === 0) {
        recentList.innerHTML = `<div class="empty-state">まだ記録がありません。「レシート撮影」または「手入力」から追加してみましょう！</div>`;
      } else {
        recentList.innerHTML = recent.map(tx => this.createTransactionCardHtml(tx)).join('');
      }
    }

    // 冷蔵庫アラート（賞味期限が今日・明日）
    const fridgeAlertBox = document.getElementById('home-fridge-alert');
    if (fridgeAlertBox) {
      const today = new Date().toISOString().split('T')[0];
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
  }

  // --- 統計 & カロリー画面描画 ---
  renderStats() {
    const stats = store.getStats(this.currentPeriod);

    // 期間見出し
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

    // 支出とカロリーのハイライト
    const statExpenseEl = document.getElementById('stat-total-expense');
    const statCalorieEl = document.getElementById('stat-total-calorie');
    const statAvgCalEl = document.getElementById('stat-avg-calorie');
    const statCountEl = document.getElementById('stat-record-count');

    if (statExpenseEl) statExpenseEl.textContent = `¥${stats.totalExpense.toLocaleString()}`;
    if (statCalorieEl) statCalorieEl.textContent = `${stats.totalCalories.toLocaleString()} kcal`;
    if (statAvgCalEl) statAvgCalEl.textContent = `${stats.averageDailyCalories.toLocaleString()} kcal/日`;
    if (statCountEl) statCountEl.textContent = `${stats.transactionCount} 件`;

    // グラフ描画
    renderCharts(stats);
  }

  // --- 冷蔵庫ストック描画 ---
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

  // --- 履歴一覧描画 ---
  renderHistory() {
    const listEl = document.getElementById('history-list');
    if (!listEl) return;

    if (store.transactions.length === 0) {
      listEl.innerHTML = `<div class="empty-state">まだ記録がありません。</div>`;
      return;
    }

    listEl.innerHTML = store.transactions.map(tx => this.createTransactionCardHtml(tx, true)).join('');
  }

  createTransactionCardHtml(tx, showDelete = false) {
    const dateFormatted = tx.date.split('-').slice(1).join('/');
    const foodItems = (tx.items || []).filter(i => i.isFood);
    const hasDiscount = tx.totalDiscount > 0;
    const items = tx.items || [];

    return `
      <div class="tx-card">
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
      moreBtn.textContent = isCurrentlyHidden ? '閉じる' : `+他${hiddenItems.length}品を表示`;
    }
  }

  deleteTx(id) {
    if (confirm('この記録を削除しますか？')) {
      store.deleteTransaction(id);
      this.showToast('記録を削除しました');
      this.renderHome();
      this.renderHistory();
      this.renderStats();
    }
  }

  deleteTxItem(txId, itemId, itemName) {
    if (confirm(`「${itemName}」を削除しますか？`)) {
      store.deleteTransactionItem(txId, itemId);
      this.showToast(`「${itemName}」を削除しました`);
      this.renderHome();
      this.renderHistory();
      this.renderStats();
    }
  }

  // --- 設定画面の初期化 ---
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

  // --- レシート画像読み取り & 解析処理 ---
  async handleReceiptUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    this.showScanningOverlay();

    try {
      // スマホカメラの高画質写真をCanvasで軽量化圧縮（約70〜100KB）
      const base64 = await this.compressImage(file, 1200, 0.8) || await this.fileToBase64(file);
      const apiKey = store.settings.geminiApiKey;

      let result;
      if (apiKey) {
        result = await parseReceiptWithGemini(base64, 'image/jpeg', apiKey);
      } else {
        // APIキー未設定時はデモスキャンで代替し、通知を表示
        result = await simulateReceiptScan(this.selectedDemoIndex++);
        this.showToast('※APIキー未設定のためデモAI認識を実行しました（設定でGemini APIキーを設定可能）', 4000);
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

  // デモスキャン
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

  // 解析結果確認・修正モーダル（ボトムシート）を開く
  openScanResultModal(data, imageBase64) {
    this.scannedDraft = {
      ...data,
      receiptImage: imageBase64
    };

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

    // 合計バッジのリアルタイム更新
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
      // カロリーが0の場合、商品名から再推定を試みる
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

  // --- 手入力モーダル操作 ---
  openManualModal() {
    const modal = document.getElementById('manual-modal');
    if (!modal) return;

    document.getElementById('manual-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('manual-store').value = '';
    document.getElementById('manual-amount').value = '';
    document.getElementById('manual-discount').value = '';
    document.getElementById('manual-memo').value = '';

    // 品目リストをクリアして1行追加
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

    // 食品名入力時の自動サジェスト＆カロリー補完
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
        suggBox.style.display = 'block';
        suggBox.innerHTML = `💡 推定: <strong>${est.calories} kcal</strong> (${est.unit || est.category}) <button type="button" class="btn-apply-sugg">適用</button>`;
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

    // 総合入力金額
    const totalInputAmount = Number(document.getElementById('manual-amount').value);
    const sumItemPrices = items.reduce((s, i) => s + i.price, 0);
    const finalAmount = totalInputAmount > 0 ? totalInputAmount : Math.max(0, sumItemPrices - discount);

    if (items.length === 0 && finalAmount === 0) {
      alert('金額または品目を入力してください。');
      return;
    }

    // 単一金額のみ入力された場合のフォールバック品目
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

  // トースト通知の表示
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

  // ユーティリティ
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
}

window.appUI = new AppUI();
