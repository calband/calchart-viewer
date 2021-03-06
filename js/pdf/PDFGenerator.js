var PDFUtils = require("./PDFUtils");
var HeaderWidget = require("./HeaderWidget");
var DotContinuityWidget = require("./DotContinuityWidget");
var IndividualContinuityWidget = require("./IndividualContinuityWidget");
var MovementDiagramWidget = require("./MovementDiagramWidget");
var BirdsEyeWidget = require("./BirdsEyeWidget");
var SurroundingDotsWidget = require("./SurroundingDotsWidget");

/**
 * @constant WIDTH is the width of the PDF document, in millimeters
 * @constant HEIGHT is the height of the PDF document, in millimeters
 * @constant SIDE_MARGIN is the left/right margin of the PDF document, in millimeters
 * @constant QUADRANT contains (x,y) coordinates for the top left corner of each quadrant
 *      of the document. y coordinates offset by headers
 */
var WIDTH = 215.9;
var HEIGHT = 279.4;
var SIDE_MARGIN = 10;

var QUADRANT = [
    {x: SIDE_MARGIN, y: 24},                     // top left
    {x: WIDTH/2 + SIDE_MARGIN, y: 24},           // top right
    {x: SIDE_MARGIN, y: HEIGHT/2 + 16},          // bottom left
    {x: WIDTH/2 + SIDE_MARGIN, y: HEIGHT/2 + 16} // bottom right
];
var QUADRANT_HEIGHT = HEIGHT/2 - 22;
var QUADRANT_WIDTH = WIDTH/2 - SIDE_MARGIN * 2;

/**
 * This PDFGenerator class will be able to generate the PDF representation of the given
 * show, for the given dot.
 *
 * @param {Show} show
 * @param {Array<String>} dots is the list of dot labels to include in the PDF
 */
var PDFGenerator = function(show, dots) {
    this.pdf = jsPDF("portrait", "mm", "letter");
    this.show = show;
    this.dots = dots;
    this.sheets = show.getSheets();
    this.data = null;
    // tracking for progress bar
    this.current = 0;
    this.total = this.dots.length * this.sheets.length; // increment per dot per stuntsheet
};

/**
 * generate a PDF for specified dots, containing its movements, positions, and continuities
 * relevant to it.
 *
 * The function will display the pdf in the webpage's preview pane
 *
 * @param {Object} options, customizable options for the pdf. Current options include:
 *      - Orientation for movement diagram (options["md-orientation"] = "west"|"east")
 *      - Orientation for bird's eye view  (options["bev-orientation"] = "west"|"east")
 *      - Orientation for surrounding dots (options["sd-orientation"] = "west"|"east")
 *      - Layout order of stuntsheets      (options["layout-order"] = "ltr"|"ttb")
 *
 * @return {string} the PDF data
 */
PDFGenerator.prototype.generate = function(options) {
    // 4 stuntsheets per page + front sheet + endsheet
    var totalPages = Math.ceil(this.sheets.length / 4) + 2;

    for (var i = 0; i < this.dots.length; i++) {
        if (i !== 0) {
            this.pdf.addPage();
        }
        this.dot = this.dots[i];
        this._generate(options);

        // if there's an odd number of pages and not on the last dot, add an extra
        // page for printing double sided
        if (totalPages % 2 === 1 && i < this.dots.length - 1) {
            this.pdf.addPage();
        }
    }

    this.data = this.pdf.output("datauristring");
};

/**
 * Generate a PDF for one dot, given by this.dot
 */
