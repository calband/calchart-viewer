/**
 * @fileOverview Defines functions that will be useful for generating the PDF
 */

/**
 * The collection of all the utility functions defined in this file
 * @type {object}
 */
PDFUtils = {};

PDFUtils.DUMMY_PDF = jsPDF("portrait", "mm", "letter");

PDFUtils.SCALE_FACTOR = PDFUtils.DUMMY_PDF.internal.scaleFactor;

PDFUtils.DEFAULT_FONT_SIZE = 12;

/**
 * Returns the width of a String in millimeters
 * @param {String} text
 * @param {int} size, font size the text will be in
 */
PDFUtils.getTextWidth = function(text, size) {
    return this.DUMMY_PDF.getStringUnitWidth(text) * size/this.SCALE_FACTOR
};

/**
 * Returns the height of text in the current fontsize in millimeters
 * @param {int} size, font size the text will be in
 */
PDFUtils.getTextHeight = function(size) {
    return size/this.SCALE_FACTOR;
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

    if (yardline < 50) {
        yardline = "S" + yardline;
    } else if (yardline == 50) {
        yardline = "50";
    } else {
        yardline = "N" + (100 - yardline);
    }

    if (steps > 4) {
        steps = 8 - steps;
        steps = Math.round(steps * 10) / 10;
        return steps + "S " + yardline;
    } else if (steps == 0) {
        return yardline;
    } else {
        steps = Math.round(steps * 10) / 10;
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

/**
 * Various jsPDF plugins that can be called by the jsPDF object itself
 */
(function (jsPDFAPI) {
    "use strict";

    /**
     * This jsPDF plugin draws a dot for the given dot type at the given coordinates
     * @param {String} dotType
     * @param {float} x
     * @param {float} y
     * @param {float} radius
     */
    jsPDFAPI.drawDot = function(dotType, x, y, radius) {
        this.setLineWidth(.1);
        if (dotType.indexOf("open") != -1) {
            this.setFillColor(255);
            this.circle(x, y, radius, "FD");
        } else {
            this.setFillColor(0);
            this.circle(x, y, radius, "FD");
        }

        radius += .1; // line radius sticks out of the circle
        if (dotType.indexOf("backslash") != -1 || dotType.indexOf("x") != -1) {
            this.line(
                x - radius, y - radius,
                x + radius, y + radius
            );
        }

        if (dotType.indexOf("forwardslash") != -1 || dotType.indexOf("x") != -1) {
            this.line(
                x - radius, y + radius,
                x + radius, y - radius
            );
        }
        this.setLineWidth(.3);
        this.setFillColor(0);
        return this;
    };

    /**
     * This jsPDF plugin resets PDF drawing options to default values, such as black
     * stroke, white fill, black text, etc.
     */
    jsPDFAPI.resetFormat = function() {
        this.setFontSize(PDFUtils.DEFAULT_FONT_SIZE);
        this.setTextColor(0);
        this.setDrawColor(0);
        this.setFillColor(255);
        this.setLineWidth(.3);
        return this;
    };
})(jsPDF.API);

module.exports = PDFUtils;