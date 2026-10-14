/**
 * 支出 & カロリーのグラフィカル可視化モジュール
 * Chart.jsを活用した高精細・レスポンシブチャート
 */

let timelineChartInstance = null;
let calorieBreakdownChartInstance = null;
let expenseBreakdownChartInstance = null;

export function renderCharts(stats) {
  renderTimelineChart(stats);
  renderCalorieBreakdownChart(stats);
  renderExpenseBreakdownChart(stats);
}

/**
 * 支出 & カロリーの推移グラフ (日別 / 月別 / 累計)
 */
function renderTimelineChart(stats) {
  const canvas = document.getElementById('timeline-chart');
  if (!canvas || !window.Chart) return;

  if (timelineChartInstance) {
    timelineChartInstance.destroy();
  }

  const ctx = canvas.getContext('2d');

  // グラデーション作成
  const expenseGrad = ctx.createLinearGradient(0, 0, 0, 240);
  expenseGrad.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
  expenseGrad.addColorStop(1, 'rgba(16, 185, 129, 0.02)');

  const calGrad = ctx.createLinearGradient(0, 0, 0, 240);
  calGrad.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
  calGrad.addColorStop(1, 'rgba(245, 158, 11, 0.0)');

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
          label: '食品カロリー (kcal)',
          data: stats.timeline.calories,
          borderColor: '#F59E0B',
          backgroundColor: '#F59E0B',
          pointBackgroundColor: '#F59E0B',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
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
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            usePointStyle: true,
            color: '#64748B',
            font: {
              family: "'Plus Jakarta Sans', 'Noto Sans JP', sans-serif",
              size: 11,
              weight: '600'
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          padding: 10,
          titleFont: { size: 12, weight: 'bold' },
          bodyFont: { size: 11 },
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const val = context.parsed.y || 0;
              if (label.includes('円')) {
                return ` 支出: ¥${val.toLocaleString()}`;
              } else {
                return ` カロリー: ${val.toLocaleString()} kcal`;
              }
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
        yExpense: {
          type: 'linear',
          position: 'left',
          grid: {
            color: 'rgba(226, 232, 240, 0.6)'
          },
          ticks: {
            color: '#10B981',
            font: { size: 10 },
            callback: (v) => '¥' + (v >= 1000 ? (v / 1000) + 'k' : v)
          }
        },
        yCalorie: {
          type: 'linear',
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: {
            color: '#F59E0B',
            font: { size: 10 },
            callback: (v) => (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v) + 'c'
          }
        }
      }
    }
  });
}

/**
 * カロリーの食品カテゴリ別ドーナツ
 */
function renderCalorieBreakdownChart(stats) {
  const canvas = document.getElementById('calorie-breakdown-chart');
  if (!canvas || !window.Chart) return;

  if (calorieBreakdownChartInstance) {
    calorieBreakdownChartInstance.destroy();
  }

  const entries = Object.entries(stats.calorieByCategory || {});
  const labels = entries.map(([k]) => k);
  const data = entries.map(([, v]) => v);

  if (data.length === 0 || data.every(v => v === 0)) {
    labels.push('データなし');
    data.push(1);
  }

  const colors = [
    '#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#64748B'
  ];

  const ctx = canvas.getContext('2d');
  calorieBreakdownChartInstance = new window.Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#FFFFFF'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 10,
            usePointStyle: true,
            color: '#64748B',
            font: { size: 10 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              const label = ctx.label || '';
              const val = ctx.parsed || 0;
              return ` ${label}: ${val.toLocaleString()} kcal`;
            }
          }
        }
      }
    }
  });
}

/**
 * 支出カテゴリ別ドーナツ
 */
function renderExpenseBreakdownChart(stats) {
  const canvas = document.getElementById('expense-breakdown-chart');
  if (!canvas || !window.Chart) return;

  if (expenseBreakdownChartInstance) {
    expenseBreakdownChartInstance.destroy();
  }

  const entries = Object.entries(stats.categoryTotals || {});
  const labels = entries.map(([k]) => k);
  const data = entries.map(([, v]) => v);

  if (data.length === 0 || data.every(v => v === 0)) {
    labels.push('支出なし');
    data.push(1);
  }

  const colors = [
    '#10B981', '#06B6D4', '#6366F1', '#F43F5E', '#EAB308', '#8B5CF6', '#94A3B8'
  ];

  const ctx = canvas.getContext('2d');
  expenseBreakdownChartInstance = new window.Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#FFFFFF'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 10,
            usePointStyle: true,
            color: '#64748B',
            font: { size: 10 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              const label = ctx.label || '';
              const val = ctx.parsed || 0;
              return ` ${label}: ¥${val.toLocaleString()}`;
            }
          }
        }
      }
    }
  });
}
