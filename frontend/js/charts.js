// ReLoop Analytics Visualizations powered by Chart.js — Neo-Brutalist Flat Palette

const ChartManager = {
  instances: {},

  destroyExisting(chartId) {
    if (this.instances[chartId]) {
      this.instances[chartId].destroy();
      delete this.instances[chartId];
    }
  },

  renderAllInsights(insights) {
    if (!insights) return;
    this.renderCategoryChart(insights.categoryWiseInsights);
    this.renderConditionChart(insights.conditionWiseInsights);
    this.renderAgeDepreciationChart(insights.ageDepreciationTrends);
    this.renderDistributionChart(insights.categoryWiseInsights);
  },

  renderCategoryChart(categoryData) {
    const ctx = document.getElementById('categoryRetentionChart')?.getContext('2d');
    if (!ctx) return;
    this.destroyExisting('categoryRetentionChart');

    this.instances['categoryRetentionChart'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: categoryData.map(c => c.category),
        datasets: [
          {
            label: 'Resale Retention (%)',
            data: categoryData.map(c => c.avgResalePercent),
            backgroundColor: '#3CC4B3',
            borderColor: '#111111',
            borderWidth: 2,
            borderRadius: 6
          },
          {
            label: 'Depreciation (%)',
            data: categoryData.map(c => c.avgDepreciation),
            backgroundColor: '#F25F5C',
            borderColor: '#111111',
            borderWidth: 2,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { color: '#111111', font: { family: 'Plus Jakarta Sans', weight: '700' } } },
          tooltip: {
            callbacks: {
              label: (c) => ` ${c.dataset.label}: ${c.raw}%`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { color: '#111111', callback: v => `${v}%` },
            grid: { color: 'rgba(17,17,17,0.08)' }
          },
          x: { ticks: { color: '#111111' }, grid: { display: false } }
        }
      }
    });
  },

  renderConditionChart(conditionData) {
    const ctx = document.getElementById('conditionRetentionChart')?.getContext('2d');
    if (!ctx) return;
    this.destroyExisting('conditionRetentionChart');

    const conditionColors = ['#BFE8C9', '#3CC4B3', '#4C9BE8', '#FFC93C', '#F9C9B0'];

    this.instances['conditionRetentionChart'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: conditionData.map(c => c.condition),
        datasets: [{
          label: 'Average Resale Value (%)',
          data: conditionData.map(c => c.avgResalePercent),
          backgroundColor: conditionColors,
          borderColor: '#111111',
          borderWidth: 2,
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) => ` Value Retained: ${c.raw}%`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            ticks: { color: '#111111', callback: v => `${v}%` },
            grid: { color: 'rgba(17,17,17,0.08)' }
          },
          y: { ticks: { color: '#111111', font: { weight: '700' } }, grid: { display: false } }
        }
      }
    });
  },

  renderAgeDepreciationChart(ageData) {
    const ctx = document.getElementById('ageDepreciationChart')?.getContext('2d');
    if (!ctx) return;
    this.destroyExisting('ageDepreciationChart');

    this.instances['ageDepreciationChart'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ageData.map(a => a.ageGroup),
        datasets: [
          {
            label: 'Depreciation (%)',
            data: ageData.map(a => a.avgDepreciation),
            borderColor: '#F25F5C',
            backgroundColor: 'rgba(242, 95, 92, 0.14)',
            fill: false,
            tension: 0.25,
            borderWidth: 3.5,
            pointRadius: 6,
            pointBorderColor: '#111111',
            pointBorderWidth: 2,
            pointBackgroundColor: '#F25F5C'
          },
          {
            label: 'Value Retention (%)',
            data: ageData.map(a => a.avgResalePercent),
            borderColor: '#3CC4B3',
            backgroundColor: 'rgba(60, 196, 179, 0.14)',
            fill: false,
            tension: 0.25,
            borderWidth: 3.5,
            pointRadius: 6,
            pointBorderColor: '#111111',
            pointBorderWidth: 2,
            pointBackgroundColor: '#3CC4B3'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { color: '#111111', font: { family: 'Plus Jakarta Sans', weight: '700' } } }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { color: '#111111', callback: v => `${v}%` },
            grid: { color: 'rgba(17,17,17,0.08)' }
          },
          x: { ticks: { color: '#111111' }, grid: { display: false } }
        }
      }
    });
  },

  renderDistributionChart(categoryData) {
    const ctx = document.getElementById('categoryVolumeChart')?.getContext('2d');
    if (!ctx) return;
    this.destroyExisting('categoryVolumeChart');

    const palette = ['#FFC93C', '#3CC4B3', '#9B7BEA', '#F7A8C4', '#4C9BE8', '#BFE8C9', '#F25F5C'];

    this.instances['categoryVolumeChart'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categoryData.map(c => c.category),
        datasets: [{
          data: categoryData.map(c => c.transactionCount),
          backgroundColor: palette,
          borderWidth: 2.5,
          borderColor: '#111111'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: '#111111', boxWidth: 14, font: { size: 11, weight: '700', family: 'Plus Jakarta Sans' } } },
          tooltip: {
            callbacks: {
              label: (c) => ` ${c.label}: ${c.raw} historical records`
            }
          }
        },
        cutout: '58%'
      }
    });
  }
};
