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
      el.addEventListener('change', e => VFC.App._onPetrolChange(e));
    });
    document.querySelectorAll('.petrol-price').forEach(el => {
      el.addEventListener('change', e => VFC.App._onPetrolChange(e));
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
      if (d.isWeekend) rowClass = 'row-weekend';
      if (edited) rowClass += ' row-edited';

      const tr = document.createElement('tr');
      tr.className = rowClass;
      tr.dataset.date = d.date;
      tr.innerHTML = `
        <td class="whitespace-nowrap font-medium">${d.day} ${d.dayNameShort}</td>
        <td class="whitespace-nowrap" style="color:var(--text-muted);font-size:0.75rem">${d.dayName}</td>
        <td><input type="checkbox" ${working ? 'checked' : ''} class="day-working" data-date="${d.date}"></td>
        <td><input type="number" value="${petrolPrice}" step="0.01" min="0" class="day-price" data-date="${d.date}" style="width:80px"></td>
        <td><input type="number" value="${km}" step="0.1" min="0" class="day-km" data-date="${d.date}" style="width:70px"></td>
        <td><input type="number" value="${passengers}" step="1" min="1" class="day-pass" data-date="${d.date}" style="width:60px"></td>
        <td class="text-right font-mono">${calc.fuelUsed.toFixed(2)}</td>
        <td class="text-right font-mono">${VFC.Utils.formatCurrency(calc.fuelCost, s.decimalPlaces)}</td>
        <td class="text-right font-mono">${VFC.Utils.formatCurrency(calc.baseFuelCost, s.decimalPlaces)}</td>
        <td class="text-right font-mono" style="${calc.extraFuelCost > 0 ? 'color:var(--orange);font-weight:600' : ''}">${VFC.Utils.formatCurrency(calc.extraFuelCost, s.decimalPlaces)}</td>
        <td><input type="text" value="${notes}" class="day-notes" data-date="${d.date}" placeholder="Notes..." style="width:130px"></td>
      `;
      tbody.appendChild(tr);
    }
    this._bindDailyEvents();
  },

  _bindDailyEvents() {
    const selector = '.day-working, .day-price, .day-km, .day-pass, .day-notes';
    document.querySelectorAll(selector).forEach(el => {
      el.addEventListener('change', e => VFC.App._onDailyChange(e));
      el.addEventListener('input', e => VFC.App._onDailyInput(e));
    });
  },

  _openPsoImport() {
    const data = VFC.Storage.getData();
    const s = data.settings;
    const lastDay = new Date(s.year, s.month, 0).getDate();
    const fromVal = `${s.year}-${String(s.month).padStart(2,'0')}-01`;
    const toVal = `${s.year}-${String(s.month).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;
    const overlay = document.createElement('div');
    overlay.id = 'psoImportOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;overflow-y:auto;padding:20px';
    const modal = document.createElement('div');
    modal.style.cssText = `background:var(--bg-card);border-radius:12px;padding:24px;max-width:700px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3)`;
    modal.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 style="margin:0;font-size:16px;font-weight:700;color:var(--text)">⛽ Import from PSO</h3>
        <button class="btn btn-secondary btn-sm" id="psoCloseBtn">✕</button>
      </div>
      <p style="font-size:13px;color:var(--text-muted);margin:0 0 12px 0">Fetches PREMIER EURO 5 prices from <code style="font-size:12px;background:var(--bg-input);padding:1px 5px;border-radius:3px">psopk.com/fuel-prices/pol/archives</code></p>
      <div style="display:flex;gap:12px;margin-bottom:12px;flex-wrap:wrap;align-items:flex-end">
        <div><label style="display:block;font-size:12px;margin-bottom:4px;color:var(--text-muted)">From Date</label><input type="date" id="psoFromDate" value="${fromVal}" style="padding:6px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg-input);color:var(--text);font-size:13px"></div>
        <div><label style="display:block;font-size:12px;margin-bottom:4px;color:var(--text-muted)">To Date</label><input type="date" id="psoToDate" value="${toVal}" style="padding:6px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg-input);color:var(--text);font-size:13px"></div>
        <div><button class="btn btn-primary btn-sm" id="psoFetchBtn">Fetch from PSO</button></div>
      </div>
      <div id="psoStatus" style="font-size:13px;margin-bottom:8px;color:var(--text-muted)"></div>
      <div id="psoPreview" style="margin-bottom:12px"></div>
      <div id="psoFallback" style="display:none;margin-top:8px">
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:6px">Auto-fetch failed. Paste the entire PSO archives page HTML below:</p>
        <textarea id="psoPasteArea" rows="6" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--bg-input);color:var(--text);font-size:12px;font-family:monospace;resize:vertical;box-sizing:border-box"></textarea>
        <div style="margin-top:8px"><button class="btn btn-primary btn-sm" id="psoParseBtn">Parse HTML</button></div>
      </div>
      <div id="psoImportArea" style="display:none;margin-top:12px;text-align:right">
        <button class="btn btn-primary" id="psoImportBtn">Import Entries</button>
      </div>`;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.getElementById('psoCloseBtn').onclick = () => this._closePsoImport();
    overlay.addEventListener('click', e => { if (e.target === overlay) this._closePsoImport(); });
    document.getElementById('psoFetchBtn').onclick = () => VFC.App._doPsoFetch();
    document.getElementById('psoParseBtn').onclick = () => VFC.App._doPsoParse();
    document.getElementById('psoImportBtn').onclick = () => VFC.App._doPsoImport();
  },

  _closePsoImport() {
    const el = document.getElementById('psoImportOverlay');
    if (el) el.remove();
  },

  _setPsoStatus(msg) {
    const el = document.getElementById('psoStatus');
    if (el) el.textContent = msg;
  },

  _showPsoFallback() {
    const el = document.getElementById('psoFallback');
    if (el) el.style.display = 'block';
  },

  _showPsoPreview(entries) {
    if (!entries || entries.length === 0) {
      this._setPsoStatus('No matching price entries found in this date range.');
      return;
    }
    const container = document.getElementById('psoPreview');
    const importArea = document.getElementById('psoImportArea');
    if (!container) return;
    let html = `<p style="font-size:13px;margin-bottom:8px;color:var(--text)">Found <strong>${entries.length}</strong> effective date(s):</p>
      <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="border-bottom:1px solid var(--border)">
        <th style="padding:6px 10px;text-align:left;color:var(--text-muted);font-weight:600">Effective Date</th>
        <th style="padding:6px 10px;text-align:right;color:var(--text-muted);font-weight:600">Price (Rs./L)</th>
      </tr></thead><tbody>`;
    for (const e of entries) {
      const d = new Date(e.date + 'T00:00:00');
      const label = d.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
      html += `<tr style="border-bottom:1px solid var(--border)">
        <td style="padding:6px 10px;color:var(--text)">${label}</td>
        <td style="padding:6px 10px;text-align:right;color:var(--text);font-weight:600">Rs. ${e.price.toFixed(2)}</td>
      </tr>`;
    }
    html += `</tbody></table></div>`;
    container.innerHTML = html;
    this._setPsoStatus('');
    if (importArea) {
      importArea.style.display = 'block';
      const btn = document.getElementById('psoImportBtn');
      if (btn) btn.textContent = `Import ${entries.length} Entries`;
    }
  },

  renderDashboard() {
    const data = VFC.Storage.getData();
    const s = data.settings;
    const stats = VFC.Calculations.calcMonth(data.dailyData, s);

    const extraPerPerson = stats.avgPassengers > 0
      ? stats.totalExtraFuelCost / stats.avgPassengers : 0;

    const cards = [
      { label: 'Working Days', value: stats.workingDays, icon: '📅' },
      { label: 'Total KM', value: VFC.Utils.formatNumber(stats.totalKm, 1) + ' km', icon: '📏' },
      { label: 'Fuel Used', value: VFC.Utils.formatNumber(stats.totalFuelUsed, 2) + ' L', icon: '⛽' },
      { label: 'Avg Petrol Price', value: VFC.Utils.formatCurrency(stats.avgPetrolPrice, 2), icon: '💰' },
      { label: 'Base Fuel Cost', value: VFC.Utils.formatCurrency(stats.totalBaseFuelCost, s.decimalPlaces), icon: '📊' },
      { label: 'Actual Fuel Cost', value: VFC.Utils.formatCurrency(stats.totalFuelCost, s.decimalPlaces), icon: '📈' },
      { label: 'Original Van Fee', value: VFC.Utils.formatCurrency(stats.originalFee, s.decimalPlaces), icon: '🏠' },
      { label: 'Revised Van Fee', value: VFC.Utils.formatCurrency(stats.revisedFee, s.decimalPlaces), icon: '🔄' },
      { label: 'Extra Fuel Cost', value: VFC.Utils.formatCurrency(stats.totalExtraFuelCost, s.decimalPlaces), icon: '🔥' },
      { label: 'Extra / Person', value: VFC.Utils.formatCurrency(extraPerPerson, s.decimalPlaces), icon: '👤' },
      { label: 'Per Passenger Fee', value: VFC.Utils.formatCurrency(stats.perPassengerFee, s.decimalPlaces), icon: '💰' }
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

    const comparison = document.createElement('div');
    comparison.style.cssText = 'grid-column:1/-1;margin-top:8px';
    comparison.innerHTML = `
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:16px;overflow-x:auto">
        <div style="font-size:14px;font-weight:700;margin-bottom:10px;color:var(--text)">📊 Base vs Actual</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="border-bottom:2px solid var(--border)">
              <th style="padding:8px 12px;text-align:left;color:var(--text-muted);font-weight:600">Metric</th>
              <th style="padding:8px 12px;text-align:right;color:var(--text-muted);font-weight:600">Base</th>
              <th style="padding:8px 12px;text-align:right;color:var(--text-muted);font-weight:600">Actual</th>
              <th style="padding:8px 12px;text-align:right;color:var(--text-muted);font-weight:600">Difference</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid var(--border)">
              <td style="padding:8px 12px;color:var(--text)">Fuel Cost</td>
              <td style="padding:8px 12px;text-align:right;color:var(--text)">${VFC.Utils.formatCurrency(stats.totalBaseFuelCost, s.decimalPlaces)}</td>
              <td style="padding:8px 12px;text-align:right;color:var(--text)">${VFC.Utils.formatCurrency(stats.totalFuelCost, s.decimalPlaces)}</td>
              <td style="padding:8px 12px;text-align:right;font-weight:600;color:${stats.totalExtraFuelCost > 0 ? 'var(--orange)' : 'var(--text)'}">${stats.totalExtraFuelCost > 0 ? '+' : ''}${VFC.Utils.formatCurrency(stats.totalExtraFuelCost, s.decimalPlaces)}</td>
            </tr>
            <tr style="border-bottom:1px solid var(--border)">
              <td style="padding:8px 12px;color:var(--text)">Fuel Rate (Rs./L)</td>
              <td style="padding:8px 12px;text-align:right;color:var(--text)">${VFC.Utils.formatCurrency(s.basePetrolPrice, 2)}</td>
              <td style="padding:8px 12px;text-align:right;color:var(--text)">${VFC.Utils.formatCurrency(stats.avgPetrolPrice, 2)}</td>
              <td style="padding:8px 12px;text-align:right;font-weight:600;color:${stats.avgPetrolPrice > s.basePetrolPrice ? 'var(--orange)' : 'var(--text)'}">${stats.avgPetrolPrice > s.basePetrolPrice ? '+' : ''}${VFC.Utils.formatCurrency(stats.avgPetrolPrice - s.basePetrolPrice, 2)}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;color:var(--text)">Van Fee</td>
              <td style="padding:8px 12px;text-align:right;color:var(--text)">${VFC.Utils.formatCurrency(stats.originalFee, s.decimalPlaces)}</td>
              <td style="padding:8px 12px;text-align:right;color:var(--text)">${VFC.Utils.formatCurrency(stats.revisedFee, s.decimalPlaces)}</td>
              <td style="padding:8px 12px;text-align:right;font-weight:600;color:${stats.totalExtraFuelCost > 0 ? 'var(--orange)' : 'var(--text)'}">${stats.totalExtraFuelCost > 0 ? '+' : ''}${VFC.Utils.formatCurrency(stats.revisedFee - stats.originalFee, s.decimalPlaces)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
    container.appendChild(comparison);
  }
};
