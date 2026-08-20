// BudgetFX — Multi-Currency Budget Planner
//
// Every entry is stored in its original currency, then converted to the
// selected home currency for the summary and table using a live public
// exchange-rate API. Entries persist in localStorage — nothing is sent to
// a server (per this project's no-backend design).

const STORAGE_KEY = 'budgetfx.entries.v1';

const homeCurrencySelect = document.getElementById('home-currency');
const form = document.getElementById('entry-form');
const descInput = document.getElementById('entry-desc');
const amountInput = document.getElementById('entry-amount');
const currencySelect = document.getElementById('entry-currency');
const typeSelect = document.getElementById('entry-type');
const status = document.getElementById('status-line');
const entriesBody = document.getElementById('entries-body');
const sumIncome = document.getElementById('sum-income');
const sumExpense = document.getElementById('sum-expense');
const sumBalance = document.getElementById('sum-balance');

let entries = loadEntries();
let rateCache = {}; // { "USD_PHP": rate }

form.addEventListener('submit', onAddEntry);
homeCurrencySelect.addEventListener('change', renderAll);

renderAll();

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    setStatus('Could not save to this browser\u2019s storage — entries will not persist.', true);
  }
}

async function onAddEntry(e) {
  e.preventDefault();
  const desc = descInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const currency = currencySelect.value;
  const type = typeSelect.value;

  if (!desc || !amount || amount <= 0) {
    setStatus('Enter a description and an amount greater than zero.', true);
    return;
  }

  entries.push({ id: crypto.randomUUID(), desc, amount, currency, type, ts: Date.now() });
  saveEntries();
  form.reset();
  typeSelect.value = type; // keep last-used type selected
  setStatus('Entry added.', false);
  await renderAll();
}

async function getRate(from, to) {
  if (from === to) return 1;
  const key = `${from}_${to}`;
  if (rateCache[key]) return rateCache[key];

  const res = await fetch(`https://open.er-api.com/v6/latest/${from}`);
  if (!res.ok) throw new Error('rate service unavailable');
  const data = await res.json();
  const rate = data.rates?.[to];
  if (!rate) throw new Error(`no rate for ${from}->${to}`);
  rateCache[key] = rate;
  return rate;
}

async function renderAll() {
  const home = homeCurrencySelect.value;

  if (entries.length === 0) {
    entriesBody.innerHTML = '<tr class="empty-row"><td colspan="4">No entries yet — add your first one above.</td></tr>';
    sumIncome.textContent = formatMoney(0, home);
    sumExpense.textContent = formatMoney(0, home);
    sumBalance.textContent = formatMoney(0, home);
    return;
  }

  setStatus('Converting entries to your home currency…', false);

  let totalIncome = 0;
  let totalExpense = 0;
  entriesBody.innerHTML = '';

  const sorted = [...entries].sort((a, b) => b.ts - a.ts);

  for (const entry of sorted) {
    let converted;
    try {
      const rate = await getRate(entry.currency, home);
      converted = entry.amount * rate;
    } catch {
      converted = null;
    }

    if (converted !== null) {
      if (entry.type === 'income') totalIncome += converted;
      else totalExpense += converted;
    }

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHtml(entry.desc)}</td>
      <td class="amount-${entry.type}">${entry.type === 'expense' ? '-' : '+'}${formatMoney(entry.amount, entry.currency)}</td>
      <td class="amount-${entry.type}">${converted !== null ? (entry.type === 'expense' ? '-' : '+') + formatMoney(converted, home) : 'rate unavailable'}</td>
      <td><button class="remove-btn" data-id="${entry.id}">Remove</button></td>
    `;
    entriesBody.appendChild(row);
  }

  entriesBody.querySelectorAll('.remove-btn').forEach((btn) => {
    btn.addEventListener('click', () => removeEntry(btn.dataset.id));
  });

  sumIncome.textContent = formatMoney(totalIncome, home);
  sumExpense.textContent = formatMoney(totalExpense, home);
  sumBalance.textContent = formatMoney(totalIncome - totalExpense, home);

  setStatus('Entries are converted to your home currency and saved in this browser.', false);
}

function removeEntry(id) {
  entries = entries.filter((e) => e.id !== id);
  saveEntries();
  renderAll();
}

function formatMoney(value, currency) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function setStatus(msg, isError) {
  status.textContent = msg;
  status.classList.toggle('error', !!isError);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
