import { ARENA_WIDTH, ARENA_HEIGHT, BRIDGE_Y, SPEED_MAP, RANGE_MAP, UNIT_RADIUS } from './constants';
import { UnitType, Team, Card, GameState, TargetType } from './types';
import { getCardById } from '../data/load';
import { playCard } from './deck';
import { isValidPlacement } from './placement-validation';
import { getLaneForSpawn } from './waypoints';

export const canPlaceCard = (
    card: Card,
    x: number,
    y: number,
    team: Team,
    currentElixir: number
): boolean => {

    // Check Elixir
    if (currentElixir < card.elixirCost) return false;

    // Check Bounds (basic map bounds)
    if (x < 0 || x > ARENA_WIDTH || y < 0 || y > ARENA_HEIGHT) return false;

    // Check Placement Rules based on Team (MVP: Static Zones)
    // Blue Player can only place in bottom half (y > BRIDGE_Y)
    if (team === Team.BLUE) {
        if (y < BRIDGE_Y) {
            // Spells can go anywhere
            if (card.type === UnitType.SPELL) return true;
            return false; // Troops/Buildings restricted to own side
        }
    }

    // Red Player logic (if implementing PvP/AI later)
    if (team === Team.RED) {
        if (y > BRIDGE_Y && card.type !== UnitType.SPELL) return false;
    }

    return true;
};

/**
 * Place a card on the battlefield
 * Deducts elixir, spawns unit/building, cycles card
 */
export const placeCard = (
    state: GameState,
    cardId: string,
    x: number,
    y: number,
    team: Team
): GameState => {
    console.log('[Placement] placeCard called:', { cardId, x, y, team });

    const card = getCardById(cardId);
    if (!card) {
        console.error(`[Placement] Card ${cardId} not found`);
        return state;
    }

    console.log('[Placement] Card found:', card.name, 'cost:', card.elixirCost);

    // Check elixir
    if (state.elixir[team] < card.elixirCost) {
        console.warn(`[Placement] Insufficient elixir: ${state.elixir[team]}/${card.elixirCost}`);
        return state;
    }

    // Validate placement using new validation system
    if (!isValidPlacement(x, y, team)) {
        console.warn(`[Placement] Invalid placement position for ${card.name} at (${x}, ${y})`);
        return state;
    }

    console.log('[Placement] Validation passed, spawning unit...');

    let newState = { ...state };

    // Deduct elixir
    newState.elixir[team] -= card.elixirCost;

    // Spawn unit/building
    if (card.type === UnitType.TROOP || card.type === UnitType.BUILDING) {
        const lane = getLaneForSpawn(x);

        const unit = {
            id: `unit_${Date.now()}_${Math.random()}`,
            team,
            x,
            y,
            hp: card.hp,
            maxHp: card.hp,
            radius: UNIT_RADIUS,
            cardId,
            dps: card.dps,
            speedPxPerSec: SPEED_MAP[card.speed],
            rangePx: RANGE_MAP[card.range],
            targetType: card.targets,
            lastAttackTime: 0,
            state: 'idle' as const,
            statuses: [],
            abilityData: {},
            lane // Assign lane based on spawn position
        };

        newState.units.push(unit);
        console.log(`[Placement] Spawned ${card.name} at (${x}, ${y}) in ${lane} lane`);
    } else if (card.type === UnitType.SPELL) {
        // Handle spells (e.g., Alex's goblin barrel)
        console.log(`[Placement] Cast spell ${card.name} at (${x}, ${y})`);
        // For MVP, spells are handled separately (could trigger abilities)
        // Simplified: spawn goblins near enemy tower for Alex
        if (cardId.includes('alex') || cardId.includes('Alex')) {
            // Find nearest enemy tower
            const enemyTowers = newState.towers.filter(t => t.team !== team);
            let nearestTower = enemyTowers[0];
            let minDist = Infinity;

            enemyTowers.forEach(tower => {
                const dist = Math.sqrt(Math.pow(tower.x - x, 2) + Math.pow(tower.y - y, 2));
                if (dist < minDist) {
                    minDist = dist;
                    nearestTower = tower;
                }
            });

            if (nearestTower) {
                // Spawn 3 goblins around tower
                for (let i = 0; i < 3; i++) {
                    const angle = (i / 3) * Math.PI * 2;
                    const distance = 30;
                    const goblinX = nearestTower.x + Math.cos(angle) * distance;

                    const goblin = {
                        id: `goblin_${Date.now()}_${i}`,
                        team,
                        x: goblinX,
                        y: nearestTower.y + Math.sin(angle) * distance,
                        hp: 350,
                        maxHp: 350,
                        radius: 7,
                        cardId: 'goblin',
                        dps: 80,
                        speedPxPerSec: 70,
                        rangePx: 18,
                        targetType: [TargetType.GROUND],
                        lastAttackTime: 0,
                        state: 'idle' as const,
                        statuses: [],
                        lane: getLaneForSpawn(goblinX) // Assign lane based on spawn position
                    };

                    newState.units.push(goblin);
                }
                console.log(`[Spell] Spawned 3 goblins near ${nearestTower.id}`);
            }
        }
    }

    // Cycle card from hand
    newState = playCard(newState, cardId, team);

    return newState;
};
