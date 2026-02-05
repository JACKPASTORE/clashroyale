import React, { useRef, useEffect, useState } from 'react';
import { createInitialState } from '../engine/init';
import { step } from '../engine/step';
import { placeCard } from '../engine/placement';
import { GameState, Team } from '../engine/types';

import Arena from './Arena';
import Hand from './Hand';

// Simple UUID fallback
const generateId = () => Math.random().toString(36).substr(2, 9);

interface GameProps {
    onExit: () => void;
}

const Game: React.FC<GameProps> = ({ onExit }) => {
    // Load saved deck or fallback
    const getSavedDeck = () => {
        const raw = localStorage.getItem('albertRoyale.deck.v1');
        return raw ? JSON.parse(raw) : [];
    };

    const [gameState, setGameState] = useState<GameState | null>(null);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const requestRef = useRef<number | undefined>(undefined);
    const lastTimeRef = useRef<number | undefined>(undefined);

    // Init
    useEffect(() => {
        const deck = getSavedDeck();
        console.log('[Game] Loaded deck from localStorage:', deck);

        if (deck.length !== 8) {
            alert("Deck invalid (not 8 cards). Go to Deck Builder.");
            onExit();
            return;
        }

        const initialState = createInitialState(deck);
        console.log('[Game] Initial state created:', {
            hand: initialState.deck.hand,
            drawPile: initialState.deck.drawPile,
            elixir: initialState.elixir
        });
        setGameState(initialState);
    }, [onExit]);

    // Loop
    const animate = (time: number) => {
        if (lastTimeRef.current !== undefined) {
            const dt = (time - lastTimeRef.current) / 1000;
            setGameState(prevState => {
                if (!prevState || prevState.status === 'game_over') return prevState;
                return step(prevState, dt); // Run Engine Step
            });
        }
        lastTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current!);
    }, [animate]);

    // Interactions
    const handleArenaTap = (x: number, y: number) => {
        console.log('[Game] Arena tap:', { x, y, selectedCardId, hasState: !!gameState });

        if (!gameState || !selectedCardId) {
            console.warn('[Game] No state or no selected card');
            return;
        }

        // Use the new placeCard function
        setGameState(prev => {
            if (!prev) return null;
            console.log('[Game] Calling placeCard:', { cardId: selectedCardId, x, y });
            const newState = placeCard(prev, selectedCardId!, x, y, Team.BLUE);
            return newState;
        });

        setSelectedCardId(null);
    };

    if (!gameState) return <div className="text-white">Loading...</div>;

    console.log('[Game] Rendering with state:', {
        handCount: gameState.deck.hand.length,
        selectedCard: selectedCardId,
        elixir: gameState.elixir[Team.BLUE],
        unitCount: gameState.units.length
    });

    return (
        <div className="relative w-full h-full bg-black overflow-hidden flex flex-col items-center">

            {/* Top Info Bar */}
            <div className="absolute top-0 w-full h-12 bg-black/50 z-20 flex justify-between items-center px-4 pointer-events-none">
                <span className="text-red-500 font-bold">Enemy</span>
                <span className={`text-xl font-mono font-black ${gameState.time < 180 ? 'text-white' : 'text-red-500 animate-pulse'}`}>
                    {Math.max(0, 180 - Math.floor(gameState.time))}s
                </span>
                <span className="text-blue-500 font-bold">Player</span>
            </div>

            {/* Main Arena Display */}
            <div className="flex-1 w-full max-w-[480px] relative">
                <Arena state={gameState} onTap={handleArenaTap} />

                {/* Game Over Overlay */}
                {gameState.status === 'game_over' && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
                        <h1 className={`text-4xl font-black mb-4 ${gameState.winner === Team.BLUE ? 'text-blue-400' : 'text-red-500'}`}>
                            {gameState.winner === Team.BLUE ? 'VICTORY!' : 'DEFEAT'}
                        </h1>
                        <button onClick={onExit} className="px-6 py-3 bg-white text-black font-bold rounded-lg hover:scale-105 transition-transform">
                            BACK TO MENU
                        </button>
                    </div>
                )}
            </div>

            {/* Bottom Hand */}
            <div className="w-full max-w-[480px] relative">
                {/* Elixir Bar */}
                <div className="h-2 w-full bg-gray-800">
                    <div
                        className="h-full bg-purple-500 transition-all duration-200 ease-linear"
                        style={{ width: `${(gameState.elixir[Team.BLUE] / 10) * 100}%` }}
                    />
                </div>
                <div className="absolute bottom-32 left-2 text-white font-black drop-shadow text-xl z-20 pointer-events-none">
                    {Math.floor(gameState.elixir[Team.BLUE])}
                </div>

                <Hand
                    handIds={gameState.deck.hand}
                    selectedCardId={selectedCardId}
                    onSelectCard={(id) => {
                        console.log('[Game] Card selected:', id);
                        setSelectedCardId(id);
                    }}
                    elixir={gameState.elixir[Team.BLUE]}
                    nextCardId={gameState.deck.nextCard}
                />
            </div>

        </div>
    );
};

export default Game;
