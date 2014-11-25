/**
 * @fileOverview Defines a base class for the PDFGenerator Widget classes
 */

/**
 * PDFWidget class
 *
 * Represents one of the widgets available on the PDFGenerator. This is an abstract
 * class; do not make an instance of this class directly.
 *
 * @param {jsPDF} pdf, the jsPDF object to be written to
 */
var PDFWidget = function(pdf) {
    this.pdf = pdf;
};

/**
 * Draws this widget onto the pdf, with whatever options passed into it as key-value
 * pairs
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

module.exports = PDFWidget;