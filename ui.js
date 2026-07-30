window.VFC = window.VFC || {};

VFC.UI = {
  _isDark: false,

  init() {
    this._isDark = localStorage.getItem('vfcDarkMode') === 'true';
    if (this._isDark) document.documentElement.classList.add('dark');
    this.updateThemeIcon();
  },

  toggleDarkMode() {
    this._isDark = !this._isDark;
    document.documentElement.classList.toggle('dark', this._isDark);
    localStorage.setItem('vfcDarkMode', this._isDark);
    this.updateThemeIcon();
  },

  updateThemeIcon() {
    const btn = document.getElementById('darkToggle');
    if (btn) btn.textContent = this._isDark ? '☀️' : '🌙';
  },

  showToast(msg, duration) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), duration || 2500);
  },

  renderAll() {
    this.renderHeader();
    this.renderSettings();
    this.renderPetrolHistory();
    this.renderDailyTable();
    this.renderDashboard();
    VFC.Charts.update();
  },

  renderHeader() {
    const data = VFC.Storage.getData();
    const s = data.settings;
    const el = document.getElementById('headerMonth');
    if (el) el.textContent = `${VFC.Utils.MONTHS[s.month - 1]} ${s.year}`;
  },

  renderSettings() {
    const data = VFC.Storage.getData();
    const s = data.settings;
    document.getElementById('settingYear').value = s.year;
    document.getElementById('settingMonth').value = s.month;
    document.getElementById('settingMonthlyFee').value = s.monthlyFee;
    document.getElementById('settingBasePrice').value = s.basePetrolPrice;
    document.getElementById('settingMileage').value = s.mileage;
    document.getElementById('settingDefaultKm').value = s.defaultKm;
    document.getElementById('settingDefaultPassengers').value = s.defaultPassengers;
    document.getElementById('settingCurrency').value = s.currency || 'PKR';
  },

  renderPetrolHistory() {
    const data = VFC.Storage.getData();
    const tbody = document.getElementById('petrolHistoryBody');
    tbody.innerHTML = '';
    const sorted = VFC.Utils.sortByDate(data.petrolHistory);
    for (const entry of sorted) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="date" value="${entry.date}" data-id="${entry.id}" class="petrol-date" style="width:140px"></td>
        <td><input type="number" value="${entry.price}" step="0.01" min="0" data-id="${entry.id}" class="petrol-price" style="width:100px"></td>
        <td><button class="btn btn-danger btn-sm" onclick="VFC.App._deletePetrolPrice(${entry.id})">✕</button></td>
      `;
      tbody.appendChild(tr);
    }
    this._bindPetrolEvents();
  },

  _bindPetrolEvents() {
    document.querySelectorAll('.petrol-date').forEach(el => {
      el.addEventListener('change', VFC.App._onPetrolChange);
    });
    document.querySelectorAll('.petrol-price').forEach(el => {
      el.addEventListener('change', VFC.App._onPetrolChange);
    });
  },

  renderDailyTable() {
    const data = VFC.Storage.getData();
    const s = data.settings;
    const tbody = document.getElementById('dailyTableBody');
    tbody.innerHTML = '';

    const dates = VFC.Utils.generateDateRange(s.year, s.month);
    const hasDailyData = Object.keys(data.dailyData).length > 0;

    for (const d of dates) {
      const dayData = data.dailyData[d.date] || {};
      const working = dayData.working !== undefined ? dayData.working : !d.isWeekend;
      const holiday = dayData.holiday || false;
      const edited = dayData.edited || false;
      const petrolPrice = dayData.petrolPrice !== undefined ? dayData.petrolPrice :
        VFC.Utils.getPetrolPriceForDate(d.date, data.petrolHistory);
      const km = dayData.kmDriven !== undefined ? dayData.kmDriven : s.defaultKm;
      const passengers = dayData.passengers !== undefined ? dayData.passengers : s.defaultPassengers;
      const notes = dayData.notes || '';

      const calc = VFC.Calculations.calcDay({
        working, kmDriven: km, passengers, petrolPrice
      }, s);

      let rowClass = '';
      if (holiday) rowClass = 'row-holiday';
      else if (d.isWeekend) rowClass = 'row-weekend';
      if (edited) rowClass += ' row-edited';

      const tr = document.createElement('tr');
      tr.className = rowClass;
      tr.dataset.date = d.date;
      tr.innerHTML = `
        <td class="whitespace-nowrap font-medium">${d.day} ${d.dayNameShort}</td>
        <td class="whitespace-nowrap" style="color:var(--text-muted);font-size:0.75rem">${d.dayName}</td>
        <td><input type="checkbox" ${working ? 'checked' : ''} class="day-working" data-date="${d.date}"></td>
        <td><input type="checkbox" ${holiday ? 'checked' : ''} class="day-holiday" data-date="${d.date}"></td>
        <td><input type="number" value="${petrolPrice}" step="0.01" min="0" class="day-price" data-date="${d.date}" style="width:80px"></td>
        <td><input type="number" value="${km}" step="0.1" min="0" class="day-km" data-date="${d.date}" style="width:70px"></td>
        <td><input type="number" value="${passengers}" step="1" min="1" class="day-pass" data-date="${d.date}" style="width:60px"></td>
        <td class="text-right font-mono">${calc.fuelUsed.toFixed(2)}</td>
        <td class="text-right font-mono">${VFC.Utils.formatCurrency(calc.fuelCost, s.currency, s.decimalPlaces)}</td>
        <td class="text-right font-mono">${VFC.Utils.formatCurrency(calc.baseFuelCost, s.currency, s.decimalPlaces)}</td>
        <td class="text-right font-mono" style="${calc.extraFuelCost > 0 ? 'color:var(--orange);font-weight:600' : ''}">${VFC.Utils.formatCurrency(calc.extraFuelCost, s.currency, s.decimalPlaces)}</td>
        <td><input type="text" value="${notes}" class="day-notes" data-date="${d.date}" placeholder="Notes..." style="width:130px"></td>
      `;
      tbody.appendChild(tr);
    }
    this._bindDailyEvents();
  },

  _bindDailyEvents() {
    const selector = '.day-working, .day-holiday, .day-price, .day-km, .day-pass, .day-notes';
    document.querySelectorAll(selector).forEach(el => {
      el.addEventListener('change', VFC.App._onDailyChange);
      el.addEventListener('input', VFC.App._onDailyInput);
    });
  },

  renderDashboard() {
    const data = VFC.Storage.getData();
    const s = data.settings;
    const stats = VFC.Calculations.calcMonth(data.dailyData, s);
    const c = s.currency;

    const cards = [
      { label: 'Working Days', value: stats.workingDays, icon: '📅' },
      { label: 'Total KM', value: VFC.Utils.formatNumber(stats.totalKm, 1) + ' km', icon: '📏' },
      { label: 'Fuel Used', value: VFC.Utils.formatNumber(stats.totalFuelUsed, 2) + ' L', icon: '⛽' },
      { label: 'Avg Petrol Price', value: VFC.Utils.formatCurrency(stats.avgPetrolPrice, c, 2), icon: '💰' },
      { label: 'Base Fuel Cost', value: VFC.Utils.formatCurrency(stats.totalBaseFuelCost, c, s.decimalPlaces), icon: '📊' },
      { label: 'Actual Fuel Cost', value: VFC.Utils.formatCurrency(stats.totalFuelCost, c, s.decimalPlaces), icon: '📈' },
      { label: 'Extra Fuel Cost', value: VFC.Utils.formatCurrency(stats.totalExtraFuelCost, c, s.decimalPlaces), icon: '🔥' },
      { label: 'Original Van Fee', value: VFC.Utils.formatCurrency(stats.originalFee, c, s.decimalPlaces), icon: '🏠' },
      { label: 'Revised Van Fee', value: VFC.Utils.formatCurrency(stats.revisedFee, c, s.decimalPlaces), icon: '🔄' },
      { label: 'Per Passenger Fee', value: VFC.Utils.formatCurrency(stats.perPassengerFee, c, s.decimalPlaces), icon: '👤' }
    ];

    const container = document.getElementById('dashboardContainer');
    container.innerHTML = '';
    for (const card of cards) {
      const div = document.createElement('div');
      div.className = 'stat-card';
      div.innerHTML = `
        <div class="label">${card.icon} ${card.label}</div>
        <div class="value">${card.value}</div>
      `;
      container.appendChild(div);
    }
  }
};
