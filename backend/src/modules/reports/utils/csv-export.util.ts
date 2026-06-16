export type CsvColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function rowsToCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const headerLine = columns.map((c) => escapeCsvCell(c.header)).join(',');
  const dataLines = rows.map((row) =>
    columns
      .map((col) => {
        const raw = col.value(row);
        const text =
          raw === null || raw === undefined ? '' : String(raw);
        return escapeCsvCell(text);
      })
      .join(','),
  );

  return [headerLine, ...dataLines].join('\n');
}
