/**
 * @fileOverview Defines a base class for the PDFGenerator Widget classes
 */

 var PDFUtils = require("./PDFUtils");

/**
 * PDFWidget class
 *
 * Represents one of the widgets available on the PDFGenerator. Each widget draws
 * a different component of the PDF, which shows detailed information about a
 * given marcher on a given stuntsheet. This is an abstract class; do not make
 * an instance of this class directly.
 *
 * @param {jsPDF} pdf, the jsPDF object to be written to
 */
var PDFWidget = function(pdf) {
    this.pdf = pdf;
};

/**
 * Draws this widget onto the pdf, with whatever options passed into it as key-value
 * pairs. For example, the options passed into the individual continuity widget might be:
 *     {
 *          continuities: [<String>, <String>],
 *          duration: 32,
 *          ...
 *     }
 *
 * @param {float} x, the x-coordinate of the position of this widget
 * @param {float} y, the y-coordinate of the position of this widget
 * @param {float} width, the width of this widget
 * @param {float} height, the height of this widget
 * @param {Object} options, the options necessary to draw a given widget as key-value pairs
 */
PDFWidget.prototype.draw = function(x, y, width, height, options) {
    console.log("draw called");
};

/**
 * A helper method for widgets that utilize a box that draws field-related
 * information such as movements, formations, or nearby dots. Draws the confining
 * box and the EWNS directions.
 *
 * @param {float} x, the x-coordinate of the top-left corner of the box
 * @param {float} y, the y-coordinate of the top-left corner of the box
 * @param {float} width, the width of the box
 * @param {float} height, the height of the box
 * @param {boolean} westUp, true if West on top of the box, false otherwise
 * @param {boolean} minimal, true to draw as little of the box as possible, false otherwise
 */
PDFWidget.prototype._drawBox = function(x, y, width, height, westUp, minimal) {
    var textHeight = PDFUtils.getTextHeight(PDFUtils.DEFAULT_FONT_SIZE);
    var textWidth = PDFUtils.getTextWidth("S", PDFUtils.DEFAULT_FONT_SIZE);

    // labels for sides of box
    var top, bottom, left, right;
    if (westUp) {
        top = "W";
        bottom = "E";
        left = "S";
        right = "N";
    } else {
        top = "E";
        bottom = "W";
        left = "N";
        right = "S";
    }

    this.pdf.setFontSize(PDFUtils.DEFAULT_FONT_SIZE);
    if (!minimal) {
        this.pdf.text(
            top,
            x + width/2 - textWidth/2 - .5,
            y - 2
        );
        this.pdf.text(
            bottom,
            x + width/2 - textWidth/2 - .5,
            y + height + textHeight
        );
    }
    this.pdf.text(
        left,
        x - textWidth - 1,
        y + height/2 + textHeight/2
    );
    this.pdf.text(
        right,
        x + width + 1,
        y + height/2 + textHeight/2
    );
    this.pdf.rect(x, y, width, height);
    this.pdf.resetFormat();
};

/**
 * A helper function for widgets that draws yardlines, hashes, and numbers.
 *
 * @param {object} box, holds the PDF properties of the enclosing box
 * @param {object} viewport, holds the marching properties of the enclosing box
 *      - {float} north, steps from the north sideline to the edge of the view
 *      - {float} south, steps from the south sideline to the edge of the view
 *      - {float} east, steps from the east sideline to the edge of the view
 *      - {float} west, steps from the west sideline to the edge of the view
 *      - {boolean} westUp, true if the box is oriented with the west sideline on top
 * @param {float} scale, the multiplier to convert from steps to pdf units
 */
