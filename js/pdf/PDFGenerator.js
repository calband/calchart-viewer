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
 * @constant QUADRANT contains (x,y) coordinates for the top left corner of each quadrant
 *      of the document. y coordinates offset by headers
 */
var WIDTH = 215.9;
var HEIGHT = 279.4;

var QUADRANT = [
    {x: 3, y: 24},                     // top left
    {x: WIDTH/2 + 3, y: 24},           // top right
    {x: 3, y: HEIGHT/2 + 16},          // bottom left
    {x: WIDTH/2 + 3, y: HEIGHT/2 + 16} // bottom right
];
var QUADRANT_HEIGHT = HEIGHT/2 - 22;
var QUADRANT_WIDTH = WIDTH/2 - 6;

/**
 * This PDFGenerator class will be able to generate the PDF representation of the given
 * show, for the given dot.
 *
 * @param {Show} show
 * @param {String} dot is the label of the selected dot
 */
var PDFGenerator = function(show, dot) {
    this.pdf = jsPDF("portrait", "mm", "letter");
    this.show = show;
    this.dot = dot;
    this.sheets = show.getSheets();
};

/**
 * generate a PDF for a specific dot, containing its movements, positions, and continuities
 * relevant to it.
 *
 * The function will display the pdf in the webpage's preview pane
 *
 * @param {Object} options, customizable options for the pdf. Current options include:
 *      - Orientation for movement diagram (options["md-orientation"] = "west"|"east")
 *      - Orientation for bird's eye view  (options["bev-orientation"] = "west"|"east")
 *      - Orientation for surrounding dots (options["sd-orientation"] = "west"|"east")
 *      - Layout order of stuntsheets      (options["layout-order"] = "ltr"|"ttb")
 *      - Accompanying widget in endsheet  (options["endsheet-widget"] = "md"|"bev"|"sd")
 */
PDFGenerator.prototype.generate = function(options) {
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

    var movements = this._getMovements();
    for (var pageNum = 0; pageNum < Math.ceil(this.sheets.length / 4); pageNum++) {
        if (pageNum != 0) {
            this.pdf.addPage();
        }

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
        this.pdf.line(
            WIDTH/2, 24,
            WIDTH/2, HEIGHT
        );
        this.pdf.line(
            0, HEIGHT/2 + 2.5,
            WIDTH, HEIGHT/2 + 2.5
        );
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
                QUADRANT_HEIGHT/5,
                {
                    sheet: sheet,
                    dotType: sheet.getDotType(this.dot)
                }
            );
            this.individualContinuityWidget.draw(
                x,
                y + QUADRANT_HEIGHT / 5,
                QUADRANT_WIDTH / 2,
                QUADRANT_HEIGHT * 2/5,
                {
                    dot: dot,
                    duration: sheet.getDuration()
                }
            );
            this.movementDiagramWidget.draw(
                x + QUADRANT_WIDTH/2 + 1,
                y + QUADRANT_HEIGHT/5,
                QUADRANT_WIDTH/2,
                QUADRANT_HEIGHT * 2/5,
                {
                    movements: movements[pageNum * 4 + i]
                }
            );
            this.birdsEyeWidget.draw(
                x,
                y + QUADRANT_HEIGHT * 3/5,
                QUADRANT_WIDTH/2,
                QUADRANT_HEIGHT * 2/5,
                {
                    sheet: sheet,
                    dot: dot
                }
            );
            this.surroundingDotsWidget.draw(
                x + QUADRANT_WIDTH/2 + 1,
                y + QUADRANT_HEIGHT * 3/5,
                QUADRANT_WIDTH/2,
                QUADRANT_HEIGHT * 2/5,
                {
                    sheet: sheet,
                    dot: dot
                }
            );
        }
    }
    var endsheetWidget;
    switch(options["endsheet-widget"]) {
        case "md":
            endsheetWidget = this.movementDiagramWidget;
            break;
        case "bev":
            endsheetWidget = this.birdsEyeWidget;
            break;
        case "sd":
            endsheetWidget = this.surroundingDotsWidget;
            break;
        default:
            throw new Error(options["endsheet-widget"] + " is not a valid option for endsheet widget");
    }
    if (endsheetWidget instanceof MovementDiagramWidget) {
        this._addEndSheet(endsheetWidget, {movements: movements});
    } else {
        this._addEndSheet(endsheetWidget);
    }

    var pdfData = this.pdf.output("datauristring");
    $(".js-pdf-preview").removeAttr("srcdoc");
    $(".js-pdf-preview").attr("src", pdfData);
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
 * Draws the end sheet containing a compilation of all the continuities and movements diagrams
 * 
 * @param {PDFWidget} the widget to place next to the individual continuity
 * @param {object} options, contains options for the widgets, if necessary.
 */
PDFGenerator.prototype._addEndSheet = function(widget, options) {
    this.pdf.addPage();
    this.pdf.line(
        WIDTH/2, 10,
        WIDTH/2, HEIGHT
    );
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
    var continuitySize = WIDTH/2 - widgetSize - labelWidth - paddingX * 4;
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
                x = WIDTH/2 + paddingX;
            } else {
                this.pdf.addPage();
                this.pdf.line(
                    WIDTH/2, 10,
                    WIDTH/2, HEIGHT
                );
                this.pdf.setFontSize(15);
                this.pdf.text(title, WIDTH/2 - PDFUtils.getTextWidth(title, 15)/2, 8);
                x = 0;
            }
            y = 10;
        }
        this.pdf.setFontSize(labelSize);
        this.pdf.text(
            String(i + 1),
            x + paddingX * 2,
            y + paddingY + labelHeight
        );
        this.individualContinuityWidget.draw(
            x + labelWidth + paddingX,
            y + paddingY,
            continuitySize,
            height,
            {
                dot: dot,
                duration: this.sheets[i].getDuration()
            }
        );
        var widgetOptions = {
            sheet: sheet,
            dot: dot,
            minimal: true
        };
        if (widget instanceof MovementDiagramWidget) {
            widgetOptions["movements"] = options["movements"][i];
        }
        widget.draw(
            x + labelWidth + continuitySize + paddingX * 2,
            y + paddingY,
            widgetSize,
            height,
            widgetOptions
        );
        y += height + 2 * paddingY;
    }
};

module.exports = PDFGenerator;
