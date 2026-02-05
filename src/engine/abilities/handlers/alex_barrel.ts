import { AbilityContext, AbilityEventType, GameState } from '../../types';
import { HIT_RADIUS_SMALL } from '../../constants';

/**
 * Alex - spawn_goblins_on_tower (Spell)
 * Spawns 3 goblins near an enemy tower
 * NOTE: This is a spell, handled in placement logic
 */
export const spawn_goblins_on_tower = (ctx: AbilityContext): GameState => {
    if (ctx.eventType !== AbilityEventType.ON_SPAWN) return ctx.state;

    const state = { ...ctx.state };
    // Find nearest enemy tower to spawn location
    const spawnX = ctx.params?.x || 240;
    const spawnY = ctx.params?.y || 400;

    const enemyTowers = state.towers.filter(t => t.team !== ctx.params?.team);
    let nearestTower = enemyTowers[0];
    let minDist = Infinity;

    enemyTowers.forEach(tower => {
        const dist = Math.sqrt(Math.pow(tower.x - spawnX, 2) + Math.pow(tower.y - spawnY, 2));
        if (dist < minDist) {
            minDist = dist;
            nearestTower = tower;
        }
    });

    if (!nearestTower) return state;

    // Spawn 3 goblins around the tower
    for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        const distance = 30;

        const goblin = {
            id: `goblin_alex_${state.time}_${i}`,
            team: ctx.params?.team || 'blue',
            x: nearestTower.x + Math.cos(angle) * distance,
            y: nearestTower.y + Math.sin(angle) * distance,
            hp: 350,
            maxHp: 350,
            radius: HIT_RADIUS_SMALL,
            cardId: 'goblin',
            dps: 80,
            speedPxPerSec: 70, // Fast
            rangePx: 18, // Melee
            targetType: [],
            lastAttackTime: Date.now(),
            state: 'idle' as const,
            statuses: []
        };

        state.units.push(goblin);
    }

    console.log(`[Alex Spell] Spawned 3 goblins near tower`);
    return state;
};
