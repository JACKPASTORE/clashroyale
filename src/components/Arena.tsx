import React from 'react';
import { GameState, Team, UnitType } from '../engine/types';
import { ARENA_WIDTH, ARENA_HEIGHT, BRIDGE_Y, TOWER_RADIUS, UNIT_RADIUS } from '../engine/constants';
import { getCardById } from '../data/load';

interface ArenaProps {
    state: GameState;
    onTap: (x: number, y: number) => void;
}

const Arena: React.FC<ArenaProps> = ({ state, onTap }) => {
    return (
        <div
            className="relative w-full h-full bg-[#3d7c45] overflow-hidden select-none"
            onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect(); // Get pixel size onscreen
                // Map click coord to logical scale (assuming constant logic width 480)
                const scale = ARENA_WIDTH / rect.width;
                const x = (e.clientX - rect.left) * scale;
                const y = (e.clientY - rect.top) * scale;
                onTap(x, y);
            }}
        >
            {/* --- GRID / BACKGROUND --- */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />

            {/* RIVER */}
            <div className="absolute left-0 right-0 h-10 bg-blue-500/80 flex items-center justify-center"
                style={{ top: BRIDGE_Y - 20 }}
            >
                <span className="text-white/30 text-xs font-bold tracking-widest">RIVER</span>
            </div>

            {/* TOWERS */}
            {state.towers.map(tower => (
                <div
                    key={tower.id}
                    className={`absolute flex flex-col items-center justify-center border-4 shadow-xl transition-all duration-200
                ${tower.team === Team.BLUE ? 'border-blue-800 bg-blue-600' : 'border-red-800 bg-red-600'}
                ${tower.type === 'king' ? 'rounded-xl' : 'rounded-full'}
            `}
                    style={{
                        width: tower.radius * 2,
                        height: tower.radius * 2,
                        left: tower.x - tower.radius,
                        top: tower.y - tower.radius,
                    }}
                >
                    <span className="text-white font-bold text-xs">{Math.ceil(tower.hp)}</span>
                </div>
            ))}

            {/* UNITS */}
            {state.units.map(unit => {
                const card = getCardById(unit.cardId);
                return (
                    <div
                        key={unit.id}
                        className={`absolute rounded-full flex items-center justify-center border-2 shadow-md transition-transform
                    ${unit.team === Team.BLUE ? 'bg-blue-400 border-blue-900' : 'bg-red-400 border-red-900'}
                `}
                        style={{
                            width: UNIT_RADIUS * 2,
                            height: UNIT_RADIUS * 2,
                            left: unit.x - UNIT_RADIUS,
                            top: unit.y - UNIT_RADIUS,
                            // Basic orientation visuals could go here
                        }}
                    >
                        {/* Mini HP Bar above unit */}
                        <div className="absolute -top-3 w-8 h-1 bg-black/50">
                            <div
                                className={`h-full ${unit.team === Team.BLUE ? 'bg-green-400' : 'bg-red-500'}`}
                                style={{ width: `${(unit.hp / unit.maxHp) * 100}%` }}
                            />
                        </div>

                        {/* Unit Icon/Text */}
                        <span className="text-[10px] leading-none text-white font-bold overflow-hidden w-full text-center">
                            {card?.name.substring(0, 2)}
                        </span>
                    </div>
                );
            })}

        </div>
    );
};

export default Arena;
