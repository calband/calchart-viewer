var MovementCommandEven = require("../viewer/MovementCommandEven");
var MovementCommandMove = require("../viewer/MovementCommandMove");
var MovementCommandStand = require("../viewer/MovementCommandStand");
var MovementCommandGoto = require("../viewer/MovementCommandGoto");
var MovementCommandMarkTime = require("../viewer/MovementCommandMarkTime");
var MovementCommandArc = require("../viewer/MovementCommandArc");
var MathUtils = require("../viewer/utils/MathUtils");
var ShowUtils = require("../viewer/utils/ShowUtils");
var PDFUtils = require("./PDFUtils");
var IndividualContinuityWidget = require("./IndividualContinuityWidget");
var MovementDiagramWidget = require("./MovementDiagramWidget");

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
    this.IndividualContinuityWidget = new IndividualContinuityWidget(this.pdf);
    this.MovementDiagramWidget = new MovementDiagramWidget(this.pdf, options["md-orientation"]);

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
            this._addDotContinuity(x, y, sheet);
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
            this._addBirdseye(
                x,
                y + QUADRANT_HEIGHT * 3/5,
                QUADRANT_WIDTH / 2,
                QUADRANT_HEIGHT * 2/5,
                sheet
            );
            this._addSurroundingDots(
                x + QUADRANT_WIDTH / 2 + 1,
                y + QUADRANT_HEIGHT * 3/5,
                QUADRANT_WIDTH / 2,
                QUADRANT_HEIGHT * 2/5,
                sheet);
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
            if (movement instanceof MovementCommandArc) {
                // each item is an Array of (deltaX, deltaY) pairs
                movement.getMiddlePoints().forEach(function(move) {
                    lines.push({
                        startPosition: startPosition,
                        deltaX: move[0],
                        deltaY: move[1]
                    });
                });
            } else {
                lines.push({
                    startPosition: startPosition,
                    deltaX: endPosition.x - startPosition.x,
                    deltaY: endPosition.y - startPosition.y
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
 * Writes one stuntsheet's continuity for the given dot type on the PDF. Includes:
 *      - Dot circle type
 *      - Overall Continuity
 *
 * @param {int} quadrantX  The x-coordinate of the top left corner of the quadrant
 * @param {int} quadrantY  The y-coordinate of the top left corner of the quadrant
 * @param {Sheet} sheet the current sheet
 */
PDFGenerator.prototype._addDotContinuity = function(quadrantX, quadrantY, sheet) {
    var _this = this;
    var box = {
        paddingX: 2,
        paddingY: 1
    };
    var text = {
        x: quadrantX + box.paddingX,
        y: quadrantY + box.paddingY,
        size: 10
    };
    var dotType = sheet.getDotType(this.dot);
    var maxWidth = QUADRANT_WIDTH - box.paddingX * 2 - 6;
    var maxHeight = QUADRANT_HEIGHT/5 - box.paddingY * 2 - 3;
    var continuities = sheet.getContinuityTexts(dotType);

    this.pdf.rect(quadrantX, quadrantY, QUADRANT_WIDTH, QUADRANT_HEIGHT/5 - 1.5);

    // fail-safe for sheets without Continuity Texts
    if (typeof continuities === "undefined") {
        return;
    }

    continuities = continuities.map(function(continuity) {
        while (PDFUtils.getTextWidth(continuity, text.size) > maxWidth) {
            text.size--;
        }
        return continuity;
    });

    while (continuities.length * PDFUtils.getTextHeight(text.size) > maxHeight) {
        text.size--;
    }

    this.pdf.drawDot(
        dotType,
        text.x + 1.5,
        text.y + 2
    );
    text.x += 4;
    this.pdf.setFontSize(10);
    this.pdf.text(
        ":",
        text.x,
        text.y + PDFUtils.getTextHeight(10)
    );
    this.pdf.setFontSize(text.size);
    text.x += 2;
    text.y += PDFUtils.getTextHeight(text.size);
    this.pdf.text(
        continuities,
        text.x,
        text.y
    );
};

/**
 * Draws the overall bird's eye view of the field. Includes:
 *      - Field outline, no yardlines
 *      - Grayed out dots
 *      - Black selected dot
 *      - Cross hairs for positions (4S N40, 2E WH)
 *      - Hashes and sidelines indicated
 *
 * @param {int} x  The x-coordinate of the top left corner of the box
 * @param {int} y  The y-coordinate of the top left corner of the box
 * @param {double} width     The width of the box
 * @param {double} height    The height of the box
 * @param {Sheet} sheet
 */
PDFGenerator.prototype._addBirdseye = function(x, y, width, height, sheet) {
    var _this = this;

    var boxWidth = width - 2 * (PDFUtils.getTextWidth("S", 12) + 1.5)

    var box = {
        height: boxWidth * 84/160,
        width: boxWidth,
        x: x,
        y: y,
        textSize: 12,

        draw: function() {
            this.x += width/2 - this.width/2;
            this.y += height/2 - this.height/2;
            var textHeight = PDFUtils.getTextHeight(this.textSize);
            var textWidth = PDFUtils.getTextWidth("S", this.textSize);
            _this.pdf.setFontSize(this.textSize);
            _this.pdf.text(
                "W",
                this.x + this.width/2 - textWidth/2,
                this.y - 1
            );
            _this.pdf.text(
                "N",
                this.x + this.width + 1,
                this.y + this.height/2 + textHeight/2
            );
            _this.pdf.text(
                "E",
                this.x + this.width/2 - textWidth/2,
                this.y + this.height + textHeight
            );
            _this.pdf.text(
                "S",
                this.x - textWidth - 1,
                this.y + this.height/2 + textHeight/2
            );
            _this.pdf.rect(
                this.x,
                this.y,
                this.width,
                this.height
            );
        }
    };

    box.draw();

    var dots = sheet.getDots();
    var currentDot = sheet.getDotByLabel(this.dot);
    var scale = box.width / 160; // units per step
    var startX = box.x;
    var startY = box.y;

    // drawing hashes
    this.pdf.setLineWidth(.2);
    var numDashes = 21;
    var dashLength = box.width / numDashes;
    var westHash = startY + 32 * scale;
    var eastHash = startY + 52 * scale;
    for (var i = 0; i < numDashes; i++) {
        if (i % 2 == 0) {
            this.pdf.setDrawColor(150);
        } else {
            this.pdf.setDrawColor(255);
        }
        var x = startX + i * dashLength;
        this.pdf.line(
            x, westHash,
            x + dashLength, westHash
        );
        this.pdf.line(
            x, eastHash,
            x + dashLength, eastHash
        );
    }

    this.pdf.setFillColor(210);
    for (var i = 0; i < dots.length; i++) {
        var dot = dots[i];
        if (dot === currentDot) { // skip currently selected dot
            continue;
        }
        var position = dot.getAnimationState(0);
        this.pdf.circle(
            startX + position.x * scale,
            startY + position.y * scale,
            .5,
            "F"
        );
    }

    var position = currentDot.getAnimationState(0);
    var x = position.x * scale;
    var y = position.y * scale;

    var coordinates = {
        textSize: 8,
        textX: PDFUtils.getXCoordinateText(position.x),
        textY: PDFUtils.getYCoordinateText(position.y)
    };

    coordinates.x = startX + x - PDFUtils.getTextWidth(coordinates.textX, coordinates.textSize)/2;
    coordinates.y = startY + y + PDFUtils.getTextHeight(coordinates.textSize)/4;

    this.pdf.setFillColor(0);
    this.pdf.setDrawColor(180);
    this.pdf.setFontSize(coordinates.textSize);

    this.pdf.line(
        startX + x, box.y,
        startX + x, box.y + box.height
    );
    this.pdf.line(
        startX, startY + y,
        startX + box.width, startY + y
    );

    // Put vertical coordinate text on opposite side of the field
    if (position.x > 80) {
        this.pdf.text(
            coordinates.textY,
            startX + 1,
            coordinates.y
        );
    } else {
        this.pdf.text(
            coordinates.textY,
            startX + box.width - PDFUtils.getTextWidth(coordinates.textY, coordinates.textSize) - 1,
            coordinates.y
        );
    }

    // Put horizontal coordinate text on opposite side of the field
    if (position.y > 42) {
        this.pdf.text(
            coordinates.textX,
            coordinates.x,
            box.y + PDFUtils.getTextHeight(coordinates.textSize)
        );
    } else {
        this.pdf.text(
            coordinates.textX,
            coordinates.x,
            box.y + box.height - 1
        );
    }
    this.pdf.circle(startX + x, startY + y, .5, 'F');
    this.pdf.setLineWidth(.3);
    this.pdf.setDrawColor(0);
};

/**
 * Draws the dots surrounding the selected dot. Includes:
 *      - Orientation always E up (for now)
 *      - 4 step radius
 *      - Solid line cross hairs; selected dot in middle
 *      - Dot labels
 *      - Dot types
 *
 * @param {int} x  The x-coordinate of the top left corner of the box
 * @param {int} y  The y-coordinate of the top left corner of the box
 * @param {double} width  The width of the box
 * @param {double} height The height of the box
 * @param {Sheet} sheet
 */
PDFGenerator.prototype._addSurroundingDots = function(x, y, width, height, sheet) {
    var _this = this;
    var box = {
        height: height - 2 * (PDFUtils.getTextHeight(12) + 2),
        x: x,
        y: y,
        textSize: 12,
        labelSize: 7,

        draw: function() {
            var textHeight = PDFUtils.getTextHeight(this.textSize);
            var textWidth = PDFUtils.getTextWidth("S", this.textSize);
            this.width = this.height; // make square
            _this.pdf.setFontSize(this.textSize);
            _this.pdf.text(
                "E",
                this.x + width/2 - textWidth/2,
                this.y + textHeight
            );
            _this.pdf.text(
                "S",
                this.x + width - textWidth - 4.5,
                this.y + height/2 + textHeight/2
            );
            _this.pdf.text(
                "W",
                this.x + width/2 - textWidth/2,
                this.y + height - 1
            );
            _this.pdf.text(
                "N",
                this.x + 4.5,
                this.y + height/2 + textHeight/2
            );
            this.x += width/2 - this.width/2;
            this.y += textHeight + 2;
            _this.pdf.rect(
                this.x,
                this.y,
                this.width,
                this.height
            );
            _this.pdf.setDrawColor(150);
            _this.pdf.setLineWidth(.1);
            // cross hairs for selected dot
            _this.pdf.line(
                this.x + this.width/2, this.y,
                this.x + this.width/2, this.y + this.height
            );
            _this.pdf.line(
                this.x, this.y + this.height/2,
                this.x + this.width, this.y + this.height/2
            );
            _this.pdf.setDrawColor(0);
            _this.pdf.setLineWidth(.3);
        }
    };

    var start = sheet.getDotByLabel(this.dot).getAnimationState(0);
    var allDots = sheet.getDots();
    var surroundingDots = [];
    for (var i = 0; i < allDots.length; i++) {
        var position = allDots[i].getAnimationState(0);
        var x = start.x - position.x;
        var y = start.y - position.y;
        // keep dots within 4 steps
        if (Math.abs(x) <= 4 && Math.abs(y) <= 4) {
            var label = allDots[i].getLabel();
            surroundingDots.push({
                deltaX: x,
                deltaY: y,
                label: label,
                type: sheet.getDotType(label)
            });
        }
    }

    box.draw();

    var origin = {
        x: box.x + box.width/2,
        y: box.y + box.height/2
    };
    var scale = box.height / 11; // radius of 4 steps + 1.5 steps of padding
    for (var i = 0; i < surroundingDots.length; i++) {
        var dot = surroundingDots[i];
        var x = dot.deltaX * scale + origin.x;
        var y = dot.deltaY * scale + origin.y;
        this.pdf.setFontSize(box.labelSize);
        this.pdf.drawDot(dot.type, x, y);
        this.pdf.text(dot.label, x - 3, y - 2);
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
