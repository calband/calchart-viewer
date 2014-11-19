/**
 * @fileOverview This file will export a class that can generate a PDF representation
 * of dots and movements
 *
 * @constant WIDTH is the width of the PDF document, in millimeters
 * @constant HEIGHT is the height of the PDF document, in millimeters
 * @constant QUADRANT contains (x,y) coordinates for the top left corner of each quadrant
 *      of the document. y coordinates offset by headers
 * @constant DOT_DATA contains the JPEG image data for the different dot types
 */

var MovementCommandEven = require("./MovementCommandEven");
var MovementCommandMove = require("./MovementCommandMove");
var MovementCommandStand = require("./MovementCommandStand");
var MovementCommandGoto = require("./MovementCommandGoto");
var MovementCommandMarkTime = require("./MovementCommandMarkTime");
var MovementCommandArc = require("./MovementCommandArc");
var MathUtils = require("./MathUtils");

/* CONSTANTS: DON'T CHANGE */
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
 * The function will end with a save call, which will prompt a new window and/or
 * a dialog box to download the generated PDF.
 */
PDFGenerator.prototype.generate = function() {
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

        this._addHeaders(pageNum + 1);
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

        for (var i = 0; i < pageSheets.length; i++) {
            var x = QUADRANT[i].x;
            var y = QUADRANT[i].y;
            var sheet = pageSheets[i];
            this._addDotContinuity(x, y, sheet);
            this._addIndividualContinuity(x, y, sheet);
            this._addMovementDiagram(x, y, sheet);
            this._addBirdseye(x, y, sheet);
            this._addSurroundingDots(x, y, sheet);
        }
    }
    // CHANGE TO this.pdf.save LATER
    this.pdf.output("dataurlnewwindow");
};

/**
 * Returns the width of a String, in whatever units this.pdf is currently using
 * @param {String} text
 * @param {int} size, font size the text will be in
 */
PDFGenerator.prototype._getTextWidth = function(text, size) {
    return this.pdf.getStringUnitWidth(text) * size/this.pdf.internal.scaleFactor
};

/**
 * Returns the height of text in the current fontsize, in whatever units this.pdf is
 * currently using
 * @param {int} size, font size the text will be in
 */
PDFGenerator.prototype._getTextHeight = function(size) {
    return size/this.pdf.internal.scaleFactor;
};

/**
 * Draws the dot for the given dot type at the given coordinates
 * @param {String} dotType
 * @param {int} x
 * @param {int} y
 */
PDFGenerator.prototype._drawDot = function(dotType, x, y) {
    var radius = 1.5;
    this.pdf.setLineWidth(.1);
    if (dotType.indexOf("open") != -1) {
        this.pdf.setFillColor(255);
        this.pdf.circle(x, y, radius, "FD");
    } else {
        this.pdf.setFillColor(0);
        this.pdf.circle(x, y, radius, "FD");
    }

    radius += .1; // line radius sticks out of the circle
    if (dotType.indexOf("backslash") != -1 || dotType.indexOf("x") != -1) {
        this.pdf.line(
            x - radius, y - radius,
            x + radius, y + radius
        );
    }

    if (dotType.indexOf("forwardslash") != -1 || dotType.indexOf("x") != -1) {
        this.pdf.line(
            x + radius, y - radius,
            x - radius, y + radius
        );
    }
    this.pdf.setLineWidth(.3);
    this.pdf.setFillColor(0);
};

/**
 * Draws the headers on the PDF. Includes:
 *      - Stuntsheet number
 *      - Dot number
 *      - "California Marching Band: <show title>"
 *      - Page number
 *
 * @param {int} pageNum is the current 1-indexed page number
 */
