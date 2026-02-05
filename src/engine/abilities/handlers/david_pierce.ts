import { AbilityContext, AbilityEventType, GameState } from '../../types';

/**
 * David - projectiles_perforants
 * Pierce damage: projectile hits multiple enemies in a line
 */
export const projectiles_perforants = (ctx: AbilityContext): GameState => {
    if (ctx.eventType !== AbilityEventType.ON_ATTACK_HIT) return ctx.state;
    if (!ctx.targetEntityId) return ctx.state;

    const state = { ...ctx.state };
    const maxTargets = ctx.params?.maxPierceTargets || 3;
    const source = state.units.find(u => u.id === ctx.sourceEntityId);
    const primaryTarget = [...state.units, ...state.towers].find(e => e.id === ctx.targetEntityId);

    if (!source || !primaryTarget) return state;

    // Find additional targets in a line behind primary
    const angle = Math.atan2(primaryTarget.y - source.y, primaryTarget.x - source.x);
    const hitTargets = [primaryTarget];

    const candidates = [...state.units.filter(u => u.team !== source.team), ...state.towers.filter(t => t.team !== source.team)];

    candidates.forEach(entity => {
        if (hitTargets.length >= maxTargets) return;
        if (entity.id === primaryTarget.id) return;

        // Check if entity is roughly along the ray and beyond primary
        const distToSource = Math.sqrt(Math.pow(entity.x - source.x, 2) + Math.pow(entity.y - source.y, 2));
        const angleToEntity = Math.atan2(entity.y - source.y, entity.x - source.x);
        const distToPrimary = Math.sqrt(Math.pow(primaryTarget.x - source.x, 2) + Math.pow(primaryTarget.y - source.y, 2));

        // Within 0.3 radians (~17°) cone and farther than primary
        if (Math.abs(angleToEntity - angle) < 0.3 && distToSource > distToPrimary) {
            hitTargets.push(entity);
        }
    });

    // Apply damage to all hit targets
    const damage = source.dps * 1.0;
    hitTargets.forEach(target => {
        if ('cardId' in target) { // Unit
            const t = state.units.find(u => u.id === target.id);
            if (t) t.hp -= damage;
        } else { // Tower
            const t = state.towers.find(tw => tw.id === target.id);
            if (t) t.hp -= damage;
        }
    });

    console.log(`[David Pierce] Hit ${hitTargets.length} targets with pierce`);
    return state;
};
