import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createInitialState } from '../engine/init';
import { step } from '../engine/step';
import { placeCard } from '../engine/placement';
import { Team } from '../engine/types';
import { getCardById } from '../data/load';
import { isValidPlacement, getPlacementColor } from '../engine/placement-validation';
import { getAllWaypoints } from '../engine/waypoints';
import ArenaLayout from '../components/battle/ArenaLayout';
import ElixirBar from '../components/battle/ElixirBar';

// Load deck from localStorage
const getSavedDeck = () => {
    const raw = localStorage.getItem('albertRoyale.deck.v1');
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch (e) {
        return [];
    }
};

const BattleScreen = ({ onExit }) => {
    const [gameState, setGameState] = useState(null);
    const [selectedCardId, setSelectedCardId] = useState(null);
    const [mousePos, setMousePos] = useState(null);
    const [showDebug, setShowDebug] = useState(false);
    const requestRef = useRef(undefined);
    const lastTimeRef = useRef(undefined);
    const gameStateRef = useRef(null);

    // Keep ref in sync
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    // Clear selection if card no longer in hand
    useEffect(() => {
        if (selectedCardId && gameState) {
            const inHand = gameState.deck[Team.BLUE].hand.includes(selectedCardId);
            if (!inHand) {
                setSelectedCardId(null);
            }
        }
    }, [gameState, selectedCardId]);

    // Init
    useEffect(() => {
        const deck = getSavedDeck();
        console.log('[BattleScreen] Loaded deck:', deck);
        if (deck.length !== 8) {
            alert("Deck invalid (not 8 cards). Go to Deck Builder.");
            if (onExit) onExit();
            return;
        }
        const initialState = createInitialState(deck);
        console.log('[BattleScreen] Initial state:', initialState);
        setGameState(initialState);
    }, [onExit]);

    // Game Loop
    useEffect(() => {
        if (!gameState) return;

        const animate = (time) => {
            if (!lastTimeRef.current) lastTimeRef.current = time;
            const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
            lastTimeRef.current = time;

            setGameState(prev => {
                if (!prev) return null;
                const newState = step(prev, dt);
                return newState;
            });

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [gameState ? 'running' : null]); // Only restart when game starts

    // Arena Click with validation
    const handleArenaTap = (e) => {
        if (!gameState || !selectedCardId) return;

        // Verify card is still in hand
        if (!gameState.deck[Team.BLUE].hand.includes(selectedCardId)) {
            console.warn('[Battle] Selected card no longer in hand');
            setSelectedCardId(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (480 / rect.width);
        const y = (e.clientY - rect.top) * (800 / rect.height);

        // Validate placement before attempting
        if (!isValidPlacement(x, y, Team.BLUE)) {
            console.warn('Invalid placement position');
            return;
        }

        // Use functional update with captured cardId
        const cardToPlay = selectedCardId;
        setSelectedCardId(null);
        setMousePos(null);

        setGameState(prev => {
            if (!prev) return null;
            // Double-check card still in hand at time of state update
            if (!prev.deck[Team.BLUE].hand.includes(cardToPlay)) {
                console.warn('[Battle] Card was removed before placement');
                return prev;
            }
            return placeCard(prev, cardToPlay, x, y, Team.BLUE);
        });
    };

    // Track mouse position for ghost preview
    const handleMouseMove = (e) => {
        if (!selectedCardId) {
            setMousePos(null);
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (480 / rect.width);
        const y = (e.clientY - rect.top) * (800 / rect.height);
        setMousePos({ x, y });
    };

    // Toggle bot enabled/disabled
    const handleBotToggle = () => {
        setGameState(prev => {
            if (!prev) return null;
            return {
                ...prev,
                bot: {
                    ...prev.bot,
                    enabled: !prev.bot.enabled
                }
            };
        });
    };

    if (!gameState) return <div className="text-white">Loading...</div>;

    const formatTime = (seconds) => {
        const totalSeconds = Math.floor(seconds);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                when: "beforeChildren",
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 20 } }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="relative w-full h-full bg-[#1C1C1C] overflow-hidden flex flex-col"
        >
            {/* BACKGROUND / CAMERA - Subtle Breath Effect */}
            <motion.div
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center bg-[#5DAE4B]"
                onClick={handleArenaTap}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setMousePos(null)}
                style={{ cursor: selectedCardId ? 'crosshair' : 'default' }}
            >
                <ArenaLayout
                    towers={gameState.towers}
                    units={gameState.units}
                />

                {/* Ghost Preview Circle */}
                {selectedCardId && mousePos && (
                    <svg className="absolute top-0 left-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                        <circle
                            cx={`${(mousePos.x / 480) * 100}%`}
                            cy={`${(mousePos.y / 800) * 100}%`}
                            r="5%"
                            fill={getPlacementColor(isValidPlacement(mousePos.x, mousePos.y, Team.BLUE))}
                            stroke="white"
                            strokeWidth="2"
                        />
                    </svg>
                )}

                {/* Debug: Waypoints Visualization */}
                {showDebug && (
                    <svg className="absolute top-0 left-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                        {getAllWaypoints().map((wp, idx) => (
                            <circle
                                key={idx}
                                cx={`${(wp.x / 480) * 100}%`}
                                cy={`${(wp.y / 800) * 100}%`}
                                r="1%"
                                fill={wp.team === Team.BLUE ? 'rgba(0, 100, 255, 0.5)' : 'rgba(255, 0, 0, 0.5)'}
                                stroke="white"
                                strokeWidth="1"
                            />
                        ))}
                    </svg>
                )}
            </motion.div>

            {/* TOP HUD LAYOUT */}
            <div className="absolute top-0 w-full z-20 pointer-events-none px-2 pt-2 flex justify-between items-start">

                {/* TOP LEFT: ENEMY PROFILE (Matches Screenshot) */}
                <motion.div
                    variants={itemVariants}
                    className="flex flex-col items-start"
                >
                    <div className="flex items-center gap-2">
                        {/* Shield Icon / Badge */}
                        <div className="w-8 h-10 bg-[#ad8a56] border-2 border-black flex items-center justify-center shadow-md relative">
                            {/* Inner shield graphic approximation */}
                            <div className="absolute inset-1 bg-[#852a2a] border border-[#e5a0a0]"></div>
                            <span className="relative z-10 text-white font-black text-xs drop-shadow-md">III</span>
                        </div>

                        <div className="flex flex-col">
                            <span className="text-[#d946ef] font-black text-lg leading-none drop-shadow-[0_2px_0_rgba(0,0,0,0.8)] stroke-black"
                                style={{ WebkitTextStroke: '1px black' }}>
                                Enemy
                            </span>
                            <span className="text-white text-xs font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                                AI Bot
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[#facc15] text-xs">🏆</span>
                                <span className="text-white font-bold text-xs drop-shadow-md">1000</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* TOP RIGHT: TIMER (Black Box, White Text) */}
                <motion.div
                    variants={itemVariants}
                    className="flex flex-col items-end gap-1"
                >
                    <div className="bg-black/80 px-3 py-1 rounded-lg border-2 border-black/40 shadow-lg backdrop-blur-sm">
                        <span className="text-[#a1a1aa] text-[10px] font-bold block leading-none text-right mb-0.5">Fin dans :</span>
                        <motion.span
                            key={Math.floor(gameState.time)}
                            initial={{ scale: 1.1 }}
                            animate={{ scale: 1 }}
                            className={`font-mono text-xl font-black block leading-none ${180 - gameState.time <= 60 ? 'text-[#ef4444]' : 'text-white'}`}
                        >
                            {formatTime(Math.max(0, 180 - gameState.time))}
                        </motion.span>
                    </div>
                    <button
                        onClick={() => setShowDebug(!showDebug)}
                        className="bg-black/60 px-2 py-1 rounded border border-white/30 text-white text-[10px] pointer-events-auto hover:bg-black/80 transition-colors"
                    >
                        Debug: {showDebug ? 'ON' : 'OFF'}
                    </button>
                    <button
                        onClick={handleBotToggle}
                        className="bg-black/60 px-2 py-1 rounded border border-white/30 text-white text-[10px] pointer-events-auto hover:bg-black/80 transition-colors"
                    >
                        AI Bot: {gameState.bot.enabled ? 'ON' : 'OFF'}
                    </button>
                </motion.div>
            </div>

            {/* MATCH OVER OVERLAY */}
            <AnimatePresence>
                {gameState.status === 'game_over' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto"
                    >
                        <h1 className={`font-black text-4xl mb-6 drop-shadow-[0_4px_0_#000] ${gameState.winner === Team.BLUE ? 'text-blue-400' : 'text-red-500'}`}>
                            {gameState.winner === Team.BLUE ? 'VICTOIRE!' : 'DÉFAITE'}
                        </h1>
                        <button
                            onClick={onExit || (() => window.location.reload())}
                            className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all"
                        >
                            Retour au Menu
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* BOTTOM HUD (Player) */}
            <motion.div
                variants={itemVariants}
                className="absolute bottom-0 w-full z-20 pb-safe-area flex flex-col gap-2 pointer-events-auto"
                style={{ background: 'linear-gradient(to top, #1C1C1C 80%, transparent)' }}
            >
                {/* Elixir Bar */}
                <div className="w-full px-4 pt-2">
                    <ElixirBar elixir={gameState.elixir[Team.BLUE]} />
                </div>

                {/* Card Bar */}
                <div className="w-full px-2 pb-2 h-24 flex items-end justify-between gap-2">

                    {/* LEFT: "Suivant" + Next Card */}
                    <div className="flex flex-col items-center justify-end h-full pb-1">
                        <div className="mb-1 bg-white ml-2 rounded-xl p-2 shadow-md relative">
                            <div className="w-4 h-4 bg-white absolute -bottom-1 left-0 rotate-45"></div>
                            <span className="text-black font-black text-xl">...</span>
                        </div>
                        <span className="text-white font-black text-[10px] uppercase drop-shadow-[0_2px_0_#000] mb-0.5 tracking-wider">Suivant</span>
                        {gameState.deck[Team.BLUE].nextCard && (
                            <CardSlotComponent
                                cardId={gameState.deck[Team.BLUE].nextCard}
                                isNext={true}
                                elixir={gameState.elixir[Team.BLUE]}
                            />
                        )}
                    </div>

                    {/* RIGHT: Active Hand (4 Cards) */}
                    <div className="flex-1 flex gap-2 justify-end items-end h-full">
                        {gameState.deck[Team.BLUE].hand.map((cardId, idx) => (
                            <CardSlotComponent
                                key={`hand-${idx}`}
                                cardId={cardId}
                                isSelected={selectedCardId === cardId}
                                onSelect={() => setSelectedCardId(cardId)}
                                elixir={gameState.elixir[Team.BLUE]}
                            />
                        ))}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// Card Slot Component
const CardSlotComponent = ({ cardId, isNext = false, isSelected = false, onSelect, elixir }) => {
    const card = getCardById(cardId);
    if (!card) return null;

    const canAfford = elixir >= card.elixirCost;
    const emoji = card.type === 'spell' ? '🧪' : card.type === 'building' ? '🏰' : '⚔️';

    const handleClick = (e) => {
        e.stopPropagation();
        if (!isNext && canAfford && onSelect) {
            onSelect();
        }
    };

    return (
        <motion.div
            whileTap={!isNext && canAfford ? { scale: 0.9 } : {}}
            animate={{ y: isSelected ? -8 : 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleClick}
            className={`relative ${isNext ? 'w-10 h-14 opacity-90' : 'w-16 h-20'} rounded-lg border-2 shadow-lg flex items-center justify-center overflow-hidden
                ${!isNext && canAfford ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}
                ${isSelected ? 'border-yellow-400 shadow-yellow-400/50' : 'border-black'}
                ${!canAfford && !isNext ? 'grayscale' : ''}
                bg-[#4b5563]`}
        >
            {/* Placeholder Card Art */}
            <div className={`w-full h-full relative flex flex-col items-center justify-center ${card.visuals?.icon && !card.visuals.icon.includes('placeholder') ? 'bg-black' : 'bg-[#9ca3af]'}`}>
                {/* Visual Icon */}
                {card.visuals && card.visuals.icon && !card.visuals.icon.includes('placeholder') ? (
                    <img src={card.visuals.icon} className="absolute inset-0 w-full h-full object-cover opacity-90" alt={card.name} />
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <span className="text-2xl drop-shadow-md opacity-80">{emoji}</span>
                    </div>
                )}

                {/* Card Name */}
                {!isNext && (
                    <div className="absolute top-0 left-0 right-0 bg-black/80 py-1 z-20">
                        <span className="text-[11px] font-black text-yellow-300 text-center block leading-tight uppercase">
                            {card.name}
                        </span>
                    </div>
                )}

                {/* Elixir Cost */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-6 bg-[#d946ef] rounded-t-lg border-x border-t border-black flex items-center justify-center z-10">
                    <span className="text-white font-black text-xs drop-shadow-md">{card.elixirCost}</span>
                </div>
            </div>

            {/* Selection/Hover Glow */}
            {!isNext && <div className={`absolute inset-0 border-2 transition-colors ${isSelected ? 'border-white' : 'border-white/0 hover:border-white/50'}`}></div>}
        </motion.div>
    );
};

export default BattleScreen;
