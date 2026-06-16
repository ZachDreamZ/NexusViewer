import { useState } from 'react';
import yaml from 'js-yaml';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

interface FrontmatterProps {
  content: string;
}

export const Frontmatter: React.FC<FrontmatterProps> = ({ content = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const parseFrontmatter = (text: string): Record<string, unknown> | null => {
    const regex = /^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*([\r\n]+|$)/;
    const match = text.match(regex);
    if (match) {
      try {
        return yaml.load(match[1]) as Record<string, unknown>;
      } catch (e) {
        console.error('Error parsing YAML frontmatter', e);
      }
    }
    return null;
  };

  const data = parseFrontmatter(content);

  if (!data) return null;

  return (
    <div className="border-b border-stone-200 dark:border-slate-800 bg-paper dark:bg-obsidian transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors text-stone-500 group"
      >
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          <span className="text-[10px] font-bold uppercase tracking-widest">Metadata</span>
        </div>
        <Info size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-stone-500 uppercase tracking-tighter">{key}</span>
              <span className="text-xs text-slate-600 dark:text-stone-500 truncate font-medium">
                {typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
