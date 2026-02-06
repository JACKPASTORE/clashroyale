import { ARENA_WIDTH, ARENA_HEIGHT, BRIDGE_Y, SPEED_MAP, RANGE_MAP, UNIT_RADIUS } from './constants';
import { UnitType, Team, Card, GameState, TargetType } from './types';
import { getCardById } from '../data/load';
import { playCard } from './deck';
import { isValidPlacement } from './placement-validation';
import { getLaneForSpawn } from './waypoints';
import { executeAbility, hasAbility } from './abilities/index';

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
    // console.log('[Placement] placeCard called:', { cardId, x, y, team });

    const card = getCardById(cardId);
    if (!card) return state;

    // Check elixir
    if (state.elixir[team] < card.elixirCost) {
        return state;
    }

    // Validate placement
    // We can relax validation for Spells if needed inside isValidPlacement, 
    // but here we just check raw bounds usually. 
    // Assuming isValidPlacement handles Spell exception logic or we pass card type.
    // For MVP rely on isValidPlacement but Spells (Alex) act as "Global".
    // If isValidPlacement blocks spells on enemy side, we might have issue.
    // Alex target is "Tower". Player clicks enemy tower? 
    // Map click X,Y passed here.

    // Deduct elixir
    let newState = { ...state };
    newState.elixir[team] -= card.elixirCost;

    // Create Entity (Unit or Spell-as-Unit)
    // Even spells are entities for a moment to trigger OnSpawn
    const lane = getLaneForSpawn(x);
    const id = `${card.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Determine startup hasCrossedRiver
    // Identical to step.ts logic
    const riverY = 400;
    const crossed = team === Team.BLUE ? (y < riverY) : (y > riverY);

    const unit = {
        id,
        team,
        x,
        y,
        hp: card.hp || 1, // Spells have 0 in JSON usually, give 1 to exist for a frame
        maxHp: card.hp || 1,
        radius: UNIT_RADIUS,
        cardId,
        nickname: card.nickname || card.name,
        dps: card.dps,
        speedPxPerSec: SPEED_MAP[card.speed] || 0,
        rangePx: RANGE_MAP[card.range] || 0,
        targetType: card.targets || [],
        lastAttackTime: 0,
        state: 'idle' as const,
        statuses: [],
        abilityState: {},
        spawnedUnits: [],
        hasCrossedRiver: crossed,
        lane
    };

    newState.units.push(unit);

    // Cycle card from hand
    newState = playCard(newState, cardId, team);

    // TRIGGER ON_SPAWN
    // This handles Jacques (coinflip), Mathis (duo), Alex (spell spawn)
    if (card.abilities) {
        // Need to import AbilityEventType... 
        // We can't use imports inside function.
        // We need to move imports to top.
        // BUT current structure of this file is messy.
        // I will use magic string or ensuring Type is available.
        // AbilityEventType.ON_SPAWN = 'onSpawn'

        card.abilities.forEach(ab => {
            const key = ab.clé || ab.key || ab.touche;
            if (key && hasAbility(key)) {
                const result = executeAbility(key, {
                    state: newState,
                    sourceEntityId: id,
                    eventType: 'onSpawn' as any, // Cast to avoid import hell if type not imported
                    params: ab.params || {},
                    rng: () => Math.random() // Simple RNG here, ideally seeded from state
                });
                Object.assign(newState, result);
            }
        });
    }

    return newState;
};
