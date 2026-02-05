import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Copy, Save } from 'lucide-react';
import CardSlot from '../components/CardSlot';
import { getAllCards, getCardById } from '../data/load';

const DecksScreen = () => {
    const [activeDeck, setActiveDeck] = useState(1);
    const [deck, setDeck] = useState([]);
    const allCards = getAllCards();

    // Load deck from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('albertRoyale.deck.v1');
        if (saved) {
            try {
                setDeck(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load deck:', e);
            }
        }
    }, []);

    // Auto-save deck whenever it changes
    useEffect(() => {
        if (deck.length > 0) {
            localStorage.setItem('albertRoyale.deck.v1', JSON.stringify(deck));
            console.log('[DecksScreen] Auto-saved deck:', deck);
        }
    }, [deck]);

    // Add card to deck
    const addCardToDeck = (cardId) => {
        if (deck.includes(cardId)) return; // Already in deck
        if (deck.length >= 8) return; // Deck full
        setDeck([...deck, cardId]);
    };

    // Remove card from deck
    const removeCardFromDeck = (cardId) => {
        setDeck(deck.filter(id => id !== cardId));
    };

    // Save deck to localStorage
    const saveDeck = () => {
        localStorage.setItem('albertRoyale.deck.v1', JSON.stringify(deck));
        alert(`Deck saved! (${deck.length}/8 cards)`);
    };

    // Calculate average elixir
    const avgElixir = deck.length > 0
        ? (deck.reduce((sum, id) => {
            const card = getCardById(id);
            return sum + (card?.elixirCost || 0);
        }, 0) / deck.length).toFixed(1)
        : '0.0';

    return (
        <div className="w-full h-full bg-[#1C2735] flex flex-col pt-14 font-sans select-none">

            {/* HEADER TABS (Decks / Collection) */}
            <div className="flex w-full bg-[#223042] border-b-4 border-black/30 pt-1 px-1 pb-0 z-20 shadow-md">
                {/* Decks Tab (Active) */}
                <div className="flex-1 bg-[#3B73E6] rounded-t-[10px] py-2 flex justify-center items-center relative z-10 shadow-[0_-2px_0_rgba(255,255,255,0.1)_inset] border-t border-[#60A5FA]">
                    <span className="text-white font-black text-xl uppercase italic drop-shadow-[0_2px_0_rgba(0,0,0,0.5)] tracking-wide"
                        style={{ textShadow: '0px 2px 0px #1E3A8A' }}>
                        Decks
                    </span>
                    {/* Active Tab Highlight Line */}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-[#FCD34D] z-20"></div>
                </div>
                {/* Collection Tab */}
                <div className="flex-1 bg-[#1A2634] rounded-t-[10px] py-2 flex justify-center items-center ml-[-4px] z-0 opacity-90 border-t border-white/5 relative top-[2px]">
                    <span className="text-[#94A3B8] font-black text-lg uppercase italic tracking-wide drop-shadow-md">Collection</span>
                    <div className="bg-[#DC2626] text-white text-[10px] font-bold px-1.5 py-[1px] rounded-[3px] ml-2 border border-white/20 shadow-sm">{allCards.length}</div>
                </div>
            </div>

            {/* DECK SELECTOR ROW */}
            <div className="flex items-center justify-between px-2 py-2 bg-[#425975] border-b border-black/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] relative z-10">
                {/* Hamburger Menu */}
                <div className="bg-[#3B73E6] w-9 h-8 rounded-[4px] border-b-[3px] border-[#1E40AF] flex items-center justify-center cursor-pointer active:border-b-0 active:translate-y-[3px] shadow-sm">
                    <Menu className="text-white drop-shadow-md" size={20} strokeWidth={3} />
                </div>

                {/* Numbered Tabs - Pixel Perfect Shapes */}
                <div className="flex space-x-[2px] bg-black/20 p-1 rounded-md">
                    {[1, 2, 3, 4, 5].map((num) => {
                        const isActive = activeDeck === num;
                        return (
                            <button
                                key={num}
                                onClick={() => setActiveDeck(num)}
                                className={`w-9 h-9 flex items-center justify-center font-black text-lg transition-all relative rounded-[4px]
                            ${isActive
                                        ? 'bg-[#FBC02D] border-b-[3px] border-[#F57F17] text-white z-10'
                                        : 'bg-[#4B6ea3] border-b-[3px] border-[#375a8c] text-[#CBD5E1] hover:bg-[#5C82B8]'}
                        `}
                            >
                                <span className="drop-shadow-[0_1px_0_rgba(0,0,0,0.5)]">{num}</span>
                                {/* Golden Arrow for Active */}
                                {isActive && (
                                    <div className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 z-20">
                                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#F57F17] filter drop-shadow-sm"></div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Save & Copy Icons */}
                <div className="flex space-x-1">
                    <button
                        onClick={saveDeck}
                        disabled={deck.length !== 8}
                        className={`w-9 h-8 rounded-[4px] border-b-[3px] flex items-center justify-center cursor-pointer active:border-b-0 active:translate-y-[3px]
                            ${deck.length === 8
                                ? 'bg-[#22C55E] border-[#16A34A] opacity-100'
                                : 'bg-gray-600 border-gray-700 opacity-50 cursor-not-allowed'}`}
                    >
                        <Save size={18} className="text-white drop-shadow-md" strokeWidth={2.5} />
                    </button>
                    <div className="bg-[#3B73E6] w-9 h-8 rounded-[4px] border-b-[3px] border-[#1E40AF] flex items-center justify-center cursor-pointer active:border-b-0 active:translate-y-[3px]">
                        <Copy size={18} className="text-white drop-shadow-md" strokeWidth={2.5} />
                    </div>
                </div>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-24 relative bg-[#202b3b]">

                <AnimatePresence mode='wait'>
                    <motion.div
                        key={activeDeck}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                        className="p-2 z-10 relative"
                    >
                        {/* 8 CARD SLOTS - DECK DISPLAY */}
                        <div className="grid grid-cols-4 gap-2 mb-2">
                            {Array.from({ length: 8 }).map((_, i) => {
                                const cardId = deck[i];
                                const card = cardId ? getCardById(cardId) : null;

                                return (
                                    <div
                                        key={i}
                                        onClick={() => card && removeCardFromDeck(card.id)}
                                        className={`aspect-[3/4] rounded-lg border-2 relative flex flex-col items-center justify-center transition-all
                                            ${card
                                                ? 'bg-slate-700 border-yellow-500 cursor-pointer hover:border-red-500'
                                                : 'bg-slate-800/50 border-slate-600 border-dashed'}`}
                                    >
                                        {card ? (
                                            <>
                                                {/* Elixir Cost */}
                                                <div className="absolute top-1 left-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center shadow border border-purple-400">
                                                    <span className="text-white font-bold text-[10px]">{card.elixirCost}</span>
                                                </div>
                                                {/* Icon */}
                                                <span className="text-3xl mb-1">
                                                    {card.type === 'spell' ? '🧪' : card.type === 'building' ? '🏰' : '⚔️'}
                                                </span>
                                                {/* Name */}
                                                <span className="text-[8px] text-center font-bold text-white leading-tight px-1">
                                                    {card.name}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-slate-500 text-2xl font-bold">{i + 1}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* ELIXIR INDICATOR */}
                        <div className="flex items-center mb-6 pl-1">
                            <div className="w-9 h-9 bg-[#AA00FF] rounded-full flex items-center justify-center border-2 border-[#E1BEE7] shadow-lg relative overflow-hidden">
                                <div className="absolute top-1 left-2 w-3 h-2 bg-white/30 rounded-full blur-[1px]"></div>
                                <div className="w-full h-1/2 absolute bottom-0 bg-[#7B1FA2] opacity-50"></div>
                            </div>
                            <span className="text-white font-black text-xl ml-2 drop-shadow-md tracking-tighter">{avgElixir}</span>
                            <span className="text-white/50 text-sm ml-1">({deck.length}/8)</span>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* SEPARATOR */}
                <div className="w-full h-[1px] bg-white/10 mb-4 mx-2"></div>

                {/* COLLECTION GRID */}
                <div className="w-full px-2 pb-4">
                    <h3 className="text-white/60 font-bold text-sm uppercase mb-2 ml-1">Collection ({allCards.length})</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {allCards.map(card => {
                            const inDeck = deck.includes(card.id);
                            return (
                                <div
                                    key={card.id}
                                    onClick={() => addCardToDeck(card.id)}
                                    className={`aspect-[3/4] rounded-lg border-2 relative flex flex-col items-center justify-center cursor-pointer transition-all
                                        ${inDeck
                                            ? 'bg-green-900/30 border-green-500 opacity-60'
                                            : 'bg-slate-700 border-slate-500 hover:border-yellow-400'}`}
                                >
                                    {/* Check badge if in deck */}
                                    {inDeck && (
                                        <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow border border-white">
                                            <span className="text-white font-bold text-xs">✓</span>
                                        </div>
                                    )}

                                    {/* Elixir Cost */}
                                    <div className="absolute top-1 left-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center shadow border border-purple-400">
                                        <span className="text-white font-bold text-[10px]">{card.elixirCost}</span>
                                    </div>

                                    {/* Icon */}
                                    <span className="text-3xl mb-1">
                                        {card.type === 'spell' ? '🧪' : card.type === 'building' ? '🏰' : '⚔️'}
                                    </span>

                                    {/* Name */}
                                    <span className="text-[8px] text-center font-bold text-white leading-tight px-1">
                                        {card.name}
                                    </span>

                                    {/* Mini Stats */}
                                    <div className="absolute bottom-1 w-full px-1 flex justify-between text-[7px] text-white/70">
                                        <span>❤️{card.hp}</span>
                                        <span>⚔️{card.dps}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DecksScreen;
