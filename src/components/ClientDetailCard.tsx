import React, { useState } from 'react';
import { 
  X, User, Hash, Building2, MapPin, Phone, 
  Navigation, Sparkles, Loader2, BrainCircuit 
} from 'lucide-react';
import { Client } from '../types';
import { getClientInsights } from '../Services/geminiService';

interface Props {
  client: Client;
  onClose: () => void;
}

const ClientDetailCard: React.FC<Props> = ({ client, onClose }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // AI 인사이트를 가져오는 함수 (기존 fetchInsight와 동일)
  const handleGetAIInsight = async () => {
    setLoading(true);
    try {
      const result = await getClientInsights(client);
      setInsight(result);
    } catch (error) {
      setInsight("인사이트를 가져오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute bottom-4 left-4 right-4 z-[1001] slide-up">
      <div className="bg-white rounded-[2.5rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 relative overflow-hidden">
        
        {/* 1. 닫기 버튼 */}
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        {/* 2. 헤더: 법인/개인 태그 및 상호명 */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black text-white uppercase ${
            client.type === 'Corporation' ? 'bg-indigo-600' : 'bg-emerald-600'
          }`}>
            {client.type === 'Corporation' ? '법인' : '개인'}
          </span>
          <h2 className="text-2xl font-black text-gray-900 leading-tight">{client.name}</h2>
        </div>

        {/* 3. AI 가이드 섹션 (버튼 또는 결과창) */}
        <div className="mb-6">
          {!insight ? (
            <button 
              onClick={handleGetAIInsight}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl flex items-center justify-center gap-2 font-black shadow-lg active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
              AI 방문 상담 가이드 보기
            </button>
          ) : (
            <div className="p-5 bg-blue-50 border border-blue-100 rounded-3xl text-sm text-gray-700 leading-relaxed animate-in fade-in zoom-in duration-300">
              <div className="flex items-center gap-2 mb-2 font-black text-blue-700">
                <BrainCircuit size={18} /> Gemini의 추천 대화 주제
              </div>
              <p className="whitespace-pre-wrap">{insight}</p>
            </div>
          )}
        </div>

        {/* 4. 정보 그리드: 대표자 및 사업자번호 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold uppercase">
              <User size={12} /> 대표자
            </div>
            <div className="font-black text-gray-800">{client.representative}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold uppercase">
              <Hash size={12} /> 사업자번호
            </div>
            <div className="font-bold text-gray-700">{client.businessNumber}</div>
          </div>
        </div>

        {/* 5. 주소 및 업종 정보 박스 */}
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-6 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <Building2 size={16} className="text-gray-400 mt-0.5" />
            <div className="text-sm font-bold text-gray-600">
              {client.businessType} <span className="mx-1 text-gray-300">|</span> {client.category}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin size={16} className="text-blue-500 mt-0.5 shrink-0" />
            <div className="text-sm font-medium text-gray-700 leading-snug">{client.address}</div>
          </div>
        </div>

        {/* 6. 하단 액션 버튼: 전화 및 길찾기 */}
        <div className="flex gap-3">
          <a 
            href={`tel:${client.phone}`} 
            className="flex-1 bg-blue-600 text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-black shadow-lg active:scale-95 transition-all"
          >
            <Phone size={18} fill="currentColor" /> 전화하기
          </a>
          <button 
            onClick={() => window.open(`https://map.kakao.com/link/search/${encodeURIComponent(client.address)}`, '_blank')}
            className="px-6 bg-gray-900 text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-black shadow-lg active:scale-95 transition-all"
          >
            <Navigation size={18} /> 길찾기
          </button>
        </div>

      </div>
    </div>
  );
};

export default ClientDetailCard;