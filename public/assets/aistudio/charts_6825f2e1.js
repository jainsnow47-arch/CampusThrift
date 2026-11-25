// ReLoop Analytics Visualizations powered by Chart.js

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

  // 1. Category Value Retention & Depreciation
  renderCategoryChart(categoryData) {
    const ctx = document.getElementById('categoryRetentionChart')?.getContext('2d');
    if (!ctx) return;
    this.destroyExisting('categoryRetentionChart');

    const labels = categoryData.map(c => c.category);
    const resalePercentages = categoryData.map(c => c.avgResalePercent);
    const depreciationPercentages = categoryData.map(c => c.avgDepreciation);

    this.instances['categoryRetentionChart'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Resale Retention (%)',
            data: resalePercentages,
            backgroundColor: '#15803d',
            borderRadius: 6,
            borderSkipped: false
          },
          {
            label: 'Depreciation (%)',
            data: depreciationPercentages,
            backgroundColor: '#fca5a5',
            borderRadius: 6,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { family: 'Plus Jakarta Sans', weight: '600' } } },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}%`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { callback: v => `${v}%` },
            grid: { color: '#f1f5f9' }
          },
          x: { grid: { display: false } }
        }
      }
    });
  },

  // 2. Condition Grade Impact
  renderConditionChart(conditionData) {
    const ctx = document.getElementById('conditionRetentionChart')?.getContext('2d');
    if (!ctx) return;
    this.destroyExisting('conditionRetentionChart');

    const labels = conditionData.map(c => c.condition);
    const values = conditionData.map(c => c.avgResalePercent);

    const conditionColors = ['#22c55e', '#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

    this.instances['conditionRetentionChart'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Average Resale Value (%)',
          data: values,
          backgroundColor: conditionColors,
          borderRadius: 8
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
              label: (ctx) => ` Value Retained: ${ctx.raw}% of Original`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            ticks: { callback: v => `${v}%` },
            grid: { color: '#f1f5f9' }
          },
          y: { grid: { display: false } }
        }
      }
    });
  },

  // 3. Age vs Depreciation Curve
  renderAgeDepreciationChart(ageData) {
    const ctx = document.getElementById('ageDepreciationChart')?.getContext('2d');
    if (!ctx) return;
    this.destroyExisting('ageDepreciationChart');

    const labels = ageData.map(a => a.ageGroup);
    const deprecValues = ageData.map(a => a.avgDepreciation);
    const retentionValues = ageData.map(a => a.avgResalePercent);

    this.instances['ageDepreciationChart'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Depreciation Curve (%)',
            data: deprecValues,
            borderColor: '#dc2626',
            backgroundColor: 'rgba(220, 38, 38, 0.08)',
            fill: true,
            tension: 0.35,
            borderWidth: 3,
            pointRadius: 5,
            pointBackgroundColor: '#dc2626'
          },
          {
            label: 'Value Retention Curve (%)',
            data: retentionValues,
            borderColor: '#15803d',
            backgroundColor: 'rgba(21, 128, 61, 0.08)',
            fill: true,
            tension: 0.35,
            borderWidth: 3,
            pointRadius: 5,
            pointBackgroundColor: '#15803d'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { family: 'Plus Jakarta Sans', weight: '600' } } }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { callback: v => `${v}%` },
            grid: { color: '#f1f5f9' }
          },
          x: { grid: { display: false } }
        }
      }
    });
  },

  // 4. Historical Category Volume Distribution
  renderDistributionChart(categoryData) {
    const ctx = document.getElementById('categoryVolumeChart')?.getContext('2d');
    if (!ctx) return;
    this.destroyExisting('categoryVolumeChart');

    const labels = categoryData.map(c => c.category);
    const counts = categoryData.map(c => c.transactionCount);

    const palette = ['#14532d', '#15803d', '#22c55e', '#84cc16', '#3b82f6', '#f59e0b', '#64748b'];

    this.instances['categoryVolumeChart'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: counts,
          backgroundColor: palette,
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11, family: 'Plus Jakarta Sans' } } },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.raw} historical records`
            }
          }
        },
        cutout: '65%'
      }
    });
  }
};
