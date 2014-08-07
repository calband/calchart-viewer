/**
 * @fileOverview Defines the Grapher class.
 */

/**
 * A Grapher can draw moments of a field show. @see Grapher.prototype.draw
 * 
 * @param {string} fieldType The type of field that the
 *   field show is performed on. For a list of valid field types,
 *   @see Grapher.prototype.setFieldType.
 * @param {jQuery} drawTarget The HTML element which the Grapher
 *   will draw to.
 */
var Grapher = function(fieldType, drawTarget) {

    /**
     * A string representation of the field type. For a list of
     * valid field types, @see Grapher.prototype.setFieldType.
     * @type {string}
     */
    this._fieldType = fieldType;
    
    /**
     * The HTML element to which the Grapher is draw.
     * @type {jQuery}
     */
    this._drawTarget = drawTarget;
};

/**
 * Sets the type of field that the show will be performed on.
 *
 * @param {string} fieldType The type of field that the show will
 *   be performed on. Valid field types include:
 *   - "college" : A football field with college hashes.
 */
Grapher.prototype.setFieldType = function(fieldType) {
    this._fieldType = fieldType;
};

/**
 * Returns the type of field that the show will be performed on.
 *
 * @return {string} The type of field that the show will be performed on.
 *   @see Grapher.prototype.setFieldType for a list of field types.
 */
Grapher.prototype.getFieldType = function() {
    return this._fieldType;
};

/**
 * Draws a moment in a field show. The moment is given as a beat of a
 * particular stuntsheet.
 *
 * @param {Stuntsheet} sheet The stuntsheet to draw.
 * @param {int} currentBeat The beat to draw, relative to the
 *   start of the stuntsheet.
 * @param {string=} selectedDot The label of the currently selected
 *   dot, or undefined if no dot is selected.
 */
Grapher.prototype.draw = function(sheet, currentBeat, selectedDot) {
    // if we don't have d3 loaded globally, then we can't do anything.
    if (d3 === undefined) {
        return;
    }
    if (this._fieldType === "college") {
        this._drawCollegeField();
    }
};

Grapher.prototype._drawCollegeField = function() {

};


module.exports = Grapher;
