import React from 'react';
import { motion } from 'framer-motion';

const CardSlot = ({ index, i }) => {
    // Mimic the exact cards from Screenshot 1 & 2
    const cards = [
        { level: 15, elite: true, elixir: 4, label: '0/180', border: 'elite' }, // Royal Giant?
        { level: 15, elite: true, elixir: 4, label: '0/20', border: 'elite' }, // Lumberjack
        { level: 14, elite: false, elixir: 4, label: '165/1000', border: 'orange' }, // Valkyrie
        { level: 14, elite: false, elixir: 2, label: '1/14', border: 'legendary' }, // Log
        { level: 14, elite: false, elixir: 5, label: '7/14', border: 'legendary' }, // Ram Rider
        { level: 14, elite: false, elixir: 5, label: '288/1000', border: 'orange' }, // Wizard
        { level: 13, elite: false, elixir: 4, label: '4/12', border: 'legendary' }, // Ewiz
        { level: 15, elite: false, elixir: 4, label: '140/1400', border: 'orange' }, // Mini Pekka (Lvl 15 but not elite glow in screenshot maybe? adjusting to match)
    ];

    const card = cards[i] || cards[0];
    const isElite = card.level === 15 && card.border === 'elite';

    return (
        <motion.div
            className="relative aspect-[3/4.2] rounded-lg cursor-pointer group"
            whileTap={{ scale: 0.95 }}
        >
            {/* ELITE GLOW ANIMATION (Behind) */}
            {isElite && (
                <div className="absolute -inset-[3px] bg-gradient-to-b from-[#E040FB] via-[#D500F9] to-[#AA00FF] rounded-lg blur-[2px] animate-pulse">
                    <div className="absolute inset-0 bg-[url('/sparkles.png')] opacity-50"></div>
                </div>
            )}

            {/* CARD FRAME */}
            <div className={`absolute inset-0 rounded-[7px] p-[2px] z-10 ${isElite
                    ? 'bg-gradient-to-b from-[#F50057] via-[#D500F9] to-[#4A148C]'
                    : card.border === 'legendary'
                        ? 'bg-gradient-to-br from-[#4FC3F7] via-[#E1F5FE] to-[#0277BD] p-[1.5px]'
                        : 'bg-[#F97316]' // Rare
                }`}>
                {/* Inner Content */}
                <div className="w-full h-full bg-[#2D3748] rounded-[5px] relative overflow-hidden shadow-inner">

                    {/* Card Art Placeholder - Mocking visual */}
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('https://clashroyale.com/uploaded-images/card_placeholder_${i % 3}.png'), linear-gradient(to bottom, #4A5568, #1A202C)` }}>
                        {isElite && <div className="absolute inset-0 bg-[#D500F9] mix-blend-overlay opacity-20"></div>}
                    </div>

                    {/* LEVEL INDICATOR (Bottom Center) - Pixel Perfect */}
                    {isElite ? (
                        // Elite Level 15
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-full flex justify-center">
                            <span className="text-[#FF80AB] font-black text-[11px] uppercase tracking-tighter drop-shadow-[0_2px_0_rgba(0,0,0,1)]"
                                style={{
                                    textShadow: '0 0 2px #C51162, 0 2px 0 #000',
                                    WebkitTextStroke: '0.5px #4A148C'
                                }}>
                                Niveau 15
                            </span>
                        </div>
                    ) : (
                        // Standard Level
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-full flex justify-center">
                            <span className="text-white font-black text-[11px] drop-shadow-[0_1.5px_0_rgba(0,0,0,1)]"
                                style={{ textShadow: '0 0 2px rgba(0,0,0,0.8)' }}>
                                Niveau {card.level}
                            </span>
                        </div>
                    )}

                    {/* PROGRESS BAR (Bottom Strip) */}
                    <div className="absolute bottom-0 left-0 w-full bg-[#111] h-6 flex items-center px-1 border-t border-white/10 z-20">
                        <div className="w-3 h-3 bg-[#3B82F6] arrow-clip mr-1"></div> {/* Arrow shape via CSS later or simple box */}
                        <div className="flex-1 h-3 bg-[#333] rounded-[2px] relative overflow-hidden">
                            <div className="absolute top-0 left-0 h-full bg-[#4CAF50] w-[60%] shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]"></div>
                        </div>
                        <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-bold drop-shadow-md pt-[1px]">{card.label}</span>
                    </div>
                </div>
            </div>

            {/* ELIXIR COST (Top Left) */}
            <div className="absolute top-[-3px] left-[-3px] z-30 drop-shadow-md">
                <div className="w-6 h-7 bg-[#AA00FF] rounded-br-lg rounded-tl-[4px] flex items-center justify-center border-l border-t border-[#E1BEE7] shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 rounded-tl-[4px]"></div>
                    <span className="text-white font-black text-[11px] drop-shadow-md relative z-10">{card.elixir}</span>
                </div>
            </div>

        </motion.div>
    );
};

export default CardSlot;
