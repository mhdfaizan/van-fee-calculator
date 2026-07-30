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
    const prevYear = s.year;
    const prevMonth = s.month;

    s.year = parseInt(document.getElementById('settingYear').value) || new Date().getFullYear();
    s.month = parseInt(document.getElementById('settingMonth').value) || 1;
    s.monthlyFee = parseFloat(document.getElementById('settingMonthlyFee').value) || 0;
    s.basePetrolPrice = parseFloat(document.getElementById('settingBasePrice').value) || 0;
    s.mileage = parseFloat(document.getElementById('settingMileage').value) || 8;
    s.defaultKm = parseFloat(document.getElementById('settingDefaultKm').value) || 0;
    s.defaultPassengers = parseInt(document.getElementById('settingDefaultPassengers').value) || 1;
    s.currency = document.getElementById('settingCurrency').value || 'PKR';

    const newKey = VFC.Utils.generateMonthKey(s.year, s.month);
    if (newKey !== data.currentKey) {
      VFC.Storage.switchToMonth(s.year, s.month);
    } else {
      VFC.Storage.saveCurrentMonth();
    }
    VFC.Storage.save();
    VFC.UI.renderAll();
    VFC.UI.showToast('Settings applied');
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

    VFC.Storage.saveCurrentMonth();
    this._scheduleSave();
    VFC.UI.renderDailyTable();
    VFC.UI.renderDashboard();
    VFC.Charts.update();
  },

  _onDailyChange() {
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
      const holiday = tr.querySelector('.day-holiday').checked;
      const price = parseFloat(tr.querySelector('.day-price').value) || 0;
      const km = parseFloat(tr.querySelector('.day-km').value) || 0;
      const passengers = parseInt(tr.querySelector('.day-pass').value) || 1;
      const notes = tr.querySelector('.day-notes').value || '';

      const existing = data.dailyData[date];
      const edited = existing ? existing.edited : false;

      data.dailyData[date] = { working, holiday, petrolPrice: price, kmDriven: km, passengers, notes, edited };
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
    VFC.Storage.saveCurrentMonth();
    this._scheduleSave();
    VFC.UI.renderPetrolHistory();
    VFC.UI.renderDailyTable();
    VFC.UI.renderDashboard();
    VFC.Charts.update();
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
