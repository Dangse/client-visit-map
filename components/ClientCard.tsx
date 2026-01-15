
import React from 'react';
import { Client } from '../types';
import { Phone, User, Building2, MapPin, Hash } from 'lucide-react';

interface ClientCardProps {
  client: Client;
  onSelect?: (client: Client) => void;
  isSelected?: boolean;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onSelect, isSelected }) => {
  return (
    <div 
      onClick={() => onSelect?.(client)}
      className={`p-4 rounded-xl border transition-all cursor-pointer ${
        isSelected 
          ? 'bg-blue-50 border-blue-500 shadow-md' 
          : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg text-gray-800">{client.name}</h3>
        <span className={`px-2 py-1 rounded text-xs font-semibold ${
          client.type === 'Corporation' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'
        }`}>
          {client.type === 'Corporation' ? '법인' : '개인'}
        </span>
      </div>
      
      <div className="space-y-1.5 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <User size={14} className="text-gray-400" />
          <span>{client.representative}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone size={14} className="text-gray-400" />
          <a 
            href={`tel:${client.phone}`} 
            className="text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {client.phone}
          </a>
        </div>
        <div className="flex items-start gap-2">
          <MapPin size={14} className="text-gray-400 mt-1 flex-shrink-0" />
          <span className="line-clamp-2">{client.address}</span>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t mt-2 text-xs text-gray-400">
          <Building2 size={12} />
          <span>{client.businessType} / {client.category}</span>
          <span className="ml-auto flex items-center gap-1">
            <Hash size={12} /> {client.businessNumber}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ClientCard;
