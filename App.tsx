import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { 
  parseRawCSV, 
  parseSheetData,
  getAutoMapping, 
  convertRawToSalesData, 
  checkForWideFormatAndUnpivot
} from './utils/dataHelpers';
import { AppStatus, ParsedCSV, KPIRecord, GoogleSheetsApiResponse } from './types';

// CONFIGURATION
// 1. If you have deployed the 'backend/code.gs' script, paste the Web App URL here.
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwTbqA55DKcz0Gw4UJpM3ffkCHFtiAGdTSdG7mRZQi9Cj4iR9RVcLC4jiwUyiRVQmLl/exec'; 
// 2. Fallback CSV URL (Direct access for immediate demo)
const DIRECT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1GgT24LDocYbxOirwHzsMagwvyYacDN50nc47i6Cfg2s/edit?gid=615412029';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.LOADING);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [mappedData, setMappedData] = useState<KPIRecord[]>([]);

  // Auto-start
  useEffect(() => {
    // Prefer Apps Script if configured, otherwise use CSV
    const targetUrl = APPS_SCRIPT_URL || DIRECT_SHEET_URL;
    const type = APPS_SCRIPT_URL ? 'json_api' : 'csv';
    
    handleDataLoad(targetUrl, type);
  }, []);

  const handleError = (msg: string) => {
      console.error(msg);
      setErrorMessage(msg);
      setStatus(AppStatus.ERROR);
  }

  const processAndShowDashboard = (raw: ParsedCSV) => {
      try {
         // 1. Unpivot (if needed)
         const processed = checkForWideFormatAndUnpivot(raw);
         
         // 2. Auto Map
         const mapping = getAutoMapping(processed.headers);
         
         // 3. Convert to Records
         const data = convertRawToSalesData(processed, mapping);
         
         if (data.length === 0) {
             throw new Error("No valid data found after processing.");
         }
         
         setMappedData(data);
         setStatus(AppStatus.DASHBOARD);

      } catch (e) {
         handleError(e instanceof Error ? e.message : "Processing failed");
      }
  };

  const handleDataLoad = async (url: string, type: 'csv' | 'json_api') => {
    setStatus(AppStatus.LOADING);
    setErrorMessage('');
    
    try {
        if (type === 'csv') {
             // ... CSV Handling Logic ...
             let fetchUrl = url;
             const spreadSheetIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
             if (spreadSheetIdMatch) {
                 const spreadsheetId = spreadSheetIdMatch[1];
                 let gid = '';
                 try {
                    const urlObj = new URL(url);
                    if (urlObj.searchParams.get('gid')) gid = urlObj.searchParams.get('gid') || '';
                    else if (urlObj.hash) {
                        const hashParams = new URLSearchParams(urlObj.hash.substring(1));
                        if (hashParams.get('gid')) gid = hashParams.get('gid') || '';
                    }
                 } catch (e) {}

                 if (gid) fetchUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
                 else fetchUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&sheet=Dashboard`;
             }
             
             console.log("Fetching CSV from:", fetchUrl);
             const response = await fetch(fetchUrl);
             if(!response.ok) throw new Error("Could not fetch CSV. Check sheet permissions.");
             const text = await response.text();
             const parsed = parseRawCSV(text);
             processAndShowDashboard(parsed);

        } else {
             // ... Apps Script JSON Logic ...
             console.log("Fetching API from:", url);
             const cacheBuster = url.includes('?') ? '&' : '?';
             const fetchUrl = `${url}${cacheBuster}t=${Date.now()}`;

             let response;
             try {
                response = await fetch(fetchUrl);
             } catch (netErr) {
                console.warn("Apps Script connection failed:", netErr);
                // Fallback Logic
                if (url === APPS_SCRIPT_URL && DIRECT_SHEET_URL) {
                    console.log("Falling back to CSV direct fetch...");
                    return handleDataLoad(DIRECT_SHEET_URL, 'csv');
                }
                throw new Error("Failed to connect to Apps Script. Check internet or CORS permissions (Deployment must be 'Anyone').");
             }

             if(!response.ok) {
                 // Try fallback if response is not OK (e.g. 403, 500)
                 if (url === APPS_SCRIPT_URL && DIRECT_SHEET_URL) {
                    console.log("Apps Script error, falling back to CSV...");
                    return handleDataLoad(DIRECT_SHEET_URL, 'csv');
                }
                throw new Error(`API returned ${response.status}: ${response.statusText}`);
             }
             
             const json: GoogleSheetsApiResponse = await response.json();
             const sheetNames = Object.keys(json);
             if(sheetNames.length === 0) throw new Error("No data returned");
             
             // Prefer 'Dashboard' sheet, or first sheet
             const dashboardSheet = sheetNames.find(s => s.toLowerCase() === 'dashboard') || sheetNames[0];
             const parsed = parseSheetData(json[dashboardSheet]);
             processAndShowDashboard(parsed);
        }
    } catch (e) {
        handleError(e instanceof Error ? e.message : "An unknown error occurred");
    }
  };

  return (
    <div className="min-h-screen bg-rose-50/30 font-sans flex flex-col">
      <nav className="bg-white border-b border-rose-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="bg-pink-500 p-2.5 rounded-xl shadow-md">
                {/* Heart/Health Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-pink-600 tracking-tight">แดชบอร์ดงานอนามัยแม่และเด็ก ปี 2569</h1>
                <p className="text-xs sm:text-sm text-sky-600 font-medium">Maternal and Child Health Dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        {/* State: LOADING */}
        {status === AppStatus.LOADING && (
          <div className="flex flex-col items-center justify-center h-96">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-400 mb-4"></div>
            <p className="text-pink-600 font-bold text-lg">กำลังโหลดข้อมูล...</p>
            <p className="text-xs text-slate-400 mt-2">Connecting to Health Data Source...</p>
          </div>
        )}

        {/* State: ERROR */}
        {status === AppStatus.ERROR && (
          <div className="max-w-lg mx-auto bg-white p-6 rounded-xl text-center border border-red-100 shadow-md mt-10">
            <h3 className="text-lg font-bold text-red-600 mb-2">การเชื่อมต่อขัดข้อง</h3>
            <p className="text-slate-500 mb-6 text-sm">{errorMessage}</p>
            <div className="flex justify-center gap-3">
                <button 
                  onClick={() => handleDataLoad(APPS_SCRIPT_URL || DIRECT_SHEET_URL, APPS_SCRIPT_URL ? 'json_api' : 'csv')} 
                  className="px-6 py-2 bg-pink-500 text-white font-medium rounded-full hover:bg-pink-600 shadow-sm text-sm"
                >
                  ลองใหม่ (Retry)
                </button>
            </div>
          </div>
        )}

        {/* State: DASHBOARD */}
        {status === AppStatus.DASHBOARD && mappedData.length > 0 && (
          <Dashboard data={mappedData} />
        )}
      </main>

      <footer className="bg-white border-t border-rose-100 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center gap-2">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-sky-100 rounded-full flex items-center justify-center text-sky-600">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm0 8.625a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM15.375 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zM7.5 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <span className="font-bold text-slate-700 text-lg">สำนักงานสาธารณสุขจังหวัดสตูล</span>
                </div>
                <p className="text-slate-400 text-sm">Satun Provincial Public Health Office</p>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default App;