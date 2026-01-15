import { KPIRecord, DashboardMetrics, ParsedCSV, ColumnMapping, GoogleSheetsApiResponse } from "../types";

// Robust CSV Line Splitter
const splitCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (i + 1 < line.length && line[i+1] === '"') {
         current += '"';
         i++;
      } else {
         inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

export const parseRawCSV = (csvText: string): ParsedCSV => {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = splitCSVLine(lines[0]);
  const rows = lines.slice(1).map(line => splitCSVLine(line)).filter(row => row.length === headers.length || row.length === headers.length + 1);
  return { headers, rows };
};

export const parseSheetData = (data: string[][]): ParsedCSV => {
  if (!data || data.length < 2) return { headers: [], rows: [] };
  const headers = data[0];
  const rows = data.slice(1);
  return { headers, rows };
}

export const mergeSelectedSheets = (apiData: GoogleSheetsApiResponse, selectedSheets: string[]): ParsedCSV => {
  if (selectedSheets.length === 0) return { headers: [], rows: [] };
  const firstValidSheet = selectedSheets.find(name => apiData[name] && apiData[name].length > 0);
  if (!firstValidSheet) return { headers: [], rows: [] };

  const headers = apiData[firstValidSheet][0];
  let allRows: string[][] = [];

  selectedSheets.forEach(name => {
    const sheetData = apiData[name];
    if (sheetData && sheetData.length > 1) {
        const rows = sheetData.slice(1);
        allRows = [...allRows, ...rows];
    }
  });
  return { headers, rows: allRows };
};

// --- Thai Date & Unpivot Logic ---

export const THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const SHORT_THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

const isDateColumn = (header: string) => {
    const h = header.trim();
    // Check for "Month Year" pattern e.g., "ตุลาคม 2569"
    const hasThaiMonth = THAI_MONTHS.some(m => h.includes(m)) || SHORT_THAI_MONTHS.some(m => h.includes(m));
    const hasYear = /\d{4}/.test(h); // Likely year
    return hasThaiMonth || (hasYear && (h.includes('/') || h.includes('-')));
};

export const checkForWideFormatAndUnpivot = (parsed: ParsedCSV): ParsedCSV => {
    const { headers, rows } = parsed;
    
    const dateColIndices: number[] = [];
    const dimensionColIndices: number[] = [];
    
    headers.forEach((h, i) => {
        if (isDateColumn(h)) {
            dateColIndices.push(i);
        } else {
            dimensionColIndices.push(i);
        }
    });

    // If we detect multiple date columns, unpivot
    if (dateColIndices.length >= 2) {
        console.log("Detected wide Matrix format. Unpivoting...", dateColIndices.map(i => headers[i]));
        
        // Dimensions + Period + Value
        const newHeaders = [...dimensionColIndices.map(i => headers[i]), 'Period', 'Value'];
        const newRows: string[][] = [];

        rows.forEach(row => {
            const dimensions = dimensionColIndices.map(i => row[i]);
            dateColIndices.forEach(dateIdx => {
                const val = row[dateIdx];
                // Keep strictly numeric values or empty
                if (val !== undefined && val !== null && val.trim() !== '') {
                   // Clean comma from numbers e.g. "1,200"
                   const cleanVal = val.replace(/,/g, '');
                   newRows.push([...dimensions, headers[dateIdx], cleanVal]);
                }
            });
        });

        return { headers: newHeaders, rows: newRows };
    }
    return parsed;
}

export const getAutoMapping = (headers: string[]): ColumnMapping => {
  const lowerHeaders = headers.map(h => h.toLowerCase());
  
  const findMatch = (keywords: string[]) => {
    const index = lowerHeaders.findIndex(h => keywords.some(k => h.includes(k)));
    return index > -1 ? headers[index] : '';
  };

  return {
    // Looks for "Period" (created by unpivot) or explicit date cols
    date: findMatch(['period', 'date', 'เดือน', 'ปี', 'เวลา']),
    // Looks for "รายการตัวชี้วัด"
    indicator: findMatch(['indicator', 'kpi', 'รายการ', 'ตัวชี้วัด', 'category', 'topic']),
    // Looks for "หน่วยงาน"
    agency: findMatch(['agency', 'hospital', 'unit', 'หน่วยงาน', 'สถานพยาบาล', 'region', 'area']),
    // Looks for "Value" (created by unpivot)
    value: findMatch(['value', 'count', 'amount', 'จำนวน', 'total', 'ค่า']),
  };
};

export const convertRawToSalesData = (rawData: ParsedCSV, mapping: ColumnMapping): KPIRecord[] => {
  const { headers, rows } = rawData;
  const getIdx = (colName: string) => headers.indexOf(colName);

  const dateIdx = getIdx(mapping.date);
  const indIdx = getIdx(mapping.indicator);
  const agencyIdx = getIdx(mapping.agency);
  const valIdx = getIdx(mapping.value);

  return rows.map((row, i) => {
    const rawVal = valIdx > -1 ? row[valIdx] : '0';
    const val = parseFloat(rawVal.replace(/,/g, '').replace(/[^0-9.-]/g, ''));
    
    if (isNaN(val)) return null;

    return {
      id: `row-${i}`,
      date: dateIdx > -1 ? row[dateIdx] : 'Unknown Period',
      indicator: indIdx > -1 ? row[indIdx] : 'General KPI',
      agency: agencyIdx > -1 ? row[agencyIdx] : 'Unknown Agency',
      value: val,
    };
  }).filter((item): item is KPIRecord => item !== null);
};

// Helper to sort Thai Months chronologically
export const getThaiMonthIndex = (periodStr: string): number => {
    const p = periodStr.trim();
    for (let i = 0; i < THAI_MONTHS.length; i++) {
        if (p.includes(THAI_MONTHS[i])) return i;
    }
    return -1;
};

export const calculateMetrics = (data: KPIRecord[]): DashboardMetrics => {
  const totalCases = data.reduce((sum, item) => sum + item.value, 0);
  const uniqueAgencies = new Set(data.map(d => d.agency)).size;
  const uniqueIndicators = new Set(data.map(d => d.indicator)).size;
  
  // By Indicator
  const indMap = new Map<string, number>();
  data.forEach(item => {
    indMap.set(item.indicator, (indMap.get(item.indicator) || 0) + item.value);
  });
  const casesByIndicator = Array.from(indMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // By Agency
  const agencyMap = new Map<string, number>();
  data.forEach(item => {
    agencyMap.set(item.agency, (agencyMap.get(item.agency) || 0) + item.value);
  });
  const casesByAgency = Array.from(agencyMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Trend
  const dateMap = new Map<string, number>();
  data.forEach(item => {
    dateMap.set(item.date, (dateMap.get(item.date) || 0) + item.value);
  });
  
  // Sort by Thai month index if possible, else alphabetical
  const monthlyTrend = Array.from(dateMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => {
        const idxA = getThaiMonthIndex(a.name);
        const idxB = getThaiMonthIndex(b.name);
        if (idxA !== -1 && idxB !== -1) {
             // Handle year crossing (e.g. Oct 69 -> Jan 70)
             const yearA = parseInt(a.name.match(/\d{4}/)?.[0] || '0');
             const yearB = parseInt(b.name.match(/\d{4}/)?.[0] || '0');
             
             if (yearA !== yearB) return yearA - yearB;
             return idxA - idxB;
        }
        return a.name.localeCompare(b.name);
    });

  // Calculate Tops
  const topMonth = monthlyTrend.length > 0 ? monthlyTrend.reduce((prev, current) => (prev.value > current.value) ? prev : current) : { name: '-', value: 0 };
  const topAgency = casesByAgency.length > 0 ? casesByAgency[0] : { name: '-', value: 0 };
  const topIndicator = casesByIndicator.length > 0 ? casesByIndicator[0] : { name: '-', value: 0 };

  return {
    totalCases,
    totalAgencies: uniqueAgencies,
    totalIndicators: uniqueIndicators,
    averagePerMonth: monthlyTrend.length > 0 ? totalCases / monthlyTrend.length : 0,
    casesByIndicator,
    casesByAgency,
    monthlyTrend,
    topMonth,
    topAgency,
    topIndicator
  };
};

export const DEMO_DATA_CSV = `KPI Name,Agency,October 2569,November 2569,December 2569
Childbirths,Hospital A,181,126,170
Preterm Births,Hospital A,3,4,4
Childbirths,Hospital B,35,28,29
Preterm Births,Hospital B,1,0,1`;