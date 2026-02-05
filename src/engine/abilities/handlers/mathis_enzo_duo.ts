import { AbilityContext, AbilityEventType, GameState, Team } from '../../types';
import { HIT_RADIUS_SMALL } from '../../constants';

/**
 * Mathis & Enzo - duo_unit
 * Spawns TWO units on placement: Mathis (tank) and Enzo (ranged)
 * NOTE: This is handled in placement logic, not here
 */
export const duo_unit = (ctx: AbilityContext): GameState => {
    if (ctx.eventType !== AbilityEventType.ON_SPAWN) return ctx.state;

    const state = { ...ctx.state };
    const mathis = state.units.find(u => u.id === ctx.sourceEntityId);
    if (!mathis) return state;

    // Mathis is the primary unit (tank)
    // Spawn Enzo behind him
    const totalHp = mathis.maxHp;
    mathis.hp = totalHp * 0.7;
    mathis.maxHp = totalHp * 0.7;
    mathis.dps = mathis.dps * 0.6; // Lower DPS for tank
    mathis.rangePx = 18; // Melee

    const enzo = {
        id: `enzo_${mathis.id}`,
        team: mathis.team,
        x: mathis.x,
        y: mathis.y + (mathis.team === Team.BLUE ? 15 : -15),
        hp: totalHp * 0.3,
        maxHp: totalHp * 0.3,
        radius: HIT_RADIUS_SMALL,
        cardId: mathis.cardId + '_enzo',
        dps: mathis.dps * 1.8, // Higher DPS for ranged
        speedPxPerSec: mathis.speedPxPerSec,
        rangePx: 100, // Ranged
        targetType: mathis.targetType,
        lastAttackTime: Date.now(),
        state: 'idle' as const,
        statuses: [],
        abilityData: { followTarget: mathis.id }
    };

    state.units.push(enzo);
    console.log(`[Mathis & Enzo] Spawned duo unit`);

    return state;
};
