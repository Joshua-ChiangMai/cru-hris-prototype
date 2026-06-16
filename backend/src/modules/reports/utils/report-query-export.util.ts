import * as XLSX from 'xlsx';
import { CsvColumn, rowsToCsv } from './csv-export.util';

export type ReportQueryExportRow = {
  employeeId: string;
  name: string;
  city: string;
  department: string;
  gender: string;
  maritalStatus: string;
};

export const REPORT_QUERY_EXPORT_COLUMNS: CsvColumn<ReportQueryExportRow>[] = [
  { header: 'Employee ID', value: (r) => r.employeeId },
  { header: 'Name', value: (r) => r.name },
  { header: 'City', value: (r) => r.city },
  { header: 'Department', value: (r) => r.department },
  { header: 'Gender', value: (r) => r.gender },
  { header: 'Marital Status', value: (r) => r.maritalStatus },
];

export function getReportExportFilename(format: 'csv' | 'xlsx'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const stamp = `${year}${month}${day}`;
  return format === 'csv'
    ? `HRIS_Report_${stamp}.csv`
    : `HRIS_Report_${stamp}.xlsx`;
}

export function formatReportEnumLabel(value: string | null): string {
  if (!value) {
    return '';
  }

  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function toReportQueryExportRows(
  employees: Array<{
    employeeNo: string;
    fullName: string;
    city: { name: string };
    department: string | null;
    gender: string | null;
    maritalStatus: string | null;
  }>,
): ReportQueryExportRow[] {
  return employees.map((employee) => ({
    employeeId: employee.employeeNo,
    name: employee.fullName,
    city: employee.city.name,
    department: employee.department ?? '',
    gender: formatReportEnumLabel(employee.gender),
    maritalStatus: formatReportEnumLabel(employee.maritalStatus),
  }));
}

export function reportQueryRowsToCsv(rows: ReportQueryExportRow[]): string {
  return rowsToCsv(rows, REPORT_QUERY_EXPORT_COLUMNS);
}

export function reportQueryRowsToExcelBuffer(rows: ReportQueryExportRow[]): Buffer {
  const sheetRows = rows.map((row) => ({
    'Employee ID': row.employeeId,
    Name: row.name,
    City: row.city,
    Department: row.department,
    Gender: row.gender,
    'Marital Status': row.maritalStatus,
  }));

  const worksheet = XLSX.utils.json_to_sheet(sheetRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
