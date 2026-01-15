import React, { useState, useEffect } from 'react';
import { KPIRecord } from '../types';

interface DataFilterProps {
  data: KPIRecord[];
  onConfirm: (filteredData: KPIRecord[]) => void;
  onBack: () => void;
}

export const DataFilter: React.FC<DataFilterProps> = ({ data, onConfirm, onBack }) => {
  const [filteredData, setFilteredData] = useState<KPIRecord[]>(data);
  
  // Filter States
  const [selectedIndicator, setSelectedIndicator] = useState('All');
  const [selectedAgency, setSelectedAgency] = useState('All');

  // Derive unique options
  const indicators = ['All', ...Array.from(new Set(data.map(d => d.indicator))).sort()];
  const agencies = ['All', ...Array.from(new Set(data.map(d => d.agency))).sort()];

  useEffect(() => {
    const newData = data.filter(item => {
      // KPI Name Filter
      if (selectedIndicator !== 'All' && item.indicator !== selectedIndicator) return false;
      // Agency Filter
      if (selectedAgency !== 'All' && item.agency !== selectedAgency) return false;
      return true;
    });
    setFilteredData(newData);
  }, [selectedIndicator, selectedAgency, data]);

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-slate-100">
      <div className="mb-6 flex justify-between items-end">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Filter Data</h2>
            <p className="text-slate-500 mt-1">Focus on specific indicators or hospitals.</p>
        </div>
        <div className="text-right">
             <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Rows</span>
             <p className="text-2xl font-bold text-cyan-600">
                 {filteredData.length} <span className="text-lg text-slate-400 font-medium">/ {data.length}</span>
             </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-lg border border-slate-100 mb-6">
        {/* Indicator */}
        <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">KPI Name (ตัวชี้วัด)</label>
            <select
                value={selectedIndicator}
                onChange={(e) => setSelectedIndicator(e.target.value)}
                className="w-full rounded-md border-slate-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 text-sm p-2.5 border"
            >
                {indicators.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
        </div>

        {/* Agency */}
        <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Agency (หน่วยงาน)</label>
            <select
                value={selectedAgency}
                onChange={(e) => setSelectedAgency(e.target.value)}
                className="w-full rounded-md border-slate-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 text-sm p-2.5 border"
            >
                {agencies.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
        </div>
      </div>
      
      {/* Data Table Preview */}
      <div className="border rounded-lg overflow-hidden border-slate-200 mb-6">
          <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                  <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Period</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Indicator</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Agency</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Value</th>
                  </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                  {filteredData.slice(0, 5).map(row => (
                      <tr key={row.id}>
                          <td className="px-4 py-2 text-sm text-slate-600">{row.date}</td>
                          <td className="px-4 py-2 text-sm text-slate-600 max-w-xs truncate" title={row.indicator}>{row.indicator}</td>
                          <td className="px-4 py-2 text-sm text-slate-600">{row.agency}</td>
                          <td className="px-4 py-2 text-sm text-slate-900 font-medium text-right">{row.value.toLocaleString()}</td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>

      <div className="flex justify-end gap-3">
        <button
            onClick={onBack}
            className="px-6 py-2.5 border border-slate-300 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors"
        >
            Back
        </button>
        <button
            onClick={() => onConfirm(filteredData)}
            disabled={filteredData.length === 0}
            className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg shadow-sm transition-all disabled:opacity-50"
        >
            Visualize Data
        </button>
      </div>
    </div>
  );
};
