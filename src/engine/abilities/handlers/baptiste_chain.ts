import { AbilityContext, AbilityEventType, GameState } from '../../types';

/**
 * Baptiste - chain_lightning (Building)
 * Attack bounces to nearby enemies with reduced damage
 */
export const chain_lightning = (ctx: AbilityContext): GameState => {
    if (ctx.eventType !== AbilityEventType.ON_ATTACK_HIT) return ctx.state;
    if (!ctx.targetEntityId) return ctx.state;

    const state = { ...ctx.state };
    const baptiste = state.units.find(u => u.id === ctx.sourceEntityId);
    const primaryTarget = [...state.units, ...state.towers].find(e => e.id === ctx.targetEntityId);

    if (!baptiste || !primaryTarget) return state;

    const maxChains = ctx.params?.max_chain_targets || 3;
    const damageDecay = ctx.params?.damage_decay || 0.7; // 70% per bounce
    const chainRadius = 50;

    const hitTargets = [primaryTarget];
    let currentDamage = baptiste.dps * 1.0;

    // Chain to additional targets
    for (let i = 1; i < maxChains; i++) {
        const lastTarget = hitTargets[hitTargets.length - 1];
        currentDamage *= damageDecay;

        // Find closest enemy not yet hit
        let nextTarget = null;
        let minDist = Infinity;

        [...state.units.filter(u => u.team !== baptiste.team), ...state.towers.filter(t => t.team !== baptiste.team)].forEach(entity => {
            if (hitTargets.includes(entity)) return;

            const dist = Math.sqrt(Math.pow(entity.x - lastTarget.x, 2) + Math.pow(entity.y - lastTarget.y, 2));
            if (dist <= chainRadius && dist < minDist) {
                minDist = dist;
                nextTarget = entity;
            }
        });

        if (!nextTarget) break;

        hitTargets.push(nextTarget);

        // Apply chained damage
        if ('cardId' in nextTarget) {
            const t = state.units.find(u => u.id === nextTarget.id);
            if (t) t.hp -= currentDamage;
        } else {
            const t = state.towers.find(tw => tw.id === nextTarget.id);
            if (t) t.hp -= currentDamage;
        }
    }

    console.log(`[Baptiste Chain] Chained to ${hitTargets.length} targets`);
    return state;
};
