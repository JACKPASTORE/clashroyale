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
 * Draw one card from the draw pile for a specific team
 * If draw pile is empty, reshuffle discard pile into it
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

    // If draw pile is empty, reshuffle discard
    if (teamDeck.drawPile.length === 0 && teamDeck.discardPile && teamDeck.discardPile.length > 0) {
        teamDeck.drawPile = shuffle(teamDeck.discardPile);
        teamDeck.discardPile = [];
        console.log(`[Deck] ${team} reshuffled discard pile into draw pile`);
    }

    // Draw top card
    if (teamDeck.drawPile.length > 0) {
        const drawnCard = teamDeck.drawPile.shift()!;
        teamDeck.hand.push(drawnCard);

        // Update nextCard
        teamDeck.nextCard = teamDeck.drawPile[0] || null;
        console.log(`[Deck] ${team} drew ${drawnCard}, hand size: ${teamDeck.hand.length}`);
    }

    return newState;
};

/**
 * Play a card: remove from hand, add to discard, draw next ONLY if hand < 4
 */
export const playCard = (state: GameState, cardId: string, team: Team): GameState => {
    // Deep copy deck state for the team
    let newState = {
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

    console.log(`[Deck] ${team} playing ${cardId}, hand before: ${teamDeck.hand.length}`);

    // Remove card from hand
    teamDeck.hand = teamDeck.hand.filter(id => id !== cardId);

    // Add to discard pile
    if (!teamDeck.discardPile) teamDeck.discardPile = [];
    teamDeck.discardPile.push(cardId);

    console.log(`[Deck] ${team} hand after removal: ${teamDeck.hand.length}`);

    // Draw next card ONLY if hand now has less than 4 cards
    if (teamDeck.hand.length < 4) {
        newState = drawCard(newState, team);
    }

    return newState;
};

/**
 * Create initial deck state for both teams
 * RED uses same deck as BLUE (different shuffle)
 */
export const createInitialDeckState = (deckIds: string[]) => {
    const shuffledBlue = shuffle([...deckIds]);
    const shuffledRed = shuffle([...deckIds]);

    return {
        [Team.BLUE]: {
            hand: shuffledBlue.slice(0, 4),
            drawPile: shuffledBlue.slice(4),
            discardPile: [] as string[],
            nextCard: shuffledBlue[4] || null
        },
        [Team.RED]: {
            hand: shuffledRed.slice(0, 4),
            drawPile: shuffledRed.slice(4),
            discardPile: [] as string[],
            nextCard: shuffledRed[4] || null
        }
    };
};
