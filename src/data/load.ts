import rawData from './albert-royale.raw.json';
import { Card, UnitType, Speed, Range, TargetType } from '../engine/types';

// Helpers to normalize weird French fields
const normalizeType = (t: string): UnitType => {
    const lower = t.toLowerCase();
    if (lower.includes('bâtiment')) return UnitType.BUILDING;
    if (lower.includes('sort')) return UnitType.SPELL;
    return UnitType.TROOP;
};

const normalizeSpeed = (s: string): Speed => {
    const lower = s?.toLowerCase() || '';
    if (lower.includes('très_rapide')) return Speed.VERY_FAST;
    if (lower.includes('rapide')) return Speed.FAST;
    if (lower.includes('moyenne')) return Speed.MEDIUM;
    if (lower.includes('lent')) return Speed.SLOW;
    if (lower.includes('aucune')) return Speed.NONE;
    return Speed.MEDIUM; // Default
};

const normalizeRange = (r: string, id?: string): Range => {
    if (id === 'alex_goblin_barrel') return Range.GLOBAL; // Explicit global range for Alex

    const lower = r?.toLowerCase() || '';
    if (lower.includes('mêlée') || lower.includes('melee')) return Range.MELEE;
    if (lower.includes('courte')) return Range.SHORT;
    if (lower.includes('très_longue')) return Range.VERY_LONG;
    if (lower.includes('longue')) return Range.LONG;
    if (lower.includes('moyenne')) return Range.MEDIUM;
    if (lower.includes('mixte')) return Range.MEDIUM; // Treat mixed as ranged for MVP (Enzo throwing)
    if (lower.includes('global')) return Range.GLOBAL;
    if (lower.includes('aucune')) return Range.NONE;
    return Range.MELEE; // Default
};

const normalizeTargets = (targets: string[]): TargetType[] => {
    if (!targets || targets.length === 0) return [TargetType.NONE];

    const res: TargetType[] = [];
    if (targets.includes('bâtiments')) return [TargetType.BUILDINGS_ONLY];

    if (targets.includes('sol')) res.push(TargetType.GROUND);
    if (targets.includes('air')) res.push(TargetType.AIR);

    return res.length ? res : [TargetType.NONE];
};

