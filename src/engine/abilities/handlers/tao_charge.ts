import { AbilityContext, AbilityEventType, GameState } from '../../types';

/**
 * Tao - charge_double_damage
 * If Tao walks a distance without attacking, next hit does 2x damage
 */
export const charge_double_damage = (ctx: AbilityContext): GameState => {
    const state = { ...ctx.state };
    const tao = state.units.find(u => u.id === ctx.sourceEntityId);
    if (!tao) return state;

    const minChargeDistance = ctx.params?.min_charge_distance || 60;
    const damageMultiplier = ctx.params?.damage_multiplier || 2.0;

    // Initialize tracking
    if (!tao.abilityData) tao.abilityData = {};
    if (!tao.abilityData.chargeStartPos) tao.abilityData.chargeStartPos = { x: tao.x, y: tao.y };
    if (!tao.abilityData.isCharged) tao.abilityData.isCharged = false;

    if (ctx.eventType === AbilityEventType.ON_TICK && tao.state === 'moving') {
        // Calculate distance traveled
        const dist = Math.sqrt(
            Math.pow(tao.x - tao.abilityData.chargeStartPos.x, 2) +
            Math.pow(tao.y - tao.abilityData.chargeStartPos.y, 2)
        );

        if (dist >= minChargeDistance) {
            tao.abilityData.isCharged = true;
        }
    }

    if (ctx.eventType === AbilityEventType.ON_ATTACK_HIT && ctx.targetEntityId) {
        if (tao.abilityData.isCharged) {
            // Apply bonus damage
            const bonusDamage = tao.dps * 1.0; // Extra hit worth of damage
            const target = [...state.units, ...state.towers].find(e => e.id === ctx.targetEntityId);

            if (target) {
                if ('cardId' in target) {
                    const t = state.units.find(u => u.id === target.id);
                    if (t) t.hp -= bonusDamage;
                } else {
                    const t = state.towers.find(tw => tw.id === target.id);
                    if (t) t.hp -= bonusDamage;
                }
            }

            // Reset charge
            tao.abilityData.isCharged = false;
            tao.abilityData.chargeStartPos = { x: tao.x, y: tao.y };
            console.log(`[Tao Charge] CHARGED HIT! Bonus damage dealt`);
        }
    }

    return state;
};
