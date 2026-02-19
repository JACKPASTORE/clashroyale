import { Team } from './types';
import { BRIDGE_LEFT_X, BRIDGE_RIGHT_X, BRIDGE_Y, BRIDGE_WIDTH, RIVER_MIN_Y, RIVER_MAX_Y } from './constants';

export type Lane = 'left' | 'right';

export interface Waypoint {
    x: number;
    y: number;
    lane: Lane;
    team: Team;
}

// Waypoints for BLUE team (bottom to top)
export const BLUE_WAYPOINTS: Waypoint[] = [
    // Left lane
    { x: BRIDGE_LEFT_X, y: 700, lane: 'left', team: Team.BLUE },
    { x: BRIDGE_LEFT_X, y: 550, lane: 'left', team: Team.BLUE },
    { x: BRIDGE_LEFT_X, y: BRIDGE_Y + 50, lane: 'left', team: Team.BLUE }, // Before bridge
    { x: BRIDGE_LEFT_X, y: BRIDGE_Y - 50, lane: 'left', team: Team.BLUE }, // After bridge
    { x: BRIDGE_LEFT_X, y: 250, lane: 'left', team: Team.BLUE },
    { x: BRIDGE_LEFT_X, y: 100, lane: 'left', team: Team.BLUE }, // Near left princess tower

    // Right lane
    { x: BRIDGE_RIGHT_X, y: 700, lane: 'right', team: Team.BLUE },
    { x: BRIDGE_RIGHT_X, y: 550, lane: 'right', team: Team.BLUE },
    { x: BRIDGE_RIGHT_X, y: BRIDGE_Y + 50, lane: 'right', team: Team.BLUE }, // Before bridge
    { x: BRIDGE_RIGHT_X, y: BRIDGE_Y - 50, lane: 'right', team: Team.BLUE }, // After bridge
    { x: BRIDGE_RIGHT_X, y: 250, lane: 'right', team: Team.BLUE },
    { x: BRIDGE_RIGHT_X, y: 100, lane: 'right', team: Team.BLUE }, // Near right princess tower
];

// Waypoints for RED team (top to bottom)
export const RED_WAYPOINTS: Waypoint[] = [
    // Left lane
    { x: BRIDGE_LEFT_X, y: 100, lane: 'left', team: Team.RED },
    { x: BRIDGE_LEFT_X, y: 250, lane: 'left', team: Team.RED },
    { x: BRIDGE_LEFT_X, y: BRIDGE_Y - 50, lane: 'left', team: Team.RED }, // Before bridge
    { x: BRIDGE_LEFT_X, y: BRIDGE_Y + 50, lane: 'left', team: Team.RED }, // After bridge
    { x: BRIDGE_LEFT_X, y: 550, lane: 'left', team: Team.RED },
    { x: BRIDGE_LEFT_X, y: 700, lane: 'left', team: Team.RED },

    // Right lane
    { x: BRIDGE_RIGHT_X, y: 100, lane: 'right', team: Team.RED },
    { x: BRIDGE_RIGHT_X, y: 250, lane: 'right', team: Team.RED },
    { x: BRIDGE_RIGHT_X, y: BRIDGE_Y - 50, lane: 'right', team: Team.RED }, // Before bridge
    { x: BRIDGE_RIGHT_X, y: BRIDGE_Y + 50, lane: 'right', team: Team.RED }, // After bridge
    { x: BRIDGE_RIGHT_X, y: 550, lane: 'right', team: Team.RED },
    { x: BRIDGE_RIGHT_X, y: 700, lane: 'right', team: Team.RED },
];

/**
 * Determine which lane a spawn position belongs to
 * @param x - Spawn X coordinate
 * @returns 'left' or 'right' lane
 */
export const getLaneForSpawn = (x: number): Lane => {
    return x < 240 ? 'left' : 'right';
};

/**
 * Get next waypoint for a unit
 * @param currentX - Current X position
 * @param currentY - Current Y position
 * @param lane - Unit's assigned lane
 * @param team - Unit's team
 * @returns Next waypoint or null if at destination
 */