const getVisuals = (id: string, type: UnitType) => {
    // Default fallback
    const defaults = {
        icon: '/assets/cards/placeholder.png',
        model: '/assets/units/placeholder.png',
        color: '#aaaaaa',
        projectile: undefined as string | undefined, // Fixed duplicate
        rotationOffset: 0, // Default rotation offset
        spawnSound: '/assets/sfx/deploy.mp3' // Default spawn sound
    };

    // Specific mapping for Albert School characters
    // The user should place images named like 'david_icon.png' / 'david_model.png' in public/assets/

    const overrides: Record<string, any> = {
        'david_archer_stylet': {
            color: '#3b82f6',
            icon: '/assets/cards/david_icon.png',
            model: '/assets/cards/david_icon.png',
            projectile: '/assets/projectile/Fleche Arc Illustration 3D.avif',
            rotationOffset: 45,
            spawnSound: '/assets/sfx/david_spawn.mp3'
        },
        'jack_cavalier': {
            color: '#f59e0b',
            // jack icon not found in list, using placeholder or maybe missing? 
            // User list didn't have jack_icon.png. Leaving default behavior (fallback to baseName check below or default)
            // Actually, if we want to be safe, we can leave generic properties and let the dynamic check below handle if file exists, 
            // but the dynamic check below constructs path. 
            // Let's explicitly set what we know exists.
            spawnSound: '/assets/sfx/jack_spawn.mp3'
        },
        'sarah_princess': {
            color: '#ec4899',
            icon: '/assets/cards/sarah_icon.png',
            model: '/assets/cards/sarah_icon.png',
            projectile: 'arrow',
            rotationOffset: -90,
            spawnSound: '/assets/sfx/sarah_spawn.mp3'
        },
        'diego_knight': {
            color: '#3b82f6',
            icon: '/assets/cards/diego_icon.png',
            model: '/assets/cards/diego_icon.png',
            spawnSound: '/assets/sfx/diego_spawn.mp3'
        },
        'timsit_elixir_dragon': {
            color: '#a855f7',
            // timsit not in list
            baseName: 'timsit',
            spawnSound: '/assets/sfx/timsit_spawn.mp3'
        },
        'jausseaud_money_bowler': {
            color: '#10b981',
            icon: '/assets/cards/jausseaud_icon.png',
            model: '/assets/cards/jausseaud_icon.png',
            spawnSound: '/assets/sfx/jausseaud_spawn.mp3'
        },
        'alexis_grandpa_wizard': {
            color: '#ef4444',
            icon: '/assets/cards/alexis_icon.png',
            model: '/assets/cards/alexis_icon.png',
            spawnSound: '/assets/sfx/alexis_spawn.mp3'
        },
        'raph_chinese_giant': {
            color: '#f97316',
            icon: '/assets/cards/raph_icon.png',
            model: '/assets/cards/raph_icon.png',
            spawnSound: '/assets/sfx/raph_spawn.mp3'
        },
        'gabriel_math_dart_goblin': {
            color: '#22c55e',
            icon: '/assets/cards/gabriel_icon.png',
            model: '/assets/cards/gabriel_icon.png',
            spawnSound: '/assets/sfx/gabriel_spawn.mp3'
        },
        'nael_biker_sapper': {
            color: '#facc15',
            icon: '/assets/cards/nael_icon.png',
            model: '/assets/cards/nael_icon.png',
            spawnSound: '/assets/sfx/nael_spawn.mp3'
        },
        'sacha_control_agent': {
            color: '#6366f1',
            icon: '/assets/cards/sacha_icon.png',
            model: '/assets/cards/sacha_icon.png',
            spawnSound: '/assets/sfx/sacha_spawn.mp3'
        },
        'mathieu_joker': {
            color: '#8b5cf6',
            // mathieu not in list
            baseName: 'mathieu',
            spawnSound: '/assets/sfx/mathieu_spawn.mp3'
        },
        'tao_charging_prince': {
            color: '#f59e0b',
            icon: '/assets/cards/tao_icon.png',
            model: '/assets/cards/tao_icon.png',
            spawnSound: '/assets/sfx/tao_spawn.mp3'
        },
        'isaac_casino_tower': {
            color: '#f43f5e',
            icon: '/assets/cards/isaac_icon.png',
            model: '/assets/cards/isaac_icon.png',
            spawnSound: '/assets/sfx/isaac_spawn.mp3'
        },
        'arbre_habonneau': {
            color: '#166534',
            icon: '/assets/cards/habonneau_icon.png',
            model: '/assets/cards/habonneau_icon.png',
            spawnSound: '/assets/sfx/habonneau_spawn.mp3'
        },
        'baptiste_tesla': {
            color: '#0ea5e9',
            icon: '/assets/cards/baptiste_icon.png',
            model: '/assets/cards/baptiste_icon.png',
            spawnSound: '/assets/sfx/baptiste_spawn.mp3'
        },
        'mathis_enzo_tricksters': {
            color: '#3b82f6',
            icon: '/assets/cards/mathis_enzo_icon.png',
            model: '/assets/cards/mathis_enzo_icon.png',
            projectile: '/assets/projectile/Bruschetta.jpeg',
            rotationOffset: 0,
            spawnSound: '/assets/sfx/mathis_enzo_spawn.mp3'
        },
        'alex_goblin_barrel': {
            color: '#10b981',
            icon: '/assets/cards/alex_icon.png',
            model: '/assets/cards/alex_icon.png',
            spawnSound: '/assets/sfx/alex_spawn.mp3'
        },
        'theo_miner_freeze': {
            color: '#3b82f6',
            icon: '/assets/cards/theo_icon.png',
            model: '/assets/cards/theo_icon.png',
            spawnSound: '/assets/sfx/theo_spawn.mp3'
        }
    };

    const override = overrides[id];
    if (override) {
        return {
            icon: override.icon || `/assets/cards/${override.baseName}_icon.png`,
            model: override.model || `/assets/units/${override.baseName}_model.png`,
            color: override.color,
            projectile: override.projectile,
            rotationOffset: override.rotationOffset,
            spawnSound: override.spawnSound || defaults.spawnSound
        };
    }

    // Generic fallbacks by type if no specific ID match
    if (type === UnitType.SPELL) return { ...defaults, color: '#a855f7' };
    if (type === UnitType.BUILDING) return { ...defaults, color: '#f59e0b' };
    return { ...defaults, color: '#3b82f6' };
};

export const loadCards = (): Card[] => {
    return rawData.cartes.map((raw: any) => {
        // Robustly handle varying field names (plage vs portée vs gamme, surnom vs nickname)
        const rawRange = raw.plage || raw.portée || raw.gamme || 'moyenne';
        const rawNickname = raw.nickname || raw.surnom || '';

        const visuals = getVisuals(raw.id, normalizeType(raw.type));

        return {
            id: raw.id,
            name: raw.nom,
            nickname: rawNickname,
            elixirCost: raw.élixir,
            type: normalizeType(raw.type),
            hp: raw.pv,
            dps: raw.atk_dps,
            speed: normalizeSpeed(raw.vitesse),
            range: normalizeRange(rawRange, raw.id),
            targets: normalizeTargets(raw.cibles),
            abilities: raw.capacités || [],
            visuals: {
                ...visuals,
                // Auto-assign projectile for ranged units IF not already manually overridden
                projectile: visuals.projectile
                    ? visuals.projectile
                    : (normalizeRange(rawRange) !== Range.MELEE ? 'arrow' : undefined),
                projectileSpeed: 500,
                rotationOffset: visuals.rotationOffset,
                spawnSound: visuals.spawnSound
            }
        };
    });
};

export const getAllCards = (): Card[] => {
    return loadCards();
};

export const getCardById = (id: string): Card | undefined => {
    return getAllCards().find(c => c.id === id);
};
