/**
 * @fileOverview This file will generate a PDF representation of dots and movements
 */

 var SHOW, DOT, PDF;
 const WIDTH = 216; // in millimeters
 const HEIGHT = 279.5; // in millimeters

/**
 * generate will generate a PDF for a specific dot, containing its movements,
 * positions, and continuities relevant to it.
 *
 * @param {Show} show
 * @param {String} dot
 *
 * The function will end with a save call, which will prompt a new window and/or
 * a dialog box to download the generated PDF.
 */
var generate = function(show, dot) {
    PDF = jsPDF();
    SHOW = show;
    DOT = dot;
    _headers();
    _dotContinuity();
    _individualContinuity();
    _movementDiagram();
    _birdseye();
    _surroundingDots();
    PDF.save("show.pdf");
};

/**
 * Draws the headers on the PDF. Includes:
 *      - Stuntsheet number
 *      - Dot number
 *      - "California Marching Band: <show title>"
 *      - Page number
 */
var _headers = function() {

}

/**
 * Writes the continuites for the given dot type on the PDF. Includes:
 *      - Dot circle type
 *      - Overall Continuity
 *      - Measure/beat number
 */
var _dotContinuity = function() {

}

/**
 * Writes the continuities for the selected dot on the PDF. Includes:
 *      - Movements
 *      - Total beats
 *      - Border between general movements, e.g. Stand and Play vs. Continuity vs. FMHS
 */
var _individualContinuity = function() {

}

/**
 * Draws the diagram for a selected dot's movements. Includes:
 *      - Circle for start
 *      - Cross for end
 *      - Path line and number of steps per movement
 *      - Yard lines, yard line markers
 *      - Hashes if in viewport
 *      - Zooming if big
 *      - Orientation EWNS; East is up
 */
var _movementDiagram = function() {

}

/**
 * Draws the overall bird's eye view of the field. Includes:
 *      - Field outline, no yardlines/hashes
 *      - Form outline, continuous for 4-step EW, 2-step NS
 *      - Circle selected dot
 *      - Cross hairs for positions (4S N40, 2E WH)
 */
var _birdseye = function() {

}

/**
 * Draws the dots surrounding the selected dot. Includes:
 *      - Orientation always E up (for now)
 *      - 4 step radius
 *      - Solid line cross hairs; selected dot in middle
 *      - Dot labels
 *      - Dot types
 */
var _surroundingDots = function() {

}

module.exports = generate;