// src/components/SearchBar.tsx
import React from 'react';
import { Search, X, RefreshCw, Settings, ChevronRight } from 'lucide-react';
import { Client } from '../types';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onRefresh: () => void;
  onOpenConfig: () => void;
  filteredClients: Client[];
  selectedClientId: string | null;
  onSelectClient: (id: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  onRefresh,
  onOpenConfig,
  filteredClients,
  selectedClientId,
  onSelectClient
}) => {
  return (
    <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-none">
      <div className="flex gap-2 pointer-events-auto">
        {/* 검색 입력창 */}
        <div className="relative flex-1 group shadow-2xl rounded-2xl overflow-hidden border border-white/20">
          <div className="absolute inset-0 bg-white/90 backdrop-blur-xl transition-all group-focus-within:bg-white" />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="상호 또는 대표자 검색" 
            className="relative w-full pl-12 pr-12 py-4 bg-transparent outline-none font-bold text-gray-800 placeholder:text-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => {setSearchQuery(''); onSelectClient('');}} 
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* 새로고침 버튼 */}
        <button 
          onClick={onRefresh}
          className="p-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 text-gray-600 pointer-events-auto active:scale-95 transition-transform"
        >
          <RefreshCw size={22} />
        </button>

        {/* 설정 버튼 */}
        <button 
          onClick={onOpenConfig}
          className="p-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 text-gray-600 pointer-events-auto active:scale-95 transition-transform"
        >
          <Settings size={22} />
        </button>
      </div>

      {/* 검색 결과 목록 */}
      {searchQuery.trim() && filteredClients.length > 1 && !selectedClientId && (
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 max-h-48 overflow-y-auto no-scrollbar pointer-events-auto slide-up">
          {filteredClients.map(c => (
            <button 
              key={c.id}
              onClick={() => onSelectClient(c.id)}
              className="w-full px-5 py-3 text-left hover:bg-blue-50 border-b border-gray-50 last:border-0 flex justify-between items-center"
            >
              <div>
                <div className="font-bold text-gray-900">{c.name}</div>
                <div className="text-[10px] text-gray-500">{c.representative} 대표 · {c.address.substring(0, 20)}...</div>
              </div>
              <ChevronRight size={14} className="text-gray-300" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;