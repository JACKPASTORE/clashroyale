import { AbilityContext, AbilityEventType, GameState, StatusType, StatusEffect } from '../../types';
import { SPLASH_RADIUS_SMALL } from '../../constants';

/**
 * Sacha - étourdir
 * Stuns enemies in a small area on hit
 */
export const etourdir = (ctx: AbilityContext): GameState => {
    if (ctx.eventType !== AbilityEventType.ON_ATTACK_HIT) return ctx.state;
    if (!ctx.targetEntityId) return ctx.state;

    const state = { ...ctx.state };
    const primaryTarget = state.units.find(u => u.id === ctx.targetEntityId);
    if (!primaryTarget) return state;

    const stunDuration = ctx.params?.duration_sec || 2.0;
    const stunRadius = ctx.params?.radius || SPLASH_RADIUS_SMALL;

    // Stun primary + nearby enemies
    state.units.forEach(unit => {
        if (unit.team === primaryTarget.team) return;

        const dist = Math.sqrt(Math.pow(unit.x - primaryTarget.x, 2) + Math.pow(unit.y - primaryTarget.y, 2));
        if (dist <= stunRadius) {
            const stun: StatusEffect = {
                type: StatusType.STUN,
                value: 1.0,
                expiresAt: state.time + stunDuration
            };

            if (!unit.statuses) unit.statuses = [];
            unit.statuses.push(stun);
        }
    });

    console.log(`[Sacha Stun] Stunned enemies around target`);
    return state;
};
