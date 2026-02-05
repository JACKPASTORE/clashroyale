import React, { useState } from 'react';
import DeckBuilder from './DeckBuilder';
import Game from './Game';

export const Menu = () => {
    const [screen, setScreen] = useState<'menu' | 'deck' | 'game'>('menu');

    // Validate deck before allowing play
    const hasValidDeck = () => {
        try {
            const saved = localStorage.getItem('albertRoyale.deck.v1');
            const deck = saved ? JSON.parse(saved) : [];
            return deck.length === 8;
        } catch { return false; }
    };

    if (screen === 'deck') return <DeckBuilder onBack={() => setScreen('menu')} />;
    if (screen === 'game') return <Game onExit={() => setScreen('menu')} />;

    return (
        <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center gap-6 p-6">
            <h1 className="text-4xl font-black text-white text-center mb-8 drop-shadow-[0_4px_0_#000]">
                ALBERT<br /><span className="text-yellow-500">ROYALE</span>
            </h1>

            <button
                onClick={() => setScreen('game')}
                disabled={!hasValidDeck()}
                className={`
                w-64 py-4 rounded-xl text-2xl font-black shadow-lg transition-transform active:scale-95
                ${hasValidDeck()
                        ? 'bg-yellow-500 text-black shadow-yellow-500/20 hover:bg-yellow-400'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'}
            `}
            >
                PLAY
            </button>

            <button
                onClick={() => setScreen('deck')}
                className="w-64 py-3 rounded-xl bg-blue-600 text-white font-bold text-lg shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-transform active:scale-95"
            >
                DECK BUILDER
            </button>

            <div className="text-slate-500 text-xs mt-10 text-center max-w-xs">
                MVP Prototype v0.1<br />
                Custom Engine powered by React+Vite
            </div>
        </div>
    );
};
