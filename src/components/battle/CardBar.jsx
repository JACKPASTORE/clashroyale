import React from 'react';
import { motion } from 'framer-motion';

const CardSlot = ({ isNext = false, cost = 0, image = "" }) => (
    <motion.div
        whileTap={{ scale: 0.9 }}
        animate={!isNext ? { y: [0, -2, 0] } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: Math.random() }}
        className={`relative ${isNext ? 'w-10 h-14 opacity-90' : 'w-16 h-20'} bg-[#4b5563] rounded-lg border-2 border-black shadow-lg flex items-center justify-center cursor-pointer overflow-hidden group`}
    >
        {/* Placeholder Card Art */}
        <div className="w-full h-full bg-[#9ca3af] relative">
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl drop-shadow-md opacity-80">{image || '🃏'}</span>
            </div>
            {/* Elixir Cost */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-6 bg-[#d946ef] rounded-t-lg border-x border-t border-black flex items-center justify-center z-10">
                <span className="text-white font-black text-xs drop-shadow-md">{cost}</span>
            </div>
        </div>

        {/* Selection/Hover Glow (CSS) */}
        {!isNext && <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/50 transition-colors"></div>}
    </motion.div>
);

const CardBar = ({ elixir }) => {
    return (
        <div className="w-full px-2 pb-2 h-24 flex items-end justify-between gap-2">

            {/* LEFT: "Suivant" + Next Card */}
            <div className="flex flex-col items-center justify-end h-full pb-1">
                <div className="mb-1 bg-white ml-2 rounded-xl p-2 shadow-md relative">
                    <div className="w-4 h-4 bg-white absolute -bottom-1 left-0 rotate-45"></div>
                    <span className="text-black font-black text-xl">...</span>
                </div>
                <span className="text-white font-black text-[10px] uppercase drop-shadow-[0_2px_0_#000] mb-0.5 tracking-wider">Suivant</span>
                <CardSlot isNext={true} cost={4} image="⚡" />
            </div>

            {/* RIGHT: Active Hand (4 Cards) */}
            <div className="flex-1 flex gap-2 justify-end items-end h-full">
                <CardSlot cost={4} image="🧔🏻" />
                <CardSlot cost={2} image="🪵" />
                <CardSlot cost={4} image="👩🏻‍🦰" />
                <CardSlot cost={5} image="🧙🏼‍♂️" />
            </div>
        </div>
    );
};

export default CardBar;
