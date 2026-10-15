/**
 * 支出のグラフィカル可視化モジュール
 * Chart.jsを活用した高精細・レスポンシブチャート
 */

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

export function renderCharts(stats) {
  renderTimelineChart(stats);
  renderExpenseBreakdownChart(stats);
  renderCategoryList(stats);
  renderStoreRanking(stats);
}

/**
 * 支出推移グラフ (日別 / 月別 / 累計)
 */
function renderTimelineChart(stats) {
  const canvas = document.getElementById('timeline-chart');
  if (!canvas || !window.Chart) return;

  if (timelineChartInstance) {
    timelineChartInstance.destroy();
  }

  const ctx = canvas.getContext('2d');

  // エメラルドグリーンのグラデーション
  const expenseGrad = ctx.createLinearGradient(0, 0, 0, 220);
  expenseGrad.addColorStop(0, 'rgba(16, 185, 129, 0.7)');
  expenseGrad.addColorStop(1, 'rgba(16, 185, 129, 0.15)');

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
          hoverBackgroundColor: '#10B981'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          padding: 10,
          titleFont: { size: 12, weight: 'bold' },
          bodyFont: { size: 12 },
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              const val = context.parsed.y || 0;
              return ` 支出: ¥${val.toLocaleString()}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#94A3B8',
            font: { size: 10 }
          }
        },
        y: {
          type: 'linear',
          beginAtZero: true,
          grid: {
            color: 'rgba(226, 232, 240, 0.6)'
          },
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

/**
 * 支出カテゴリ別ドーナツグラフ
 */
function renderExpenseBreakdownChart(stats) {
  const canvas = document.getElementById('expense-breakdown-chart');
  if (!canvas || !window.Chart) return;

  if (expenseBreakdownChartInstance) {
    expenseBreakdownChartInstance.destroy();
  }

  const entries = Object.entries(stats.categoryTotals || {}).filter(([, v]) => v > 0);
  entries.sort((a, b) => b[1] - a[1]); // 金額の降順

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
            label: function(ctx) {
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

/**
 * 分析画面: カテゴリ別支出一覧
 */
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

/**
 * 分析画面: 利用店舗ランキング
 */
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
