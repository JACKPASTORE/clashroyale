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
        projectile: undefined as string | undefined,
        rotationOffset: 0 // Default rotation offset
    };

    // Specific mapping for Albert School characters
    // The user should place images named like 'david_icon.png' / 'david_model.png' in public/assets/

    const overrides: Record<string, any> = {
        'david_archer_stylet': {
            color: '#3b82f6',
            baseName: 'david',
            projectile: '/assets/projectile/Fleche Arc Illustration 3D.avif',
            rotationOffset: 45 // Adjust if image is diagonal
        },
        'jack_cavalier': { color: '#f59e0b', baseName: 'jack' },
        'sarah_princess': {
            color: '#ec4899',
            baseName: 'sarah',
            projectile: 'arrow',
            rotationOffset: -90 // Standard arrow usually points Up
        },
        'diego_knight': { color: '#3b82f6', baseName: 'diego' },
        'timsit_elixir_dragon': { color: '#a855f7', baseName: 'timsit' },
        'jausseaud_money_bowler': { color: '#10b981', baseName: 'jausseaud' },
        'alexis_grandpa_wizard': { color: '#ef4444', baseName: 'alexis' },
        'raph_chinese_giant': { color: '#f97316', baseName: 'raph' },
        'gabriel_math_dart_goblin': { color: '#22c55e', baseName: 'gabriel' },
        'nael_biker_sapper': { color: '#facc15', baseName: 'nael' },
        'sacha_control_agent': { color: '#6366f1', baseName: 'sacha' },
        'mathieu_joker': { color: '#8b5cf6', baseName: 'mathieu' },
        'tao_charging_prince': { color: '#f59e0b', baseName: 'tao' },
        'isaac_casino_tower': { color: '#f43f5e', baseName: 'isaac' }, // Building
        'arbre_habonneau': { color: '#166534', baseName: 'habonneau' }, // Building
        'baptiste_tesla': { color: '#0ea5e9', baseName: 'baptiste' }, // Building
        'mathis_enzo_tricksters': {
            color: '#3b82f6',
            baseName: 'mathis_enzo',
            projectile: '/assets/projectile/Bruschetta.jpeg',
            rotationOffset: 0 // Bruschetta might spin or be round
        },
        'alex_goblin_barrel': { color: '#10b981', baseName: 'alex' } // Spell
    };

    const override = overrides[id];
    if (override) {
        return {
            icon: `/assets/cards/${override.baseName}_icon.png`,
            model: `/assets/units/${override.baseName}_model.png`,
            color: override.color,
            projectile: override.projectile,
            rotationOffset: override.rotationOffset
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
                rotationOffset: visuals.rotationOffset
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
