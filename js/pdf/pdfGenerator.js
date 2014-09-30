/**
 * @fileOverview This file will generate a PDF representation of dots and movements
 */

/**
 * generatePDF will generate a PDF for a specific dot, containing its movements,
 * positions, and continuities relevant to it.
 *
 * @param {Show} show
 * @param {String} dot
 *
 * The function will end with a save call, which will prompt a new window and/or
 * a dialog box to download the generated PDF.
 */
var generate = function(show, dot) {
    var pdf = jsPDF();
    pdf.save("show.pdf");
};

module.exports = generate;