PDFGenerator.prototype._addHeaders = function(pageNum) {
    var totalPages = Math.ceil(this.sheets.length/4);
    var _this = this; // for use in nested functions

    var header = {
        title: {
            text: _this.show.getTitle(),
            label: "Dot " + _this.dot,
            size: 16,

            getX: function(text) {
                return WIDTH/2 - _this._getTextWidth(text, this.size)/2;
            },

            getY: function() {
                return header.y + header.paddingY + _this._getTextHeight(this.size);
            }
        },

        pageInfo: {
            size: 12,

            getWidth: function() {
                return _this._getTextWidth("Page " + pageNum + "/" + totalPages, this.size);
            },

            getHeight: function() {
                return _this._getTextHeight(this.size);
            },

            draw: function() {
                _this.pdf.text(
                    "Page ",
                    this.x,
                    this.y
                )
                this.x += _this._getTextWidth("Page ", this.size);
                _this.pdf.text(
                    String(pageNum),
                    this.x,
                    this.y - 1
                );
                this.x += _this._getTextWidth(String(pageNum), this.size);
                _this.pdf.text(
                    "/",
                    this.x,
                    this.y
                );
                this.x += _this._getTextWidth("/", this.size);
                _this.pdf.text(
                    String(totalPages),
                    this.x,
                    this.y + 1
                );
            }
        },

        x: WIDTH * 1/6,
        y: 5,
        width: WIDTH * 2/3,
        height: _this._getTextHeight(16) * 3,
        paddingX: 3,
        paddingY: 1,

        draw: function() {
            /* box */
            _this.pdf.rect(this.x, this.y, this.width, this.height);

            /* title */
            _this.pdf.setFontSize(this.title.size);
            _this.pdf.text(
                this.title.text,
                this.title.getX(this.title.text),
                this.title.getY()
            );
            _this.pdf.setFontSize(this.title.size - 3);
            _this.pdf.text(
                this.title.label,
                this.title.getX(this.title.label),
                this.title.getY() + _this._getTextHeight(this.title.size - 3) + 2
            );

            /* page info */
            _this.pdf.setFontSize(this.pageInfo.size);
            this.pageInfo.x = this.x + this.paddingX;
            this.pageInfo.y = this.y + this.height/2 + this.pageInfo.getHeight()/2;
            this.pageInfo.draw();

            this.pageInfo.x = WIDTH * 5/6 - this.paddingX - this.pageInfo.getWidth();
            this.pageInfo.draw();
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
            return WIDTH - this.width;
        },

        hasNext: function() {
            return ++this.sheet <= _this.sheets.length;
        },

        draw: function(x, y) {
            _this.pdf.text("SS " + this.sheet, x, y);
        }
    };

    /* Title and Page information */
    header.draw();

    /* Stuntsheet */
    sheetInfo.height = _this._getTextHeight(sheetInfo.size);
    sheetInfo.width = _this._getTextWidth("SS 00", sheetInfo.size) + sheetInfo.marginX;
    _this.pdf.setFontSize(sheetInfo.size);

    sheetInfo.draw(sheetInfo.getLeft(), sheetInfo.getTop());

    if (sheetInfo.hasNext()) {
        sheetInfo.draw(sheetInfo.getRight(), sheetInfo.getTop());
    }

    if (sheetInfo.hasNext()) {
        sheetInfo.draw(sheetInfo.getLeft(), sheetInfo.getBottom());
    }

    if (sheetInfo.hasNext()) {
        sheetInfo.draw(sheetInfo.getRight(), sheetInfo.getBottom());
    }
};

/**
 * Writes one stuntsheet's continuity for the given dot type on the PDF. Includes:
 *      - Dot circle type
 *      - Overall Continuity
 *      - Measure/beat number
 *
 * @param {int} quadrantX  The x-coordinate of the top left corner of the quadrant
 * @param {int} quadrantY  The y-coordinate of the top left corner of the quadrant
 * @param {Sheet} sheet the current sheet
 */
PDFGenerator.prototype._addDotContinuity = function(quadrantX, quadrantY, sheet) {
    var _this = this; // for use in nested functions

    var box = {
        paddingX: 2,
        paddingY: 1,

        draw: function(height) {
            _this.pdf.rect(quadrantX, quadrantY, QUADRANT_WIDTH, height);
        }
    };

    var text = {
        x: quadrantX + box.paddingX,
        y: quadrantY + box.paddingY,
        size: 10,

        // width is the width of the containing box
        draw: function() {
            var _size = this.size;
            var dotType = sheet.getDotType(_this.dot);
            var maxWidth = QUADRANT_WIDTH - box.paddingX*2 - 6;

            var continuities = sheet.getContinuityTexts(dotType);

            // fail-safe for sheets without Continuity Texts
            if (typeof continuities === "undefined") {
                box.draw(_this._getTextHeight(_size) + box.paddingY * 2 + 1);
                return;
            }

            continuities = continuities.map(function(text) {
                while (_this._getTextWidth(text, _size) > maxWidth) {
                    _size--;
                }

                return text;
            });

            var maxHeight = (QUADRANT_HEIGHT/5 - 2*box.paddingY - 3);
            while (continuities.length * _this._getTextHeight(_size) > maxHeight) {
                _size -= 1;
            }

            _this.pdf.setFontSize(this.size);
            _this._drawDot(dotType, this.x + 1.5, this.y + 2);
            this.x += 4;
            _this.pdf.text(
                ":",
                this.x,
                this.y + _this._getTextHeight(this.size)
            );
            _this.pdf.setFontSize(_size);
            this.x += 2;
            this.y += _this._getTextHeight(_size);
            _this.pdf.text(
                continuities,
                this.x,
                this.y
            );

            var height = _this._getTextHeight(_size) * continuities.length + 2*box.paddingY + 3;
            box.draw(height);
        }
    };

    text.draw();
};

/**
 * Writes the continuities for the selected dot on the PDF. Includes:
 *      - Movements
 *      - Total beats
 *      - Border between general movements, e.g. Stand and Play vs. Continuity
 *
 * @param {int} quadrantX  The x-coordinate of the top left corner of the quadrant
 * @param {int} quadrantY  The y-coordinate of the top left corner of the quadrant
 * @param {Sheet} sheet the current stuntsheet
 */
