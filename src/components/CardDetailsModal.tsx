import React from 'react';
import { Card, UnitType, TargetType, Speed, Range } from '../engine/types';
import { X, Shield, Sword, Zap, Move, Crosshair, Users } from 'lucide-react';
import KeyedImage from './KeyedImage';

interface CardDetailsModalProps {
    card: Card;
    onClose: () => void;
    onToggleDeck: (cardId: string) => void;
    isInDeck: boolean;
}

const CardDetailsModal: React.FC<CardDetailsModalProps> = ({ card, onClose, onToggleDeck, isInDeck }) => {

    // Helper to format enum values
    const formatValue = (val: string) => val.replace(/_/g, ' ').toUpperCase();

    // Helper to map values to colors/icons if needed
    const getRarityColor = () => {
        // Mock rarity logic based on elixir cost or type for now
        if (card.elixirCost >= 6) return 'text-purple-400 border-purple-500 shadow-purple-900/50'; // Epic/Legendary feel
        if (card.elixirCost >= 4) return 'text-orange-400 border-orange-500 shadow-orange-900/50'; // Rare
        return 'text-blue-400 border-blue-500 shadow-blue-900/50'; // Common
    };

    const borderColor = getRarityColor().split(' ')[1];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* Modal Content */}
            <div className={`relative w-full max-w-sm bg-slate-900 rounded-xl border-2 ${borderColor} shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}>

                {/* Header / Image Area */}
                <div className="relative h-48 bg-gradient-to-b from-slate-800 to-slate-900 flex items-center justify-center p-6 border-b border-slate-700">
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-2 bg-black/40 rounded-full hover:bg-black/60 text-white transition-colors z-10"
                    >
                        <X size={20} />
                    </button>

                    {/* Elixir Hexagon */}
                    <div className="absolute top-3 left-3 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center border-2 border-purple-300 shadow-lg z-10">
                        <span className="font-black text-xl text-white drop-shadow-md">{card.elixirCost}</span>
                    </div>

                    {/* Card Image (Using visual model or icon) */}
                    <div className="relative w-32 h-32 filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform duration-300">
                        <KeyedImage
                            src={card.visuals.model || card.visuals.icon}
                            alt={card.name}
                            className="w-full h-full object-contain"
                            maxSize={512}
                        />
                    </div>

                    <div className="absolute bottom-2 left-0 w-full text-center">
                        <div className="inline-block px-3 py-1 bg-black/60 rounded-full backdrop-blur-md border border-white/10">
                            <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">{formatValue(card.type)}</span>
                        </div>
                    </div>
                </div>

                {/* Info Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">

                    {/* Title Section */}
                    <div className="text-center">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">{card.name}</h2>
                        {card.nickname && <p className="text-sm text-yellow-500 font-medium italic">"{card.nickname}"</p>}
                        <p className="mt-2 text-xs text-slate-400 break-words leading-relaxed">
                            {/* Generic description if none provided in raw JSON, but ability descriptions exist */}
                            {card.abilities && card.abilities.length > 0
                                ? card.abilities.map(a => a.description).join(' ')
                                : "Une unité redoutable pour votre armée."}
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* HP */}
                        <div className="bg-slate-800/50 p-2 rounded border border-slate-700 flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-900/50 rounded flex items-center justify-center text-green-400">
                                <Shield size={16} />
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold">Points de Vie</div>
                                <div className="text-sm font-bold text-white">{card.hp}</div>
                            </div>
                        </div>

                        {/* DPS/Damage */}
                        <div className="bg-slate-800/50 p-2 rounded border border-slate-700 flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-900/50 rounded flex items-center justify-center text-red-400">
                                <Sword size={16} />
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold">Dégâts / Sec</div>
                                <div className="text-sm font-bold text-white">{card.dps}</div>
                            </div>
                        </div>

                        {/* Speed */}
                        {card.type === UnitType.TROOP && (
                            <div className="bg-slate-800/50 p-2 rounded border border-slate-700 flex items-center gap-3">
                                <div className="w-8 h-8 bg-yellow-900/50 rounded flex items-center justify-center text-yellow-400">
                                    <Move size={16} />
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-400 uppercase font-bold">Vitesse</div>
                                    <div className="text-sm font-bold text-white">{formatValue(card.speed)}</div>
                                </div>
                            </div>
                        )}

                        {/* Range */}
                        <div className="bg-slate-800/50 p-2 rounded border border-slate-700 flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-900/50 rounded flex items-center justify-center text-blue-400">
                                <Crosshair size={16} />
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold">Portée</div>
                                <div className="text-sm font-bold text-white">{formatValue(card.range)}</div>
                            </div>
                        </div>

                        {/* Targets */}
                        <div className="col-span-2 bg-slate-800/50 p-2 rounded border border-slate-700 flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-900/50 rounded flex items-center justify-center text-purple-400">
                                <Users size={16} />
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold">Cibles</div>
                                <div className="text-sm font-bold text-white">{card.targets.map(formatValue).join(', ')}</div>
                            </div>
                        </div>

                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-950 border-t border-slate-800">
                    <button
                        onClick={() => {
                            onToggleDeck(card.id);
                            onClose();
                        }}
                        className={`w-full py-3 rounded-lg font-black uppercase tracking-wider shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2
                            ${isInDeck
                                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/30'
                                : 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/30'}
                        `}
                    >
                        {isInDeck ? (
                            <>
                                <span className="text-xl">✕</span> Retirer du Deck
                            </>
                        ) : (
                            <>
                                <span className="text-xl">+</span> Ajouter au Deck
                            </>
                        )}
                    </button>
                    <div className="mt-2 text-center">
                        <button onClick={onClose} className="text-xs text-slate-500 hover:text-white underline">Fermer</button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CardDetailsModal;
