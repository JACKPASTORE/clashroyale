export enum UnitType {
    TROOP = 'troop',
    BUILDING = 'building',
    SPELL = 'spell',
}

export enum TargetType {
    GROUND = 'ground',
    AIR = 'air',
    BUILDINGS_ONLY = 'buildings_only',
    NONE = 'none'
}

export enum Speed {
    VERY_SLOW = 'very_slow',
    SLOW = 'slow',
    MEDIUM = 'medium',
    FAST = 'fast',
    VERY_FAST = 'very_fast',
    NONE = 'none'
}

export enum Range {
    MELEE = 'melee',
    SHORT = 'short',
    MEDIUM = 'medium',
    LONG = 'long',
    VERY_LONG = 'very_long',
    GLOBAL = 'global',
    NONE = 'none' // For spells or buildings that don't attack
}

// === ABILITIES SYSTEM ===

export enum StatusType {
    SLOW = 'slow',
    STUN = 'stun',
    FREEZE = 'freeze',
    RAGE = 'rage',
    BOOST = 'boost',
    KNOCKBACK = 'knockback'
}

export interface StatusEffect {
    type: StatusType;
    value: number; // multiplier (0.5 = 50% slow, 1.5 = 50% boost) or magnitude
    expiresAt: number; // game time in seconds
    source?: string; // entity id that applied it
}

export enum AbilityEventType {
    ON_SPAWN = 'onSpawn',
    ON_ATTACK_HIT = 'onAttackHit',
    ON_TICK = 'onTick',
    ON_DEATH = 'onDeath',
    ON_COLLISION = 'onCollision'
}

export interface AbilityContext {
    state: GameState;
    sourceEntityId: string;
    targetEntityId?: string;
    eventType: AbilityEventType;
    params?: any;
    dt?: number;
    rng: () => number; // deterministic RNG function
}

// === CORE TYPES ===

export interface Card {
    id: string;
    name: string;
    nickname: string;
    elixirCost: number;
    type: UnitType;
    hp: number;
    dps: number;
    speed: Speed;
    range: Range;
    targets: TargetType[];
    // Raw abilities kept for potential future use or UI display
    abilities?: any[];
    visuals: {
        icon: string;
        model: string;
        color: string;
        projectile?: string; // e.g., 'arrow', 'fireball'
        projectileSpeed?: number;
        rotationOffset?: number; // Degrees to adjust image
        spawnSound?: string;
    };
}

export enum Team {
    BLUE = 'blue', // Player
    RED = 'red',   // Enemy
}

export interface Entity {
    id: string;
    team: Team;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    radius: number; // For collision
}

export interface Unit extends Entity {
    cardId: string; // Ref to Card stats
    dps: number;
    speedPxPerSec: number;
    rangePx: number;
    targetType: TargetType[];
    lastAttackTime: number; // timestamp
    state: 'idle' | 'moving' | 'attacking';
    targetId?: string; // ID of current target entity
    lane: 'left' | 'right'; // Lane assignment for waypoint navigation

    // ABILITIES SYSTEM
    statuses: StatusEffect[];
    abilityData?: any; // card-specific runtime data (hit counters, charge distance, etc.)
    spawnedUnits?: string[]; // IDs of units spawned by this unit (minibots, goblins, etc.)
}

export interface Tower extends Entity {
    type: 'king' | 'princess';
    dps: number;
    rangePx: number;
    lastAttackTime: number;
    targetId?: string;
}

export interface Projectile {
    id: string;
    ownerId: string; // Unit who fired it
    team: Team;
    targetId: string; // Homing projectile
    x: number;
    y: number;
    speed: number;
    damage: number;
    visual: string; // 'arrow', 'fireball', 'rock', 'axe'
    startX: number;
    startY: number;
    progress: number; // 0 to 1
    targetType: TargetType[];
    aoeRadius?: number; // For splash damage
    angle?: number; // Current rotation in radians
    rotationOffset?: number; // Visual correction in degrees
}

export interface GameState {
    towers: Tower[];
    units: Unit[];
    projectiles: Projectile[]; // New projectile array
    elixir: {
        [Team.BLUE]: number;
        [Team.RED]: number;
    };
    deck: {
        [Team.BLUE]: {
            hand: string[];
            drawPile: string[];
            discardPile: string[];
            nextCard: string | null;
        };
        [Team.RED]: {
            hand: string[];
            drawPile: string[];
            discardPile: string[];
            nextCard: string | null;
        };
    };
    status: 'playing' | 'game_over';
    winner?: Team;
    time: number;

    // BOT SYSTEM
    bot: {
        enabled: boolean;
        lastThinkTime: number;
        nextThinkDelay: number;
    };

    // ABILITIES SYSTEM
    rngSeed: number;
    rngState: number;
}


