import { GameState, Team, Unit, Tower, TargetType } from './types';
import { getCardById } from '../data/load';
import { isValidPlacement } from './placement-validation';
import { DEBUG_LOGS } from './debug';

/**
 * Threat information for defensive decisions
 */
interface ThreatInfo {
    unit: Unit;
    distance: number;
    targetTower: Tower;
}

/**
 * Bot action decision
 */
interface BotAction {
    cardId: string;
    x: number;
    y: number;
}

/**
 * Main bot decision function - called periodically from game loop
 * Returns action to take or null if no action
 */
export const botThink = (state: GameState): BotAction | null => {
    const team = Team.RED;
    const redDeck = state.deck[team];
    const redElixir = state.elixir[team];

    // Check if bot has cards and enough elixir
    if (redDeck.hand.length === 0) return null;

    // Evaluate threats (BLUE units near RED towers)
    const threat = evaluateThreat(state);

    let cardId: string | null = null;
    let isDefense = false;

    // PRIORITY 1: DEFENSE
    if (threat) {
        cardId = pickCardForDefense(redDeck.hand, threat, redElixir);
        isDefense = true;
    }

    // PRIORITY 2: ATTACK
    if (!cardId) {
        cardId = pickCardForAttack(redDeck.hand, redElixir, state);
        isDefense = false;
    }

    // No valid card found
    if (!cardId) return null;

    // Calculate placement
    const placement = pickPlacement(state, cardId, isDefense, threat || undefined);

    // Validate placement
    if (!isValidPlacement(placement.x, placement.y, team)) {
        if (DEBUG_LOGS) console.warn(`[Bot] Invalid placement at (${placement.x}, ${placement.y})`);
        return null;
    }

    if (DEBUG_LOGS) {
        console.log(`[Bot] ${isDefense ? 'DEFENSE' : 'ATTACK'} - Playing ${cardId} at (${placement.x}, ${placement.y})`);
    }

    return {
        cardId,
        x: placement.x,
        y: placement.y
    };
};

/**
 * Evaluate if there are threatening BLUE units near RED towers
 * Returns the most threatening unit or null
 */
const evaluateThreat = (state: GameState): ThreatInfo | null => {
    const blueTroops = state.units.filter(u => u.team === Team.BLUE);
    if (blueTroops.length === 0) return null;

    const redTowers = state.towers.filter(t => t.team === Team.RED && t.hp > 0);

    let closestThreat: ThreatInfo | null = null;
    let minDistance = Infinity;

    // Find BLUE unit closest to RED tower and in top third (y < 267)
    for (const unit of blueTroops) {
        if (unit.y > 267) continue; // Not close enough to RED side

        for (const tower of redTowers) {
            const dist = Math.hypot(unit.x - tower.x, unit.y - tower.y);
            if (dist < minDistance) {
                minDistance = dist;
                closestThreat = {
                    unit,
                    distance: dist,
                    targetTower: tower
                };
            }
        }
    }

    // Only consider it a threat if within range
    if (closestThreat && closestThreat.distance < 300) {
        return closestThreat;
    }

    return null;
};

/**
 * Pick a defensive card from hand
 * Prefer low-cost cards, avoid buildingsOnly vs troops
 */
const pickCardForDefense = (hand: string[], threat: ThreatInfo, elixir: number): string | null => {
    const affordableCards = hand
        .map(id => ({ id, card: getCardById(id) }))
        .filter(({ card }) => card && card.elixirCost <= elixir)
        .sort((a, b) => (a.card?.elixirCost || 0) - (b.card?.elixirCost || 0)); // Prefer cheaper

    // Avoid buildingsOnly cards vs troops
    const isTargetBuilding = threat.unit.cardId.includes('tower') || threat.unit.cardId.includes('building');

    for (const { id, card } of affordableCards) {
        if (!card) continue;

        // Skip buildingsOnly cards if threat is a troop
        if (!isTargetBuilding && card.targets.includes(TargetType.BUILDINGS_ONLY)) {
            continue;
        }

        // Prefer cards with decent HP (>= 500) or low cost (<= 4)
        if (card.hp >= 500 || card.elixirCost <= 4) {
            return id;
        }
    }

    // Fallback: return cheapest affordable
    return affordableCards[0]?.id || null;
};

/**
 * Pick an offensive card from hand
 * Prefer buildingsOnly tanks, then medium troops
 */
const pickCardForAttack = (hand: string[], elixir: number, state: GameState): string | null => {
    const affordableCards = hand
        .map(id => ({ id, card: getCardById(id) }))
        .filter(({ card }) => card && card.elixirCost <= elixir);

    if (affordableCards.length === 0) return null;

    // Strategy: prefer buildingsOnly tanks if affordable
    const tanks = affordableCards.filter(({ card }) =>
        card && card.targets.includes(TargetType.BUILDINGS_ONLY) && card.hp >= 1000
    );

    if (tanks.length > 0 && elixir >= tanks[0].card!.elixirCost) {
        return tanks[0].id;
    }

    // Else pick medium-cost troop (avoid spending all elixir)
    const mediumCards = affordableCards.filter(({ card }) =>
        card && card.elixirCost >= 3 && card.elixirCost <= 5
    );

    if (mediumCards.length > 0) {
        return mediumCards[0].id;
    }

    // Fallback: cheapest affordable (keep elixir above 1 if possible)
    const sortedByCost = affordableCards.sort((a, b) => (a.card?.elixirCost || 0) - (b.card?.elixirCost || 0));

    // Don't go below 1 elixir if possible
    for (const { id, card } of sortedByCost) {
        if (card && elixir - card.elixirCost >= 1) {
            return id;
        }
    }

    // Emergency: just play anything
    return sortedByCost[0]?.id || null;
};

/**
 * Calculate placement position based on mode (defense/attack)
 */
const pickPlacement = (state: GameState, cardId: string, isDefense: boolean, threat?: ThreatInfo): { x: number, y: number } => {
    const card = getCardById(cardId);
    if (!card) return { x: 240, y: 200 }; // Fallback center

    if (isDefense && threat) {
        // Place between threat and tower, but in RED half
        const midX = (threat.unit.x + threat.targetTower.x) / 2;
        const midY = Math.max(50, (threat.unit.y + threat.targetTower.y) / 2); // Ensure in RED half

        // Add randomness ±20px
        return {
            x: Math.max(50, Math.min(430, midX + (Math.random() - 0.5) * 40)),
            y: Math.max(50, Math.min(350, midY + (Math.random() - 0.5) * 40)) // Keep in top half
        };
    } else {
        // ATTACK: Place behind princess tower (safe zone)
        const redTowers = state.towers.filter(t => t.team === Team.RED && t.type === 'princess' && t.hp > 0);

        // Choose weakest enemy tower's lane
        const blueTowers = state.towers.filter(t => t.team === Team.BLUE && t.type === 'princess' && t.hp > 0);
        const targetTower = blueTowers.length > 0
            ? blueTowers.reduce((min, t) => t.hp < min.hp ? t : min)
            : blueTowers[0];

        // Pick lane based on target tower
        const lane = targetTower && targetTower.x < 240 ? 'left' : 'right';
        const x = lane === 'left' ? 120 : 360;

        // Place behind princess tower (safe zone, y ~150-200)
        const y = 150 + Math.random() * 50;

        // Add randomness ±15px
        return {
            x: Math.max(50, Math.min(430, x + (Math.random() - 0.5) * 30)),
            y: Math.max(50, Math.min(350, y + (Math.random() - 0.5) * 30))
        };
    }
};