export const getNextWaypoint = (
    currentX: number,
    currentY: number,
    lane: Lane,
    team: Team,
    forceBridge: boolean = false, // New param: if target is across river
    targetY?: number // New param: explicit target Y
): Waypoint | null => {
    // 1. Strict River & Bridge Logic
    const BRIDGE_X = lane === 'left' ? BRIDGE_LEFT_X : BRIDGE_RIGHT_X;
    const RIVER_Y = BRIDGE_Y;

    // Check if we need to cross the river
    let needsToCross = false;
    if (targetY !== undefined) {
        const mySide = currentY > RIVER_Y ? 'bottom' : 'top';
        const targetSide = targetY > RIVER_Y ? 'bottom' : 'top';
        if (mySide !== targetSide) needsToCross = true;
    } else {
        needsToCross = true; // Default behavior
    }

    if (needsToCross || forceBridge) {
        const distToRiverCenter = Math.abs(currentY - RIVER_Y);
        const distToBridgeX = Math.abs(currentX - BRIDGE_X);

        // HARD ROUTING: if the target is across the river, always route through the lane bridge.
        // This avoids diagonal "water crossing" even when dt is large or waypoints are skipped.
        const isBottomSide = currentY > RIVER_MAX_Y;
        const isTopSide = currentY < RIVER_MIN_Y;
        const inRiver = !isBottomSide && !isTopSide;
        const aligned = distToBridgeX <= BRIDGE_WIDTH / 2;

        if (isBottomSide) {
            // Go to entry just below the river first, then cross.
            if (!aligned) return { x: BRIDGE_X, y: RIVER_MAX_Y + 10, lane, team };
            return { x: BRIDGE_X, y: RIVER_MIN_Y - 10, lane, team };
        }
        if (isTopSide) {
            // Go to entry just above the river first, then cross.
            if (!aligned) return { x: BRIDGE_X, y: RIVER_MIN_Y - 10, lane, team };
            return { x: BRIDGE_X, y: RIVER_MAX_Y + 10, lane, team };
        }
        if (inRiver) {
            // If somehow in the river, snap routing along the bridge axis.
            if (!aligned) return { x: BRIDGE_X, y: currentY, lane, team };
            // Push towards the opposite side depending on which half we are in.
            return { x: BRIDGE_X, y: currentY > RIVER_Y ? (RIVER_MIN_Y - 10) : (RIVER_MAX_Y + 10), lane, team };
        }

        // A. If I am approaching the river (within 150px) but NOT aligned with bridge
        // Force movement to Bridge Entry Point BEFORE touching water
        if (distToRiverCenter < 150 && distToBridgeX > BRIDGE_WIDTH / 2) {
            // Determine Entry Y based on which side we are on
            // If at bottom (>400), go to 450. If at top (<400), go to 350.
            // This pulls them away from the river bank to align first.
            const entryY = currentY > RIVER_Y ? 450 : 350;
            return { x: BRIDGE_X, y: entryY, lane, team };
        }

        // B. If I am aligned with bridge, just cross (target the other side or bridge center)
        if (distToRiverCenter < 50 && distToBridgeX <= BRIDGE_WIDTH / 2) {
            // Continue forward handling
        }
    }

    // 2. Standard Waypoint Progression
    const waypoints = team === Team.BLUE ? BLUE_WAYPOINTS : RED_WAYPOINTS;
    const laneWaypoints = waypoints.filter(wp => wp.lane === lane);

    // Find the next waypoint ahead of current position
    for (const wp of laneWaypoints) {
        const dist = Math.hypot(wp.x - currentX, wp.y - currentY);

        // If waypoint is close enough, skip to next
        if (dist < 30) continue;

        // Check if waypoint is in the right direction
        if (team === Team.BLUE && wp.y < currentY) {
            return wp; // Move up
        } else if (team === Team.RED && wp.y > currentY) {
            return wp; // Move down
        }
    }

    return null; // Reached final waypoint
};

/**
 * Get all waypoints for debug visualization
 */
export const getAllWaypoints = (): Waypoint[] => {
    return [...BLUE_WAYPOINTS, ...RED_WAYPOINTS];
};
