window.VFC = window.VFC || {};

VFC.Exports = {
  printReport() {
    window.print();
  },

  async exportPdf() {
    const btn = this._findBtn();
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = 'Generating PDF...';
    btn.disabled = true;

    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();

      pdf.setFontSize(18);
      pdf.text('Van Fee Calculator - Monthly Report', pageWidth / 2, 20, { align: 'center' });

      const data = VFC.Storage.getData();
      const s = data.settings;
      pdf.setFontSize(11);
      pdf.text(`${VFC.Utils.MONTHS[s.month - 1]} ${s.year}`, pageWidth / 2, 28, { align: 'center' });

      const stats = VFC.Calculations.calcMonth(data.dailyData, s);
      let y = 38;

      const drawStat = (label, value) => {
        pdf.setFontSize(10);
        pdf.text(label, 14, y);
        pdf.text(String(value), pageWidth - 14, y, { align: 'right' });
        y += 6;
      };

      drawStat('Working Days', stats.workingDays);
      drawStat('Total KM', VFC.Utils.formatNumber(stats.totalKm, 1));
      drawStat('Total Fuel Used', VFC.Utils.formatNumber(stats.totalFuelUsed, 2) + ' L');
      drawStat('Average Petrol Price', VFC.Utils.formatCurrency(stats.avgPetrolPrice, 2));
      drawStat('Base Fuel Cost', VFC.Utils.formatCurrency(stats.totalBaseFuelCost, s.decimalPlaces));
      drawStat('Actual Fuel Cost', VFC.Utils.formatCurrency(stats.totalFuelCost, s.decimalPlaces));
      drawStat('Extra Fuel Cost', VFC.Utils.formatCurrency(stats.totalExtraFuelCost, s.decimalPlaces));
      drawStat('Original Van Fee', VFC.Utils.formatCurrency(stats.originalFee, s.decimalPlaces));
      drawStat('Revised Van Fee', VFC.Utils.formatCurrency(stats.revisedFee, s.decimalPlaces));
      drawStat('Per Passenger Fee', VFC.Utils.formatCurrency(stats.perPassengerFee, s.decimalPlaces));

      y += 8;
      pdf.setFontSize(12);
      pdf.text('Daily Data', 14, y);
      y += 6;

      const days = VFC.Utils.generateDateRange(s.year, s.month);
      for (const d of days) {
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }
        const dd = data.dailyData[d.date] || {};
        const working = dd.working !== undefined ? dd.working : !d.isWeekend;
        if (!working) continue;
        const km = dd.kmDriven !== undefined ? dd.kmDriven : s.defaultKm;
        const passengers = dd.passengers !== undefined ? dd.passengers : s.defaultPassengers;
        const price = dd.petrolPrice !== undefined ? dd.petrolPrice :
          VFC.Utils.getPetrolPriceForDate(d.date, data.petrolHistory);
        const fuelUsed = VFC.Calculations.calcFuelUsed(km, s.mileage);
        const fuelCost = VFC.Calculations.calcFuelCost(fuelUsed, price);

        pdf.setFontSize(8);
        const line = `${d.day} ${d.dayNameShort}: ${km}km, ${passengers}pax, Rs. ${price}/L = ${fuelUsed.toFixed(2)}L, ${VFC.Utils.formatCurrency(fuelCost, s.decimalPlaces)}`;
        const lines = pdf.splitTextToSize(line, 180);
        pdf.text(lines, 14, y);
        y += 4 * lines.length;
      }

      pdf.save(`Van-Fee-Report-${s.year}-${s.month}.pdf`);
      VFC.UI.showToast('PDF exported successfully');
    } catch (err) {
      VFC.UI.showToast('PDF export failed: ' + err.message);
    }

    btn.textContent = orig;
    btn.disabled = false;
  },

  _findBtn() {
    const btns = document.querySelectorAll('.btn-primary');
    for (const btn of btns) {
      if (btn.textContent.includes('Export PDF')) return btn;
    }
    return null;
  },

  exportExcel() {
    const data = VFC.Storage.getData();
    const s = data.settings;
    const days = VFC.Utils.generateDateRange(s.year, s.month);

    const rows = [['Date', 'Day', 'Working', 'Holiday', 'Petrol Price', 'KM Driven', 'Passengers',
      'Fuel Used (L)', 'Fuel Cost', 'Base Fuel Cost', 'Extra Fuel Cost', 'Notes']];

    for (const d of days) {
      const dd = data.dailyData[d.date] || {};
      const working = dd.working !== undefined ? dd.working : !d.isWeekend;
      const holiday = dd.holiday || false;
      const price = dd.petrolPrice !== undefined ? dd.petrolPrice :
        VFC.Utils.getPetrolPriceForDate(d.date, data.petrolHistory);
      const km = dd.kmDriven !== undefined ? dd.kmDriven : s.defaultKm;
      const passengers = dd.passengers !== undefined ? dd.passengers : s.defaultPassengers;
      const fuelUsed = VFC.Calculations.calcFuelUsed(km, s.mileage);
      const fuelCost = VFC.Calculations.calcFuelCost(fuelUsed, price);
      const baseCost = VFC.Calculations.calcBaseFuelCost(fuelUsed, s.basePetrolPrice);
      const extraCost = VFC.Calculations.calcExtraFuel(fuelCost, baseCost);

      if (working) {
        rows.push([d.date, d.dayName, 'Yes', holiday ? 'Yes' : 'No', price, km, passengers,
          +fuelUsed.toFixed(2), +fuelCost.toFixed(2), +baseCost.toFixed(2), +extraCost.toFixed(2), dd.notes || '']);
      }
    }

    const stats = VFC.Calculations.calcMonth(data.dailyData, s);
    rows.push([]);
    rows.push(['Summary', '', '', '', '', '', '', '', '', '', '', '']);
    rows.push(['Working Days', stats.workingDays]);
    rows.push(['Total KM', +stats.totalKm.toFixed(1)]);
    rows.push(['Total Fuel Used (L)', +stats.totalFuelUsed.toFixed(2)]);
    rows.push(['Average Petrol Price', +stats.avgPetrolPrice.toFixed(2)]);
    rows.push(['Base Fuel Cost', +stats.totalBaseFuelCost.toFixed(2)]);
    rows.push(['Actual Fuel Cost', +stats.totalFuelCost.toFixed(2)]);
    rows.push(['Extra Fuel Cost', +stats.totalExtraFuelCost.toFixed(2)]);
    rows.push(['Original Van Fee', stats.originalFee]);
    rows.push(['Revised Van Fee', +stats.revisedFee.toFixed(2)]);
    rows.push(['Per Passenger Fee', +stats.perPassengerFee.toFixed(2)]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!colwidths'] = [12, 10, 8, 8, 10, 10, 10, 10, 10, 10, 10, 18];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Van Fee Report');
    XLSX.writeFile(wb, `Van-Fee-Report-${s.year}-${s.month}.xlsx`);
    VFC.UI.showToast('Excel exported successfully');
  },

  exportCsv() {
    const data = VFC.Storage.getData();
    const s = data.settings;
    const days = VFC.Utils.generateDateRange(s.year, s.month);

    const rows = [['Date', 'Day', 'Working', 'Holiday', 'Petrol Price', 'KM Driven', 'Passengers',
      'Fuel Used (L)', 'Fuel Cost', 'Base Fuel Cost', 'Extra Fuel Cost', 'Notes']];

    for (const d of days) {
      const dd = data.dailyData[d.date] || {};
      const working = dd.working !== undefined ? dd.working : !d.isWeekend;
      const holiday = dd.holiday || false;
      const price = dd.petrolPrice !== undefined ? dd.petrolPrice :
        VFC.Utils.getPetrolPriceForDate(d.date, data.petrolHistory);
      const km = dd.kmDriven !== undefined ? dd.kmDriven : s.defaultKm;
      const passengers = dd.passengers !== undefined ? dd.passengers : s.defaultPassengers;
      const fuelUsed = VFC.Calculations.calcFuelUsed(km, s.mileage);
      const fuelCost = VFC.Calculations.calcFuelCost(fuelUsed, price);
      const baseCost = VFC.Calculations.calcBaseFuelCost(fuelUsed, s.basePetrolPrice);
      const extraCost = VFC.Calculations.calcExtraFuel(fuelCost, baseCost);
      if (working) {
        rows.push([d.date, d.dayName, 'Yes', holiday ? 'Yes' : 'No', price, km, passengers,
          fuelUsed.toFixed(2), fuelCost.toFixed(2), baseCost.toFixed(2), extraCost.toFixed(2), `"${(dd.notes || '').replace(/"/g, '""')}"`]);
      }
    }

    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Van-Fee-Report-${s.year}-${s.month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    VFC.UI.showToast('CSV exported successfully');
  }
};
