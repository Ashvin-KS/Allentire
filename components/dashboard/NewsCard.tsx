import React from 'react';
import { Newspaper, ExternalLink, Pencil } from 'lucide-react';
import { Card } from '../ui/Card';

interface NewsCardProps {
  onEdit: () => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({ onEdit }) => {
  const news = [
    { id: 1, title: "React 19 Alpha Released", summary: "Critical breakdown of actions and new hooks.", time: "2h ago" },
    { id: 2, title: "OpenAI Pricing Model", summary: "50% reduction in GPT-4 Turbo API costs announced.", time: "5h ago" },
    { id: 3, title: "Linux Kernel 6.8", summary: "Major driver improvements and scheduling updates.", time: "1d ago" },
  ];

  return (
    <Card 
      title="Intel Feed" 
      icon={Newspaper} 
      className="col-span-1 md:col-span-2"
      action={
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1.5 hover:bg-[#262626] rounded text-gray-600 hover:text-white transition-colors group"
          title="Configure Sources"
        >
          <Pencil size={14} className="group-hover:scale-110 transition-transform" />
        </button>
      }
    >
      <div className="flex flex-col gap-0 h-full">
        {news.map((item, index) => (
          <div 
            key={item.id} 
            className={`
              group flex flex-col py-3 px-2 rounded-lg hover:bg-[#262626]/40 cursor-pointer transition-colors
              ${index !== news.length - 1 ? 'border-b border-[#262626]' : ''}
            `}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-gray-200 group-hover:text-cyan-400 transition-colors">
                {item.title}
              </span>
              <span className="text-[10px] text-gray-600 font-mono whitespace-nowrap">{item.time}</span>
            </div>
            <p className="text-xs text-gray-500 line-clamp-1 group-hover:text-gray-400">
              {item.summary}
            </p>
          </div>
        ))}
        
        <div className="mt-auto pt-2 flex justify-end">
             <button className="text-[10px] uppercase font-bold tracking-wider text-gray-600 hover:text-cyan-500 flex items-center gap-1 transition-colors">
                View All <ExternalLink size={10} />
             </button>
        </div>
      </div>
    </Card>
  );
};