import { Team } from './types';

// Arena dimensions
export const ARENA_WIDTH = 480;
export const ARENA_HEIGHT = 800;

// River zone (center of arena)
export const RIVER_CENTER_Y = 400;
export const RIVER_HALF_HEIGHT = 20; // River is 40px tall
export const RIVER_BUFFER = 20; // Additional buffer zone

// River bounds with buffer
export const RIVER_MIN_Y = RIVER_CENTER_Y - RIVER_HALF_HEIGHT - RIVER_BUFFER; // 360
export const RIVER_MAX_Y = RIVER_CENTER_Y + RIVER_HALF_HEIGHT + RIVER_BUFFER; // 440

/**
 * Check if a position is valid for card placement
 * @param x - X coordinate (0-480)
 * @param y - Y coordinate (0-800)
 * @param team - Team attempting placement
 * @returns true if placement is valid, false otherwise
 */
export const isValidPlacement = (x: number, y: number, team: Team): boolean => {
    // Check arena bounds
    if (x < 0 || x > ARENA_WIDTH || y < 0 || y > ARENA_HEIGHT) {
        return false;
    }

    // Check river zone + buffer (no placement allowed)
    if (y >= RIVER_MIN_Y && y <= RIVER_MAX_Y) {
        return false;
    }

    // Check team side
    if (team === Team.BLUE) {
        // BLUE can only place in bottom half (below river)
        return y > RIVER_MAX_Y;
    } else {
        // RED can only place in top half (above river)
        return y < RIVER_MIN_Y;
    }
};

/**
 * Get visual feedback color for placement preview
 */
export const getPlacementColor = (isValid: boolean): string => {
    return isValid ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
};
