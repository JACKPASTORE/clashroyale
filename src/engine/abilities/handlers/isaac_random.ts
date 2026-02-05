import { AbilityContext, AbilityEventType, GameState, StatusType, StatusEffect } from '../../types';
import { randomChoice } from '../../rng';
import { AURA_RADIUS_MEDIUM } from '../../constants';

/**
 * Isaac - orthographe_aléatoire (Building)
 * Random buff/debuff every N seconds
 */
export const orthographe_aleatoire = (ctx: AbilityContext): GameState => {
    if (ctx.eventType !== AbilityEventType.ON_TICK) return ctx.state;

    const state = { ...ctx.state };
    const isaac = state.units.find(u => u.id === ctx.sourceEntityId);
    if (!isaac) return state;

    const triggerInterval = ctx.params?.trigger_interval_sec || 6;
    const effectDuration = 3.0;
    const auraRadius = ctx.params?.radius || AURA_RADIUS_MEDIUM;

    // Initialize timer
    if (!isaac.abilityData) isaac.abilityData = {};
    if (!isaac.abilityData.lastTrigger) isaac.abilityData.lastTrigger = 0;

    if (state.time - isaac.abilityData.lastTrigger >= triggerInterval) {
        isaac.abilityData.lastTrigger = state.time;

        // Random effect
        const effects = ['rage', 'boost', 'slow'];
        const chosen = randomChoice(ctx.rng, effects);

        // Apply to allies in radius
        state.units.forEach(unit => {
            if (unit.team !== isaac.team) return;

            const dist = Math.sqrt(Math.pow(unit.x - isaac.x, 2) + Math.pow(unit.y - isaac.y, 2));
            if (dist <= auraRadius) {
                let effect: StatusEffect;

                if (chosen === 'rage') {
                    effect = { type: StatusType.RAGE, value: 0.7, expiresAt: state.time + effectDuration }; // 30% faster attack
                } else if (chosen === 'boost') {
                    effect = { type: StatusType.BOOST, value: 1.2, expiresAt: state.time + effectDuration }; // 20% faster move
                } else {
                    // Slow enemies instead
                    return;
                }

                if (!unit.statuses) unit.statuses = [];
                unit.statuses.push(effect);
            }
        });

        // Slow enemies if "slow" chosen
        if (chosen === 'slow') {
            state.units.forEach(unit => {
                if (unit.team === isaac.team) return;
                const dist = Math.sqrt(Math.pow(unit.x - isaac.x, 2) + Math.pow(unit.y - isaac.y, 2));
                if (dist <= auraRadius) {
                    const slow: StatusEffect = { type: StatusType.SLOW, value: 0.8, expiresAt: state.time + effectDuration };
                    if (!unit.statuses) unit.statuses = [];
                    unit.statuses.push(slow);
                }
            });
        }

        console.log(`[Isaac Random] Triggered ${chosen.toUpperCase()} effect!`);
    }

    return state;
};
