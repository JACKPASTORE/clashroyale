import { GameState, Team, Tower, Unit } from './types';
import {
    ARENA_WIDTH, ARENA_HEIGHT,
    KING_TOWER_HP, PRINCESS_TOWER_HP,
    TOWER_RADIUS, ELIXIR_MAX
} from './constants';
import { createInitialDeckState } from './deck';

export const createInitialState = (playerDeckIds: string[]): GameState => {
    // Setup Towers
    const towers: Tower[] = [
        // --- RED TEAM (Top) ---
        // Princess Left
        {
            id: 'red_p_l', team: Team.RED, type: 'princess',
            x: 80, y: 120, hp: PRINCESS_TOWER_HP, maxHp: PRINCESS_TOWER_HP,
            radius: TOWER_RADIUS, dps: 140, rangePx: 250, lastAttackTime: 0
        },
        // Princess Right
        {
            id: 'red_p_r', team: Team.RED, type: 'princess',
            x: ARENA_WIDTH - 80, y: 120, hp: PRINCESS_TOWER_HP, maxHp: PRINCESS_TOWER_HP,
            radius: TOWER_RADIUS, dps: 140, rangePx: 250, lastAttackTime: 0
        },
        // King
        {
            id: 'red_king', team: Team.RED, type: 'king',
            x: ARENA_WIDTH / 2, y: 50, hp: KING_TOWER_HP, maxHp: KING_TOWER_HP,
            radius: TOWER_RADIUS + 10, dps: 180, rangePx: 250, lastAttackTime: 0
        },

        // --- BLUE TEAM (Bottom) ---
        // Princess Left
        {
            id: 'blue_p_l', team: Team.BLUE, type: 'princess',
            x: 80, y: ARENA_HEIGHT - 120, hp: PRINCESS_TOWER_HP, maxHp: PRINCESS_TOWER_HP,
            radius: TOWER_RADIUS, dps: 140, rangePx: 250, lastAttackTime: 0
        },
        // Princess Right
        {
            id: 'blue_p_r', team: Team.BLUE, type: 'princess',
            x: ARENA_WIDTH - 80, y: ARENA_HEIGHT - 120, hp: PRINCESS_TOWER_HP, maxHp: PRINCESS_TOWER_HP,
            radius: TOWER_RADIUS, dps: 140, rangePx: 250, lastAttackTime: 0
        },
        // King
        {
            id: 'blue_king', team: Team.BLUE, type: 'king',
            x: ARENA_WIDTH / 2, y: ARENA_HEIGHT - 50, hp: KING_TOWER_HP, maxHp: KING_TOWER_HP,
            radius: TOWER_RADIUS + 10, dps: 180, rangePx: 250, lastAttackTime: 0
        }
    ];

    return {
        towers,
        units: [],
        elixir: {
            [Team.BLUE]: 5,
            [Team.RED]: 5
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
