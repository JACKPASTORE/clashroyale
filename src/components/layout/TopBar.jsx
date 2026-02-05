import React from 'react';
import { Plus } from 'lucide-react';

const TopBar = () => {
    return (
        <div className="absolute top-0 left-0 w-full px-2 pt-2 pb-1 flex justify-between items-center z-50 pointer-events-none bg-gradient-to-b from-black/20 to-transparent">

            {/* LEFT: King Level & XP */}
            <div className="flex items-center pointer-events-auto">
                {/* King Level Icon */}
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-[#3B73E6] border-2 border-white/50 relative flex items-center justify-center transform rotate-45 rounded-[8px] shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
                        <div className="w-9 h-9 border border-white/20 bg-[#2C5AB8] absolute inset-1.5 "></div>
                        <span className="text-white font-black text-xl -rotate-45 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] z-20">48</span>
                    </div>
                    {/* Crown Icon Placeholder above if needed, but the screenshot is simple star/shape */}
                </div>

                {/* XP Bar Text */}
                <div className="bg-black/80 text-white font-bold text-xs px-2 py-1 rounded-r-md -ml-3 pl-5 border-y border-r border-[#ffffff40] shadow-md relative z-0 mt-4">
                    <span className="drop-shadow-md">5387/25000</span>
                </div>
            </div>

            {/* RIGHT: Resources */}
            <div className="flex space-x-2 pointer-events-auto items-center mt-4">

                {/* Gold */}
                <div className="flex items-center bg-black/60 h-8 rounded-sm pl-8 pr-8 border border-[#ffffff20] relative shadow-lg">
                    <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-8 h-8 bg-[#FFD700] rounded-full border-2 border-[#FCD34D] shadow-[0_2px_4px_rgba(0,0,0,0.5)] z-20"></div>
                    <span className="text-white font-black text-sm tracking-tight drop-shadow-md">258 509</span>
                    {/* Green Plus */}
                    <button className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-6 h-6 bg-[#4CAF50] rounded-md border-b-2 border-[#1B5E20] flex items-center justify-center shadow-lg active:mt-[1px] active:border-b-0">
                        <Plus size={14} className="text-white" strokeWidth={4} />
                    </button>
                </div>

                {/* Gems */}
                <div className="flex items-center bg-black/60 h-8 rounded-sm pl-8 pr-8 border border-[#ffffff20] relative shadow-lg">
                    <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-8 h-8 bg-[#10B981] rounded-lg border-t border-[#34D399] rotate-45 shadow-[0_2px_4px_rgba(0,0,0,0.5)] z-20"></div>
                    <span className="text-white font-black text-sm tracking-tight drop-shadow-md">1 893</span>
                    {/* Green Plus */}
                    <button className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-6 h-6 bg-[#4CAF50] rounded-md border-b-2 border-[#1B5E20] flex items-center justify-center shadow-lg active:mt-[1px] active:border-b-0">
                        <Plus size={14} className="text-white" strokeWidth={4} />
                    </button>
                </div>

            </div>
        </div>
    );
};

export default TopBar;