PDFGenerator.prototype._addIndividualContinuity = function(quadrantX, quadrantY, sheet) {
    var _this = this;

    var box = {
        height: QUADRANT_HEIGHT * 2/5,
        width: QUADRANT_WIDTH / 2,
        x: quadrantX,
        y: quadrantY + QUADRANT_HEIGHT / 5,
        paddingX: 2,
        paddingY: 1.5,
        size: 10,
        movements: [],

        draw: function() {
            _this.pdf.rect(this.x, this.y, this.width, this.height);
            var textHeight = _this._getTextHeight(this.size);
            var textY = this.y + this.paddingY + textHeight;
            var textX = this.x + this.paddingX;
            for (var i = 0; i < this.movements.length; i++) {
                var _size = this.size;
                var maxWidth = this.width - this.paddingX * 2;
                while (_this._getTextWidth(this.movements[i], _size) > maxWidth) {
                    _size--;
                }

                _this.pdf.setFontSize(_size);
                _this.pdf.text(
                    this.movements[i],
                    textX,
                    textY + (textHeight + 1) * i
                );
            }

            var totalLabel = sheet.getDuration() + " beats total";
            _this.pdf.setFontSize(this.size);
            _this.pdf.text(
                totalLabel,
                quadrantX + this.width/2 - _this._getTextWidth(totalLabel, this.size)/2 - 3,
                this.y + this.height - this.paddingY
            );
        }
    };

    var movements = sheet.getDotByLabel(this.dot).getMovementCommands();
    for (var i = 0; i < movements.length; i++) {
        var movement = movements[i];
        var orientation = movement.getOrientation();
        switch (orientation) {
            case 0:
                orientation = "E"; break;
            case 90:
                orientation = "S"; break;
            case 180:
                orientation = "W"; break;
            case 270:
                orientation = "N"; break;
            case "CW":
            case "CCW":
                break;
            default:
                orientation = "";
        }
        var start = movement.getStartPosition();
        var end = movement.getEndPosition();
        var deltaX = end.x - start.x;
        var deltaY = end.y - start.y;
        var dirX = (deltaX < 0) ? "S" : "N";
        var dirY = (deltaY < 0) ? "W" : "E";
        deltaX = Math.abs(deltaX);
        deltaY = Math.abs(deltaY);

        var text;

        // If movement is an Even, but behaves like a Move, treat as MovementCommandMove
        var isMoveCommand = function() {
            if (movement instanceof MovementCommandMove) {
                return true;
            }
            if (movement instanceof MovementCommandEven) {
                var steps = movement.getBeatDuration() / movement.getBeatsPerStep();
                if (steps == deltaX && deltaY == 0) {
                    return true;
                }
                if (steps == deltaY && deltaX == 0) {
                    return true;
                }
            }
            return false;
        }();

        if (isMoveCommand) {
            // MovementCommandMoves only move in one direction: X or Y
            if (deltaX == 0) {
                text = "Move " + deltaY + dirY;
            } else {
                text = "Move " + deltaX + dirX;
            }
        } else if (movement instanceof MovementCommandMarkTime) {
            if (movement.getBeatDuration() == 0) {
                continue;
            }
            text = "MT " + movement.getBeatDuration() + orientation;
        } else if (movement instanceof MovementCommandStand) {
            text = "Close " + movement.getBeatDuration() + orientation;
        } else if (movement instanceof MovementCommandEven) {
            text = "Even ";
            // If movement is a fraction of steps, simply say "NE" or "S"
            if (deltaX % 1 != 0 || deltaY % 1 != 0) {
                text += (deltaX != 0) ? dirX : "";
                text += (deltaY != 0) ? dirY : "";
            } else {
                // End result will be concat. of directions, e.g. "Even 8E, 4S"
                var moveTexts = [];
                if (deltaY != 0) {
                    moveTexts.push(deltaY + dirY);
                }
                if (deltaX != 0) {
                    moveTexts.push(deltaX + dirX);
                }
                text += moveTexts.join(", ");
            }
            // Error checking for an even move without movement in any direction
            if (text === "Even ") {
                text += "0";
            }
            var steps = movement.getBeatDuration() / movement.getBeatsPerStep();
            text += " (" + steps + " steps)";
        } else if (movement instanceof MovementCommandGoto) {
            text = "See Continuity (" + movement.getBeatDuration() + " beats)";
        } else if (movement instanceof MovementCommandArc) {
            text = "GT " + orientation + " " + movement.getAngle() + " deg. (" + movement.getBeatDuration() + " steps)";
        } else {
            throw new TypeError("Class not recognized: " + type);
        }
        box.movements.push(text);
    }
    box.draw();
};

/**
 * Draws the diagram for a selected dot's movements. Includes:
 *      - Circle for start
 *      - Cross for end
 *      - Path line and number of steps per movement
 *      - Yard lines, yard line markers
 *      - Hashes if in viewport
 *      - Zooming if big
 *      - Orientation EWNS; East is up
 *
 * @param {int} quadrantX  The x-coordinate of the top left corner of the quadrant
 * @param {int} quadrantY  The y-coordinate of the top left corner of the quadrant
 * @param {Sheet} sheet
 */
