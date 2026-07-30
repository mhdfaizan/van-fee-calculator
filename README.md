# Van Fee Calculator

**Live App:** [mhdfaizan.github.io/van-fee-calculator](https://mhdfaizan.github.io/van-fee-calculator/)
**Repository:** [github.com/mhdfaizan/van-fee-calculator](https://github.com/mhdfaizan/van-fee-calculator)

Calculate monthly van fees based on daily petrol price fluctuations. A fully client-side Progressive Web App (PWA) that works entirely in the browser.

---

## How It Works

### 1. Set Your Parameters

Configure the month, monthly van fee, base petrol price (the price you budgeted for), vehicle mileage (km/L), default daily KM, and passenger count. Click **Apply Settings** to generate the calendar.

### 2. Enter Petrol Price Changes

Instead of entering a price for every single day, you only enter dates **when the petrol price changes**. For example, if price starts at ₱311/L on July 1 and rises to ₱316.15/L on July 18, you add two entries. The app automatically fills the correct price for each day in between.

### 3. Review and Adjust Daily Data

The app generates a full monthly calendar with all dates. Each row shows:
- Whether it's a **working day** (weekdays default to Yes, weekends to No)
- Whether it's a **holiday**
- The **petrol price** (auto-filled from your history)
- **KM driven** (auto-filled from default, editable)
- **Passenger count** (auto-filled, editable)
- Calculated fuel used, fuel cost, base cost, and extra cost
- **Notes** for special trips, half days, etc.

You can override any value on any day. Modified rows are highlighted in green. Holidays in red. Weekends in orange.

### 4. Dashboard Updates Instantly

All calculations update in real time as you edit:
- Working days count, total KM, total fuel used
- Average petrol price for the month
- Base fuel cost (at your budgeted price) vs actual fuel cost
- Extra fuel cost (the difference)
- Original van fee vs revised van fee (original + extra fuel)
- Per-passenger fee

### 5. Charts and Reports

- **Line chart** tracks daily petrol price trends
- **Bar chart** shows daily fuel costs
- **Pie chart** shows working vs non-working day split
- **Export** as PDF, Excel, CSV, or print directly

---

## Features

- **Settings Management** — Configure year, month, monthly fee (PKR), base petrol price, mileage, default daily KM, and passenger count
- **Petrol Price History** — Enter only dates when petrol prices change; daily prices auto-fill automatically
- **Daily Calendar Table** — Auto-generates all dates for the selected month with inline editing for working days, holidays, KM driven, passengers, and notes
- **Real-time Dashboard** — Working days, total KM, fuel used, average price, base/actual/extra costs, revised fee, and per-passenger fee — all updated instantly
- **Interactive Charts** — Line chart (daily petrol prices), bar chart (daily fuel costs), pie chart (working vs non-working days)
- **Reports** — Print-friendly layout, PDF export, Excel export, CSV export
- **Dark/Light Mode** — Toggle between themes
- **Persistent Storage** — All data saved automatically to LocalStorage; session restored on reload
- **Import/Export** — JSON backup and restore for data portability
- **Month History** — Independent data for each month; switch between months freely
- **Clone Previous Month** — Copy petrol history and daily data from the previous month
- **Undo/Redo** — Keyboard shortcuts (Ctrl+Z / Ctrl+Y)
- **PWA** — Installable, works offline after first visit

## How Calculations Work

| Metric | Formula |
|--------|---------|
| Fuel Used | Daily KM / Mileage (km/L) |
| Fuel Cost | Fuel Used × Daily Petrol Price |
| Base Fuel Cost | Fuel Used × Base Petrol Price |
| Extra Fuel Cost | Fuel Cost − Base Fuel Cost |
| Total Actual Fuel Cost | Sum of all daily fuel costs |
| Total Base Fuel Cost | Sum of all daily base fuel costs |
| Total Extra Fuel Cost | Total Actual − Total Base |
| Revised Van Fee | Monthly Fee + Total Extra Fuel Cost |
| Per Passenger Fee | Revised Fee / Average Passenger Count |

Non-working days are excluded from all calculations.

## Installation

No installation required. The app runs entirely in the browser.

```bash
git clone https://github.com/mhdfaizan/van-fee-calculator.git
cd van-fee-calculator
```

Then open `index.html` in any modern browser.

### CDN Dependencies

- [TailwindCSS](https://tailwindcss.com/) — Utility-first CSS framework
- [Chart.js](https://www.chartjs.org/) — Interactive charts
- [Day.js](https://day.js.org/) — Date manipulation
- [SheetJS](https://sheetjs.com/) — Excel export
- [jsPDF](https://github.com/parallax/jsPDF) — PDF export
- [html2canvas](https://html2canvas.hertzen.com/) — HTML to canvas for PDF

## Deployment

### GitHub Pages

1. Push the repository to GitHub
2. Go to **Settings → Pages**
3. Under **Branch**, select `main` (or `master`) and `/ (root)` folder
4. Click **Save**
5. Your site will be available at `https://<username>.github.io/van-fee-calculator/`

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      - uses: actions/deploy-pages@v4
```

## Browser Compatibility

- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+
- Opera 76+

## Project Structure

```
van-fee-calculator/
├── index.html          # Main application page
├── style.css           # Custom styles
├── app.js              # Main application logic
├── utils.js            # Utility functions
├── storage.js          # LocalStorage operations
├── calculations.js     # Fee calculation formulas
├── ui.js               # UI rendering
├── charts.js           # Chart.js integration
├── exports.js          # PDF, Excel, CSV export
├── manifest.json       # PWA manifest
├── service-worker.js   # PWA service worker
├── assets/
│   ├── icon-192.svg    # PWA icon (192×192)
│   └── icon-512.svg    # PWA icon (512×512)
└── README.md           # This file
```

## Future Enhancements

- CSV import for bulk data entry
- Settings import/export
- Auto-backup to cloud storage
- Multi-language support
- Animated dashboard transitions
- Keyboard shortcut reference dialog
- Version history / changelog tracking

## License

MIT
