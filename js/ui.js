/**
 * UI操作・レンダリング・インタラクションコントローラー
 */
import { store, ReceiptImageDB } from './store.js';
import { parseReceiptWithGemini, simulateReceiptScan, testGeminiApiKey, sanitizeApiKey, DEMO_RECEIPTS } from './gemini.js';
import { renderCharts } from './charts.js';

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

    // スキャン結果モーダルの合計金額・値引き手動変更リスナー
    const draftTotalInput = document.getElementById('draft-total-amount');
    if (draftTotalInput) {
      draftTotalInput.addEventListener('input', () => this.renderDraftItems(false));
    }
    const draftDiscountInput = document.getElementById('draft-discount');
    if (draftDiscountInput) {
      draftDiscountInput.addEventListener('input', () => this.renderDraftItems(false));
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

    if (window.lucide) window.lucide.createIcons();
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

    // 買い物回数 & 1回あたり平均
    const shopCountEl = document.getElementById('home-shopping-count');
    const avgShopEl = document.getElementById('home-avg-spend-per-shop');
    if (shopCountEl) shopCountEl.textContent = `${stats.transactionCount} 回`;
    if (avgShopEl) avgShopEl.textContent = `1回平均: ¥${stats.avgSpendPerShop.toLocaleString()}`;

    // 主な支出カテゴリ TOP3
    const topCatListEl = document.getElementById('home-top-categories-list');
    if (topCatListEl) {
      if (!stats.topCategories || stats.topCategories.length === 0) {
        topCatListEl.innerHTML = `<div style="font-size: 11px; color: var(--text-muted); text-align: center; padding: 6px;">今月の支出データがありません</div>`;
      } else {
        const catColors = {
          '主食': '#10B981', 'お肉・魚': '#F43F5E', '野菜・果物': '#84CC16',
          '乳製品・飲料': '#06B6D4', '惣菜・お弁当': '#F59E0B', 'お菓子・スイーツ': '#EC4899',
          '日用品': '#8B5CF6', '外食': '#EF4444', 'その他': '#94A3B8'
        };
        topCatListEl.innerHTML = stats.topCategories.map(cat => {
          const color = catColors[cat.name] || '#94A3B8';
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
        recentList.innerHTML = recent.map(tx => this.createTransactionCardHtml(tx, true)).join('');
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

    if (window.lucide) window.lucide.createIcons();
  }

  // --- 支出分析画面描画 ---
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

    // 支出とハイライト
    const statExpenseEl = document.getElementById('stat-total-expense');
    const statAvgExpenseEl = document.getElementById('stat-avg-expense');
    const statDiscountEl = document.getElementById('stat-discount-total');
    const statCountEl = document.getElementById('stat-record-count');

    if (statExpenseEl) statExpenseEl.textContent = `¥${stats.totalExpense.toLocaleString()}`;
    if (statAvgExpenseEl) statAvgExpenseEl.textContent = `¥${stats.avgSpendPerShop.toLocaleString()}`;
    if (statDiscountEl) statDiscountEl.textContent = `累計節約: ¥${stats.totalDiscount.toLocaleString()}`;
    if (statCountEl) statCountEl.textContent = `${stats.transactionCount} 件の記録`;

    // グラフ描画
    renderCharts(stats);
    if (window.lucide) window.lucide.createIcons();
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

  // --- 設定画面の初期化 ---
  renderSettings() {
    const apiKeyInput = document.getElementById('cfg-api-key');
    const budgetInput = document.getElementById('cfg-budget');
    const savePhotoInput = document.getElementById('cfg-save-photo');

    if (apiKeyInput) apiKeyInput.value = store.settings.geminiApiKey || '';
    if (budgetInput) budgetInput.value = store.settings.monthlyBudget || 75000;
    if (savePhotoInput) savePhotoInput.checked = !!store.settings.saveReceiptPhotos;
  }

  // --- レシート画像読み取り & 解析処理 ---
  async handleReceiptUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    this.showScanningOverlay();

    try {
      // 高速化最適化（最大1600px・品質0.82・コントラスト補正）で文字鮮明度を保ちつつ通信量を80%削減
      const base64 = await this.compressImage(file, 1600, 0.82) || await this.fileToBase64(file);
      const apiKey = sanitizeApiKey(store.settings.geminiApiKey);

      let result;
      if (apiKey) {
        try {
          result = await parseReceiptWithGemini(base64, 'image/jpeg', apiKey);
        } catch (apiErr) {
          console.warn('Gemini API call failed, falling back to demo scan:', apiErr);
          // API通信失敗時: 写真破棄を避け、デモ認識でフォールバックしてユーザーに通知
          result = await simulateReceiptScan(this.selectedDemoIndex++);
          this.showToast(`⚠️ AI通信エラー: ${apiErr.message}（撮影写真はそのまま保持し、デモ解析に切り替えました）`, 8000);
        }
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

    const totalInput = document.getElementById('draft-total-amount');
    if (totalInput) {
      totalInput.value = data.totalAmount || 0;
    }

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
    if (!this.scannedDraft) return;
    this.scannedDraft.items.splice(idx, 1);
    this.renderDraftItems(true);
  }

  saveScanDraft() {
    if (!this.scannedDraft) return;

    const storeName = document.getElementById('draft-store').value.trim() || '店舗未登録';
    const date = document.getElementById('draft-date').value || new Date().toISOString().split('T')[0];
    const discount = Number(document.getElementById('draft-discount').value) || 0;
    const totalInput = document.getElementById('draft-total-amount');
    const addToFridge = document.getElementById('draft-add-fridge').checked;
    const draftSavePhoto = document.getElementById('draft-save-photo');
    const shouldSavePhoto = draftSavePhoto ? draftSavePhoto.checked : !!store.settings.saveReceiptPhotos;

    this.scannedDraft.store = storeName;
    this.scannedDraft.date = date;
    this.scannedDraft.totalDiscount = discount;
    if (totalInput && totalInput.value) {
      this.scannedDraft.totalAmount = Number(totalInput.value) || this.scannedDraft.totalAmount;
    }

    if (!shouldSavePhoto) {
      this.scannedDraft.receiptImage = null;
    }

    store.addTransaction(this.scannedDraft, addToFridge);

    this.closeScanModal();
    this.showToast('家計簿に記録しました！支出サマリーに反映されました✨');
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
}

window.appUI = new AppUI();
