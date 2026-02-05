import { Unit, StatusEffect, StatusType } from './types';

/**
 * Apply a status effect to a unit
 * If same type exists, keep the stronger/longer one
 */
export const applyStatus = (unit: Unit, status: StatusEffect, gameTime: number): void => {
    const existing = unit.statuses.find(s => s.type === status.type);

    if (existing) {
        // Refresh if new one is stronger or lasts longer
        if (status.value >= existing.value || status.expiresAt > existing.expiresAt) {
            existing.value = status.value;
            existing.expiresAt = status.expiresAt;
            existing.source = status.source;
        }
    } else {
        unit.statuses.push(status);
    }
};

/**
 * Remove expired statuses from a unit
 */
export const updateStatuses = (unit: Unit, gameTime: number): void => {
    unit.statuses = unit.statuses.filter(s => s.expiresAt > gameTime);
};

/**
 * Get the effective multiplier for a specific status type
 * Returns 1.0 if no such status is active
 */
export const getStatusMultiplier = (unit: Unit, type: StatusType): number => {
    const status = unit.statuses.find(s => s.type === type);
    return status ? status.value : 1.0;
};

/**
 * Check if unit is stunned/frozen (unable to move or attack)
 */
export const isStunned = (unit: Unit): boolean => {
    return unit.statuses.some(s => s.type === StatusType.STUN || s.type === StatusType.FREEZE);
};

/**
 * Calculate effective movement speed considering all status effects
 */
export const getEffectiveSpeed = (unit: Unit): number => {
    const slowMult = getStatusMultiplier(unit, StatusType.SLOW);
    const boostMult = getStatusMultiplier(unit, StatusType.BOOST);
    return unit.speedPxPerSec * slowMult * boostMult;
};

/**
 * Calculate effective attack cooldown considering rage
 */
export const getEffectiveCooldown = (hitCooldown: number, unit: Unit): number => {
    const rageMult = getStatusMultiplier(unit, StatusType.RAGE);
    return hitCooldown * rageMult;
};
