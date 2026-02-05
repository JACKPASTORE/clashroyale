import React from 'react';
import { Crown, Shield } from 'lucide-react';
import { Team } from '../../engine/types';


const ArenaLayout = ({ towers = [], units = [] }) => {
    // Find specific towers
    const redKing = towers.find(t => t.team === Team.RED && t.type === 'king');
    const redLeft = towers.find(t => t.team === Team.RED && t.type === 'princess' && t.x < 240);
    const redRight = towers.find(t => t.team === Team.RED && t.type === 'princess' && t.x >= 240);
    const blueKing = towers.find(t => t.team === Team.BLUE && t.type === 'king');
    const blueLeft = towers.find(t => t.team === Team.BLUE && t.type === 'princess' && t.x < 240);
    const blueRight = towers.find(t => t.team === Team.BLUE && t.type === 'princess' && t.x >= 240);

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

                {/* --- ENEMY SIDE (Top) --- */}
                <div className="relative flex-1 w-full">

                    {/* ENEMY KING TOWER (Pushed further back) */}
                    {redKing && (
                        <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-32 h-36 flex flex-col items-center z-20 scale-90">
                            {/* Level Badge */}
                            <div className="absolute -top-4 w-8 h-9 bg-[url('/assets/level_badge.png')] bg-contain bg-no-repeat flex items-center justify-center z-30">
                                <div className="w-6 h-7 bg-[#facc15] border-2 border-black rotate-45 flex items-center justify-center shadow-md">
                                    <span className="text-black font-black text-xs -rotate-45">15</span>
                                </div>
                            </div>

                            {/* Tower Structure */}
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
                                <span className="text-white text-[8px] font-bold block text-center mb-[1px]">{getTowerHP(redKing)}</span>
                                <div className="w-20 h-2 bg-black/70 rounded-sm relative overflow-hidden">
                                    <div className="absolute h-full bg-[#dc2626] transition-all" style={{ width: `${getHPPercent(redKing)}%` }}></div>
                                    <div className="absolute top-0 w-full h-[2px] bg-white/30"></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ENEMY PRINCESS TOWERS (More spread out) */}
                    {/* Left */}
                    {redLeft && (
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
                                <span className="text-white text-[9px] font-bold block leading-tight text-center mb-[1px]">{getTowerHP(redLeft)}</span>
                                <div className="w-16 h-1.5 bg-black/70 rounded-sm relative overflow-hidden">
                                    <div className="absolute h-full bg-[#dc2626] transition-all" style={{ width: `${getHPPercent(redLeft)}%` }}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Right */}
                    {redRight && (
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
                                <span className="text-white text-[9px] font-bold block leading-tight text-center mb-[1px]">{getTowerHP(redRight)}</span>
                                <div className="w-16 h-1.5 bg-black/70 rounded-sm relative overflow-hidden">
                                    <div className="absolute h-full bg-[#dc2626] transition-all" style={{ width: `${getHPPercent(redRight)}%` }}></div>
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


                {/* --- PLAYER SIDE (Bottom) --- */}
                <div className="relative flex-1 w-full">

                    {/* PLAYER KING TOWER (Pushed further down) */}
                    {blueKing && (
                        <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-32 h-36 flex flex-col items-center z-20 scale-90">
                            <div className="absolute -top-4 w-8 h-9 z-30">
                                <div className="w-6 h-7 bg-black border border-[#facc15] flex items-center justify-center shadow-md skew-y-6">
                                    <span className="text-[#facc15] font-black text-xs">14</span>
                                </div>
                            </div>

                            <div className="w-28 h-24 bg-[#1e40af] rounded-t-3xl rounded-b-xl border-4 border-[#172554] shadow-2xl relative flex flex-col items-center justify-end">
                                <div className="absolute -top-4 w-24 h-8 bg-[#3b82f6] rounded-t-full border-t-4 border-[#1e40af] z-10"></div>
                                <div className="relative z-0 -top-6">
                                    <span className="text-4xl filter drop-shadow-lg">🤴🏽</span>
                                </div>
                                <div className="w-16 h-10 bg-[#93c5fd] rounded-t-full border-4 border-[#1e3a8a] mb-1"></div>
                            </div>
                            <div className="mt-1 bg-black/50 px-1 py-0.5 rounded border border-white/20">
                                <div className="w-20 h-2 bg-black/70 rounded-sm relative overflow-hidden">
                                    <div className="absolute h-full bg-[#3b82f6] transition-all" style={{ width: `${getHPPercent(blueKing)}%` }}></div>
                                    <div className="absolute top-0 w-full h-[2px] bg-white/30"></div>
                                </div>
                                <span className="text-white text-[8px] font-bold block text-center mt-[1px]">{getTowerHP(blueKing)}</span>
                            </div>
                        </div>
                    )}

                    {/* PLAYER PRINCESS TOWERS */}
                    {/* Left */}
                    {blueLeft && (
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
                                    <div className="absolute h-full bg-[#3b82f6] transition-all" style={{ width: `${getHPPercent(blueLeft)}%` }}></div>
                                </div>
                                <span className="text-white text-[9px] font-bold block leading-tight text-center">{getTowerHP(blueLeft)}</span>
                            </div>
                        </div>
                    )}

                    {/* Right */}
                    {blueRight && (
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
                                    <div className="absolute h-full bg-[#3b82f6] transition-all" style={{ width: `${getHPPercent(blueRight)}%` }}></div>
                                </div>
                                <span className="text-white text-[9px] font-bold block leading-tight text-center">{getTowerHP(blueRight)}</span>
                            </div>
                        </div>
                    )}

                </div>

            </div>

            {/* --- PLACED UNITS (Global Overlay) --- */}
            {units.map(unit => {
                // Map logical coords (480x800) to visual coords
                const visualX = (unit.x / 480) * 100; // percentage
                const visualY = (unit.y / 800) * 100 + 8; // percentage, offset for top padding

                const hpPercent = (unit.hp / unit.maxHp) * 100;
                const barColor = hpPercent > 60 ? '#22c55e' : hpPercent > 30 ? '#eab308' : '#ef4444';

                return (
                    <div
                        key={unit.id}
                        className="absolute z-50"
                        style={{
                            left: `${visualX}%`,
                            top: `${visualY}%`,
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                        {/* HP Bar */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-black/50 rounded-full overflow-hidden">
                            <div
                                className="h-full transition-all duration-300"
                                style={{
                                    width: `${hpPercent}%`,
                                    backgroundColor: barColor
                                }}
                            />
                        </div>

                        {/* Unit Circle */}
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold
                            ${unit.team === Team.BLUE ? 'bg-blue-400 border-blue-900 text-white' : 'bg-red-400 border-red-900 text-white'}`}
                        >
                            🔥
                        </div>
                    </div>
                );
            })}

        </div>
    );
};

export default ArenaLayout;
