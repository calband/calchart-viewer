/**
 * @fileOverview This file will generate a PDF representation of dots and movements
 */

 var SHOW, DOT, PDF;
 // In millimeters
 const WIDTH = 215.9;
 const HEIGHT = 279.4;

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
    PDF = jsPDF("portrait", "mm", "letter");
    SHOW = show;
    DOT = dot;
    for (var page = 1; page <= Math.ceil(SHOW.getNumSheets() / 4); page++) {
        if (page != 1) {
            PDF.addPage();
        }
        _headers(page);
        _dotContinuity();
        _individualContinuity();
        _movementDiagram();
        _birdseye();
        _surroundingDots();
    }
    PDF.save("show.pdf");
};

/**
 * Returns the width of a String, in whatever units jsPDF is currently using
 * @param {String} text
 * @param {int} size, font size the text will be in
 */
function _getTextWidth(text, size) {
    return PDF.getStringUnitWidth(text) * size/PDF.internal.scaleFactor
}

/**
 * Returns the height of text in the current fontsize, in whatever units jsPDF is
 * currently using
 * @param {int} size, font size the text will be in
 */
function _getTextHeight(size) {
    return size/PDF.internal.scaleFactor;
}

/**
 * Draws the headers on the PDF. Includes:
 *      - Stuntsheet number
 *      - Dot number
 *      - "California Marching Band: <show title>"
 *      - Page number
 *
 * @param {int} page is the current page number
 * @param {String} dot is the selected dot label
 */
var _headers = function(page) {
    // function objects
    var totalSheets = SHOW.getNumSheets();
    var totalPages = Math.ceil(totalSheets/4);

    var box = {
        height: _getTextHeight(16) * 3,
        width: WIDTH * 2/3,
        offsetX: WIDTH * 1/6,
        offsetY: 5,
        paddingX: 3,
        paddingY: 1,
        style: "stroke",
        draw: function(x, y) {
            PDF.rect(x, y, this.width, this.height, this.style);
        }
    };

    var title = {
        label: "California Marching Band:",
        text: SHOW.getTitle(),
        size: 16,
        draw: function(y) {
            PDF.setFontSize(this.size);
            PDF.text(
                this.label,
                WIDTH/2 - _getTextWidth(this.label, this.size)/2,
                y
            );
            PDF.text(
                this.text,
                WIDTH/2 - _getTextWidth(this.text, this.size)/2,
                y + this.height + 1
            );
        },

        init: function() {
            this.height = _getTextHeight(this.size);
            return this;
        }
    }.init();

    var pageInfo = {
        text: page + "/" + totalPages,
        size: 12,
        draw: function(x, y) {
            var text = this.text.split("/");
            PDF.setFontSize(this.size);
            PDF.text(text[0], x, y - 1);
            PDF.text("/", x + _getTextWidth(text[0], this.size) - .5, y);
            PDF.text(text[1], x + _getTextWidth(text[1], this.size) + .5, y + 1);
        },

        init: function() {
            this.width = _getTextWidth(this.text, this.size);
            this.height = _getTextHeight(this.size);
            this.offsetCenter = box.height/2 + this.height/2;
            return this;
        }
    }.init();

    var sheetInfo = {
        marginX: 4,
        marginY: 3,
        size: 14,
        sheet: (page - 1) * 4 + 1,
        draw: function(x, y) {
            PDF.text("SS " + this.sheet + "/" + totalSheets, x, y);
            PDF.text("Dot " + DOT, x, y + _getTextHeight(this.size));
        },

        init: function() {
            this.width = _getTextWidth("Dot " + DOT, this.size);
            this.height = _getTextHeight(this.size);
            return this;
        }
    }.init();
    
    var baselines = {
        top: box.offsetY,
        bottom: HEIGHT - (box.offsetY + box.height),
        left: box.offsetX + box.paddingX,
        right: box.offsetX + box.width - box.paddingX - pageInfo.width
    }

    /* Rectangles */
    box.draw(box.offsetX, box.offsetY);
    box.draw(box.offsetX, HEIGHT - (box.offsetY + box.height));

    /* Show titles */
    title.draw(baselines.top + box.paddingY + title.height);
    title.draw(baselines.bottom + box.paddingY + title.height);

    /* Page # Information */
    pageInfo.draw(baselines.left, baselines.top + pageInfo.offsetCenter);
    pageInfo.draw(baselines.right, baselines.top + pageInfo.offsetCenter);
    pageInfo.draw(baselines.left, baselines.bottom + pageInfo.offsetCenter);
    pageInfo.draw(baselines.right, baselines.bottom + pageInfo.offsetCenter);

    /* Stuntsheet and Dot Info */
    // top left
    sheetInfo.draw(
        sheetInfo.marginX,
        sheetInfo.marginY + sheetInfo.height
    );
    // bottom left
    if (++sheetInfo.sheet <= totalSheets) {
        sheetInfo.draw(
            sheetInfo.marginX,
            sheetInfo.marginY + sheetInfo.height + HEIGHT/2
        );
    }
    // top right
    if (++sheetInfo.sheet <= totalSheets) {
        sheetInfo.draw(
            WIDTH - sheetInfo.width - sheetInfo.marginX,
            sheetInfo.marginY + sheetInfo.height
        );
    }
    // bottom right
    if (++sheetInfo.sheet <= totalSheets) {
        sheetInfo.draw(
            WIDTH - sheetInfo.width - sheetInfo.marginX,
            sheetInfo.marginY + sheetInfo.height + HEIGHT/2
        );
    }
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

// to test, go to web console and type "test()"
window.test = function() {
    var Show = require("./Show");
    var sheets = ["sheet1", "sheet2", "sheet3", "sheet4", "sheet5"];
    var testShow = new Show("Stand Up to Cancer", "2014", "Lorem Ipsum whatever", ["A1"], sheets);
    generate(testShow, "A1");
};