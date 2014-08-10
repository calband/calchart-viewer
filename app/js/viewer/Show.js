/**
 * @fileOverview Defines the Show class.
 */
 
/**
 * Represents an entire fieldshow.
 *
 * @param {string} title The title of the show.
 * @param {string} year The year that the show was performed.
 * @param {string} description The show description.
 * @param {Array<string>} dotLabels An array containing the
 *   labels of each dot in the show.
 * @param {Array<Sheet>=} sheets The sheets in the show. This
 *   parameter is optional - sheets can be appended after
 *   the show is constructed by using the appendSheet(...)
 *   method.
 */
var Show = function(title, year, description, dotLabels, sheets) {
    this._title = title;
    this._year = year;
    this._description = description;
    this._dotLabels = dotLabels;
    if (sheets === undefined) {
        this._sheets = [];
    } else {
        this._sheets = sheets;
    }
};

/**
 * Returns the title of the show.
 *
 * @return {string} The title of the show.
 */
Show.prototype.getTitle = function() {
    return this._title;
};

/**
 * Returns the year during which the show was performed.
 *
 * @return {string} The year during which the show was
 *   performed.
 */
Show.prototype.getYear = function() {
    return this._year;
};

/**
 * Returns the show description.
 *
 * @return {string} The show description.
 */
Show.prototype.getDescription = function() {
    return this._description;
};

/**
 * Returns an array containing the labels for
 * all dots in the show.
 *
 * @return {Array<string>} An array of all dot labels.
 */
Show.prototype.getDotLabels = function() {
    return this._dotLabels;
};

/**
 * Returns an array of all sheets in the show.
 *
 * @return {Array<Sheet>} An array of all sheets in the show.
 */
Show.prototype.getSheets = function() {
    return this._sheets;
};

/**
 * Adds a sheet to the back of the show.
 *
 * @param {Sheet} sheet The sheet to add to the
 *   show.
 */
Show.prototype.appendSheet = function(sheet) {
    this._sheets.push(sheet);
};

module.exports = Show;