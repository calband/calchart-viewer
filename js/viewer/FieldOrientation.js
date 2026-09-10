/**
 * @fileOverview Utilities for converting device compass headings
 * into Cal Band field-relative headings.
 */

var FieldOrientation = {};

FieldOrientation.VENUES = {
    maxwell: {
        name: "Maxwell Family Field",
        eastHeading: 27
    },

    memorial: {
        name: "California Memorial Stadium",
        eastHeading: 36
    }
};

/**
 * Normalize an angle to the range [0, 360).
 */
FieldOrientation.normalizeDegrees = function(angle) {
    return ((angle % 360) + 360) % 360;
};

/**
 * Convert a real-world compass heading into a Cal Band field heading.
 *
 * Field convention:
 *   N = 0
 *   E = 90
 *   S = 180
 *   W = 270
 *
 * eastHeading is the real-world compass heading corresponding
 * to Marching East at the selected venue.
 */
FieldOrientation.toFieldHeading = function(rawHeading, eastHeading) {
    return FieldOrientation.normalizeDegrees(
        rawHeading - eastHeading + 90
    );
};

/**
 * Return the nearest cardinal/intercardinal field direction.
 */
FieldOrientation.getDirectionLabel = function(fieldHeading) {
    var directions = [
        "N",
        "NE",
        "E",
        "SE",
        "S",
        "SW",
        "W",
        "NW"
    ];

    var index = Math.round(
        FieldOrientation.normalizeDegrees(fieldHeading) / 45
    ) % directions.length;

    return directions[index];
};

/**
 * Find the shortest signed angular difference from current to target.
 *
 * Positive = clockwise/right
 * Negative = counterclockwise/left
 */
FieldOrientation.getTurnError = function(currentHeading, targetHeading) {
    return (
        (
            targetHeading -
            currentHeading +
            540
        ) % 360
    ) - 180;
};

module.exports = FieldOrientation;