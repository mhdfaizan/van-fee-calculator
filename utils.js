window.VFC = window.VFC || {};

VFC.Utils = {
  MONTHS: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  DAYS: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  DAYS_SHORT: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
  getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  },

  getDayName(year, month, day) {
    return this.DAYS[new Date(year, month - 1, day).getDay()];
  },

  getDayNameShort(year, month, day) {
    return this.DAYS_SHORT[new Date(year, month - 1, day).getDay()];
  },

  isWeekend(year, month, day) {
    const d = new Date(year, month - 1, day).getDay();
    return d === 0 || d === 6;
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    return `${parseInt(parts[2])} ${this.MONTHS[parseInt(parts[1]) - 1].slice(0,3)}`;
  },

  formatDateInput(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toISOString().split('T')[0];
  },

  generateMonthKey(year, month) {
    return `${year}-${month}`;
  },

  getToday() {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  },

  getDefaultSettings() {
    const t = this.getToday();
    return {
      year: t.year,
      month: t.month,
      monthlyFee: 0,
      basePetrolPrice: 0,
      mileage: 8,
      defaultKm: 40,
      defaultPassengers: 4,
      decimalPlaces: 2
    };
  },

  formatCurrency(amount, decimals) {
    const val = (amount || 0).toFixed(decimals || 2);
    return `Rs. ${val}`;
  },

  formatNumber(val, decimals) {
    return (val || 0).toFixed(decimals || 2);
  },

  validateNumber(val, allowZero) {
    const n = parseFloat(val);
    if (isNaN(n)) return false;
    if (!allowZero && n === 0) return false;
    return n >= 0;
  },

  clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  },

  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  debounce(fn, delay) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  generateDateRange(year, month) {
    const days = this.getDaysInMonth(year, month);
    const result = [];
    for (let d = 1; d <= days; d++) {
      const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      result.push({
        date: dateStr,
        day: d,
        dayName: this.getDayName(year, month, d),
        dayNameShort: this.getDayNameShort(year, month, d),
        isWeekend: this.isWeekend(year, month, d)
      });
    }
    return result;
  },

  getPetrolPriceForDate(dateStr, petrolHistory) {
    if (!petrolHistory || petrolHistory.length === 0) return 0;
    const sorted = [...petrolHistory].sort((a, b) => a.date.localeCompare(b.date));
    let price = 0;
    for (const entry of sorted) {
      if (entry.date <= dateStr) price = entry.price;
    }
    return price;
  },

  sortByDate(arr) {
    return [...arr].sort((a, b) => a.date.localeCompare(b.date));
  }
};
