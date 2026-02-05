import { AbilityContext, AbilityEventType, GameState } from '../../types';

/**
 * Gabriel - rapid_fire
 * Fires in bursts (3 shots quickly)
 * Note: This is approximated by decreasing cooldown temporarily
 */
export const rapid_fire = (ctx: AbilityContext): GameState => {
    const state = { ...ctx.state };
    const gabriel = state.units.find(u => u.id === ctx.sourceEntityId);
    if (!gabriel) return state;

    // Initialize burst tracking
    if (!gabriel.abilityData) gabriel.abilityData = {};
    if (!gabriel.abilityData.burstCount) gabriel.abilityData.burstCount = 0;
    if (!gabriel.abilityData.inBurst) gabriel.abilityData.inBurst = false;

    const burstSize = ctx.params?.burst_size || 3;

    if (ctx.eventType === AbilityEventType.ON_ATTACK_HIT) {
        gabriel.abilityData.burstCount++;

        if (gabriel.abilityData.burstCount >= burstSize) {
            gabriel.abilityData.burstCount = 0;
            gabriel.abilityData.inBurst = false;
        } else {
            gabriel.abilityData.inBurst = true;
            // Reduce cooldown for next shot (handled externally by reducing lastAttackTime)
            gabriel.lastAttackTime -= 700; // Shoot again in 0.3s instead of 1s
        }
    }

    return state;
};
