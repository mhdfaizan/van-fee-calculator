window.VFC = window.VFC || {};

VFC.App = {
  _saveTimer: null,
  _autoSaveDelay: 300,

  init() {
    VFC.Storage.init();
    VFC.UI.init();
    this._bindKeyboardShortcuts();
    VFC.UI.renderAll();
  },

  _bindKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); this._undo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); this._redo(); }
    });
  },

  _applySettings() {
    const data = VFC.Storage.getData();
    const s = data.settings;

    s.year = parseInt(document.getElementById('settingYear').value) || new Date().getFullYear();
    s.month = parseInt(document.getElementById('settingMonth').value) || 1;
    s.monthlyFee = parseFloat(document.getElementById('settingMonthlyFee').value) || 0;
    s.basePetrolPrice = parseFloat(document.getElementById('settingBasePrice').value) || 0;
    s.mileage = parseFloat(document.getElementById('settingMileage').value) || 8;
    s.defaultKm = parseFloat(document.getElementById('settingDefaultKm').value) || 0;
    s.defaultPassengers = parseInt(document.getElementById('settingDefaultPassengers').value) || 1;

    const newKey = VFC.Utils.generateMonthKey(s.year, s.month);
    if (newKey !== data.currentKey) {
      VFC.Storage.switchToMonth(s.year, s.month);
    } else {
      VFC.Storage.saveCurrentMonth();
    }

    const active = data.petrolHistory.filter(p => p.price > 0);
    for (const dateKey in data.dailyData) {
      const day = data.dailyData[dateKey];
      if (!day.edited) {
        day.kmDriven = s.defaultKm;
        day.passengers = s.defaultPassengers;
      }
      day.petrolPrice = VFC.Utils.getPetrolPriceForDate(dateKey, active);
    }

    VFC.Storage.saveCurrentMonth();
    VFC.Storage.save();
    VFC.UI.renderAll();
    VFC.UI.showToast('Settings applied');
  },

  _reapplyPetrolPrices() {
    const data = VFC.Storage.getData();
    const active = data.petrolHistory.filter(p => p.price > 0);
    for (const dateKey in data.dailyData) {
      const price = VFC.Utils.getPetrolPriceForDate(dateKey, active);
      if (price > 0 || !data.dailyData[dateKey].petrolPrice) {
        data.dailyData[dateKey].petrolPrice = price;
      }
    }
    VFC.Storage.saveCurrentMonth();
    this._scheduleSave();
    VFC.UI.renderDailyTable();
    VFC.UI.renderDashboard();
    VFC.Charts.update();
  },

  _onPetrolChange(e) {
    const el = e.target;
    const id = parseFloat(el.dataset.id);
    const data = VFC.Storage.getData();
    const entry = data.petrolHistory.find(p => p.id === id);
    if (!entry) return;

    if (el.classList.contains('petrol-date')) {
      entry.date = el.value;
    } else if (el.classList.contains('petrol-price')) {
      entry.price = parseFloat(el.value) || 0;
    }

    this._reapplyPetrolPrices();
  },

  _onDailyChange(e) {
    const tr = e.target && e.target.closest('tr');
    if (tr && tr.dataset.date) {
      const data = VFC.Storage.getData();
      if (data.dailyData[tr.dataset.date]) {
        data.dailyData[tr.dataset.date].edited = true;
      }
    }
    this._collectDailyData();
    VFC.Storage.saveCurrentMonth();
    this._scheduleSave();
    VFC.UI.renderDashboard();
    VFC.Charts.update();
  },

  _onDailyInput() {
    this._debouncedDailyUpdate();
  },

  _debouncedDailyUpdate: null,

  _collectDailyData() {
    const data = VFC.Storage.getData();
    const rows = document.querySelectorAll('#dailyTableBody tr');
    rows.forEach(tr => {
      const date = tr.dataset.date;
      if (!date) return;
      const working = tr.querySelector('.day-working').checked;
      const price = parseFloat(tr.querySelector('.day-price').value) || 0;
      const km = parseFloat(tr.querySelector('.day-km').value) || 0;
      const passengers = parseInt(tr.querySelector('.day-pass').value) || 1;
      const notes = tr.querySelector('.day-notes').value || '';

      const existing = data.dailyData[date];
      const edited = existing ? existing.edited : false;

      data.dailyData[date] = { working, petrolPrice: price, kmDriven: km, passengers, notes, edited };
    });
  },

  _addPetrolPrice() {
    const data = VFC.Storage.getData();
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    data.petrolHistory.push({ id: Date.now(), date: dateStr, price: 0 });
    VFC.Storage.saveCurrentMonth();
    this._scheduleSave();
    VFC.UI.renderPetrolHistory();
  },

  _deletePetrolPrice(id) {
    const data = VFC.Storage.getData();
    data.petrolHistory = data.petrolHistory.filter(e => e.id != id);
    this._reapplyPetrolPrices();
    VFC.UI.renderPetrolHistory();
  },

  _scheduleSave() {
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      VFC.Storage.save();
    }, this._autoSaveDelay);
  },

  _resetAll() {
    if (!confirm('Are you sure you want to reset ALL data? This cannot be undone.')) return;
    VFC.Storage.reset();
    VFC.UI.renderAll();
    VFC.UI.showToast('All data has been reset');
  },

  _backup() {
    const json = VFC.Storage.backup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ts = new Date().toISOString().slice(0, 10);
    a.download = `van-fee-backup-${ts}.json`;
    a.click();
    URL.revokeObjectURL(url);
    VFC.UI.showToast('Backup downloaded');
  },

  _restore(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      if (VFC.Storage.restore(e.target.result)) {
        VFC.UI.renderAll();
        VFC.UI.showToast('Backup restored successfully');
      } else {
        VFC.UI.showToast('Invalid backup file');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  },

  _undo() {
    if (VFC.Storage.undo()) {
      VFC.UI.renderAll();
      VFC.UI.showToast('Undo');
    }
  },

  _redo() {
    if (VFC.Storage.redo()) {
      VFC.UI.renderAll();
      VFC.UI.showToast('Redo');
    }
  },

  _clonePrevMonth() {
    if (VFC.Storage.clonePrevMonth()) {
      VFC.UI.renderAll();
      VFC.UI.showToast('Previous month data cloned');
    } else {
      VFC.UI.showToast('No previous month data found');
    }
  },

  _duplicatePetrolHistory() {
    const data = VFC.Storage.getData();
    const keys = Object.keys(data.monthHistory).filter(k => k !== data.currentKey);
    if (keys.length === 0) {
      VFC.UI.showToast('No other months available');
      return;
    }
    VFC.Storage.duplicatePetrolHistory(keys[keys.length - 1]);
    VFC.UI.renderPetrolHistory();
    VFC.UI.renderDailyTable();
    VFC.UI.renderDashboard();
    VFC.Charts.update();
    VFC.UI.showToast('Petrol history duplicated');
  },

  _psoEntries: null,

  _parsePsoDate(text) {
    const months = {
      'January':1,'February':2,'March':3,'April':4,'May':5,'June':6,
      'July':7,'August':8,'September':9,'October':10,'November':11,'December':12
    };
    const m = text.trim().match(/^(\w+)\s+(\d+),\s+(\d{4})$/);
    if (!m) return null;
    const month = months[m[1]];
    if (!month) return null;
    return `${m[3]}-${String(month).padStart(2,'0')}-${String(parseInt(m[2])).padStart(2,'0')}`;
  },

  _parsePsoHtml(html, fromDate, toDate) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const entries = [];
    let oldestDate = null;
    const links = doc.querySelectorAll('a.uk-accordion-title');
    for (const link of links) {
      const text = link.textContent.trim();
      const dateMatch = text.match(/Effective From:\s*(.+)/);
      if (!dateMatch) continue;
      const dateStr = this._parsePsoDate(dateMatch[1]);
      if (!dateStr) continue;
      if (!oldestDate || dateStr < oldestDate) oldestDate = dateStr;
      if (dateStr < fromDate || dateStr > toDate) continue;
      const content = link.nextElementSibling;
      if (!content) continue;
      const rows = content.querySelectorAll('table tbody tr');
      for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2 && cells[0].textContent.trim() === 'PREMIER EURO 5') {
          const pm = cells[1].textContent.trim().match(/Rs\.?\s*([\d.]+)/);
          if (pm) entries.push({ date: dateStr, price: parseFloat(pm[1]) });
        }
      }
    }
    return { entries, oldestDate };
  },

  async _doPsoFetch() {
    const fromDate = document.getElementById('psoFromDate').value;
    const toDate = document.getElementById('psoToDate').value;
    if (!fromDate || !toDate) { VFC.UI.showToast('Select a date range'); return; }
    VFC.UI._setPsoStatus('Fetching PSO prices...');
    document.getElementById('psoFetchBtn').disabled = true;
    const proxyBase = 'https://corsproxy.io/?url=';
    this._psoEntries = [];
    let page = 1;
    let ok = true;
    while (ok && page <= 41) {
      const url = proxyBase + encodeURIComponent(`https://psopk.com/fuel-prices/pol/archives?page=${page}`);
      try {
        const r = await fetch(url);
        if (!r.ok) { ok = false; break; }
        const html = await r.text();
        const result = this._parsePsoHtml(html, fromDate, toDate);
        this._psoEntries.push(...result.entries);
        if (result.oldestDate && result.oldestDate < fromDate) break;
        page++;
      } catch {
        ok = false;
        break;
      }
    }
    document.getElementById('psoFetchBtn').disabled = false;
    if (!ok && this._psoEntries.length === 0) {
      VFC.UI._setPsoStatus('Auto-fetch failed. Use the manual paste option below.');
      VFC.UI._showPsoFallback();
      return;
    }
    VFC.UI._showPsoPreview(this._psoEntries);
  },

  _doPsoParse() {
    const html = document.getElementById('psoPasteArea').value;
    if (!html.trim()) { VFC.UI.showToast('Paste the PSO page HTML first'); return; }
    const fromDate = document.getElementById('psoFromDate').value;
    const toDate = document.getElementById('psoToDate').value;
    const result = this._parsePsoHtml(html, fromDate, toDate);
    this._psoEntries = result.entries;
    VFC.UI._showPsoPreview(this._psoEntries);
  },

  _doPsoImport() {
    if (!this._psoEntries || this._psoEntries.length === 0) {
      VFC.UI.showToast('No entries to import');
      return;
    }
    const data = VFC.Storage.getData();
    const existing = new Set(data.petrolHistory.map(e => e.date));
    let added = 0;
    for (const entry of this._psoEntries) {
      if (!existing.has(entry.date)) {
        data.petrolHistory.push({ id: Date.now() + added, date: entry.date, price: entry.price });
        added++;
      }
    }
    if (added === 0) {
      VFC.UI.showToast('All entries already in history');
      VFC.UI._closePsoImport();
      return;
    }
    VFC.Storage.saveCurrentMonth();
    this._scheduleSave();
    this._reapplyPetrolPrices();
    VFC.UI.renderPetrolHistory();
    VFC.UI.showToast(`Imported ${added} price entries from PSO`);
    VFC.UI._closePsoImport();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  VFC.App._debouncedDailyUpdate = VFC.Utils.debounce(() => {
    VFC.App._collectDailyData();
    VFC.Storage.saveCurrentMonth();
    VFC.Storage.save();
    VFC.UI.renderDashboard();
    VFC.Charts.update();
  }, 500);

  VFC.App.init();
});
