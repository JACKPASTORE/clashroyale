import { Team } from './types';

export type Lane = 'left' | 'right';

export interface Waypoint {
    x: number;
    y: number;
    lane: Lane;
    team: Team;
}

// Bridge positions (at river level)
const BRIDGE_Y = 400;
const LEFT_BRIDGE_X = 160;
const RIGHT_BRIDGE_X = 320;

// Waypoints for BLUE team (bottom to top)
export const BLUE_WAYPOINTS: Waypoint[] = [
    // Left lane
    { x: 120, y: 700, lane: 'left', team: Team.BLUE },
    { x: 120, y: 550, lane: 'left', team: Team.BLUE },
    { x: LEFT_BRIDGE_X, y: BRIDGE_Y + 50, lane: 'left', team: Team.BLUE }, // Before bridge
    { x: LEFT_BRIDGE_X, y: BRIDGE_Y - 50, lane: 'left', team: Team.BLUE }, // After bridge
    { x: 120, y: 250, lane: 'left', team: Team.BLUE },
    { x: 120, y: 100, lane: 'left', team: Team.BLUE }, // Near left princess tower

    // Right lane
    { x: 360, y: 700, lane: 'right', team: Team.BLUE },
    { x: 360, y: 550, lane: 'right', team: Team.BLUE },
    { x: RIGHT_BRIDGE_X, y: BRIDGE_Y + 50, lane: 'right', team: Team.BLUE }, // Before bridge
    { x: RIGHT_BRIDGE_X, y: BRIDGE_Y - 50, lane: 'right', team: Team.BLUE }, // After bridge
    { x: 360, y: 250, lane: 'right', team: Team.BLUE },
    { x: 360, y: 100, lane: 'right', team: Team.BLUE }, // Near right princess tower
];

// Waypoints for RED team (top to bottom)
export const RED_WAYPOINTS: Waypoint[] = [
    // Left lane
    { x: 120, y: 100, lane: 'left', team: Team.RED },
    { x: 120, y: 250, lane: 'left', team: Team.RED },
    { x: LEFT_BRIDGE_X, y: BRIDGE_Y - 50, lane: 'left', team: Team.RED }, // Before bridge
    { x: LEFT_BRIDGE_X, y: BRIDGE_Y + 50, lane: 'left', team: Team.RED }, // After bridge
    { x: 120, y: 550, lane: 'left', team: Team.RED },
    { x: 120, y: 700, lane: 'left', team: Team.RED },

    // Right lane
    { x: 360, y: 100, lane: 'right', team: Team.RED },
    { x: 360, y: 250, lane: 'right', team: Team.RED },
    { x: RIGHT_BRIDGE_X, y: BRIDGE_Y - 50, lane: 'right', team: Team.RED }, // Before bridge
    { x: RIGHT_BRIDGE_X, y: BRIDGE_Y + 50, lane: 'right', team: Team.RED }, // After bridge
    { x: 360, y: 550, lane: 'right', team: Team.RED },
    { x: 360, y: 700, lane: 'right', team: Team.RED },
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
    team: Team
): Waypoint | null => {
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
