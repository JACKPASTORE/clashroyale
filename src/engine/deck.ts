import { GameState, Team } from './types';

export const shuffle = (array: string[]) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

/**
 * Play a card: Circular Queue System
 * 1. Remove from hand
 * 2. Draw from front of queue (if hand < 4)
 * 3. Add played card to BACK of queue
 */
export const playCard = (state: GameState, cardId: string, team: Team): GameState => {
    // Deep copy deck state for the team
    const newState = {
        ...state,
        deck: {
            ...state.deck,
            [team]: {
                ...state.deck[team],
                hand: [...state.deck[team].hand],
                drawPile: [...state.deck[team].drawPile],
                discardPile: [...state.deck[team].discardPile]
            }
        }
    };

    const teamDeck = newState.deck[team];

    console.log(`[Deck] ${team} playing ${cardId}`);
    console.log(`[Deck] Before - Hand: [${teamDeck.hand}], Queue: [${teamDeck.drawPile}]`);

    // 1. Remove card from hand
    const cardIndex = teamDeck.hand.indexOf(cardId);
    if (cardIndex === -1) {
        console.error(`[Deck] Card ${cardId} not in hand!`);
        return state;
    }
    teamDeck.hand.splice(cardIndex, 1);

    // 2. Draw from front of queue (if hand < 4)
    if (teamDeck.hand.length < 4 && teamDeck.drawPile.length > 0) {
        const drawn = teamDeck.drawPile.shift()!; // Remove from front
        teamDeck.hand.push(drawn);
        console.log(`[Deck] Drew ${drawn} from queue`);
    }

    // 3. Add played card to BACK of queue
    teamDeck.drawPile.push(cardId);

    // 4. Update nextCard indicator
    teamDeck.nextCard = teamDeck.drawPile[0] || null;

    console.log(`[Deck] After - Hand: [${teamDeck.hand}], Queue: [${teamDeck.drawPile}]`);

    return newState;
};

/**
 * Draw one card from queue (used at game start if needed)
 */
export const drawCard = (state: GameState, team: Team): GameState => {
    const newState = {
        ...state,
        deck: {
            ...state.deck,
            [team]: {
                ...state.deck[team],
                hand: [...state.deck[team].hand],
                drawPile: [...state.deck[team].drawPile],
                discardPile: [...state.deck[team].discardPile]
            }
        }
    };

    const teamDeck = newState.deck[team];

    // Draw from queue
    if (teamDeck.drawPile.length > 0) {
        const drawnCard = teamDeck.drawPile.shift()!;
        teamDeck.hand.push(drawnCard);
        teamDeck.nextCard = teamDeck.drawPile[0] || null;
        console.log(`[Deck] ${team} drew ${drawnCard}, hand size: ${teamDeck.hand.length}`);
    }

    return newState;
};

/**
 * Create initial deck state for both teams
 * 8 cards → 4 in hand, 4 in queue
 */
export const createInitialDeckState = (deckIds: string[]) => {
    const shuffledBlue = shuffle([...deckIds]);
    const shuffledRed = shuffle([...deckIds]);

    return {
        [Team.BLUE]: {
            hand: shuffledBlue.slice(0, 4),      // First 4 cards
            drawPile: shuffledBlue.slice(4, 8),  // Next 4 cards (queue)
            discardPile: [] as string[],         // Unused (keep for compatibility)
            nextCard: shuffledBlue[4] || null    // Show first card in queue
        },
        [Team.RED]: {
            hand: shuffledRed.slice(0, 4),
            drawPile: shuffledRed.slice(4, 8),
            discardPile: [] as string[],
            nextCard: shuffledRed[4] || null
        }
    };
};

