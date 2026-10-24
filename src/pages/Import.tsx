import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Download, FileSpreadsheet, Loader2, PlusCircle, Trash2, UploadCloud, X } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import { MethodBadge, StatusBadge } from '../components/ui/Badges';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import { processTransactions } from '../services/dataProcessing';
import { IMPORT_FIELDS, TEMPLATE_ROWS, guessMapping, parseCSV, rowsToRaw } from '../utils/csvImport';
import type { ColumnMapping, DateOrder, ImportField } from '../utils/csvImport';
import { downloadCSV } from '../utils/csv';
import { formatDateTime, formatINR, formatNumber } from '../utils/format';
import { METHOD_LABELS, PAYMENT_METHODS, TXN_STATUSES } from '../types';
import type { Device, PaymentMethod, TxnStatus } from '../types';

const MAX_FILE_MB = 20;
const DEVICES: Device[] = ['Mobile App', 'Web', 'POS Terminal'];

interface Parsed {
  fileName: string;
  headers: string[];
  rows: string[][];
}

function nowLocalInput() {
  const d = new Date();
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

const EMPTY_FORM = {
  id: '', timestamp: nowLocalInput(), amount: '', method: 'UPI' as PaymentMethod, status: 'Success' as TxnStatus,
  customerId: '', merchant: '', category: '', city: '', device: 'Mobile App' as Device, failureReason: '',
};

export default function Import() {
  const { transactions, addTransactions, clearAllTransactions } = useAppData();
  const notify = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [dateOrder, setDateOrder] = useState<DateOrder>('DMY');
  const [defaultMethod, setDefaultMethod] = useState<PaymentMethod>('UPI');
  const [defaultStatus, setDefaultStatus] = useState<TxnStatus>('Success');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [adding, setAdding] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [clearing, setClearing] = useState(false);

  const result = useMemo(() => {
    if (!parsed) return null;
    const raw = rowsToRaw(parsed.rows, { mapping, dateOrder, defaultMethod, defaultStatus, source: `CSV · ${parsed.fileName}` });
    return processTransactions(raw);
  }, [parsed, mapping, dateOrder, defaultMethod, defaultStatus]);

  const missingRequired = IMPORT_FIELDS.filter((f) => f.required && mapping[f.field] === undefined);

  const readFile = (file: File) => {
    if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') {
      notify('Please choose a .csv file (in Excel: File → Save As → CSV).', 'error');
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      notify(`File is larger than ${MAX_FILE_MB} MB`, 'error');
      return;
    }
    file.text().then((text) => {
      const all = parseCSV(text);
      if (all.length < 2) {
        notify('The file has no data rows', 'error');
        return;
      }
      const [headers, ...rows] = all;
      setParsed({ fileName: file.name, headers, rows });
      setMapping(guessMapping(headers));
    });
  };

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) readFile(f);
    e.target.value = '';
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) readFile(f);
  };

  const setField = (field: ImportField, value: string) =>
    setMapping((m) => {
      const next = { ...m };
      if (value === '') delete next[field];
      else next[field] = Number(value);
      return next;
    });

  const runImport = async () => {
    if (!result || result.transactions.length === 0) return;
    setSaving(true);
    try {
      const saved = await addTransactions(result.transactions);
      const skipped = result.transactions.length - saved;
      notify(`Imported ${formatNumber(saved)} transactions${skipped ? ` · ${formatNumber(skipped)} already existed` : ''}`);
      setParsed(null);
    } catch (e) {
      notify(`Import failed: ${e instanceof Error ? e.message : 'unknown error'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const addOne = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    const amount = Number(form.amount);
    if (!form.timestamp) return setFormError('Choose the date and time.');
    if (!Number.isFinite(amount) || amount <= 0) return setFormError('Amount must be greater than 0.');
    const { transactions: valid, report } = processTransactions([{
      id: form.id.trim() || `TXN-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date(form.timestamp).toISOString(),
      amount,
      method: form.method,
      status: form.status,
      customerId: form.customerId.trim() || 'UNKNOWN',
      merchant: form.merchant,
      category: form.category,
      city: form.city,
      device: form.device,
      failureReason: form.failureReason,
      source: 'Manual entry',
    }]);
    if (!valid.length) return setFormError(report.rejected[0]?.reason ?? 'Invalid transaction');
    setAdding(true);
    try {
      const saved = await addTransactions(valid);
      if (saved) {
        notify(`Transaction ${valid[0].id} added`);
        setForm({ ...EMPTY_FORM, timestamp: nowLocalInput() });
      } else setFormError(`A transaction with ID ${valid[0].id} already exists.`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setAdding(false);
    }
  };

  const clearAll = async () => {
    setClearing(true);
    try {
      await clearAllTransactions();
      notify('All your transactions were deleted', 'info');
      setConfirmText('');
    } catch (e) {
      notify(`Delete failed: ${e instanceof Error ? e.message : 'unknown error'}`, 'error');
    } finally {
      setClearing(false);
    }
  };

  const downloadTemplate = () => downloadCSV('paypulse_import_template.csv', TEMPLATE_ROWS);

  return (
    <>
      <PageHeader
        title="Import data"
        description="Upload a CSV export from your bank, Razorpay, Paytm or PhonePe Business — or add transactions one by one."
        actions={<button className="btn-secondary" onClick={downloadTemplate}><Download className="h-4 w-4" /> CSV template</button>}
      />

      {/* Step 1 — choose file */}
      {!parsed && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`card flex flex-col items-center justify-center border-2 border-dashed px-6 py-14 text-center transition ${dragging ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200'}`}
        >
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-cyan-50 text-cyan-700"><UploadCloud className="h-7 w-7" /></span>
          <p className="mt-4 text-lg font-semibold text-slate-900">Drop a CSV file here</p>
          <p className="mt-1 max-w-md text-sm text-slate-500">
            Columns are detected automatically. Excel files: open them and use <b>File → Save As → CSV</b> first.
          </p>
          <button className="btn-ink mt-5" onClick={() => fileInput.current?.click()}><FileSpreadsheet className="h-4 w-4" /> Choose file</button>
          <input ref={fileInput} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
        </div>
      )}

      {/* Step 2 — map columns + preview */}
      {parsed && result && (
        <div className="grid gap-4 xl:grid-cols-5">
          <Card className="xl:col-span-2" title="Match columns" subtitle={`${parsed.fileName} · ${formatNumber(parsed.rows.length)} rows`}
            actions={<button className="btn-ghost h-8" onClick={() => setParsed(null)}><X className="h-4 w-4" /> Cancel</button>}>
            <div className="space-y-3">
              {IMPORT_FIELDS.map(({ field, label, required, hint }) => (
                <div key={field} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-center gap-3">
                  <label htmlFor={`m-${field}`} className="text-sm text-slate-700">
                    {label}{required && <span className="text-red-500"> *</span>}
                    {hint && <span className="block text-[11px] text-slate-400">{hint}</span>}
                  </label>
                  <select id={`m-${field}`} className="input h-9" value={mapping[field] ?? ''} onChange={(e) => setField(field, e.target.value)}>
                    <option value="">— not in file —</option>
                    {parsed.headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                  </select>
                </div>
              ))}
              <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
                <div>
                  <label htmlFor="o-date" className="label">Date format</label>
                  <select id="o-date" className="input h-9" value={dateOrder} onChange={(e) => setDateOrder(e.target.value as DateOrder)}>
                    <option value="DMY">DD/MM/YYYY</option>
                    <option value="MDY">MM/DD/YYYY</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="o-method" className="label">Default method</label>
                  <select id="o-method" className="input h-9" value={defaultMethod} onChange={(e) => setDefaultMethod(e.target.value as PaymentMethod)}>
                    {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{METHOD_LABELS[m]}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="o-status" className="label">Default status</label>
                  <select id="o-status" className="input h-9" value={defaultStatus} onChange={(e) => setDefaultStatus(e.target.value as TxnStatus)}>
                    {TXN_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </Card>

          <Card className="xl:col-span-3" title="Preview" bodyClassName="p-0"
            subtitle={`${formatNumber(result.report.validCount)} ready to import · ${formatNumber(result.report.rejectedCount)} skipped`}
            actions={
              <button className="btn-primary" onClick={runImport} disabled={saving || missingRequired.length > 0 || result.transactions.length === 0}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Import {formatNumber(result.transactions.length)}
              </button>
            }>
            {missingRequired.length > 0 && (
              <p className="mx-5 mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Choose a column for: {missingRequired.map((f) => f.label).join(', ')}.
              </p>
            )}
            {result.report.rejected.length > 0 && (
              <div className="mx-5 mt-4 flex flex-wrap gap-2">
                {result.report.rejected.map((r) => (
                  <span key={r.reason} className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700">{r.reason}: {formatNumber(r.count)}</span>
                ))}
              </div>
            )}
            <div className="scrollbar-thin mt-2 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {['ID', 'Date', 'Method', 'Amount', 'Status', 'Customer', 'Merchant'].map((h) => (
                      <th key={h} className="table-th font-medium normal-case tracking-normal text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.transactions.slice(0, 8).map((t) => (
                    <tr key={t.id} className="border-t border-slate-100">
                      <td className="table-td font-mono text-xs">{t.id}</td>
                      <td className="table-td text-xs">{formatDateTime(t.timestamp)}</td>
                      <td className="table-td"><MethodBadge method={t.method} /></td>
                      <td className="table-td font-semibold text-slate-900">{formatINR(t.amount)}</td>
                      <td className="table-td"><StatusBadge status={t.status} /></td>
                      <td className="table-td max-w-[10rem] truncate">{t.customerId}</td>
                      <td className="table-td max-w-[12rem] truncate">{t.merchant}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.transactions.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-500">No valid rows with the current column choices.</p>}
            </div>
          </Card>
        </div>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {/* Manual entry */}
        <Card className="xl:col-span-2" title={<span className="flex items-center gap-2"><PlusCircle className="h-4 w-4 text-cyan-600" /> Add a transaction</span>}
          subtitle="For payments that are not in an export yet">
          <form onSubmit={addOne} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" noValidate>
            <div>
              <label htmlFor="n-time" className="label">Date & time *</label>
              <input id="n-time" type="datetime-local" className="input" value={form.timestamp} onChange={(e) => setForm({ ...form, timestamp: e.target.value })} />
            </div>
            <div>
              <label htmlFor="n-amount" className="label">Amount (₹) *</label>
              <input id="n-amount" type="number" min="0.01" step="0.01" inputMode="decimal" className="input" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label htmlFor="n-id" className="label">Transaction ID</label>
              <input id="n-id" className="input" placeholder="auto" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
            </div>
            <div>
              <label htmlFor="n-method" className="label">Method</label>
              <select id="n-method" className="input" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as PaymentMethod })}>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{METHOD_LABELS[m]}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="n-status" className="label">Status</label>
              <select id="n-status" className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TxnStatus })}>
                {TXN_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="n-device" className="label">Device</label>
              <select id="n-device" className="input" value={form.device} onChange={(e) => setForm({ ...form, device: e.target.value as Device })}>
                {DEVICES.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="n-customer" className="label">Customer</label>
              <input id="n-customer" className="input" placeholder="ID, email or name" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} />
            </div>
            <div>
              <label htmlFor="n-merchant" className="label">Merchant</label>
              <input id="n-merchant" className="input" value={form.merchant} onChange={(e) => setForm({ ...form, merchant: e.target.value })} />
            </div>
            <div>
              <label htmlFor="n-category" className="label">Category</label>
              <input id="n-category" className="input" placeholder="Food, Travel…" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div>
              <label htmlFor="n-city" className="label">City</label>
              <input id="n-city" className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            {form.status === 'Failed' && (
              <div className="sm:col-span-2">
                <label htmlFor="n-reason" className="label">Failure reason</label>
                <input id="n-reason" className="input" value={form.failureReason} onChange={(e) => setForm({ ...form, failureReason: e.target.value })} />
              </div>
            )}
            <div className="flex items-end sm:col-span-2 lg:col-span-3">
              {formError && <p className="mr-auto rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{formError}</p>}
              <button type="submit" className="btn-ink ml-auto" disabled={adding}>
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />} Add transaction
              </button>
            </div>
          </form>
        </Card>

        {/* Manage data */}
        <Card title={<span className="flex items-center gap-2"><Trash2 className="h-4 w-4 text-red-500" /> Manage data</span>} subtitle="Stored securely in your account">
          <p className="text-sm text-slate-600">
            You have <b className="text-slate-900">{formatNumber(transactions.length)}</b> transactions saved.
            {transactions.length > 0 && <> <Link to="/dashboard" className="font-semibold text-cyan-700 hover:underline">Open dashboard →</Link></>}
          </p>
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50/50 p-4">
            <p className="text-sm font-semibold text-red-800">Delete all transactions</p>
            <p className="mt-1 text-xs text-red-700/80">This permanently removes every transaction and alert review in your account. Type <b>DELETE</b> to confirm.</p>
            <div className="mt-3 flex gap-2">
              <input aria-label="Type DELETE to confirm" className="input h-9" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
              <button className="btn h-9 bg-red-600 text-white hover:bg-red-700" disabled={confirmText !== 'DELETE' || clearing || !transactions.length} onClick={clearAll}>
                {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
              </button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
