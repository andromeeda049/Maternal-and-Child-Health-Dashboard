import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { KPIRecord } from '../types';

interface AIChatProps {
  data: KPIRecord[];
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const AIChat: React.FC<AIChatProps> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'สวัสดีครับ ผมคือผู้ช่วย AI วิเคราะห์ข้อมูลงานอนามัยแม่และเด็ก มีอะไรให้ผมช่วยหาคำตอบจากข้อมูลชุดนี้ไหมครับ?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const generateDataContext = () => {
    if (data.length === 0) return "No data available currently.";

    const totalCases = data.reduce((sum, item) => sum + item.value, 0);
    const agencies = Array.from(new Set(data.map(d => d.agency))).join(', ');
    const indicators = Array.from(new Set(data.map(d => d.indicator))).join(', ');
    
    // Create a simplified top 10 list for context
    const sortedData = [...data].sort((a, b) => b.value - a.value).slice(0, 20);
    const topDataSummary = sortedData.map(d => `${d.indicator} (${d.agency}, ${d.date}): ${d.value}`).join('\n');

    return `
      Context Data Summary:
      - Total Cases: ${totalCases}
      - Agencies: ${agencies}
      - Indicators: ${indicators}
      - Top 20 Records by Value:
      ${topDataSummary}
    `;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const context = generateDataContext();
      
      const systemInstruction = `
        You are an AI Assistant for a Public Health Dashboard (Maternal & Child Health).
        Language: Please answer in Thai (Official/Professional tone).
        
        Current Data Context:
        ${context}

        Rules:
        1. Answer questions based strictly on the provided data summary.
        2. If the user asks for a specific number not in the summary, explain that you are looking at the top records and aggregates.
        3. Be helpful and concise.
      `;

      // Single turn generation for simplicity in this context, 
      // but constructing a chat history prompt is also possible.
      // We join previous history for context.
      const chatHistory = messages.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text}`).join('\n');
      const fullPrompt = `${chatHistory}\nUser: ${userText}\nAI:`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: fullPrompt,
        config: {
          systemInstruction: systemInstruction,
        }
      });

      const responseText = response.text || "ขออภัย ไม่สามารถประมวลผลได้ในขณะนี้";
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);

    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 group"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 animate-bounce-slow">
               <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            <span className="hidden group-hover:inline max-w-0 group-hover:max-w-xs transition-all duration-300 overflow-hidden font-medium">
              สอบถาม AI
            </span>
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 md:right-6 z-40 w-[90vw] md:w-[400px] h-[500px] bg-white rounded-2xl shadow-2xl border border-rose-100 flex flex-col animate-fade-in-up overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm">ผู้ช่วยวิเคราะห์ข้อมูล</h3>
                <p className="text-xs text-pink-100 opacity-90">Powered by Gemini AI</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-pink-500 text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                }`}>
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                   <div className="flex gap-1">
                     <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></span>
                     <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-100"></span>
                     <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-200"></span>
                   </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-slate-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="พิมพ์คำถามที่นี่..."
                disabled={isLoading}
                className="flex-1 border-slate-200 bg-slate-50 rounded-full text-sm focus:border-pink-500 focus:ring-pink-500 px-4"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-2.5 bg-pink-500 text-white rounded-full hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-2">
               AI อาจแสดงข้อมูลคลาดเคลื่อน โปรดตรวจสอบกับ Dashboard อีกครั้ง
            </p>
          </div>
        </div>
      )}
    </>
  );
};