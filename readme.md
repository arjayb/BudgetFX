# BudgetFX — Multi-Currency Budget Planner

A budget ledger for anyone earning, spending, or sending money across more
than one currency: log income and expenses in whatever currency they
actually happened in, and see everything converted and totaled in one
home currency.

**Live demo:** _add your GitHub Pages link here_

## Why this project

Spreadsheet budgets fall apart the moment money crosses currencies — a
salary in AED, rent paid in PHP, a subscription billed in USD. BudgetFX
keeps each entry in its original currency (so the record stays accurate)
but converts everything live for the summary, so the totals are always in
one currency you actually think in.

## Features

- Add income/expense entries in any of six currencies
- Live conversion to a selectable home currency for every entry and the
  running summary (income, expenses, balance)
- Entries persist in the browser via `localStorage` — reload-safe, no
  account needed
- Full CRUD: add and remove entries
- No backend — this is a genuinely client-only app

## Tech stack

- Vanilla JavaScript (ES2020+)
- [open.er-api.com](https://www.exchangerate-api.com/) — free, keyless
  exchange-rate API
- Browser `localStorage` for persistence

## Running locally

```bash
git clone https://github.com/arjayb/BudgetFX.git
cd BudgetFX
npx serve .
```

## Known limitations

- Data lives only in the browser that created it — clearing site data or
  switching devices loses the ledger. A production version would need a
  backend and accounts to sync across devices.
- Currency conversion depends on the free API being reachable; if a rate
  can't be fetched, that row shows "rate unavailable" rather than a wrong
  number.

## Possible next steps

- CSV export/import
- Category tagging and monthly breakdown charts
- Optional backend sync for multi-device access

## License

MIT
