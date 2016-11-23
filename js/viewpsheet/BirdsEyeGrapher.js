/**
 * @fileOverview Defines the BirdsEyeGrapher class.
 */

var JSUtils = require("../viewer/utils/JSUtils");
var Grapher = require("../viewer/Grapher");

/**
 * A BirdsEyeGrapher is a Grapher for the birds eye widget in the
 * viewpsheet.
 *
 * @param {jQuery} stuntsheet The HTML element for the current stuntsheet
 */
var BirdsEyeGrapher = function(stuntsheet) {
    var drawTarget = stuntsheet.find(".birds-eye-view .graph");
    Grapher.apply(this, ["college", drawTarget]);
};

JSUtils.extends(BirdsEyeGrapher, Grapher);

/**
 * Override to not color dots differently based on direction of travel
 */
BirdsEyeGrapher.prototype._getAngleScale = function() {
    return function() {
        return "";
    };
};

/**
 * Draws the birds eye widget for the given stuntsheet
 */
BirdsEyeGrapher.prototype.draw = function(sheet, selectedDot) {
    Grapher.prototype.draw.apply(this, [sheet, 0, selectedDot]);
};

module.exports = BirdsEyeGrapher;
