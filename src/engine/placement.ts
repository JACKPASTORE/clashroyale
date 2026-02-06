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
        // Simplified: spawn transparent/flying barrel which waits 2s then spawns goblins
        if (cardId.includes('alex') || cardId.includes('Alex')) {
            const barrel = {
                id: `barrel_${Date.now()}`,
                team,
                x,
                y,
                hp: 100, // Dummy HP that won't be hit
                maxHp: 100,
                radius: 0, // No collision
                cardId: 'alex_goblin_barrel',
                dps: 0,
                speedPxPerSec: 0, // Stationary (visual delay)
                rangePx: 0,
                targetType: [], // Untargetable
                lastAttackTime: 0,
                state: 'idle' as const,
                statuses: [],
                abilityData: {
                    isBarrel: true,
                    spawnTime: Date.now()
                },
                lane: getLaneForSpawn(x)
            };
            newState.units.push(barrel);
            console.log(`[Spell] Cast Alex Barrel at (${x}, ${y}) - waiting 2s`);
        }
    }

    // Cycle card from hand
    newState = playCard(newState, cardId, team);

    return newState;
};
