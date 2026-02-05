import { AbilityContext, AbilityEventType, GameState } from '../../types';
import { SPLASH_RADIUS_MEDIUM } from '../../constants';

/**
 * Jausseaud - splash_damage
 * AoE damage around the primary target
 */
export const splash_damage = (ctx: AbilityContext): GameState => {
    if (ctx.eventType !== AbilityEventType.ON_ATTACK_HIT) return ctx.state;
    if (!ctx.targetEntityId) return ctx.state;

    const state = { ...ctx.state };
    const jausseaud = state.units.find(u => u.id === ctx.sourceEntityId);
    const primaryTarget = [...state.units, ...state.towers].find(e => e.id === ctx.targetEntityId);

    if (!jausseaud || !primaryTarget) return state;

    const splashRadius = ctx.params?.radius || SPLASH_RADIUS_MEDIUM;
    const damage = jausseaud.dps * 1.0;

    // Find all enemies in splash radius around primary target
    const splashTargets: any[] = [];

    [...state.units.filter(u => u.team !== jausseaud.team), ...state.towers.filter(t => t.team !== jausseaud.team)].forEach(entity => {
        const dist = Math.sqrt(Math.pow(entity.x - primaryTarget.x, 2) + Math.pow(entity.y - primaryTarget.y, 2));
        if (dist <= splashRadius) {
            splashTargets.push(entity);
        }
    });

    // Apply damage to all splash targets
    splashTargets.forEach(target => {
        if ('cardId' in target) { // Unit
            const t = state.units.find(u => u.id === target.id);
            if (t) t.hp -= damage;
        } else { // Tower
            const t = state.towers.find(tw => tw.id === target.id);
            if (t) t.hp -= damage;
        }
    });

    console.log(`[Jausseaud Splash] Hit ${splashTargets.length} targets in splash AoE`);
    return state;
};
