import React, { useState } from 'react';

interface DataInputProps {
  onDataLoaded: (url: string, type: 'csv' | 'json_api') => void;
  onDemoLoad: () => void;
  isLoading: boolean;
}

export const DataInput: React.FC<DataInputProps> = ({ onDataLoaded, onDemoLoad, isLoading }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [showScriptModal, setShowScriptModal] = useState(false);

  const handleFetch = async () => {
    if (!url) {
      setError('Please enter a valid URL.');
      return;
    }

    // Heuristic to detect CSV vs Script API
    const isScript = url.includes('script.google.com');
    const isSheet = url.includes('docs.google.com/spreadsheets');

    if (!isScript && !isSheet) {
      setError('Invalid URL. Use a Google Sheet Link or Apps Script Web App URL.');
      return;
    }
    
    setError('');
    onDataLoaded(url, isScript ? 'json_api' : 'csv');
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-rose-100">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">เชื่อมต่อข้อมูล (Connect Data)</h2>
        <p className="text-slate-500">
           วางลิงก์ Google Sheet หรือ Apps Script URL ด้านล่างเพื่อเริ่มการแสดงผล
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Google Sheet Link <span className="text-slate-400 font-normal">or</span> Apps Script Web App URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/... OR https://script.google.com/..."
              className="flex-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm p-2.5 border"
            />
            <button
              onClick={handleFetch}
              disabled={isLoading}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-pink-500 hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
            >
              {isLoading ? 'เชื่อมต่อ...' : 'เชื่อมต่อ'}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        {/* Advanced Options */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
              <h4 className="text-sm font-semibold text-slate-800">Advanced: Backend API (code.gs)</h4>
              <p className="text-xs text-slate-500 mt-1">ใช้สำหรับการเชื่อมต่อที่เสถียรกว่า (แนะนำสำหรับข้อมูลขนาดใหญ่)</p>
          </div>
          <button 
            onClick={() => setShowScriptModal(true)}
            className="text-pink-600 text-sm font-medium hover:text-pink-800 underline"
          >
            ดูวิธีตั้งค่า
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-2 bg-white text-sm text-slate-500">หรือทดลองใช้</span>
          </div>
        </div>

        <button
          onClick={onDemoLoad}
          className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none"
        >
          โหลดข้อมูลตัวอย่าง (Demo Data)
        </button>
      </div>

      {/* Script Setup Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowScriptModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Setup Google Sheets Backend
                </h3>
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-4">
                    Copy this code into your Google Sheet's Script Editor to create a secure API for all your sheets.
                  </p>
                  <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2 mb-4">
                    <li>Open your Google Sheet.</li>
                    <li>Go to <strong>Extensions &gt; Apps Script</strong>.</li>
                    <li>Delete existing code and paste the code below.</li>
                    <li>Click <strong>Deploy &gt; New Deployment</strong>.</li>
                    <li>Select type: <strong>Web App</strong>.</li>
                    <li>Set <em>Who has access</em> to: <strong>Anyone</strong>.</li>
                    <li>Copy the resulting URL and paste it into the app.</li>
                  </ol>
                  <div className="bg-slate-800 rounded-md p-4 overflow-x-auto">
                    <pre className="text-xs text-green-400 font-mono">
{`function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var output = {};
  
  // Iterate through all sheets
  sheets.forEach(function(sheet) {
    // Get all data as string to preserve formatting
    var data = sheet.getDataRange().getDisplayValues();
    if (data.length > 0) {
       output[sheet.getName()] = data;
    }
  });
  
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}`}
                    </pre>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6">
                <button
                  type="button"
                  className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-pink-600 text-base font-medium text-white hover:bg-pink-700 focus:outline-none sm:text-sm"
                  onClick={() => setShowScriptModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};