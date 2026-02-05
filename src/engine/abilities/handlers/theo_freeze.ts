import { AbilityContext, AbilityEventType, GameState, StatusType, StatusEffect } from '../../types';
import { SPLASH_RADIUS_SMALL } from '../../constants';

/**
 * Théo - freeze_on_talk
 * Periodically freezes enemies nearby
 */
export const freeze_on_talk = (ctx: AbilityContext): GameState => {
    if (ctx.eventType !== AbilityEventType.ON_TICK) return ctx.state;

    const state = { ...ctx.state };
    const theo = state.units.find(u => u.id === ctx.sourceEntityId);
    if (!theo) return state;

    const freezeDuration = ctx.params?.duration_sec || 1.5;
    const freezeRadius = ctx.params?.radius || SPLASH_RADIUS_SMALL;
    const triggerInterval = 5; // Every 5 seconds

    // Initialize timer
    if (!theo.abilityData) theo.abilityData = {};
    if (!theo.abilityData.lastFreeze) theo.abilityData.lastFreeze = 0;

    if (state.time - theo.abilityData.lastFreeze >= triggerInterval) {
        theo.abilityData.lastFreeze = state.time;

        // Freeze nearby enemies
        state.units.forEach(unit => {
            if (unit.team === theo.team) return;

            const dist = Math.sqrt(Math.pow(unit.x - theo.x, 2) + Math.pow(unit.y - theo.y, 2));
            if (dist <= freezeRadius) {
                const freeze: StatusEffect = {
                    type: StatusType.FREEZE,
                    value: 1.0,
                    expiresAt: state.time + freezeDuration
                };

                if (!unit.statuses) unit.statuses = [];
                unit.statuses.push(freeze);
            }
        });

        console.log(`[Théo Freeze] Froze nearby enemies!`);
    }

    return state;
};
