import React, { useState } from 'react';
import { ArrowLeft, Newspaper, X, Plus, Rss, Hash } from 'lucide-react';

interface NewsManagerProps {
  onBack: () => void;
}

export const NewsManager: React.FC<NewsManagerProps> = ({ onBack }) => {
  const [feeds, setFeeds] = useState([
    "Hacker News (Top)",
    "React.js Blog",
    "OpenAI Research",
    "Verge Tech"
  ]);
  const [keywords, setKeywords] = useState(["AI", "Rust", "Typescript", "SpaceX", "Design"]);
  const [newKeyword, setNewKeyword] = useState("");

  const removeKeyword = (k: string) => setKeywords(keywords.filter(w => w !== k));
  const addKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if(newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
        setKeywords([...keywords, newKeyword.trim()]);
        setNewKeyword("");
    }
  };

  return (
    <div className="h-full w-full flex flex-col animate-in fade-in zoom-in duration-300 p-4 md:p-8">
       {/* Header */}
       <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-[#161616] rounded-lg text-gray-400 hover:text-white transition-colors border border-transparent hover:border-[#333]"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Newspaper className="text-cyan-500" />
            Intel Sources
          </h1>
          <p className="text-gray-500 text-sm">Configure your news feeds and tracking keywords.</p>
        </div>
      </div>

      <div className="w-full max-w-xl mx-auto flex flex-col gap-8">
        {/* Active Feeds */}
        <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Rss size={14} /> Active Feeds
            </h3>
            <div className="flex flex-col gap-2">
                {feeds.map(feed => (
                    <div key={feed} className="flex items-center justify-between p-3 bg-[#161616] border border-[#262626] rounded-lg">
                        <span className="text-gray-300 font-medium">{feed}</span>
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                             <span className="text-xs text-emerald-500 font-mono tracking-wider">LIVE</span>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        {/* Keywords */}
        <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Hash size={14} /> Watch Keywords
            </h3>
            <div className="bg-[#161616] border border-[#262626] rounded-xl p-6">
                <div className="flex flex-wrap gap-2 mb-6">
                    {keywords.map(word => (
                        <div key={word} className="flex items-center gap-2 px-3 py-1.5 bg-[#262626] border border-[#333] rounded-full text-sm text-gray-300 group hover:border-gray-500 transition-colors">
                            <span>{word}</span>
                            <button onClick={() => removeKeyword(word)} className="text-gray-500 hover:text-red-400 transition-colors">
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
                
                <form onSubmit={addKeyword} className="relative">
                    <input 
                        type="text" 
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        placeholder="Add new keyword..." 
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg pl-3 pr-10 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                    />
                     <button 
                        type="submit"
                        disabled={!newKeyword.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <Plus size={18} />
                    </button>
                </form>
            </div>
        </section>
      </div>
    </div>
  )
}