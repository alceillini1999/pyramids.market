// backend/src/routes/expenses.google.js
const express = require('express');
const router = express.Router();
const { readRows, appendRow, updateRow, deleteRow, findRowIndexByKey } = require('../google/sheets.repo');

const SHEET_ID = process.env.SHEET_EXPENSES_ID;
const TAB = process.env.SHEET_EXPENSES_TAB || 'Expenses';
// Columns: A:Date(ISO) | B:Description | C:Amount | D:Category | E:Notes

function rowToExpense(r) {
  return {
    date: r[0] || '',
    description: r[1] || '',
    amount: Number(r[2] || 0),
    category: r[3] || '',
    notes: r[4] || '',
  };
}

router.get('/', async (req, res) => {
  try {
    const rows = await readRows(SHEET_ID, TAB, 'A2:E');
    const list = rows.map(rowToExpense);
    res.json(list);
  } catch (e) {
    console.error('GET expenses:', e?.message || e);
    res.status(500).json({ error: 'Failed to read expenses' });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { date, description, amount=0, category='', notes='' } = req.body || {};
    if (!date || !description) return res.status(400).json({ error: 'date and description are required' });
    await appendRow(SHEET_ID, TAB, [date, description, Number(amount), category, notes]);
    res.json({ ok: true });
  } catch (e) {
    console.error('POST expense:', e?.message || e);
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

// optional: update/delete by composite key (date+description)
router.put('/google/:date/:desc', async (req, res) => {
  try {
    const keyDate = req.params.date;
    const keyDesc = req.params.desc;
    const rows = await readRows(SHEET_ID, TAB, 'A2:E');
    const idx = rows.findIndex(r => String(r[0]||'')===String(keyDate) && String(r[1]||'')===String(keyDesc));
    const rowIdx1 = idx >= 0 ? idx + 2 : -1;
    if (rowIdx1 < 0) return res.status(404).json({ error: 'Expense not found' });

    const { date=keyDate, description=keyDesc, amount=0, category='', notes='' } = req.body || {};
    await updateRow(SHEET_ID, TAB, rowIdx1, [date, description, Number(amount), category, notes]);
    res.json({ ok: true });
  } catch (e) {
    console.error('PUT expense:', e?.message || e);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

router.delete('/google/:date/:desc', async (req, res) => {
  try {
    const keyDate = req.params.date;
    const keyDesc = req.params.desc;
    const rows = await readRows(SHEET_ID, TAB, 'A2:E');
    const idx = rows.findIndex(r => String(r[0]||'')===String(keyDate) && String(r[1]||'')===String(keyDesc));
    const rowIdx1 = idx >= 0 ? idx + 2 : -1;
    if (rowIdx1 < 0) return res.status(404).json({ error: 'Expense not found' });
    await deleteRow(SHEET_ID, TAB, rowIdx1);
    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE expense:', e?.message || e);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

module.exports = router;