PDFGenerator.prototype._addMovementDiagram = function(quadrantX, quadrantY, sheet) {
    var _this = this;

    // draws box and field
    var box = {
        height: QUADRANT_HEIGHT * 2/5 - 2 * (this._getTextHeight(12) + 2),
        width: QUADRANT_WIDTH / 2 - 2 * (this._getTextWidth("S", 12) + 1.5),
        x: quadrantX + QUADRANT_WIDTH / 2 + 1,
        y: quadrantY + QUADRANT_HEIGHT / 5,
        textSize: 12,

        // params are boundaries of viewport
        // left, right are steps from South sideline; top, bottom are steps from West sideline
        // scale is units per step
        draw: function(left, right, top, bottom, scale) {
            var textHeight = _this._getTextHeight(this.textSize);
            var textWidth = _this._getTextWidth("S", this.textSize);
            _this.pdf.setFontSize(this.textSize);
            _this.pdf.text(
                "E",
                this.x + QUADRANT_WIDTH / 4 - textWidth/2,
                this.y + textHeight
            );
            _this.pdf.text(
                "S",
                this.x + QUADRANT_WIDTH/2 - textWidth,
                this.y + QUADRANT_HEIGHT / 5 + textHeight / 2
            );
            _this.pdf.text(
                "W",
                this.x + QUADRANT_WIDTH / 4 - textWidth/2,
                this.y + QUADRANT_HEIGHT * 2/5 - 1
            );
            _this.pdf.text(
                "N",
                this.x + 1,
                this.y + QUADRANT_HEIGHT / 5 + textHeight / 2
            );
            this.x += textWidth + 2;
            this.y += textHeight + 2;
            _this.pdf.rect(
                this.x,
                this.y,
                this.width,
                this.height
            );
            var westHash = bottom < 32 && top > 32;
            var eastHash = bottom < 52 && top > 52;
            var hashLength = 3;

            // position of first yardline in viewport
            var i = (left - Math.floor(left/8) * 8) * scale;
            var yardlineNum = Math.floor(left/8) * 5;
            for (; i < this.width && yardlineNum <= 100; i += scale * 8, yardlineNum -= 5) {
                _this.pdf.line(
                    this.x + i, this.y,
                    this.x + i, this.y + this.height
                );
                if (westHash) {
                    var y = this.y + this.height - (32 - bottom) * scale;
                    _this.pdf.line(
                        this.x + i - hashLength/2, y,
                        this.x + i + hashLength/2, y
                    );
                }
                if (eastHash) {
                    var y = this.y + this.height - (52 - bottom) * scale;
                    _this.pdf.line(
                        this.x + i - hashLength/2, y,
                        this.x + i + hashLength/2, y
                    );
                }

                var yardlineText = "";
                var yardTextSize = 8;
                if (yardlineNum < 50) {
                    yardlineText = String(yardlineNum);
                } else {
                    yardlineText = String(100 - yardlineNum);
                }
                _this.pdf.setTextColor(150);
                _this.pdf.setFontSize(yardTextSize);
                var halfTextWidth = _this._getTextWidth(yardlineText, yardTextSize)/2;

                if (i < halfTextWidth) {
                    // first character doesn't fit
                    if (yardlineText.length > 1) {
                        _this.pdf.text(
                            yardlineText[1],
                            this.x + i,
                            this.y + this.height - 1
                        );
                    }
                } else if (i > this.width - halfTextWidth) {
                    // second character doesn't fit
                    if (yardlineText.length > 1) {
                        _this.pdf.text(
                            yardlineText[0],
                            this.x + i - halfTextWidth,
                            this.y + this.height - 1
                        );
                    }
                } else {
                    _this.pdf.text(
                        yardlineText,
                        this.x + i - halfTextWidth,
                        this.y + this.height - 1
                    );
                }
            }
            _this.pdf.setTextColor(0);
        },

        // draws movement lines and labels starting at (x, y) in steps from edge of viewport
        lines: function(movements, x, y, scale) {
            x = this.x + x * scale;
            y = this.y + y * scale;
            var spotRadius = 2;
            _this.pdf.circle(x, y, spotRadius);
            _this.pdf.setLineWidth(0.5);
            for (var i = 0; i < movements.length; i++) {
                // 0: deltaX, 1: deltaY, 2: list of intermediate points (arcs)
                var movement = movements[i];
                // negative because orientation flipped
                var deltaX = -movement[0] * scale;
                var deltaY = -movement[1] * scale;

                if (movement[2] === undefined) {
                    _this.pdf.line(x, y, x + deltaX, y + deltaY);
                    x += deltaX;
                    y += deltaY;
                } else {
                    var points = movement[2];
                    for (var j = 0; j < points.length; j++) {
                        deltaX = -points[j][0] * scale;
                        deltaY = -points[j][1] * scale;
                        _this.pdf.line(x, y, x + deltaX, y + deltaY);
                        x += deltaX;
                        y += deltaY;
                    }
                }
            }
            _this.pdf.setLineWidth(0.1);
            _this.pdf.line(
                x - spotRadius, y - spotRadius,
                x + spotRadius, y + spotRadius
            );
            _this.pdf.line(
                x + spotRadius, y - spotRadius,
                x - spotRadius, y + spotRadius
            );
        }
    };

    var movements = sheet.getDotByLabel(this.dot).getMovementCommands();
    var startPosition = movements[0].getStartPosition();

    // calculates scale of viewport
    var viewport = {
        startX: startPosition.x,
        startY: startPosition.y,
        minX: 0, // minX <= 0, maximum movement South
        minY: 0, // minY <= 0, maximum movement West
        maxX: 0, // maxX >= 0, maximum movement North
        maxY: 0, // maxY >= 0, maximum movement East
        deltaX: 0, // overall change in NS
        deltaY: 0, // overall change in EW
        width: 20, // in steps
        height: box.height/box.width * 20, // in steps, keeping height/width ratio
        update: function(x, y) {
            this.deltaX += x;
            this.deltaY += y;
            if (this.deltaX < this.minX) {
                this.minX = this.deltaX;
            } else if (this.deltaX > this.maxX) {
                this.maxX = this.deltaX;
            }

            if (this.deltaY < this.minY) {
                this.minY = this.deltaY;
            } else if (this.deltaY > this.maxY) {
                this.maxY = this.deltaY;
            }
        },
        getOverallX: function() {
            return this.maxX - this.minX;
        },
        getOverallY: function() {
            return this.maxY - this.minY;
        },
        scale: function() {
            var deltaX = this.getOverallX();
            var deltaY = this.getOverallY();
            if (deltaX > this.width - 4) {
                this.width = deltaX + 4;
                this.height = box.height/box.width * this.width;
            }
            if (deltaY > this.height - 4) {
                this.height = deltaY + 4;
                this.width = box.width/box.height * this.height;
            }
        }
    };

    var lines = [];
    for (var i = 0; i < movements.length; i++) {
        var movement = movements[i];
        var endPosition = movement.getEndPosition();
        var x = endPosition.x - startPosition.x;
        var y = endPosition.y - startPosition.y;

        if (movement instanceof MovementCommandArc) {
            var points = movement.getMiddlePoints(10);
            lines.push([x, y, points]);
        } else {
            lines.push([x, y]);
        }
        viewport.update(x, y);
        startPosition = endPosition;
    }
    viewport.scale();

    // units per step
    var scale = box.width / viewport.width;
    // steps from sideline until start of viewport
    var south = viewport.startX + viewport.maxX - viewport.getOverallX()/2 - viewport.width/2;
    var west = viewport.startY + viewport.maxY - viewport.getOverallY()/2 - viewport.height/2;
    var north = south + viewport.width;
    var east = west + viewport.height;
    // orientation East up
    box.draw(north, south, east, west, scale);
    box.lines(lines, north - viewport.startX, east - viewport.startY, scale);
};

