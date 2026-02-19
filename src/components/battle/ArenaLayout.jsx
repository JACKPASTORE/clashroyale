import React from 'react';
import { Crown, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { Team } from '../../engine/types';
import { getCardById } from '../../data/load';

const UnitRenderer = ({ unit, isMirrored }) => {
    const card = getCardById(unit.cardId);
    if (!card) return null;

    let visualX = (unit.x / 480) * 100;
    let visualY = (unit.y / 800) * 100 + 8; // Offset match

    if (isMirrored) {
        visualX = 100 - visualX;
        visualY = 100 - ((unit.y / 800) * 100) + 8; // Keep offset? +8 probably needs check.
        // Actually, if we invert Y, the +8 offset might push it off screen or wrong way?
        // Let's refine: Original Y% is based on top.
        // Mirrored Y% = 100 - OriginalY%. 
        visualY = 100 - (unit.y / 800) * 100;
    }

    const hpPercent = (unit.hp / unit.maxHp) * 100;
    const barColor = hpPercent > 60 ? '#22c55e' : hpPercent > 30 ? '#eab308' : '#ef4444';

    // Determine visuals
    // If no model url, use fallback color circle
    const hasModel = card.visuals && card.visuals.model && !card.visuals.model.includes('placeholder');

    return (
        <motion.div
            layout
            initial={{ scale: 0, opacity: 0 }}
            animate={{
                scale: 1,
                opacity: 1,
                x: "-50%",
                y: "-50%",
                top: `${visualY}%`,
                left: `${visualX}%`
            }}
            transition={{ duration: 0.2 }} // Smooth movement
            className="absolute z-50 pointer-events-none"
        >
            {/* HP Bar */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-1 bg-black/50 rounded-full overflow-hidden">
                <div
                    className="h-full transition-all duration-300"
                    style={{
                        width: `${hpPercent}%`,
                        backgroundColor: barColor
                    }}
                />
            </div>

            {/* Visual Representation */}
            {hasModel ? (
                <div className={`w-12 h-12 relative flex items-center justify-center`}>
                    {/* Sprite Placeholder - In future use <img> */}
                    <img
                        src={card.visuals.model}
                        alt={card.name}
                        className={`w-full h-full object-contain drop-shadow-lg ${unit.state === 'attacking' ? 'animate-pulse' : ''}`}
                        style={{
                            filter: unit.team === Team.RED ? 'hue-rotate(180deg)' : 'none'
                        }}
                    />
                </div>
            ) : (
                <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shadow-sm`}
                    style={{
                        backgroundColor: card.visuals.color,
                        borderColor: unit.team === Team.BLUE ? '#1e3a8a' : '#7f1d1d'
                    }}
                >
                    {unit.team === Team.BLUE ? '🔵' : '🔴'}
                </div>
            )}
        </motion.div>
    );
};

const ArenaLayout = ({ towers = [], units = [], projectiles = [], isMirrored = false }) => {
    // Determine Top (Enemy) and Bottom (Player) towers based on mirroring
    // Default (isMirrored=false/Host/Blue): Enemy=Red(Top), Player=Blue(Bottom)
    // Mirrored (Client/Red): Enemy=Blue(Top), Player=Red(Bottom)

    const enemyTeam = isMirrored ? Team.BLUE : Team.RED;
    const playerTeam = isMirrored ? Team.RED : Team.BLUE;

    // Helper to find relative towers
    // Note: 'left' and 'right' logic might need swap if mirrored?
    // Engine: x < 240 is Left.
    // If mirrored (visual flip), x < 240 (Logical Left) becomes Visual Right?
    // Formula: visualX = 100 - x%.
    // So x=0 (Left) -> 100 (Right).
    // Yes, Left/Right swaps visually if we mirror X. 

    // Top (Visual Enemy)
    const topKing = towers.find(t => t.team === enemyTeam && t.type === 'king');
    // Top Left Visual = Logical Right if mirrored?
    // Let's stick to logical find first, and place them freely.
    // Actually, just finding by ID/position is safer.
    const topLeft = towers.find(t => t.team === enemyTeam && t.type === 'princess' && (isMirrored ? t.x >= 240 : t.x < 240));
    const topRight = towers.find(t => t.team === enemyTeam && t.type === 'princess' && (isMirrored ? t.x < 240 : t.x >= 240));

    // Bottom (Visual Player)
    const botKing = towers.find(t => t.team === playerTeam && t.type === 'king');
    const botLeft = towers.find(t => t.team === playerTeam && t.type === 'princess' && (isMirrored ? t.x >= 240 : t.x < 240));
    const botRight = towers.find(t => t.team === playerTeam && t.type === 'princess' && (isMirrored ? t.x < 240 : t.x >= 240));

    const getTowerHP = (tower) => tower ? Math.ceil(tower.hp) : 0;
    const getHPPercent = (tower) => tower ? (tower.hp / tower.maxHp) * 100 : 0;

    return (
        <div className="absolute inset-x-0 top-16 bottom-28 bg-[#9caeb5] overflow-hidden flex flex-col items-center shadow-inner select-none z-0">

            {/* --- ENVIRONMENT BACKGROUND (Forest/Cliffs) --- */}
            <div className="absolute inset-0 z-0 bg-[#4ade80]">
                {/* Grass Edges */}
                <div className="absolute left-0 top-0 bottom-0 w-3 bg-[#22c55e] border-r-4 border-[#16a34a]/50"></div>
                <div className="absolute right-0 top-0 bottom-0 w-3 bg-[#22c55e] border-l-4 border-[#16a34a]/50"></div>
                {/* Random Trees (CSS Circles) */}
                <div className="absolute top-10 left-[-4px] w-8 h-8 bg-[#14532d] rounded-full opacity-50 blur-[1px]"></div>
                <div className="absolute top-40 right-[-4px] w-6 h-6 bg-[#14532d] rounded-full opacity-50 blur-[1px]"></div>
            </div>

            {/* --- ARENA FLOOR (Light Stone Tile) --- */}
            <div className="relative w-[94%] h-full bg-[#e3dcd2] border-x-[6px] border-[#cebfad] shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] z-10 flex flex-col">

                {/* TILE PATTERN GRID */}
                <div className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none"
                    style={{
                        backgroundImage: 'linear-gradient(#bfb3a4 1px, transparent 1px), linear-gradient(90deg, #bfb3a4 1px, transparent 1px)',
                        backgroundSize: '24px 24px' /* Smaller tiles for scale */
                    }}>
                </div>

                {/* --- TOP SIDE (Visual Enemy) --- */}
                <div className="relative flex-1 w-full">

                    {/* KING TOWER */}
                    {topKing && (
                        <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-32 h-36 flex flex-col items-center z-20 scale-90">
                            {/* Level Badge */}
                            <div className="absolute -top-4 w-8 h-9 bg-[url('/assets/level_badge.png')] bg-contain bg-no-repeat flex items-center justify-center z-30">
                                <div className="w-6 h-7 bg-[#facc15] border-2 border-black rotate-45 flex items-center justify-center shadow-md">
                                    <span className="text-black font-black text-xs -rotate-45">15</span>
                                </div>
                            </div>
                            {/* Tower Structure - Reused Red style for Enemy */}
                            <div className="w-28 h-24 bg-[#b91c1c] rounded-lg border-4 border-[#7f1d1d] shadow-2xl relative flex flex-col items-center justify-end overflow-visible">
                                <div className="absolute -top-8 w-20 h-10 bg-[#7f1d1d] rounded-t-xl z-0"></div>
                                <div className="relative z-10 -top-6">
                                    <span className="text-4xl filter drop-shadow-lg">🤴🏼</span>
                                </div>
                                <div className="w-full h-8 bg-[#991b1b] border-t-2 border-[#7f1d1d] flex justify-center">
                                    <div className="w-12 h-8 bg-black/40 rounded-t-full border-t-2 border-black/20"></div>
                                </div>
                            </div>
                            <div className="mt-1 bg-black/50 px-1 py-0.5 rounded border border-white/20">
                                <span className="text-white text-[8px] font-bold block text-center mb-[1px]">{getTowerHP(topKing)}</span>
                                <div className="w-20 h-2 bg-black/70 rounded-sm relative overflow-hidden">
                                    <div className="absolute h-full bg-[#dc2626] transition-all" style={{ width: `${getHPPercent(topKing)}%` }}></div>
                                    <div className="absolute top-0 w-full h-[2px] bg-white/30"></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PRINCESS TOWERS */}
                    {/* Visual Left */}
                    {topLeft && (
                        <div className="absolute top-10 left-4 w-24 h-28 flex flex-col items-center z-20 scale-90">
                            <div className="absolute -top-3 z-30 transform -rotate-12">
                                <div className="w-5 h-5 bg-[#facc15] border border-black flex items-center justify-center shadow font-black text-[9px]">15</div>
                            </div>
                            <div className="w-20 h-20 bg-[#ef4444] rounded-xl border-4 border-[#991b1b] shadow-xl relative top-2">
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-6 bg-[#b91c1c] rounded-md"></div>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                                    <span className="text-2xl">👸🏻</span>
                                </div>
                            </div>
                            <div className="mt-3 bg-black/50 px-1 rounded border border-white/20 relative z-30">
                                <span className="text-white text-[9px] font-bold block leading-tight text-center mb-[1px]">{getTowerHP(topLeft)}</span>
                                <div className="w-16 h-1.5 bg-black/70 rounded-sm relative overflow-hidden">
                                    <div className="absolute h-full bg-[#dc2626] transition-all" style={{ width: `${getHPPercent(topLeft)}%` }}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Visual Right */}
                    {topRight && (
                        <div className="absolute top-10 right-4 w-24 h-28 flex flex-col items-center z-20 scale-90">
                            <div className="absolute -top-3 z-30 transform rotate-12">
                                <div className="w-5 h-5 bg-[#facc15] border border-black flex items-center justify-center shadow font-black text-[9px]">15</div>
                            </div>
                            <div className="w-20 h-20 bg-[#ef4444] rounded-xl border-4 border-[#991b1b] shadow-xl relative top-2">
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-6 bg-[#b91c1c] rounded-md"></div>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                                    <span className="text-2xl">👸🏻</span>
                                </div>
                            </div>
                            <div className="mt-3 bg-black/50 px-1 rounded border border-white/20 relative z-30">
                                <span className="text-white text-[9px] font-bold block leading-tight text-center mb-[1px]">{getTowerHP(topRight)}</span>
                                <div className="w-16 h-1.5 bg-black/70 rounded-sm relative overflow-hidden">
                                    <div className="absolute h-full bg-[#dc2626] transition-all" style={{ width: `${getHPPercent(topRight)}%` }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- RIVER (Compact, Wider look) --- */}
                <div className="relative w-full h-14 flex items-center justify-center z-10 my-2">
                    <div className="absolute inset-x-0 h-10 top-2 bg-[#a21caf] border-y-4 border-[#86198f] shadow-inner overflow-hidden flex items-center">
                        <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 animate-flow-horizontal"></div>
                        <div className="absolute inset-0 bg-gradient-to-b from-[#d946ef]/60 to-[#c026d3]/80 mix-blend-overlay"></div>
                    </div>

                    {/* Bridges pushed further out */}
                    <div className="absolute left-6 w-12 h-16 bg-[#854d0e] border-x-2 border-[#451a03] rounded shadow-[0_4px_4px_rgba(0,0,0,0.5)] z-20 flex flex-col justify-between py-1 px-[2px]">
                        <div className="w-full h-[2px] bg-[#fcd34d]/30 mb-auto"></div>
                        <div className="w-full h-[2px] bg-[#fcd34d]/30 mt-auto"></div>
                    </div>

                    <div className="absolute right-6 w-12 h-16 bg-[#854d0e] border-x-2 border-[#451a03] rounded shadow-[0_4px_4px_rgba(0,0,0,0.5)] z-20 flex flex-col justify-between py-1 px-[2px]">
                        <div className="w-full h-[2px] bg-[#fcd34d]/30 mb-auto"></div>
                        <div className="w-full h-[2px] bg-[#fcd34d]/30 mt-auto"></div>
                    </div>
                </div>


                {/* --- BOTTOM SIDE (Visual Player) --- */}
                <div className="relative flex-1 w-full">

                    {/* KING TOWER */}
                    {botKing && (
                        <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-32 h-36 flex flex-col items-center z-20 scale-90">
                            {/* Level Badge */}
                            <div className="absolute -top-4 w-8 h-9 z-30">
                                <div className="w-6 h-7 bg-black border border-[#facc15] flex items-center justify-center shadow-md skew-y-6">
                                    <span className="text-[#facc15] font-black text-xs">14</span>
                                </div>
                            </div>
                            {/* Blue style for Player */}
                            <div className="w-28 h-24 bg-[#1e40af] rounded-t-3xl rounded-b-xl border-4 border-[#172554] shadow-2xl relative flex flex-col items-center justify-end">
                                <div className="absolute -top-4 w-24 h-8 bg-[#3b82f6] rounded-t-full border-t-4 border-[#1e40af] z-10"></div>
                                <div className="relative z-0 -top-6">
                                    <span className="text-4xl filter drop-shadow-lg">🤴🏽</span>
                                </div>
                                <div className="w-16 h-10 bg-[#93c5fd] rounded-t-full border-4 border-[#1e3a8a] mb-1"></div>
                            </div>
                            <div className="mt-1 bg-black/50 px-1 py-0.5 rounded border border-white/20">
                                <div className="w-20 h-2 bg-black/70 rounded-sm relative overflow-hidden">
                                    <div className="absolute h-full bg-[#3b82f6] transition-all" style={{ width: `${getHPPercent(botKing)}%` }}></div>
                                    <div className="absolute top-0 w-full h-[2px] bg-white/30"></div>
                                </div>
                                <span className="text-white text-[8px] font-bold block text-center mt-[1px]">{getTowerHP(botKing)}</span>
                            </div>
                        </div>
                    )}

                    {/* PRINCESS TOWERS */}
                    {/* Visual Left */}
                    {botLeft && (
                        <div className="absolute bottom-10 left-4 w-24 h-28 flex flex-col items-center z-20 scale-90">
                            <div className="absolute -top-3 z-30">
                                <div className="w-5 h-5 bg-black border border-[#facc15] flex items-center justify-center shadow text-[#facc15] font-black text-[9px]">14</div>
                            </div>
                            <div className="w-20 h-20 bg-[#2563eb] rounded-xl border-4 border-[#1e3a8a] shadow-xl relative top-2 flex flex-col items-center">
                                <div className="absolute -top-2 w-16 h-4 bg-[#60a5fa] rounded-full border border-[#1e3a8a]"></div>
                                <div className="absolute -top-6">
                                    <span className="text-2xl">👸🏽</span>
                                </div>
                            </div>
                            <div className="mt-3 bg-black/50 px-1 rounded border border-white/20 relative z-30">
                                <div className="w-16 h-1.5 bg-black/70 rounded-sm mb-[1px] relative overflow-hidden">
                                    <div className="absolute h-full bg-[#3b82f6] transition-all" style={{ width: `${getHPPercent(botLeft)}%` }}></div>
                                </div>
                                <span className="text-white text-[9px] font-bold block leading-tight text-center">{getTowerHP(botLeft)}</span>
                            </div>
                        </div>
                    )}

                    {/* Visual Right */}
                    {botRight && (
                        <div className="absolute bottom-10 right-4 w-24 h-28 flex flex-col items-center z-20 scale-90">
                            <div className="absolute -top-3 z-30">
                                <div className="w-5 h-5 bg-black border border-[#facc15] flex items-center justify-center shadow text-[#facc15] font-black text-[9px]">14</div>
                            </div>
                            <div className="w-20 h-20 bg-[#2563eb] rounded-xl border-4 border-[#1e3a8a] shadow-xl relative top-2 flex flex-col items-center">
                                <div className="absolute -top-2 w-16 h-4 bg-[#60a5fa] rounded-full border border-[#1e3a8a]"></div>
                                <div className="absolute -top-6">
                                    <span className="text-2xl">👸🏽</span>
                                </div>
                            </div>
                            <div className="mt-3 bg-black/50 px-1 rounded border border-white/20 relative z-30">
                                <div className="w-16 h-1.5 bg-black/70 rounded-sm mb-[1px] relative overflow-hidden">
                                    <div className="absolute h-full bg-[#3b82f6] transition-all" style={{ width: `${getHPPercent(botRight)}%` }}></div>
                                </div>
                                <span className="text-white text-[9px] font-bold block leading-tight text-center">{getTowerHP(botRight)}</span>
                            </div>
                        </div>
                    )}

                </div>

            </div>

            {/* --- PLACED UNITS (Global Overlay) --- */}
            {units.map(unit => (
                <UnitRenderer key={unit.id} unit={unit} isMirrored={isMirrored} />
            ))}

            {/* --- PROJECTILES --- */}
            {projectiles && projectiles.map(proj => {
                let visualX = (proj.x / 480) * 100;
                let visualY = (proj.y / 800) * 100 + 8; // Offset match

                // Mirror Logic
                if (isMirrored) {
                    visualX = 100 - visualX;
                    visualY = 100 - (proj.y / 800) * 100;
                }

                // Angle needs mirroring too! 
                // If we flip the board, we are essentially rotating 180deg.
                // So the angle should also be rotated 180deg.
                // Or simply flipped?
                // If a projectile travels Right (0deg), after mirror (Left/Right swap), it should travel Left (180deg).
                // If it travels Up (-90deg), after mirror (Up/Down swap), it should travel Down (90deg).
                // So yes, angle + 180deg (or PI rad).

                const angleRad = proj.angle || 0;
                const offsetDeg = proj.rotationOffset || 0;
                let angleDeg = angleRad * (180 / Math.PI);

                if (isMirrored) {
                    angleDeg += 180;
                }

                const totalRotation = angleDeg + offsetDeg;


                return (
                    <div
                        key={proj.id}
                        className="absolute z-[60] pointer-events-none flex items-center justify-center drop-shadow-md"
                        style={{
                            left: `${visualX}%`,
                            top: `${visualY}%`,
                            transform: `translate(-50%, -50%) rotate(${totalRotation}deg)`,
                            transition: 'top 0.05s linear, left 0.05s linear',
                            width: '32px', // Larger for visibility
                            height: '32px'
                        }}
                    >
                        {proj.visual.startsWith('/') || proj.visual.startsWith('http') ? (
                            <img
                                src={proj.visual}
                                alt="projectile"
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <span className="text-xl">
                                {proj.visual === 'fireball' ? '🔥' : '🏹'}
                            </span>
                        )}
                    </div>
                );
            })}

        </div>
    );
};

export default ArenaLayout;
