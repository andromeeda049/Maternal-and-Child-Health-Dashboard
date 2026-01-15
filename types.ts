// Data structure for a single row in the dashboard (Refactored for KPI)
export interface KPIRecord {
  id: string;
  date: string;       // Period (e.g., "ตุลาคม 2569")
  indicator: string;  // KPI Name (e.g., "จำนวนมารดาคลอด")
  agency: string;     // Hospital/Unit (e.g., "รพ.สตูล")
  value: number;      // The count/value
  [key: string]: string | number;
}

export interface DashboardMetrics {
  totalCases: number;
  totalAgencies: number;
  totalIndicators: number;
  averagePerMonth: number;
  casesByIndicator: { name: string; value: number }[];
  casesByAgency: { name: string; value: number }[];
  monthlyTrend: { name: string; value: number }[];
  // New metrics for multi-dimensional cards
  topMonth: { name: string; value: number };
  topAgency: { name: string; value: number };
  topIndicator: { name: string; value: number };
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SHEET_SELECTION = 'SHEET_SELECTION',
  PREVIEW = 'PREVIEW',
  FILTER = 'FILTER',
  DASHBOARD = 'DASHBOARD',
  ERROR = 'ERROR'
}

export interface ParsedCSV {
  headers: string[];
  rows: string[][];
}

export interface ColumnMapping {
  date: string;      // Column for Time/Month
  indicator: string; // Column for KPI Name
  agency: string;    // Column for Hospital name
  value: string;     // Column for the number (used during map check, though unpivot handles most)
}

export interface GoogleSheetsApiResponse {
  [sheetName: string]: string[][];
}