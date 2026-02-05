import { AbilityContext, AbilityEventType, GameState } from '../../types';

/**
 * Salomé - ramping_damage (Inferno-like)
 * DPS ramps up from min to max over time while targeting same enemy
 * Resets if target changes
 */
export const ramping_damage = (ctx: AbilityContext): GameState => {
    const state = { ...ctx.state };
    const salome = state.units.find(u => u.id === ctx.sourceEntityId);
    if (!salome) return state;

    const minDps = ctx.params?.min_dps || 90;
    const maxDps = ctx.params?.max_dps || 300;
    const rampTime = ctx.params?.ramp_time_sec || 3.5;

    // Initialize ramping data
    if (!salome.abilityData) salome.abilityData = {};
    if (!salome.abilityData.rampProgress) salome.abilityData.rampProgress = 0;
    if (!salome.abilityData.lastTargetId) salome.abilityData.lastTargetId = null;

    // Check if target changed
    if (ctx.eventType === AbilityEventType.ON_TICK) {
        const currentTarget = salome.targetId;

        if (currentTarget !== salome.abilityData.lastTargetId) {
            // Target changed or lost - reset ramp
            salome.abilityData.rampProgress = 0;
            salome.abilityData.lastTargetId = currentTarget;
            salome.dps = minDps;
        } else if (currentTarget && ctx.dt) {
            // Same target - ramp up
            salome.abilityData.rampProgress = Math.min(rampTime, salome.abilityData.rampProgress + ctx.dt);
            const progress = salome.abilityData.rampProgress / rampTime;
            salome.dps = minDps + (maxDps - minDps) * progress;

            if (salome.abilityData.rampProgress >= rampTime) {
                console.log(`[Salomé Ramp] MAX DPS reached (${maxDps})`);
            }
        }
    }

    return state;
};
