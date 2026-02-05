import { Speed, Range } from './types';

// Dimensions (Logic coordinates, can be scaled for display)
export const ARENA_WIDTH = 480;
export const ARENA_HEIGHT = 800; // Standard mobile ratio
export const TOWER_RADIUS = 30;
export const UNIT_RADIUS = 15;

export const BRIDGE_Y = ARENA_HEIGHT / 2;
export const BRIDGE_LEFT_X = 80;
export const BRIDGE_RIGHT_X = ARENA_WIDTH - 80;

export const ELIXIR_MAX = 10;
export const ELIXIR_REGEN_RATE = 0.4; // Slower regen: 1 elixir per 2.5s

export const HIT_COOLDOWN = 1.0; // 1 attack per second for MVP simplicity

// Speed Mappings (px per sec)
export const SPEED_MAP: Record<string, number> = {
    [Speed.VERY_SLOW]: 20,
    [Speed.SLOW]: 30,
    [Speed.MEDIUM]: 50,
    [Speed.FAST]: 75,
    [Speed.VERY_FAST]: 100,
    [Speed.NONE]: 0,
};

// Range Mappings (px)
export const RANGE_MAP: Record<string, number> = {
    [Range.MELEE]: 40,      // Close combat
    [Range.SHORT]: 100,
    [Range.MEDIUM]: 180,    // Standard ranged
    [Range.LONG]: 250,      // Sniper
    [Range.VERY_LONG]: 350, // Princess/Siege
    [Range.GLOBAL]: 9999,   // Spells
    [Range.NONE]: 0,
};

export const KING_TOWER_HP = 4500;
export const PRINCESS_TOWER_HP = 2600;

// === ABILITIES SYSTEM ===

// Hitbox radii
export const HIT_RADIUS_TROOP = 10;
export const HIT_RADIUS_BUILDING = 14;
export const HIT_RADIUS_SMALL = 7; // goblins, minions
export const HIT_RADIUS_KING = 22;
export const HIT_RADIUS_PRINCESS = 18;

// Splash/AoE radii
export const SPLASH_RADIUS_SMALL = 14;
export const SPLASH_RADIUS_MEDIUM = 18;
export const SPLASH_RADIUS_LARGE = 24;

// Aura radii
export const AURA_RADIUS_SMALL = 22;
export const AURA_RADIUS_MEDIUM = 24;
export const AURA_RADIUS_LARGE = 32;

