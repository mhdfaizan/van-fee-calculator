window.VFC = window.VFC || {};

VFC.Charts = {
  _charts: {},

  update() {
    const data = VFC.Storage.getData();
    const s = data.settings;
    const dates = VFC.Utils.generateDateRange(s.year, s.month);
    const labels = dates.map(d => `${d.day} ${d.dayNameShort}`);
    const dayData = data.dailyData;

    this._updatePriceChart(labels, dates, s, dayData, data.petrolHistory);
    this._updateCostChart(labels, dates, s, dayData);
    this._updateWorkChart(dayData);
  },

  _getCtx(id) {
    const canvas = document.getElementById(id);
    if (!canvas) return null;
    return canvas.getContext('2d');
  },

  _destroyChart(key) {
    if (this._charts[key]) {
      this._charts[key].destroy();
      delete this._charts[key];
    }
  },

  _getChartColors() {
    const isDark = document.documentElement.classList.contains('dark');
    return {
      text: isDark ? '#94a3b8' : '#64748b',
      grid: isDark ? '#1e293b' : '#e2e8f0',
      border: isDark ? '#334155' : '#e2e8f0'
    };
  },

  _updatePriceChart(labels, dates, settings, dayData, petrolHistory) {
    const ctx = this._getCtx('priceChart');
    if (!ctx) return;
    this._destroyChart('price');
    const colors = this._getChartColors();

    const prices = dates.map(d => {
      const dd = dayData[d.date];
      if (dd && dd.petrolPrice !== undefined) return dd.petrolPrice;
      return VFC.Utils.getPetrolPriceForDate(d.date, petrolHistory);
    });

    this._charts.price = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Petrol Price',
          data: prices,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Daily Petrol Price', color: colors.text, font: { size: 13 } }
        },
        scales: {
          x: { ticks: { color: colors.text, font: { size: 10 }, maxTicksLimit: 15 }, grid: { color: colors.grid } },
          y: { ticks: { color: colors.text, font: { size: 10 } }, grid: { color: colors.grid }, beginAtZero: false }
        }
      }
    });
  },

  _updateCostChart(labels, dates, settings, dayData) {
    const ctx = this._getCtx('costChart');
    if (!ctx) return;
    this._destroyChart('cost');
    const colors = this._getChartColors();

    const costs = dates.map(d => {
      const dd = dayData[d.date];
      if (!dd || !dd.working) return 0;
      const fuelUsed = VFC.Calculations.calcFuelUsed(dd.kmDriven || 0, settings.mileage);
      return VFC.Calculations.calcFuelCost(fuelUsed, dd.petrolPrice || 0);
    });

    this._charts.cost = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Fuel Cost',
          data: costs,
          backgroundColor: costs.map(c => c > 0 ? 'rgba(34,197,94,0.7)' : 'rgba(203,213,225,0.3)'),
          borderColor: costs.map(c => c > 0 ? '#22c55e' : 'transparent'),
          borderWidth: 1,
          borderRadius: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Daily Fuel Cost', color: colors.text, font: { size: 13 } }
        },
        scales: {
          x: { ticks: { color: colors.text, font: { size: 10 }, maxTicksLimit: 15 }, grid: { color: colors.grid } },
          y: { ticks: { color: colors.text, font: { size: 10 } }, grid: { color: colors.grid }, beginAtZero: true }
        }
      }
    });
  },

  _updateWorkChart(dayData) {
    const ctx = this._getCtx('workChart');
    if (!ctx) return;
    this._destroyChart('work');
    const colors = this._getChartColors();

    let working = 0, nonWorking = 0;
    for (const key in dayData) {
      if (dayData[key].working) working++;
      else nonWorking++;
    }

    this._charts.work = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Working Days', 'Non-Working Days'],
        datasets: [{
          data: [working || 1, nonWorking || 1],
          backgroundColor: ['#22c55e', '#ef4444'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: colors.text, font: { size: 11 }, padding: 12 }
          },
          title: {
            display: true,
            text: 'Working vs Non-Working Days',
            color: colors.text,
            font: { size: 13 }
          }
        }
      }
    });
  }
};
