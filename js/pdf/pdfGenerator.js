/**
 * @fileOverview This file will generate a PDF representation of dots and movements
 */

/**
 * The pdfGenerator will be the overall object that contains the methods to generate
 * a PDF.
 *
 * @param {Show} show
 * @param {String} dot
 *
 * @return {jsPDF} the PDF document for the dot
 */
var pdfGenerator = function(show, dot) {
    this._show = show;
    this._dot = dot;
    this._pdf = jsPDF();
}

/**
 * generatePDF will generate a PDF for a specific dot, containing its movements,
 * positions, and continuities relevant to it.
 *
 * @return {jsPDF} the PDF document for the dot
 */
pdfGenerator.prototype.generatePDF = function() {
    return this._pdf.save("show.pdf");
};

module.exports = pdfGenerator;