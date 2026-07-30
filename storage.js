window.VFC = window.VFC || {};

VFC.Storage = {
  KEY: 'vanFeeCalculator',
  _data: null,
  _undoStack: [],
  _redoStack: [],
  MAX_UNDO: 50,

  _defaultData() {
    const settings = VFC.Utils.getDefaultSettings();
    const key = VFC.Utils.generateMonthKey(settings.year, settings.month);
    return {
      settings: VFC.Utils.deepClone(settings),
      petrolHistory: [],
      dailyData: {},
      monthHistory: {},
      currentKey: key
    };
  },

  _pushUndo() {
    this._undoStack.push(VFC.Utils.deepClone(this._data));
    if (this._undoStack.length > this.MAX_UNDO) this._undoStack.shift();
    this._redoStack = [];
  },

  init() {
    const raw = localStorage.getItem(this.KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        this._data = parsed;
        if (!this._data.monthHistory) this._data.monthHistory = {};
        const key = this._data.currentKey || VFC.Utils.generateMonthKey(
          this._data.settings.year, this._data.settings.month
        );
        this._data.currentKey = key;
        this._ensureMonthData();
      } catch {
        this._data = this._defaultData();
      }
    } else {
      this._data = this._defaultData();
    }
    this._seedDailyData();
    return this._data;
  },

  _seedDailyData() {
    const s = this._data.settings;
    const key = this._data.currentKey;
    if (!key) return;
    const days = VFC.Utils.getDaysInMonth(s.year, s.month);
    if (Object.keys(this._data.dailyData).length === days) return;
    const dates = VFC.Utils.generateDateRange(s.year, s.month);
    for (const d of dates) {
      if (!this._data.dailyData[d.date]) {
        const price = VFC.Utils.getPetrolPriceForDate(d.date, this._data.petrolHistory);
        this._data.dailyData[d.date] = {
          working: !d.isWeekend,
          holiday: false,
          petrolPrice: price,
          kmDriven: s.defaultKm,
          passengers: s.defaultPassengers,
          notes: '',
          edited: false
        };
      }
    }
    if (this._data.monthHistory[key]) {
      this._data.monthHistory[key].dailyData = VFC.Utils.deepClone(this._data.dailyData);
    }
  },

  _ensureMonthData() {
    const key = this._data.currentKey;
    if (!this._data.monthHistory[key]) {
      this._data.monthHistory[key] = {
        settings: VFC.Utils.deepClone(this._data.settings),
        petrolHistory: VFC.Utils.deepClone(this._data.petrolHistory),
        dailyData: VFC.Utils.deepClone(this._data.dailyData)
      };
    }
  },

  getData() {
    return this._data;
  },

  save() {
    this._pushUndo();
    localStorage.setItem(this.KEY, JSON.stringify(this._data));
  },

  saveQuiet() {
    localStorage.setItem(this.KEY, JSON.stringify(this._data));
  },

  loadMonth(key) {
    if (this._data.monthHistory[key]) {
      const m = this._data.monthHistory[key];
      this._data.settings = VFC.Utils.deepClone(m.settings);
      this._data.petrolHistory = VFC.Utils.deepClone(m.petrolHistory);
      this._data.dailyData = VFC.Utils.deepClone(m.dailyData);
      this._data.currentKey = key;
      return true;
    }
    return false;
  },

  saveCurrentMonth() {
    const key = this._data.currentKey;
    this._data.monthHistory[key] = {
      settings: VFC.Utils.deepClone(this._data.settings),
      petrolHistory: VFC.Utils.deepClone(this._data.petrolHistory),
      dailyData: VFC.Utils.deepClone(this._data.dailyData)
    };
  },

  switchToMonth(year, month) {
    this.saveCurrentMonth();
    const key = VFC.Utils.generateMonthKey(year, month);
    if (this._data.monthHistory[key]) {
      this.loadMonth(key);
    } else {
      this._data.currentKey = key;
      this._data.settings.year = year;
      this._data.settings.month = month;
      this._data.petrolHistory = [];
      this._data.dailyData = {};
      this._data.monthHistory[key] = {
        settings: VFC.Utils.deepClone(this._data.settings),
        petrolHistory: [],
        dailyData: {}
      };
    }
    this._seedDailyData();
    this.saveQuiet();
  },

  backup() {
    return JSON.stringify(this._data, null, 2);
  },

  restore(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.settings || !parsed.monthHistory) return false;
      this._data = parsed;
      this._pushUndo();
      this.saveQuiet();
      return true;
    } catch {
      return false;
    }
  },

  reset() {
    this._data = this._defaultData();
    this._undoStack = [];
    this._redoStack = [];
    this.saveQuiet();
  },

  undo() {
    if (this._undoStack.length === 0) return false;
    this._redoStack.push(VFC.Utils.deepClone(this._data));
    this._data = this._undoStack.pop();
    this.saveQuiet();
    return true;
  },

  redo() {
    if (this._redoStack.length === 0) return false;
    this._undoStack.push(VFC.Utils.deepClone(this._data));
    this._data = this._redoStack.pop();
    this.saveQuiet();
    return true;
  },

  clonePrevMonth() {
    const key = this._data.currentKey;
    const parts = key.split('-');
    let y = parseInt(parts[0]), m = parseInt(parts[1]);
    m--;
    if (m < 1) { m = 12; y--; }
    const prevKey = VFC.Utils.generateMonthKey(y, m);
    if (this._data.monthHistory[prevKey]) {
      const prev = this._data.monthHistory[prevKey];
      this._data.petrolHistory = VFC.Utils.deepClone(prev.petrolHistory);
      this._data.dailyData = VFC.Utils.deepClone(prev.dailyData);
      this.saveCurrentMonth();
      this.saveQuiet();
      return true;
    }
    return false;
  },

  duplicatePetrolHistory(srcKey) {
    const src = srcKey ? this._data.monthHistory[srcKey] : null;
    if (src) {
      this._data.petrolHistory = VFC.Utils.deepClone(src.petrolHistory);
    }
  }
};
