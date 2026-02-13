import { GameState, Team, Tower, Unit } from './types';
import {
    ARENA_WIDTH, ARENA_HEIGHT,
    KING_TOWER_HP, PRINCESS_TOWER_HP,
    TOWER_RADIUS, ELIXIR_MAX
} from './constants';
import { createInitialDeckState } from './deck';

export const createInitialState = (playerDeckIds: string[]): GameState => {
    // Setup Towers
    return {
        towers: [
            // BLUE TEAM (Player) - Bottom
            { id: 'blue_king', team: Team.BLUE, type: 'king', x: 240, y: 750, hp: 4000, maxHp: 4000, radius: 25, dps: 120, rangePx: 180, lastAttackTime: 0 },
            { id: 'blue_left', team: Team.BLUE, type: 'princess', x: 80, y: 650, hp: 2500, maxHp: 2500, radius: 20, dps: 100, rangePx: 160, lastAttackTime: 0 },
            { id: 'blue_right', team: Team.BLUE, type: 'princess', x: 400, y: 650, hp: 2500, maxHp: 2500, radius: 20, dps: 100, rangePx: 160, lastAttackTime: 0 },

            // RED TEAM (Enemy) - Top
            { id: 'red_king', team: Team.RED, type: 'king', x: 240, y: 50, hp: 4000, maxHp: 4000, radius: 25, dps: 120, rangePx: 180, lastAttackTime: 0 },
            { id: 'red_left', team: Team.RED, type: 'princess', x: 80, y: 150, hp: 2500, maxHp: 2500, radius: 20, dps: 100, rangePx: 160, lastAttackTime: 0 },
            { id: 'red_right', team: Team.RED, type: 'princess', x: 400, y: 150, hp: 2500, maxHp: 2500, radius: 20, dps: 100, rangePx: 160, lastAttackTime: 0 },
        ],
        units: [],
        projectiles: [], // Start with empty projectiles
        elixir: {
            [Team.BLUE]: 5,
            [Team.RED]: 5,
        },
        deck: createInitialDeckState(playerDeckIds),
        status: 'playing',
        time: 0,
        // Bot System
        bot: {
            enabled: true,
            lastThinkTime: 0,
            nextThinkDelay: 0.7 + Math.random() * 0.6 // Initial delay 0.7-1.3s
        },
        // Abilities System
        rngSeed: Date.now(),
        rngState: Date.now()
    };
};
