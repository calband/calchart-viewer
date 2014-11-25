/**
 * @fileOverview Defines a base class for the PDFGenerator Widget classes
 */

/**
 * PDFWidget class
 *
 * Represents one of the widgets available on the PDFGernator. This is an abstract
 * class; do not make an instance of this class directly.
 *
 * @param {jsPDF} pdf, the jsPDF object we will be drawing to
 * @param {float} x, the x-coordinate of the position of this widget
 * @param {float} y, the y-coordinate of the position of this widget
 * @param {float} width, the width of this widget
 * @param {float} height, the height of this widget
 */
var PDFWidget = function(pdf, x, y, width, height) {
    this.pdf = pdf;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
};

/**
 * Draws this widget onto the pdf, with whatever options passed into it as key-value
 * pairs
 *
 * @param {Object} options, the options necessary to draw a given widget
 */
PDFWidget.prototype.draw = function(options) {
    console.log("draw called");
};

module.exports = PDFWidget;