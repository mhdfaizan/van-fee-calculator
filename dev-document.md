# Project: Van Fee Calculator

## Objective

Develop a fully client-side web application for calculating monthly van fees based on daily petrol price fluctuations.

The application should be a professional-quality Progressive Web App (PWA) that works entirely in the browser without requiring a backend or database.

The application should be designed for non-technical users and should be responsive for desktop, tablet and mobile.

The final product must be deployable as a static website.

----------------------------------------------------

## Tech Stack

Use:

- HTML5
- CSS3
- TailwindCSS
- Vanilla JavaScript (ES2023)

Do NOT use:

- React
- Vue
- Angular
- jQuery

External libraries allowed:

- Day.js
- Chart.js
- SheetJS (xlsx)
- jsPDF
- FileSaver.js

No build process.

No npm.

No Node server.

Everything should work by simply opening index.html.

----------------------------------------------------

## Storage

Use browser LocalStorage.

Automatically save whenever data changes.

Automatically restore previous session when the page loads.

Include:

Reset All Data button

Export Backup (JSON)

Import Backup (JSON)

----------------------------------------------------

## Layout

Single page application.

Use modern card layout.

Sections:

1. Header

Application title

Current month

Current year

Dark Mode toggle

----------------------------------------------------

2. Settings Card

Inputs:

Year

Month

Monthly Van Fee

Base Petrol Price

Mileage (km/L)

Default Daily KM

Default Passenger Count

Currency

----------------------------------------------------

3. Petrol Price History

Instead of entering petrol price every day, user enters only dates where petrol price changes.

Columns:

Effective Date

Petrol Price

Delete

Add New Price

Example

1 Jul
311

18 Jul
316.15

22 Jul
320.73

23 Jul
327.12

24 Jul
331.52

25 Jul
335.18

28 Jul
334.18

29 Jul
335.81

30 Jul
335.06

Application automatically fills daily prices.

----------------------------------------------------

4. Daily Calendar Table

Automatically generate all dates of selected month.

Columns

Date

Day Name

Working Day

Holiday

Petrol Price

KM Driven

Passengers

Fuel Used

Fuel Cost

Base Fuel Cost

Extra Fuel Cost

Notes

Rules

Saturday and Sunday must still appear.

Weekends default to:

Working = false

Weekdays default to:

Working = true

User can manually override.

Example:

School holiday

Strike

Rain

Special trip

Half day

----------------------------------------------------

5. Dashboard

Cards

Working Days

Total KM

Fuel Used

Average Petrol Price

Base Fuel Cost

Actual Fuel Cost

Extra Fuel Cost

Original Van Fee

Revised Van Fee

Per Passenger Fee

Update instantly.

----------------------------------------------------

6. Charts

Chart.js

Line Chart

Daily Petrol Price

Bar Chart

Daily Fuel Cost

Pie Chart

Working vs Non-working Days

----------------------------------------------------

7. Reports

Printable monthly summary

Export PDF

Export Excel

----------------------------------------------------

## Calculation Rules

Fuel Used

Daily KM / Mileage

Fuel Cost

Fuel Used × Daily Petrol Price

Base Fuel Cost

Fuel Used × Base Petrol Price

Extra Fuel

Fuel Cost − Base Fuel Cost

Actual Fuel Cost

Sum of all daily fuel costs

Base Fuel Cost

Sum of all daily base fuel costs

Extra Fuel Cost

Actual Fuel Cost − Base Fuel Cost

Revised Fee

Monthly Fee + Extra Fuel Cost

Per Passenger Fee

Revised Fee / Passenger Count

Rows where Working Day = false

Must NOT be included in calculations.

----------------------------------------------------

## Automatic Month Generation

Selecting

Year

Month

Must automatically generate:

Correct number of days

Leap year handling

Correct weekdays

Examples

February

28 or 29 days

April

30

July

31

----------------------------------------------------

## Daily Behaviour

Each row should allow editing:

Working

Holiday

Petrol Price

KM

Passengers

Notes

Everything else should calculate automatically.

----------------------------------------------------

## Smart Features

Auto-fill petrol prices from Petrol Price History.

Auto-fill KM using default value.

Auto-fill passenger count using default value.

User can override any individual row.

----------------------------------------------------

## Validation

No negative numbers.

Mileage cannot be zero.

Passenger count minimum = 1.

Petrol price cannot be negative.

Prevent invalid dates.

----------------------------------------------------

## UI

Modern clean interface.

Rounded cards.

Soft shadows.

Sticky header.

Sticky table headers.

Responsive.

Dark mode.

Light mode.

----------------------------------------------------

## UX Improvements

Highlight weekends.

Highlight holidays.

Highlight edited rows.

Color coding

Green

Normal

Orange

Modified

Red

Holiday

----------------------------------------------------

## Advanced Features

Monthly history stored in LocalStorage.

User can switch between previous months.

Each month maintains independent data.

Example

July 2026

August 2026

September 2026

Each has separate records.

----------------------------------------------------

## Settings

Allow changing

Currency Symbol

Decimal Places

Default KM

Default Mileage

Default Passenger Count

----------------------------------------------------

## PWA

Implement

manifest.json

service-worker.js

Offline support

Installable

Works without internet

----------------------------------------------------

## Deployment

Deploy automatically using GitHub Pages.

Repository structure

index.html

style.css

app.js

manifest.json

service-worker.js

assets/

README.md

GitHub Actions optional but preferred.

After deployment provide:

Live URL

Repository URL

Deployment instructions

----------------------------------------------------

## Documentation

Generate README containing

Overview

Features

Installation

Deployment

How calculations work

Browser compatibility

Screenshots

Future enhancements

----------------------------------------------------

## Code Quality

Modular JavaScript.

No duplicated logic.

Meaningful function names.

Comments only where necessary.

Separate modules for

Storage

Calculations

UI

Charts

Exports

Utilities

----------------------------------------------------

## Nice-to-have Features

Search month

Clone previous month

Duplicate petrol history

Keyboard shortcuts

Undo

Redo

CSV export

Import Excel

Print-friendly layout

Animated dashboard

Settings import/export

Auto backup

Version information

About dialog

----------------------------------------------------

## Deliverables

Produce a complete production-ready application.

Everything should work immediately after cloning.

No TODOs.

No placeholders.

No mock data.

No incomplete features.

All calculations must be correct.

Test all functionality before considering the project complete.

Finally deploy to GitHub Pages and provide:

1. GitHub repository

2. Live deployed URL

3. README

4. Screenshots

5. Instructions for future customization.