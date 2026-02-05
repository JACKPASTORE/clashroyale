import { AbilityContext, AbilityEventType, GameState, Team } from '../../types';
import { HIT_RADIUS_SMALL } from '../../constants';

/**
 * Raph - invoquer_minichichis
 * Periodically spawns chichis behind Raph
 */
export const invoquer_minichichis = (ctx: AbilityContext): GameState => {
    if (ctx.eventType !== AbilityEventType.ON_TICK) return ctx.state;

    const state = { ...ctx.state };
    const raph = state.units.find(u => u.id === ctx.sourceEntityId);
    if (!raph) return state;

    const spawnInterval = ctx.params?.spawn_interval_sec || 5;
    const chichiCount = ctx.params?.chichi_count || 2;
    const chichiPv = ctx.params?.chichi_pv || 220;
    const chichiDps = ctx.params?.chichi_dps || 55;
    const maxActive = 6;

    //Initialize timer
    if (!raph.abilityData) raph.abilityData = {};
    if (!raph.abilityData.lastSpawn) raph.abilityData.lastSpawn = 0;
    if (!raph.abilityData.activeChichis) raph.abilityData.activeChichis = 0;

    if (state.time - raph.abilityData.lastSpawn >= spawnInterval && raph.abilityData.activeChichis < maxActive) {
        raph.abilityData.lastSpawn = state.time;

        // Spawn chichis
        for (let i = 0; i < chichiCount && raph.abilityData.activeChichis < maxActive; i++) {
            const chichi = {
                id: `chichi_${raph.id}_${state.time}_${i}`,
                team: raph.team,
                x: raph.x + (i - chichiCount / 2) * 15,
                y: raph.y + (raph.team === Team.BLUE ? 20 : -20),
                hp: chichiPv,
                maxHp: chichiPv,
                radius: HIT_RADIUS_SMALL,
                cardId: 'chichi',
                dps: chichiDps,
                speedPxPerSec: 50, // Medium
                rangePx: 18, // Melee
                targetType: [],
                lastAttackTime: Date.now(),
                state: 'idle' as const,
                statuses: [],
                abilityData: { owner: raph.id }
            };

            state.units.push(chichi);
            raph.abilityData.activeChichis++;
        }

        console.log(`[Raph Chichis] Spawned ${chichiCount} chichis (total active: ${raph.abilityData.activeChichis})`);
    }

    return state;
};
