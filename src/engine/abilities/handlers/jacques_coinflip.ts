import { AbilityContext, AbilityEventType, GameState } from '../../types';

/**
 * Jacques - coinflip_spawn
 * 50% chance to spawn when placed
 * NOTE: This is handled in placement logic, not in engine
 * This handler is a placeholder for the spawn event
 */
export const coinflip_spawn = (ctx: AbilityContext): GameState => {
    if (ctx.eventType !== AbilityEventType.ON_SPAWN) return ctx.state;

    const spawn_probability = ctx.params?.spawn_probability || 0.5;
    const roll = ctx.rng();

    if (roll > spawn_probability) {
        console.log(`[Jacques Coinflip] SPAWN FAILED! (rolled ${roll.toFixed(2)} > ${spawn_probability})`);
        // This should actually be handled in Game.tsx before spawning
        // But we log here for debugging
    } else {
        console.log(`[Jacques Coinflip] Spawn SUCCESS! (rolled ${roll.toFixed(2)} <= ${spawn_probability})`);
    }

    return ctx.state;
};
