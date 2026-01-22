// src/components/ConfigModal.tsx
import React from 'react';
import { X } from 'lucide-react';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetUrl: string;
  setSheetUrl: (url: string) => void;
  onSave: () => void;
}

const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  sheetUrl,
  setSheetUrl,
  onSave
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black">데이터 설정</h3>
          <button onClick={onClose} className="p-2 bg-gray-50 rounded-full text-gray-400">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-black text-gray-400 uppercase mb-2 block">
              구글 시트 CSV 주소
            </label>
            <input 
              type="text" 
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
            />
          </div>
          <button 
            onClick={onSave}
            className="w-full py-4 bg-gray-900 text-white rounded-xl font-black active:scale-95 transition-transform"
          >
            갱신 및 저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigModal;