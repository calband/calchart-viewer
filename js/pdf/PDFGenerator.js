var PDFUtils = require("./PDFUtils");
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
 * generate will generate a PDF for a specific dot, containing its movements,
 * positions, and continuities relevant to it.
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
    this.DotContinuityWidget = new DotContinuityWidget(this.pdf);
    this.IndividualContinuityWidget = new IndividualContinuityWidget(this.pdf);
    this.MovementDiagramWidget = new MovementDiagramWidget(this.pdf, options["md-orientation"]);
    this.BirdsEyeWidget = new BirdsEyeWidget(this.pdf, options["bev-orientation"]);
    this.SurroundingDotsWidget = new SurroundingDotsWidget(this.pdf, options["sd-orientation"]);

    var continuityTexts = this._getContinuityTexts();
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

        this._addHeaders(pageNum + 1, options["layout-order"] === "ltr");
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
            this.DotContinuityWidget.draw(
                x,
                y,
                QUADRANT_WIDTH,
                QUADRANT_HEIGHT/5,
                {
                    sheet: sheet,
                    dotType: sheet.getDotType(this.dot)
                }
            );
            this.IndividualContinuityWidget.draw(
                x,
                y + QUADRANT_HEIGHT / 5,
                QUADRANT_WIDTH / 2,
                QUADRANT_HEIGHT * 2/5,
                {
                    continuities: continuityTexts[pageNum * 4 + i],
                    duration: sheet.getDuration()
                }
            );
            this.MovementDiagramWidget.draw(
                x + QUADRANT_WIDTH/2 + 1,
                y + QUADRANT_HEIGHT/5,
                QUADRANT_WIDTH/2,
                QUADRANT_HEIGHT * 2/5,
                { movements: movements[pageNum * 4 + i] }
            );
            this.BirdsEyeWidget.draw(
                x,
                y + QUADRANT_HEIGHT * 3/5,
                QUADRANT_WIDTH/2,
                QUADRANT_HEIGHT * 2/5,
                {
                    sheet: sheet,
                    dot: sheet.getDotByLabel(this.dot)
                }
            );
            this.SurroundingDotsWidget.draw(
                x + QUADRANT_WIDTH/2 + 1,
                y + QUADRANT_HEIGHT * 3/5,
                QUADRANT_WIDTH/2,
                QUADRANT_HEIGHT * 2/5,
                {
                    sheet: sheet,
                    dot: sheet.getDotByLabel(this.dot)
                }
            );
        }
    }
    this._addEndSheet(continuityTexts, movements);

    var pdfData = this.pdf.output("datauristring");
    $(".js-pdf-preview").removeAttr("srcdoc");
    $(".js-pdf-preview").attr("src", pdfData);
};

/*
 * Returns all of the selected dot's individual continuity texts
 * @return {Array<Array<String>>} an Array of continuity texts for each sheet
 */
