import { AbilityContext, AbilityEventType, GameState, StatusType, StatusEffect } from '../../types';

/**
 * Alexis - lent_à_l'impact
 * Applies slow on each hit
 */
export const lent_a_l_impact = (ctx: AbilityContext): GameState => {
    if (ctx.eventType !== AbilityEventType.ON_ATTACK_HIT) return ctx.state;
    if (!ctx.targetEntityId) return ctx.state;

    const state = { ...ctx.state };
    const target = state.units.find(u => u.id === ctx.targetEntityId);
    if (!target) return state;

    const slowPercent = ctx.params?.slow_percent || 20;
    const duration = ctx.params?.duration_sec || 2.5;

    const slow: StatusEffect = {
        type: StatusType.SLOW,
        value: 1.0 - (slowPercent / 100), // 0.8 = 20% slow
        expiresAt: state.time + duration
    };

    if (!target.statuses) target.statuses = [];

    // Refresh or apply
    const existing = target.statuses.find(s => s.type === StatusType.SLOW);
    if (existing) {
        existing.expiresAt = state.time + duration;
    } else {
        target.statuses.push(slow);
    }

    return state;
};
