import { AbilityContext, AbilityEventType, GameState, Team } from '../../types';
import { getCardById } from '../../../data/load';
import { HIT_RADIUS_SMALL } from '../../constants';

/**
 * Noah - spawn_minibots
 * Periodically spawns minibots behind Noah
 */
export const spawn_minibots = (ctx: AbilityContext): GameState => {
    if (ctx.eventType !== AbilityEventType.ON_TICK) return ctx.state;

    const state = { ...ctx.state };
    const noah = state.units.find(u => u.id === ctx.sourceEntityId);
    if (!noah) return state;

    const spawnInterval = ctx.params?.spawn_interval_sec || 5;
    const botCount = ctx.params?.bot_count || 2;
    const botPv = ctx.params?.bot_pv || 250;
    const botDps = ctx.params?.bot_atk_dps || 60;

    // Initialize timer
    if (!noah.abilityData) noah.abilityData = {};
    if (!noah.abilityData.lastSpawn) noah.abilityData.lastSpawn = 0;
    if (!noah.abilityData.spawnedCount) noah.abilityData.spawnedCount = 0;

    if (state.time - noah.abilityData.lastSpawn >= spawnInterval && noah.abilityData.spawnedCount < 6) {
        noah.abilityData.lastSpawn = state.time;

        // Spawn minibots
        for (let i = 0; i < botCount; i++) {
            const minibot = {
                id: `minibot_${noah.id}_${state.time}_${i}`,
                team: noah.team,
                x: noah.x + (i - botCount / 2) * 15,
                y: noah.y + (noah.team === Team.BLUE ? 20 : -20),
                hp: botPv,
                maxHp: botPv,
                radius: HIT_RADIUS_SMALL,
                cardId: 'minibot', // Fake card ID
                dps: botDps,
                speedPxPerSec: 70, // Fast
                rangePx: 18, // Melee
                targetType: [],
                lastAttackTime: Date.now(),
                state: 'idle' as const,
                statuses: [],
                abilityData: { lifetime: state.time + 12 } // 12s lifetime
            };

            state.units.push(minibot);
            noah.abilityData.spawnedCount++;
        }

        console.log(`[Noah Minibots] Spawned ${botCount} minibots`);
    }

    return state;
};
