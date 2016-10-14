/**
 * @fileOverview Defines the widget for generating the page's headers
 */

var JSUtils = require("../viewer/utils/JSUtils");
var PDFUtils = require("./PDFUtils");
var PDFWidget = require("./PDFWidget");

/**
 * @constant WIDTH is the width of the PDF document, in millimeters
 * @constant HEIGHT is the height of the PDF document, in millimeters
 * @constant SIDE_MARGIN is the left/right margin of the PDF document, in millimeters
 */
var WIDTH = 215.9;
var HEIGHT = 279.4;
var SIDE_MARGIN = 10;

/**
 * Represents the widget for a page's headers
 *
 * This widget will include the stuntsheet number, the dot number, the show title, and
 * the page number
 *
 * @param {jsPDF} pdf, the jsPDF object to be written to
 * @param {Object} options,
 *      - {String} dotLabel, the selected dot
 *      - {String} title, the title of the show
 *      - {int} totalSheets, the total number of sheets
 */
var HeaderWidget = function(pdf, options) {
    this.dotLabel = "Dot " + options["dotLabel"];
    this.title = options["title"];
    this.totalSheets = options["totalSheets"];
    this.totalPages = Math.ceil(this.totalSheets / 4);
    PDFWidget.apply(this, [pdf]);
};

JSUtils.extends(HeaderWidget, PDFWidget);

/**
 * Draws the Header Widget with the given options:
 *      - {int} pageNum, the current 1-indexed page number
 *      - {boolean} isLeftToRight, true if stuntsheets go from left to right, false otherwise
 */
HeaderWidget.prototype.draw = function(options) {
    var _this = this;
    var pageNum = options["pageNum"];
    var isLeftToRight = options["isLeftToRight"];

    var header = {
        x: WIDTH * 1/4,
        y: 5,
        width: WIDTH * 1/2,
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

            _this.pdf.text(String(_this.totalPages), x, y + 1);
        }
    };

    var sheetInfo = {
        marginX: SIDE_MARGIN,
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
            return ++this.sheet <= _this.totalSheets;
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
        this.title,
        WIDTH/2 - PDFUtils.getTextWidth(this.title, header.size)/2,
        header.y + header.paddingY + PDFUtils.getTextHeight(header.size)
    );

    /* Dot */
    this.pdf.setFontSize(header.size - 3);
    this.pdf.text(
        this.dotLabel,
        WIDTH/2 - PDFUtils.getTextWidth(this.dotLabel, header.size)/2,
        header.y + header.paddingY + PDFUtils.getTextHeight(header.size) * 2
    );

    /* Page Info */
    this.pdf.setFontSize(pageInfo.size);
    var x = header.x + header.paddingX;
    var y = header.y + header.height/2 + PDFUtils.getTextHeight(pageInfo.size)/2;
    pageInfo.draw(x, y);

    x = WIDTH * 3/4 - header.paddingX - PDFUtils.getTextWidth("Page 0/0", pageInfo.size);
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

module.exports = HeaderWidget;