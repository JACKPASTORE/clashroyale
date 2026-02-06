import { Unit, StatusEffect, StatusType } from '../types';

export const updateStatuses = (unit: Unit, currentTime: number) => {
    // Remove expired statuses
    unit.statuses = unit.statuses.filter(s => s.expiresAt > currentTime);
};

export const applyStatus = (unit: Unit, effect: StatusEffect) => {
    // Check if status of same type exists
    const existing = unit.statuses.find(s => s.type === effect.type);

    if (existing) {
        // Refresh duration if new one is longer or same? 
        // Logic: Keep strongest value, refresh time if new one expires later

        // Exceptions for stacking? Default: no stacking of magnitude.

        if (effect.value > existing.value) {
            existing.value = effect.value;
        }

        if (effect.expiresAt > existing.expiresAt) {
            existing.expiresAt = effect.expiresAt;
        }
    } else {
        unit.statuses.push(effect);
    }
};

export const isStunned = (unit: Unit): boolean => {
    return unit.statuses.some(s => s.type === StatusType.STUN || s.type === StatusType.FREEZE);
};

export const getEffectiveSpeed = (unit: Unit): number => {
    if (isStunned(unit)) return 0;

    const baseSpeed = unit.speedPxPerSec;
    let multiplier = 1.0;

    unit.statuses.forEach(s => {
        if (s.type === StatusType.SLOW) {
            // value is e.g. 0.2 (20% slow) -> speed * 0.8
            // wait, Status definition: value is number. 
            // In request: "Slow: multiplie vitesse par (1 - slowPercent/100)"
            // So if value store 20 (percent), we do 1 - 0.2.
            // Let's assume passed value is raw 0.2 for efficiency.
            // Or better, let's store 0.8 directly? 
            // Request: "slowPercent=20". Let's store 0.2
            multiplier *= (1 - s.value);
        }
        if (s.type === StatusType.BOOST) {
            // value e.g. 0.2 (+20%)
            multiplier *= (1 + s.value);
        }
    });

    return Math.max(0, baseSpeed * multiplier);
};

export const getEffectiveAttackSpeed = (unit: Unit, baseCooldown: number): number => {
    let multiplier = 1.0;

    // Rage: cooldown * 0.7
    if (unit.statuses.some(s => s.type === StatusType.RAGE)) {
        multiplier *= 0.7;
    }

    return baseCooldown * multiplier;
};
