import React, { useState } from 'react';

interface SheetSelectorProps {
  sheetNames: string[];
  onConfirm: (selectedSheets: string[]) => void;
  onCancel: () => void;
}

export const SheetSelector: React.FC<SheetSelectorProps> = ({ sheetNames, onConfirm, onCancel }) => {
  // Select all by default
  const [selected, setSelected] = useState<Set<string>>(new Set(sheetNames));

  const toggleSheet = (name: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(name)) {
      newSelected.delete(name);
    } else {
      newSelected.add(name);
    }
    setSelected(newSelected);
  };

  const toggleAll = () => {
    if (selected.size === sheetNames.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sheetNames));
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-slate-100 animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Select Sheets to Import</h2>
        <p className="text-slate-500 mt-2">
          We found {sheetNames.length} sheets. Select which ones you want to include in your dashboard.
        </p>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <span className="text-sm font-medium text-slate-600">{selected.size} selected</span>
        <button 
          onClick={toggleAll}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          {selected.size === sheetNames.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-2 border rounded-lg border-slate-100 bg-slate-50">
        {sheetNames.map((name) => (
          <label
            key={name}
            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${selected.has(name) ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
          >
            <input
              type="checkbox"
              className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              checked={selected.has(name)}
              onChange={() => toggleSheet(name)}
            />
            <span className={`ml-3 font-medium truncate w-full ${selected.has(name) ? 'text-indigo-900' : 'text-slate-600'}`}>
              {name}
            </span>
          </label>
        ))}
      </div>
      
      <div className="mt-8 flex gap-4 justify-center">
         <button 
           onClick={onCancel}
           className="px-6 py-2.5 border border-slate-300 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors"
         >
            Cancel
         </button>
         <button 
           onClick={() => onConfirm(Array.from(selected))}
           disabled={selected.size === 0}
           className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
         >
            Continue with {selected.size} Sheet{selected.size !== 1 && 's'}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
         </button>
      </div>
    </div>
  );
};
