/**
 * @fileOverview Defines functions that will be useful for generating the PDF
 */

/**
 * The collection of all the utility functions defined in this file. Contains a
 * dummy jsPDF object that can be used for jsPDF-related measurements
 * @type {object}
 */
PDFUtils = { pdf: jsPDF("portrait", "mm", "letter") };

PDFUtils.scaleFactor = PDFUtils.pdf.internal.scaleFactor;

/**
 * Returns the width of a String in millimeters
 * @param {String} text
 * @param {int} size, font size the text will be in
 */
PDFUtils.getTextWidth = function(text, size) {
    return this.pdf.getStringUnitWidth(text) * size/this.scaleFactor
};

/**
 * Returns the height of text in the current fontsize in millimeters
 * @param {int} size, font size the text will be in
 */
PDFUtils.getTextHeight = function(size) {
    return size/this.scaleFactor;
};

/**
 * Returns the text that will be shown for the given x-coordinate in
 * the form of "4N N40" to mean "4 steps North of the North-40"
 *
 * @param {int} x, the x-coordinate
 * @return {String} the display text for the x-coordinate
 */
PDFUtils.getXCoordinateText = function(x) {
    var steps = x % 8;
    var yardline = Math.floor(x / 8) * 5;

    if (steps > 4) { // closer to North-side yardline
        yardline += 5;
    }
    steps = Math.round(steps * 10) / 10;

    if (yardline < 50) {
        yardline = "S" + yardline;
    } else if (yardline == 50) {
        yardline = "50";
    } else {
        yardline = "N" + (100 - yardline);
    }

    if (steps > 4) {
        return (8 - steps) + "S " + yardline;
    } else if (steps == 0) {
        return yardline;
    } else {
        return steps + "N " + yardline;
    }
};

/**
 * Returns the text that will be shown for the given y-coordinate in
 * the form of "8E EH" to mean "8 steps East of the East Hash"
 *
 * @param {int} y, the y-coordinate
 * @return {String} the display text for the y-coordinate
 */
PDFUtils.getYCoordinateText = function(y) {
    function round(val) {
        return Math.round(val * 10) / 10;
    };

    // West Sideline
    if (y == 0) {
        return "WS";
    }
    // Near West Sideline
    if (y <= 16) {
        return round(y) + " WS";
    }
    // West of West Hash
    if (y < 32) {
        return round(32 - y) + "W WH";
    }
    // West Hash
    if (y == 32) {
        return "WH";
    }
    // East of West Hash
    if (y <= 40) {
        return round(y - 32) + "E WH";
    }
    // West of East Hash
    if (y < 52) {
        return round(52 - y) + "W EH";
    }
    // East Hash
    if (y == 52) {
        return "EH";
    }
    // East of East Hash
    if (y <= 68) {
        return round(y - 52) + "E EH";
    }
    // Near East Sideline
    if (y < 84) {
        return round(84 - y) + " ES";
    }
    // East Sideline
    return "ES";
};

module.exports = PDFUtils;