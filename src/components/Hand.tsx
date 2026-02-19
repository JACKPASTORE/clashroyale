import React from 'react';
import { Card } from '../engine/types';
import { getCardById } from '../data/load';

interface HandProps {
    handIds: string[];
    selectedCardId: string | null;
    onSelectCard: (id: string) => void;
    elixir: number;
    nextCardId: string | null;
}

const Hand: React.FC<HandProps> = ({ handIds, selectedCardId, onSelectCard, elixir, nextCardId }) => {
    return (
        <div className="absolute bottom-0 w-full h-32 bg-[#2d1b11] border-t-4 border-[#1a100a] flex items-center px-2 gap-2 select-none z-50">

            {/* Next Card Slot */}
            <div className="flex flex-col items-center justify-center mr-2">
                <span className="text-[10px] text-white font-bold mb-1">NEXT</span>
                <div className="w-12 h-16 bg-black/50 rounded border border-white/20 flex items-center justify-center">
                    {nextCardId && (() => {
                        const c = getCardById(nextCardId);
                        return c ? <span className="text-2xl opacity-50">🃏</span> : null;
                    })()}
                </div>
            </div>

            {/* Hand Cards */}
            <div className="flex-1 flex justify-center gap-3">
                {handIds.map(id => {
                    const card = getCardById(id);
                    if (!card) return <div key={id} className="w-16 h-20 bg-red-500/50">Err</div>;

                    const isSelected = selectedCardId === id;
                    const canAfford = elixir >= card.elixirCost;

                    return (
                        <button
                            key={id}
                            onClick={() => {
                                console.log('[Hand] Card clicked:', id, 'canAfford:', canAfford);
                                if (canAfford) {
                                    onSelectCard(id);
                                }
                            }}
                            className={`
                        relative w-20 h-28 rounded-lg flex flex-col items-center justify-center border-2 transition-transform active:scale-95
                        ${isSelected ? 'border-yellow-400 -translate-y-4 shadow-[0_0_15px_#facc15]' : 'border-black shadow-lg'}
                        ${canAfford ? 'bg-gray-700 cursor-pointer' : 'bg-gray-800 opacity-60 grayscale cursor-not-allowed'}
                    `}
                        >
                            {/* Elixir Cost Badge */}
                            <div className="absolute -top-2 -left-2 w-6 h-6 bg-purple-600 rounded-full border border-black flex items-center justify-center z-10">
                                <span className="text-white font-bold text-xs">{card.elixirCost}</span>
                            </div>

                            {/* Visual */}
                            <div className={`w-[90%] h-[60%] ${card.visuals?.icon && !card.visuals.icon.includes('placeholder') ? 'bg-white' : 'bg-gray-600'} rounded flex items-center justify-center mb-1 overflow-hidden`}>
                                {card.visuals?.icon && !card.visuals.icon.includes('placeholder') ? (
                                    <img src={card.visuals.icon} className="w-full h-full object-cover" alt={card.name} />
                                ) : (
                                    <span className="text-3xl">
                                        {card.type === 'spell' ? '🧪' : card.type === 'building' ? '🏰' : '⚔️'}
                                    </span>
                                )}
                            </div>

                            {/* Name */}
                            <span className="text-[9px] text-white font-bold text-center leading-tight px-1 overflow-hidden h-8">
                                {card.name}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default Hand;