PDFGenerator.prototype._getContinuityTexts = function() {
    var showContinuities = [];
    var dotLabel = this.dot;
    this.sheets.forEach(function(sheet) {
        var continuities = [];
        sheet.getDotByLabel(dotLabel).getMovementCommands().forEach(function(movement) {
            var text = movement.getContinuityText();
            if (text !== "") {
                continuities.push(text);
            }
        });
        showContinuities.push(continuities);
    });
    return showContinuities;
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
 * Draws the headers on the PDF. Includes:
 *      - Stuntsheet number
 *      - Dot number
 *      - Show title
 *      - Page number
 *
 * @param {int} pageNum is the current 1-indexed page number
 * @param {boolean} isLeftToRight, true if stuntsheets go from left to write, false otherwise
 */
PDFGenerator.prototype._addHeaders = function(pageNum, isLeftToRight) {
    var _this = this;
    var totalPages = Math.ceil(this.sheets.length/4);
    var title = this.show.getTitle();
    var dot = "Dot " + this.dot;

    var header = {
        x: WIDTH * 1/6,
        y: 5,
        width: WIDTH * 2/3,
        height: 17, // PDFUtils.getTextHeight(16) * 3
        paddingX: 3,
        paddingY: 1,
        size: 16
    };

    var pageInfo = {
        size: 12,
        draw: function(x, y) {
            _this.pdf.text("Page ", x, y);
            x += 10.9; // PDFUtils.getTextWidth("Page ", this.size)

            _this.pdf.text(String(pageNum), x, y - 1);
            x += PDFUtils.getTextWidth(String(pageNum), this.size);

            _this.pdf.text("/", x, y);
            x += 1.2; //PDFUtils.getTextWidth("/", this.size)

            _this.pdf.text(String(totalPages), x, y + 1);
        }
    };

    var sheetInfo = {
        marginX: 4,
        marginY: 3,
        size: 28,
        sheet: (pageNum - 1) * 4 + 1,

        getTop: function() {
            return this.marginY + this.height;
        },

        getBottom: function() {
            return this.getTop() + HEIGHT/2;
        },

        getLeft: function() {
            return this.marginX;
        },

        getRight: function() {
            return WIDTH - PDFUtils.getTextWidth("SS " + this.sheet, this.size) - sheetInfo.marginX;
        },

        hasNext: function() {
            return ++this.sheet <= _this.sheets.length;
        },

        draw: function(x, y) {
            _this.pdf.text("SS " + this.sheet, x, y);
        }
    };

    /* Title and Page information */
    this.pdf.rect(header.x, header.y, header.width, header.height);

    /* Title */
    this.pdf.setFontSize(header.size);
    this.pdf.text(
        title,
        WIDTH/2 - PDFUtils.getTextWidth(title, header.size)/2,
        header.y + header.paddingY + PDFUtils.getTextHeight(header.size)
    );

    /* Dot */
    this.pdf.setFontSize(header.size - 3);
    this.pdf.text(
        dot,
        WIDTH/2 - PDFUtils.getTextWidth(dot, header.size)/2,
        header.y + header.paddingY + PDFUtils.getTextHeight(header.size) * 2
    );

    /* Page Info */
    this.pdf.setFontSize(pageInfo.size);
    var x = header.x + header.paddingX;
    var y = header.y + header.height/2 + PDFUtils.getTextHeight(pageInfo.size)/2;
    pageInfo.draw(x, y);

    x = WIDTH * 5/6 - header.paddingX - PDFUtils.getTextWidth("Page 0/0", pageInfo.size);
    pageInfo.draw(x, y);

    /* Stuntsheet */
    sheetInfo.height = PDFUtils.getTextHeight(sheetInfo.size);
    sheetInfo.width = PDFUtils.getTextWidth("SS 00", sheetInfo.size) + sheetInfo.marginX;
    this.pdf.setFontSize(sheetInfo.size);

    sheetInfo.draw(sheetInfo.getLeft(), sheetInfo.getTop());

    if (sheetInfo.hasNext()) {
        if (isLeftToRight) {
            sheetInfo.draw(sheetInfo.getRight(), sheetInfo.getTop());
        } else {
            sheetInfo.draw(sheetInfo.getLeft(), sheetInfo.getBottom());
        }
    }

    if (sheetInfo.hasNext()) {
        if (isLeftToRight) {
            sheetInfo.draw(sheetInfo.getLeft(), sheetInfo.getBottom());
        } else {
            sheetInfo.draw(sheetInfo.getRight(), sheetInfo.getTop());
        }
    }

    if (sheetInfo.hasNext()) {
        sheetInfo.draw(sheetInfo.getRight(), sheetInfo.getBottom());
    }
};

/**
 * Draws the end sheet containing a compilation of all the continuities and movements diagrams
 * @param {Array<Array<String>>} continuityTexts a list of continuities grouped by stuntsheet
 * @param {Array<Array<Object>>} movements a list of movement objects grouped by stuntsheet
 */
PDFGenerator.prototype._addEndSheet = function(continuityTexts, movements) {
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
    var diagramSize = 30;
    var continuitySize = WIDTH/2 - diagramSize - labelWidth - paddingX * 4;
    var x = 0;
    var y = 10;
    for (var i = 0; i < this.sheets.length; i++) {
        var height = diagramSize - 9;
        var continuityHeight = (continuityTexts[i].length + 1) * (textHeight + 1) + 2*paddingY;
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
        this.IndividualContinuityWidget.draw(
            x + labelWidth + paddingX,
            y + paddingY,
            continuitySize,
            height,
            {
                continuities: continuityTexts[i],
                duration: this.sheets[i].getDuration()
            }
        );
        this.MovementDiagramWidget.draw(
            x + labelWidth + continuitySize + paddingX * 2,
            y + paddingY,
            diagramSize,
            diagramSize,
            {
                movements: movements[i],
                minimal: true
            }
        );
        y += height + 2 * paddingY;
    }
};

module.exports = PDFGenerator;
