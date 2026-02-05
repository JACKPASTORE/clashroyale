import { AbilityContext, AbilityEventType, GameState, StatusType, StatusEffect } from '../../types';
import { AURA_RADIUS_SMALL } from '../../constants';

/**
 * Habonneau - blocking_slow (Building)
 * Slows enemies in an aura around the building
 */
export const blocking_slow = (ctx: AbilityContext): GameState => {
    if (ctx.eventType !== AbilityEventType.ON_TICK) return ctx.state;

    const state = { ...ctx.state };
    const habonneau = state.units.find(u => u.id === ctx.sourceEntityId);
    if (!habonneau) return state;

    const slowPercent = ctx.params?.slow_percent || 25;
    const auraRadius = ctx.params?.radius || AURA_RADIUS_SMALL;
    const duration = 0.5; // Short duration, constantly refreshed

    // Find enemies in aura
    state.units.forEach(unit => {
        if (unit.team === habonneau.team) return;

        const dist = Math.sqrt(Math.pow(unit.x - habonneau.x, 2) + Math.pow(unit.y - habonneau.y, 2));
        if (dist <= auraRadius) {
            const slow: StatusEffect = {
                type: StatusType.SLOW,
                value: 1.0 - (slowPercent / 100), // 0.75 = 25% slow
                expiresAt: state.time + duration
            };

            if (!unit.statuses) unit.statuses = [];
            // Apply slow (will be refreshed by applyStatus logic in status.ts)
            const existing = unit.statuses.find(s => s.type === StatusType.SLOW);
            if (existing) {
                existing.expiresAt = state.time + duration;
            } else {
                unit.statuses.push(slow);
            }
        }
    });

    return state;
};
