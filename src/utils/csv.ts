type Cell = string | number | undefined | null;

function escape(cell: Cell): string {
  const s = cell === undefined || cell === null ? '' : String(cell);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV(rows: Record<string, Cell>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.map(escape).join(',')];
  rows.forEach((r) => lines.push(headers.map((h) => escape(r[h])).join(',')));
  return lines.join('\r\n');
}

/** Builds a CSV and triggers a browser download. Returns false if there was nothing to export. */
export function downloadCSV(filename: string, rows: Record<string, Cell>[], preface: string[] = []): boolean {
  if (rows.length === 0) return false;
  const body = [...preface.map(escape), toCSV(rows)].join('\r\n');
  const blob = new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