PDFGenerator.prototype._generate = function(options) {
    // Widgets
    this.headerWidget = new HeaderWidget(this.pdf, {
        dotLabel: this.dot,
        title: this.show.getTitle(),
        totalSheets: this.sheets.length
    });
    this.dotContinuityWidget = new DotContinuityWidget(this.pdf);
    this.individualContinuityWidget = new IndividualContinuityWidget(this.pdf);
    this.movementDiagramWidget = new MovementDiagramWidget(this.pdf, options["md-orientation"]);
    this.birdsEyeWidget = new BirdsEyeWidget(this.pdf, options["bev-orientation"]);
    this.surroundingDotsWidget = new SurroundingDotsWidget(this.pdf, options["sd-orientation"]);

    this._addFrontSheet();

    var movements = this._getMovements();
    for (var pageNum = 0; pageNum < Math.ceil(this.sheets.length / 4); pageNum++) {
        this.pdf.addPage();

        var pageSheets = []
        for (var i = 0; i < 4; i++) {
            var sheet = pageNum * 4 + i;
            if (sheet == this.sheets.length) {
                break;
            }
            pageSheets.push(this.sheets[sheet]);
        }

        this.headerWidget.draw({
            pageNum: pageNum + 1,
            isLeftToRight: options["layout-order"] === "ltr"
        });
        // drawing lines between quadrants
        this.pdf.setDrawColor(150);
        this.pdf.vLine(WIDTH/2, 24, HEIGHT - 24);
        this.pdf.hLine(0, HEIGHT/2 + 2.5, WIDTH);
        this.pdf.setDrawColor(0);

        var quadrantOrder = [0, 1, 2, 3]; // top left, top right, bottom left, bottom right
        if (options["layout-order"] === "ttb") {
            quadrantOrder = [0, 2, 1, 3];
        }

        for (var i = 0; i < pageSheets.length; i++) {
            var x = QUADRANT[quadrantOrder[i]].x;
            var y = QUADRANT[quadrantOrder[i]].y;
            var sheet = pageSheets[i];
            var dot = sheet.getDotByLabel(this.dot);
            this.dotContinuityWidget.draw(
                x,
                y,
                QUADRANT_WIDTH,
                QUADRANT_HEIGHT/6,
                {
                    sheet: sheet,
                    dotType: sheet.getDotType(this.dot)
                }
            );
            this.individualContinuityWidget.draw(
                x,
                y + QUADRANT_HEIGHT/6,
                QUADRANT_WIDTH/2,
                QUADRANT_HEIGHT/3,
                {
                    dot: dot,
                    duration: sheet.getDuration()
                }
            );
            this.movementDiagramWidget.draw(
                x + QUADRANT_WIDTH/2 + 1,
                y + QUADRANT_HEIGHT/6,
                QUADRANT_WIDTH/2,
                QUADRANT_HEIGHT/3,
                {
                    movements: movements[pageNum * 4 + i]
                }
            );
            this.surroundingDotsWidget.draw(
                x,
                y + QUADRANT_HEIGHT/2 + 2,
                QUADRANT_WIDTH,
                QUADRANT_HEIGHT/2 - 2,
                {
                    sheet: sheet,
                    dot: dot
                }
            );
            // increment progress bar
            this.current++;
            var percentage = this.current / this.total;
            $(".js-pdf-loading .progress-bar").css({
                width: (50 + percentage * 50) + "%", // 50% from loading server
            });
        }
    }

    this._addEndSheet(movements);
};

/**
 * Returns a list of movements for each stuntsheet, which are changes in position with
 * respect to the previous position
 * @return {Array<Array<Object>>} where each element is a list of movements for each
 *   stuntsheet. The Object contains:
 *      - {Coordinate} startPosition
 *      - {int} deltaX
 *      - {int} deltaY
 */
PDFGenerator.prototype._getMovements = function() {
    var moves = [];
    var dotLabel = this.dot;
    this.sheets.forEach(function(sheet) {
        var lines = [];
        var movements = sheet.getDotByLabel(dotLabel).getMovementCommands();
        var startPosition = movements[0].getStartPosition();
        movements.forEach(function(movement) {
            var endPosition = movement.getEndPosition();
            if (movement.getMiddlePoints === undefined) {
                lines.push({
                    startPosition: startPosition,
                    deltaX: endPosition.x - startPosition.x,
                    deltaY: endPosition.y - startPosition.y
                });
            } else { // movement is a MovementCommandArc
                // each item is an Array of (deltaX, deltaY) pairs
                movement.getMiddlePoints().forEach(function(move) {
                    lines.push({
                        startPosition: startPosition,
                        deltaX: move[0],
                        deltaY: move[1]
                    });
                });
            }
            startPosition = endPosition;
        });
        moves.push(lines);
    });
    return moves;
};

/**
 * Draws the front sheet which shows the birds eye view for all stuntsheets. Copied
 * mostly from endsheet
 */