/**
 * Draws the overall bird's eye view of the field. Includes:
 *      - Field outline, no yardlines/hashes
 *      - Form outline, continuous for 4-step EW, 2-step NS
 *      - Circle selected dot
 *      - Cross hairs for positions (4S N40, 2E WH)
 *
 * @param {int} quadrantX  The x-coordinate of the top left corner of the quadrant
 * @param {int} quadrantY  The y-coordinate of the top left corner of the quadrant
 * @param {Sheet} sheet
 */
PDFGenerator.prototype._addBirdseye = function(quadrantX, quadrantY, sheet) {
    var _this = this;

    var box = {
        height: QUADRANT_HEIGHT * 2/5 - 2 * (this._getTextHeight(12) + 2),
        width: QUADRANT_WIDTH / 2 - 2 * (this._getTextWidth("S", 12) + 1.5),
        x: quadrantX,
        y: quadrantY + QUADRANT_HEIGHT * 3/5,
        textSize: 12,

        draw: function() {
            var textHeight = _this._getTextHeight(this.textSize);
            var textWidth = _this._getTextWidth("S", this.textSize);
            _this.pdf.setFontSize(this.textSize);
            _this.pdf.text(
                "W",
                this.x + QUADRANT_WIDTH / 4 - textWidth/2,
                this.y + textHeight
            );
            _this.pdf.text(
                "N",
                this.x + QUADRANT_WIDTH/2 - textWidth,
                this.y + QUADRANT_HEIGHT / 5 + textHeight / 2
            );
            _this.pdf.text(
                "E",
                this.x + QUADRANT_WIDTH / 4 - textWidth/2,
                this.y + QUADRANT_HEIGHT * 2/5 - 1
            );
            _this.pdf.text(
                "S",
                this.x + 1,
                this.y + QUADRANT_HEIGHT / 5 + textHeight / 2
            );
            this.x += textWidth + 2;
            this.y += textHeight + 2;
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
    var startX = box.x;
    var startY = box.y;
    // units per step
    var scaleX = box.width / 160;
    var scaleY = box.height / 84;

    // drawing hashes
    this.pdf.setLineWidth(.2);
    var numDashes = 21;
    var dashLength = box.width / numDashes;
    var westHash = startY + 32 * scaleY;
    var eastHash = startY + 52 * scaleY;
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
            startX + position.x * scaleX,
            startY + position.y * scaleY,
            .5,
            "F"
        );
    }

    var position = currentDot.getAnimationState(0);
    var x = position.x * scaleX;
    var y = position.y * scaleY;

    var coordinates = { textSize: 8 };

    // Gives x-coordinates for current dot; i.e. "4S N40"
    var horizSteps = position.x % 8;
    if (horizSteps > 4) { // closer to North-side yardline
        var yardline = Math.ceil(position.x/8) * 5;
        if (yardline < 50) {
            yardline = "S" + yardline;
        } else if (yardline === 50) {
            yardline = "50";
        } else {
            yardline = "N" + (100 - yardline);
        }
        coordinates.textX = horizSteps - 4 + "S " + yardline;
    } else { // closer to South-side yardline
        var yardline = Math.floor(position.x/8) * 5;
        if (yardline < 50) {
            yardline = "S" + yardline;
        } else if (yardline === 50) {
            yardline = "50";
        } else {
            yardline = "N" + (100 - yardline);
        }

        if (horizSteps === 0) {
            coordinates.textX = yardline;
        } else {
            coordinates.textX = horizSteps + "N " + yardline;
        }
    }

    // Gives y-coordinates for current dot; i.e. "2E WH"
    vertSteps = position.y;
    if (vertSteps <= 16) { // closer to West sideline
        if (vertSteps === 0) {
            coordinates.textY = "WS";
        } else {
            coordinates.textY = vertSteps + " WS";
        }
    } else if (vertSteps <= 32) { // West of West hash
        if (vertSteps === 32) {
            coordinates.textY = "WH";
        } else {
            coordinates.textY = 32 - vertSteps + "W WH";
        }
    } else if (vertSteps <= 40) { // East of West hash
        coordinates.textY = vertSteps - 32 + "E WH";
    } else if (vertSteps <= 52) { // West of East hash
        if (vertSteps === 52) {
            coordinates.textY = "EH";
        } else {
            coordinates.textY = 52 - vertSteps + "W EH";
        }
    } else if (vertSteps <= 68) { // East of East hash
        coordinates.textY = vertSteps - 52 + "E EH";
    } else { // Closer to East sideline
        if (vertSteps === 84) {
            coordinates.textY = "ES";
        } else {
            coordinates.textY = 84 - vertSteps + " ES";
        }
    }

    coordinates.x = startX + x - this._getTextWidth(coordinates.textX, coordinates.textSize)/2;
    coordinates.y = startY + y + this._getTextHeight(coordinates.textSize)/4;

    this.pdf.setFillColor(0);
    this.pdf.setDrawColor(180);
    this.pdf.setFontSize(coordinates.textSize);

    this.pdf.line(
        startX + x, startY,
        startX + x, startY + box.height
    );
    this.pdf.line(
        startX, startY + y,
        startX + box.width, startY + y
    );

    // Put coordinate texts on opposite side of the field as the selected dot
    if (position.y > 42) {
        this.pdf.text(
            coordinates.textX,
            coordinates.x,
            startY + this._getTextHeight(coordinates.textSize)
        );
    } else {
        this.pdf.text(
            coordinates.textX,
            coordinates.x,
            startY + box.height - 1
        );
    }

    if (position.x > 80) {
        this.pdf.text(
            coordinates.textY,
            startX + 1,
            coordinates.y
        );
    } else {
        this.pdf.text(
            coordinates.textY,
            startX + box.width - this._getTextWidth(coordinates.textY, coordinates.textSize) - 1,
            coordinates.y
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
 * @param {int} quadrantX  The x-coordinate of the top left corner of the quadrant
 * @param {int} quadrantY  The y-coordinate of the top left corner of the quadrant
 * @param {Sheet} sheet
 */
PDFGenerator.prototype._addSurroundingDots = function(quadrantX, quadrantY, sheet) {
    var _this = this;
    var box = {
        height: QUADRANT_HEIGHT * 2/5 - 2 * (this._getTextHeight(12) + 2),
        x: quadrantX + QUADRANT_WIDTH / 2 + 1,
        y: quadrantY + QUADRANT_HEIGHT * 3/5,
        textSize: 12,
        labelSize: 7,

        draw: function(surroundingDots, start) {
            var textHeight = _this._getTextHeight(this.textSize);
            var textWidth = _this._getTextWidth("S", this.textSize);
            var scale = this.height / 10; // 5 step radius for viewport
            this.width = this.height; // make square
            _this.pdf.setFontSize(this.textSize);
            _this.pdf.text(
                "E",
                this.x + QUADRANT_WIDTH / 4 - textWidth/2,
                this.y + textHeight
            );
            _this.pdf.text(
                "S",
                this.x + QUADRANT_WIDTH/2 - textWidth - 4.5,
                this.y + QUADRANT_HEIGHT / 5 + textHeight / 2
            );
            _this.pdf.text(
                "W",
                this.x + QUADRANT_WIDTH / 4 - textWidth/2,
                this.y + QUADRANT_HEIGHT * 2/5 - 1
            );
            _this.pdf.text(
                "N",
                this.x + 4.5,
                this.y + QUADRANT_HEIGHT / 5 + textHeight / 2
            );
            this.x += QUADRANT_WIDTH/4 - this.width/2;
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
            var origin = {
                x: this.x + this.width/2,
                y: this.y + this.height/2
            };
            for (var i = 0; i < surroundingDots.length; i++) {
                var dot = surroundingDots[i];
                var x = dot.deltaX * scale + origin.x;
                var y = dot.deltaY * scale + origin.y;
                _this.pdf.setFontSize(this.labelSize);
                _this._drawDot(dot.type, x, y);
                _this.pdf.text(dot.label, x - 3, y - 2);
            }
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

    box.draw(surroundingDots);
};

module.exports = PDFGenerator;
