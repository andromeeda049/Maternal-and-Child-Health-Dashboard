import React, { useState } from 'react';
import { ParsedCSV, ColumnMapping } from '../types';

interface DataMapperProps {
  csvData: ParsedCSV;
  initialMapping: ColumnMapping;
  onConfirm: (mapping: ColumnMapping) => void;
  onCancel: () => void;
}

export const DataMapper: React.FC<DataMapperProps> = ({ csvData, initialMapping, onConfirm, onCancel }) => {
  const [mapping, setMapping] = useState<ColumnMapping>(initialMapping);

  const headers = csvData.headers;
  const previewRows = csvData.rows.slice(0, 5);

  const handleChange = (field: keyof ColumnMapping, value: string) => {
    setMapping(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = mapping.indicator && mapping.agency && mapping.date && mapping.value;

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-100 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Map Your Data Columns</h2>
        <p className="text-slate-500">Match the columns from your sheet to the Dashboard fields.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Mapping Form */}
        <div className="lg:col-span-1 space-y-5">
            <h3 className="font-semibold text-slate-700 border-b pb-2 text-lg">Field Mapping</h3>
            
            {[
                { label: 'KPI/Indicator Name (รายการ)', field: 'indicator', help: 'e.g. จำนวนมารดาคลอด' },
                { label: 'Agency/Hospital (หน่วยงาน)', field: 'agency', help: 'e.g. รพ.สตูล' },
                { label: 'Period/Month (เดือน/ปี)', field: 'date', help: 'Generated from column headers' },
                { label: 'Value (จำนวน/ค่า)', field: 'value', help: 'The numeric data' },
            ].map((item) => (
                <div key={item.field}>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                        {item.label} <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={mapping[item.field as keyof ColumnMapping]}
                        onChange={(e) => handleChange(item.field as keyof ColumnMapping, e.target.value)}
                        className={`block w-full rounded-md shadow-sm sm:text-sm p-2.5 border ${!mapping[item.field as keyof ColumnMapping] ? 'border-red-300 bg-red-50' : 'border-slate-300 focus:ring-cyan-500 focus:border-cyan-500'}`}
                    >
                        <option value="">-- Select Column --</option>
                        {headers.map(h => (
                            <option key={h} value={h}>{h}</option>
                        ))}
                    </select>
                    {item.help && <p className="text-xs text-slate-400 mt-1">{item.help}</p>}
                </div>
            ))}

            <div className="pt-6 flex gap-3">
                <button
                    onClick={() => onConfirm(mapping)}
                    disabled={!isFormValid}
                    className="flex-1 inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    Generate Dashboard
                </button>
                <button
                    onClick={onCancel}
                    className="inline-flex justify-center items-center px-4 py-3 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none"
                >
                    Back
                </button>
            </div>
        </div>

        {/* Right Col: Data Preview */}
        <div className="lg:col-span-2">
            <h3 className="font-semibold text-slate-700 border-b pb-2 mb-4 text-lg">Data Preview (Unpivoted)</h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            {headers.map((h, i) => (
                                <th key={i} scope="col" className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {previewRows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-slate-50 transition-colors">
                                {row.map((cell, cellIndex) => (
                                    <td key={cellIndex} className="px-3 py-3 whitespace-nowrap text-sm text-slate-600 border-r last:border-r-0 border-slate-100">
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};
