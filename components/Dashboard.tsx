import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend
} from 'recharts';
import { KPIRecord, DashboardMetrics } from '../types';
import { calculateMetrics, getThaiMonthIndex } from '../utils/dataHelpers';

interface DashboardProps {
  data: KPIRecord[];
}

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  // -- Filters State --
  const [selectedAgency, setSelectedAgency] = useState<string>('All');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedIndicator, setSelectedIndicator] = useState<string>('All');

  // -- Derive Options --
  const agencies = useMemo(() => ['All', ...Array.from(new Set(data.map(d => d.agency))).sort()], [data]);
  const indicators = useMemo(() => ['All', ...Array.from(new Set(data.map(d => d.indicator))).sort()], [data]);
  const months = useMemo(() => {
    return ['All', ...Array.from(new Set(data.map(d => d.date))).sort((a, b) => {
        // Sort months chronologically
        const idxA = getThaiMonthIndex(a);
        const idxB = getThaiMonthIndex(b);
        if (idxA !== -1 && idxB !== -1) {
             const yearA = parseInt(a.match(/\d{4}/)?.[0] || '0');
             const yearB = parseInt(b.match(/\d{4}/)?.[0] || '0');
             if (yearA !== yearB) return yearA - yearB;
             return idxA - idxB;
        }
        return a.localeCompare(b);
    })];
  }, [data]);

  // -- Filter Data --
  const filteredData = useMemo(() => {
    return data.filter(item => {
        if (selectedAgency !== 'All' && item.agency !== selectedAgency) return false;
        if (selectedMonth !== 'All' && item.date !== selectedMonth) return false;
        if (selectedIndicator !== 'All' && item.indicator !== selectedIndicator) return false;
        return true;
    });
  }, [data, selectedAgency, selectedMonth, selectedIndicator]);

  // -- Calculate Metrics on Fly --
  const metrics: DashboardMetrics = useMemo(() => calculateMetrics(filteredData), [filteredData]);

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-rose-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <h2 className="text-lg font-bold text-pink-600 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z" clipRule="evenodd" />
                </svg>
                กรองข้อมูล (Filter)
              </h2>
              <button 
                  onClick={() => {setSelectedAgency('All'); setSelectedMonth('All'); setSelectedIndicator('All');}}
                  className="text-sm text-sky-500 hover:text-sky-700 font-medium mt-2 md:mt-0 underline decoration-sky-200"
              >
                  ล้างค่าทั้งหมด
              </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">หน่วยงาน (Agency)</label>
                  <select 
                      value={selectedAgency}
                      onChange={(e) => setSelectedAgency(e.target.value)}
                      className="w-full rounded-lg border-slate-200 bg-slate-50 text-sm focus:ring-pink-500 focus:border-pink-500 p-2.5"
                  >
                      {agencies.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
              </div>
              <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">เดือน (Month)</label>
                  <select 
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full rounded-lg border-slate-200 bg-slate-50 text-sm focus:ring-pink-500 focus:border-pink-500 p-2.5"
                  >
                      {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
              </div>
              <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">ตัวชี้วัด (Indicator)</label>
                  <select 
                      value={selectedIndicator}
                      onChange={(e) => setSelectedIndicator(e.target.value)}
                      className="w-full rounded-lg border-slate-200 bg-slate-50 text-sm focus:ring-pink-500 focus:border-pink-500 p-2.5"
                  >
                      {indicators.map(i => <option key={i} value={i}>{i.length > 40 ? i.substring(0, 40) + '...' : i}</option>)}
                  </select>
              </div>
          </div>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-rose-100 gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">ภาพรวมสถานการณ์ (Overview)</h2>
           <p className="text-sm text-slate-500">
               แสดงผล {filteredData.length} รายการ 
               {selectedAgency !== 'All' && ` สำหรับ ${selectedAgency}`}
           </p>
        </div>
      </div>
      
      {/* Specific Remark for Tha Phae */}
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700 font-medium">
              หมายเหตุ: รพ.ท่าแพ ไม่มีบริการห้องคลอด
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid - Enhanced with 2 Rows / Multi-dimension */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
            title="จำนวนเคสรวม (Total Cases)" 
            value={metrics.totalCases.toLocaleString()} 
            icon={<svg className="w-8 h-8 text-pink-500" viewBox="0 0 24 24" fill="currentColor"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>}
            subTitle="รายการ"
        />
        <StatCard 
            title="หน่วยงานที่รายงาน (Agencies)" 
            value={metrics.totalAgencies.toString()} 
            icon={<svg className="w-8 h-8 text-sky-500" viewBox="0 0 24 24" fill="currentColor"><path d="M19.006 3.705a.75.75 0 00-.512-1.41L6 6.838V3a.75.75 0 00-.75-.75h-1.5A.75.75 0 003 3v4.93l-1.006.365a.75.75 0 00.512 1.41l16.5-6z" /><path fillRule="evenodd" d="M3.019 11.115L18 5.667V9.09l4.006 1.456a.75.75 0 11-.512 1.41l-2.5-1.091v9.885h1.25a.75.75 0 010 1.5H3.75a.75.75 0 010-1.5h1.25v-9.134l-2.5.91a.75.75 0 01-.5-1.41l.019-.007zm13.481.984l-4.5 1.636V19.5h4.5v-7.401zm-6 2.181l-4.5 1.637V19.5h4.5v-5.22z" clipRule="evenodd" /></svg>}
            subTitle="แห่ง"
        />
        <StatCard 
            title="จำนวนตัวชี้วัด (Indicators)" 
            value={metrics.totalIndicators.toString()} 
            icon={<svg className="w-8 h-8 text-purple-500" viewBox="0 0 24 24" fill="currentColor"><path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v9.375c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v4.875c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 18v-4.875z" /></svg>}
            subTitle="เรื่อง"
        />
        <StatCard 
            title="เฉลี่ยต่อเดือน (Avg/Month)" 
            value={Math.round(metrics.averagePerMonth).toLocaleString()} 
            icon={<svg className="w-8 h-8 text-amber-500" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" /></svg>}
            subTitle="ราย"
        />
        
        {/* Row 2: Highlights */}
        <StatCard 
            title="เดือนที่พบมากที่สุด (Peak Month)" 
            value={metrics.topMonth.name} 
            icon={<svg className="w-8 h-8 text-rose-500" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5zm7.5-3.75a.75.75 0 01.75.75v2.25h2.25a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75V7.5a.75.75 0 01.75-.75z" clipRule="evenodd" /></svg>}
            subTitle={`${metrics.topMonth.value.toLocaleString()} ราย`}
        />
        <StatCard 
            title="หน่วยงานสูงสุด (Top Agency)" 
            value={metrics.topAgency.name} 
            icon={<svg className="w-8 h-8 text-teal-500" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" /></svg>}
            subTitle={`${metrics.topAgency.value.toLocaleString()} ราย`}
        />
        <StatCard 
            title="ตัวชี้วัดสูงสุด (Top Indicator)" 
            value={metrics.topIndicator.name.length > 25 ? metrics.topIndicator.name.substring(0, 25) + '...' : metrics.topIndicator.name} 
            icon={<svg className="w-8 h-8 text-indigo-500" viewBox="0 0 24 24" fill="currentColor"><path d="M10.5 18a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" /><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm0 13.5a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" /></svg>}
            subTitle={`${metrics.topIndicator.value.toLocaleString()} ราย`}
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100">
          <h3 className="text-lg font-bold text-pink-600 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              แนวโน้มรายเดือน (Monthly Trend)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.monthlyTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffe4e6" />
                <XAxis dataKey="name" stroke="#881337" fontSize={12} tickLine={false} axisLine={false} angle={-15} textAnchor="end" height={50}/>
                <YAxis stroke="#881337" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #fecdd3', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#ec4899" strokeWidth={3} dot={{ r: 5, fill: '#ec4899', strokeWidth: 2, stroke: '#fff' }} name="จำนวน (ราย)" activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Agency Comparison */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100">
          <h3 className="text-lg font-bold text-sky-600 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              แยกตามหน่วยงาน (Top Agencies)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.casesByAgency.slice(0, 8)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e0f2fe" />
                <XAxis type="number" stroke="#0369a1" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" width={100} stroke="#0369a1" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#f0f9ff' }} contentStyle={{ borderRadius: '12px' }} />
                <Bar dataKey="value" fill="#38bdf8" radius={[0, 6, 6, 0]} barSize={24} name="จำนวน (ราย)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* KPI Breakdown */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-pink-500 rounded-full"></span>
            รายละเอียดตัวชี้วัด (Indicator Performance)
          </h3>
          <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-rose-100">
              <thead className="bg-pink-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-pink-700 uppercase tracking-wider">ชื่อตัวชี้วัด</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-pink-700 uppercase tracking-wider">จำนวนรวม</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-pink-700 uppercase tracking-wider">% สัดส่วน</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-pink-700 uppercase tracking-wider">ภาพรวม</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-rose-50">
                {metrics.casesByIndicator.map((item, idx) => {
                   const percent = metrics.totalCases > 0 ? (item.value / metrics.totalCases) * 100 : 0;
                   return (
                  <tr key={idx} className="hover:bg-pink-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-right font-mono">{item.value.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 text-right">{percent.toFixed(1)}%</td>
                    <td className="px-6 py-4 align-middle">
                      <div className="w-full bg-slate-100 rounded-full h-2.5 max-w-[100px] mx-auto overflow-hidden">
                        <div className="bg-pink-400 h-2.5 rounded-full" style={{ width: `${Math.min(percent * 2, 100)}%` }}></div>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; subTitle?: string }> = ({ title, value, icon, subTitle }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100 flex items-center gap-4 transition-transform hover:scale-[1.02]">
    <div className="p-3 bg-slate-50 rounded-xl">
        {icon}
    </div>
    <div className="overflow-hidden">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">{title}</p>
        <p className="text-xl font-bold text-slate-800 tracking-tight truncate">{value}</p>
        {subTitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{subTitle}</p>}
    </div>
  </div>
);