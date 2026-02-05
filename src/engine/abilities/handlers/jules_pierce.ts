import { AbilityContext, AbilityEventType, GameState } from '../../types';

/**
 * Jules - ligne_shot
 * Similar to David's pierce but fewer targets
 */
export const ligne_shot = (ctx: AbilityContext): GameState => {
    if (ctx.eventType !== AbilityEventType.ON_ATTACK_HIT) return ctx.state;
    if (!ctx.targetEntityId) return ctx.state;

    const state = { ...ctx.state };
    const maxTargets = ctx.params?.pierce_targets || 2;
    const jules = state.units.find(u => u.id === ctx.sourceEntityId);
    const primaryTarget = [...state.units, ...state.towers].find(e => e.id === ctx.targetEntityId);

    if (!jules || !primaryTarget) return state;

    // Find additional targets in a line (same logic as David but max 2)
    const angle = Math.atan2(primaryTarget.y - jules.y, primaryTarget.x - jules.x);
    const hitTargets = [primaryTarget];

    const candidates = [...state.units.filter(u => u.team !== jules.team), ...state.towers.filter(t => t.team !== jules.team)];

    candidates.forEach(entity => {
        if (hitTargets.length >= maxTargets) return;
        if (entity.id === primaryTarget.id) return;

        const distToSource = Math.sqrt(Math.pow(entity.x - jules.x, 2) + Math.pow(entity.y - jules.y, 2));
        const angleToEntity = Math.atan2(entity.y - jules.y, entity.x - jules.x);
        const distToPrimary = Math.sqrt(Math.pow(primaryTarget.x - jules.x, 2) + Math.pow(primaryTarget.y - jules.y, 2));

        if (Math.abs(angleToEntity - angle) < 0.3 && distToSource > distToPrimary) {
            hitTargets.push(entity);
        }
    });

    // Apply damage to additional targets
    const damage = jules.dps * 1.0;
    hitTargets.slice(1).forEach(target => { // Skip primary (already damaged)
        if ('cardId' in target) {
            const t = state.units.find(u => u.id === target.id);
            if (t) t.hp -= damage;
        } else {
            const t = state.towers.find(tw => tw.id === target.id);
            if (t) t.hp -= damage;
        }
    });

    if (hitTargets.length > 1) {
        console.log(`[Jules Line] Hit ${hitTargets.length} targets`);
    }

    return state;
};
