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

const normalizeRange = (r: string): Range => {
    const lower = r?.toLowerCase() || '';
    if (lower.includes('mêlée') || lower.includes('melee')) return Range.MELEE;
    if (lower.includes('courte')) return Range.SHORT;
    if (lower.includes('très_longue')) return Range.VERY_LONG;
    if (lower.includes('longue')) return Range.LONG;
    if (lower.includes('moyenne')) return Range.MEDIUM;
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

export const loadCards = (): Card[] => {
    return rawData.cartes.map((raw: any) => {
        // Robustly handle varying field names (plage vs portée vs gamme, surnom vs nickname)
        const rawRange = raw.plage || raw.portée || raw.gamme || 'moyenne';
        const rawNickname = raw.nickname || raw.surnom || '';

        return {
            id: raw.id,
            name: raw.nom,
            nickname: rawNickname,
            elixirCost: raw.élixir,
            type: normalizeType(raw.type),
            hp: raw.pv,
            dps: raw.atk_dps,
            speed: normalizeSpeed(raw.vitesse),
            range: normalizeRange(rawRange),
            targets: normalizeTargets(raw.cibles),
            abilities: raw.capacités || []
        };
    });
};

export const getAllCards = (): Card[] => {
    return loadCards();
};

export const getCardById = (id: string): Card | undefined => {
    return getAllCards().find(c => c.id === id);
};
