import React from 'react';
import { Briefing } from '../types';

interface MissionControlProps {
  briefing: Briefing | null;
  loading: boolean;
}

const MissionControl: React.FC<MissionControlProps> = ({ briefing, loading }) => {
  return (
    <div className="w-full lg:w-80 h-[200px] lg:h-[600px] bg-slate-900 border-2 border-slate-700 rounded-lg p-4 flex flex-col gap-4 shadow-lg ml-0 lg:ml-4 mt-4 lg:mt-0">
      <div className="border-b border-slate-700 pb-2">
        <h3 className="text-cyan-400 text-lg font-bold flex items-center gap-2">
          <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
          AURA AI LINK
        </h3>
        <p className="text-xs text-slate-500">Tactical Support Unit v2.5</p>
      </div>

      <div className="flex-1 overflow-y-auto font-mono text-sm space-y-4">
        {loading ? (
            <div className="text-green-400 animate-pulse">
                [ENCRYPTING TRANSMISSION...]
            </div>
        ) : briefing ? (
            <div className="animate-fade-in">
                <div className="text-yellow-400 font-bold mb-1">
                    {'>'} {briefing.title.toUpperCase()}
                </div>
                <div className="text-slate-300 leading-relaxed">
                    {briefing.message}
                </div>
            </div>
        ) : (
            <div className="text-slate-600 italic">
                Awaiting mission data...
            </div>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-slate-700">
         <div className="grid grid-cols-3 gap-1">
            {Array.from({length: 6}).map((_, i) => (
                <div key={i} className={`h-1 rounded ${Math.random() > 0.5 ? 'bg-cyan-900' : 'bg-cyan-700/30'}`}></div>
            ))}
         </div>
         <p className="text-[10px] text-right text-slate-600 mt-1">SYS.NORMAL</p>
      </div>
    </div>
  );
};

export default MissionControl;