PDFGenerator.prototype._addFrontSheet = function() {
    this.pdf.vLine(WIDTH/2, 10, HEIGHT - 10);
    var title = this.show.getTitle() + " - Dot " + this.dot;
    this.pdf.setFontSize(15);
    this.pdf.text(title, WIDTH/2 - PDFUtils.getTextWidth(title, 15)/2, 8);
    var paddingX = 2;
    var paddingY = .5;
    var textSize = 10;
    var textHeight = PDFUtils.getTextHeight(textSize);
    var labelSize = 20;
    var labelWidth = PDFUtils.getTextWidth("00", labelSize) + paddingX * 2;
    var labelHeight = PDFUtils.getTextHeight(labelSize);
    var width = WIDTH/2 - labelWidth - paddingX * 3 - SIDE_MARGIN;
    var height = width * 84/160; // aspect ratio from BirdsEyeWidget
    var x = 0;
    var y = 10;
    for (var i = 0; i < this.sheets.length; i++) {
        var sheet = this.sheets[i];
        var dot = sheet.getDotByLabel(this.dot);

        if (y + height > HEIGHT - 5) {
            if (x === 0) {
                x = WIDTH/2 + paddingX - SIDE_MARGIN;
            } else {
                this.pdf.addPage();
                this.pdf.vLine(WIDTH/2, 10, HEIGHT - 10);
                this.pdf.setFontSize(15);
                this.pdf.text(title, WIDTH/2 - PDFUtils.getTextWidth(title, 15)/2, 8);
                x = 0;
            }
            y = 10;
        }

        this.pdf.setFontSize(labelSize);
        this.pdf.text(
            String(i + 1),
            x + paddingX + SIDE_MARGIN,
            y + paddingY + labelHeight
        );
        var options = {
            sheet: sheet,
            dot: dot,
            minimal: true,
        };
        this.birdsEyeWidget.draw(
            x + labelWidth + paddingX + SIDE_MARGIN,
            y + paddingY,
            width,
            height,
            options
        );
        y += height + 2 * paddingY;
    }
};

/**
 * Draws the end sheet containing a compilation of all the continuities and movements diagrams
 * 
 * @param {Array<Array<Object>>} the movements for the dot
 */
PDFGenerator.prototype._addEndSheet = function(movements) {
    this.pdf.addPage();
    this.pdf.vLine(WIDTH/2, 10, HEIGHT - 10);
    var title = this.show.getTitle() + " - Dot " + this.dot;
    this.pdf.setFontSize(15);
    this.pdf.text(title, WIDTH/2 - PDFUtils.getTextWidth(title, 15)/2, 8);
    var paddingX = 2;
    var paddingY = .5;
    var textSize = 10;
    var textHeight = PDFUtils.getTextHeight(textSize);
    var labelSize = 20;
    var labelWidth = PDFUtils.getTextWidth("00", labelSize) + paddingX * 2;
    var labelHeight = PDFUtils.getTextHeight(labelSize);
    var widgetSize = 30;
    var continuitySize = WIDTH/2 - widgetSize - labelWidth - paddingX * 3 - SIDE_MARGIN;
    var x = 0;
    var y = 10;
    for (var i = 0; i < this.sheets.length; i++) {
        var sheet = this.sheets[i];
        var dot = sheet.getDotByLabel(this.dot);

        var height = widgetSize - 5;
        var continuityHeight = (dot.getMovementCommands().length + 1) * (textHeight + 1) + 2*paddingY;
        if (continuityHeight > height) {
            height = continuityHeight;
        }

        if (y + height > HEIGHT - 5) {
            if (x == 0) {
                x = WIDTH/2 + paddingX - SIDE_MARGIN;
            } else {
                this.pdf.addPage();
                this.pdf.vLine(WIDTH/2, 10, HEIGHT - 10);
                this.pdf.setFontSize(15);
                this.pdf.text(title, WIDTH/2 - PDFUtils.getTextWidth(title, 15)/2, 8);
                x = 0;
            }
            y = 10;
        }
        this.pdf.setFontSize(labelSize);
        this.pdf.text(
            String(i + 1),
            x + paddingX + SIDE_MARGIN,
            y + paddingY + labelHeight
        );
        this.individualContinuityWidget.draw(
            x + labelWidth + paddingX + SIDE_MARGIN,
            y + paddingY,
            continuitySize,
            height,
            {
                dot: dot,
                duration: this.sheets[i].getDuration()
            }
        );
        var options = {
            sheet: sheet,
            dot: dot,
            minimal: true,
            movements: movements[i],
        };
        this.movementDiagramWidget.draw(
            x + labelWidth + continuitySize + paddingX + SIDE_MARGIN,
            y + paddingY,
            widgetSize,
            height,
            options
        );
        y += height + 2 * paddingY;
    }
};

module.exports = PDFGenerator;