PDFWidget.prototype._drawYardlines = function(box, viewport, scale) {
    var yardlineSize = box.height * 12/47.1; // at the usual height, yardline text should be 12
    this.pdf.setFontSize(yardlineSize);

    // get the y-coordinates of the hashes and yardlines
    var eastHash = viewport.west < 52 && viewport.east > 52;
    var westHash = viewport.west < 32 && viewport.east > 32;
    var eastHashY, westHashY, yardline;
    if (viewport.westUp) {
        eastHashY = box.y + (52 - viewport.west) * scale;
        westHashY = box.y + (32 - viewport.west) * scale;
        yardline = Math.ceil(viewport.south/8) * 5;
        viewport.left = viewport.south;
    } else {
        eastHashY = box.y + (viewport.east - 52) * scale;
        westHashY = box.y + (viewport.east - 32) * scale;
        yardline = Math.floor(viewport.north/8) * 5;
        viewport.left = viewport.north;
    }

    // EAST-WEST LINES

    var top = viewport.westUp ? viewport.west : viewport.east;
    var topY = viewport.westUp ? Math.ceil(top/4) : Math.floor(top/4);
    var orientationFactor = viewport.westUp ? -1 : 1;
    var deltaY = Math.abs(topY * 4 - top);
    var deltaNorth = scale * Math.max(0, viewport.north - 160);
    var deltaSouth = scale * Math.min(0, viewport.south);
    var deltaLeft = viewport.westUp ? deltaSouth : deltaNorth;
    var deltaRight = viewport.westUp ? deltaNorth : deltaSouth;
    for (; scale * deltaY < box.height; deltaY += 4) {
        var stepsY = top - orientationFactor * deltaY;
        // don't make lines past sidelines
        if (stepsY < 0 || stepsY > 84) {
            continue;
        }

        // darken sidelines
        if (stepsY % 84 === 0) {
            this.pdf.setDrawColor(0);
        } else {
            this.pdf.setDrawColor(200);
        }

        // stop lines at endzones
        this.pdf.hLine(
            box.x,
            box.y + deltaY * scale + deltaLeft,
            box.width + orientationFactor * (deltaRight - deltaLeft)
        );
    }

    // YARDLINES

    // position of first yardline from edge of viewport
    var deltaX = Math.abs(yardline * 8/5 - viewport.left) * scale;
    var hashLength = 3;
    var isSplitting = false;

    // 4-step line before first line
    if (deltaX > scale * 4) {
        deltaX -= scale * 4;
        isSplitting = true;
    }

    // helper function to draw yardlines that may end at a sideline
    var _this = this;
    var deltaEast = scale * Math.max(0, viewport.east - 84);
    var deltaWest = scale * Math.min(0, viewport.west);
    var deltaTop = viewport.westUp ? deltaWest : deltaEast;
    var deltaBottom = viewport.westUp ? deltaEast : deltaWest;
    var orientationFactor = viewport.westUp ? -1 : 1;
    var drawYardline = function(yardlineX) {
        _this.pdf.vLine(
            yardlineX,
            box.y + deltaTop,
            box.height + orientationFactor * (deltaBottom - deltaTop)
        )
    };

    // draw yardlines
    this.pdf.setTextColor(150);
    for (; deltaX < box.width; deltaX += scale * 4, isSplitting = !isSplitting) {
        var yardlineX = box.x + deltaX;

        // drawing the yardline
        if (isSplitting) {
            this.pdf.setDrawColor(200);
            drawYardline(yardlineX);
            continue;
        }

        this.pdf.setDrawColor(0);
        drawYardline(yardlineX);

        // drawing hashes
        if (westHash) {
            this.pdf.hLine(
                yardlineX - hashLength/2,
                westHashY,
                hashLength
            );
        }
        if (eastHash) {
            this.pdf.hLine(
                yardlineX - hashLength/2,
                eastHashY,
                hashLength
            );
        }

        // writing yardline numbers
        var yardlineText = "";
        if (yardline < 50) {
            yardlineText = String(yardline);
        } else {
            yardlineText = String(100 - yardline);
        }
        if (yardlineText.length === 1) {
            yardlineText = "0" + yardlineText;
        }
        var halfTextWidth = PDFUtils.getTextWidth(yardlineText, yardlineSize)/2;
        if (deltaX > halfTextWidth) { // include first character if room
            this.pdf.text(
                yardlineText[0],
                yardlineX - halfTextWidth - .5,
                box.y + box.height - 2
            );
        }
        if (deltaX < box.width - halfTextWidth) { // include second character if room
            this.pdf.text(
                yardlineText[1],
                yardlineX + .5,
                box.y + box.height - 2
            );
        }

        // go to next yardline
        yardline += viewport.westUp ? 5 : -5;
        if (yardline < 0 || yardline > 100) {
            break;
        }
    }

    this.pdf.resetFormat();
};

module.exports = PDFWidget;