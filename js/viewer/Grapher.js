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
    if (!d3) {
        throw new TypeError("Cannot load grapher because d3 was not found.");
    }

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
    this._svgWidth = parseInt(this._drawTarget.css("width"), 10); // outer width
    this._svgHeight = parseInt(this._drawTarget.css("height"), 10); // outer height

    this._svg = d3.select(this._drawTarget.get(0))
        .append("svg")
        .attr("width", this._svgWidth)
        .attr("height", this._svgHeight);
};

/**
 * The aspect ratio of a college football field, given in height/width.
 * @type {float}
 */
Grapher.COLLEGE_FIELD_ASPECT_RATIO = 0.5333;

/**
 * How many steps there are horizontally across a regular college football
 * field.
 * @type {int}
 */
Grapher.COLLEGE_FIELD_STEPS_HORIZONTAL = 160;

/**
 * How many steps there are vertically across a regular college football field.
 * @type {int}
 */
Grapher.COLLEGE_FIELD_STEPS_VERTICAL = 84;

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
    this._clearSvg();
    if (this._fieldType === "college") {
        this._drawCollegeField();
    }
    if (sheet && (currentBeat >= 0)) {
        this._drawStuntsheetAtBeat(sheet, currentBeat, selectedDot);
    }
};

Grapher.COLLEGE_FIELD_PADDING = {
    left: 10, // pixels
    right: 10
};

/**
 * Return a d3 scale which maps an integer number of steps from the top of a
 * college field to the pixel value, offset from the top of the svg whose
 * height is the provided svgHeight, where a dot that many steps from the top
 * should be rendered. This is the y scale for mapping steps to pixel
 * coordinates in the svg.
 *
 * Note: a d3 scale is just a function that takes the input and return the
 * output. for example, if I have scale = _getVerticalStepScale(...), I can
 * call scale(50) to find the pixel y-offset that a dot 50 steps from the top
 * of the field should be placed at.
 *
 * Note: this scale takes padding into account: its output is relative to the entire
 * svg container, not just the field area of the svg.
 *
 * @param {object} fieldPadding a dict with "left" and "right" keys,
 *   specifying the space that should be between the edges of the svg
 *   container and the edges of the left and right 0 yardlines, respectively.
 * @return {function(int):Number} the scale
 */
Grapher.prototype._getVerticalStepScale = function (fieldPadding) {
    var fieldWidth = this._svgWidth - fieldPadding.left - fieldPadding.right;
    var fieldHeight = fieldWidth * Grapher.COLLEGE_FIELD_ASPECT_RATIO;
    var fieldVerticalPadding = (this._svgHeight - fieldHeight) / 2;
    var top = fieldVerticalPadding;
    var bottom = this._svgHeight - fieldVerticalPadding;
    return d3.scale.linear()
        .domain([0, Grapher.COLLEGE_FIELD_STEPS_VERTICAL]) // 84 8-per-5 steps vertically in a field
        .range([top, bottom]);
};

/**
 * Return a d3 scale which maps an integer number of steps from the left
 * endzone (the 0 yardline) of a college field to a pixel value for what x
 * coordinate a dot should have, in the svg container specified by svgWidth,
 * if that dot is that many steps from the left 0 yardline. This is the x scale
 * for mapping steps to pixel coordinates in the svg.
 *
 * Note: this scale takes padding into account: its output is relative to the entire
 * svg container, not just the field area of the svg.
 *
 * @param  {object} fieldPadding a dict with "left" and "right" keys,
 *   specifying the space that should be between the edges of the svg
 *   container and the edges of the left and right 0 yardlines, respectively.
 * @return {function(int):Number} the x scale
 */
Grapher.prototype._getHorizontalStepScale = function (fieldPadding) {
    return d3.scale.linear()
        .domain([0, Grapher.COLLEGE_FIELD_STEPS_HORIZONTAL]) // 160 8-per-5 steps from field end to end
        .range([fieldPadding.left, this._svgWidth - fieldPadding.right]);
};

/**
 * Return a d3 scale which maps an angle between 0 and 360 to a color hash
 * representing what color we should draw the dot as based on its angle.
 * 
 * This is a d3 quantize scale, which means that it has a continuous domain but
 * a discrete range: d3 automatically looks at the size of the range and the
 * bounds of the input domain and returns a function that maps the domain to
 * the range in even steps.
 * @return {function(Number):string} function converts angle to color string
 */
Grapher.prototype._getAngleColorScale = function () {
    var colors = {
        east: "#F9FBF6", // scraped from images of front of the uniform
        west: "#FFEA59", // scraped from images of uniform side
        north: "#38363B", // scraped from images of uniform side
        south: "#38363B" // scraped from actual images of cal band's capes #38363B
    };
    return d3.scale.quantize()
        .domain([0, 360])
        .range([colors.east, colors.south, colors.west, colors.north]);
};

/**
 * Return an array which contains the number of steps from the left side of a
 * college football field for each yardline in [5, 10, ... 50, 45, ... 10, 5].
 * For example, if we wanted to know how many steps from the left side of the
 * field the left 10 yardline was, then we would look at the second value in
 * the returned array of ints.
 * @return {Array<int>} the array of step offsets.
 */
Grapher.prototype._generateYardlineSteps = function () {
    var rtn = [];
    for (var i = 8; i < 160; i += 8) {
        rtn.push(i);
    }
    return rtn;
};

/**
 * Clear the grapher's svg context (remove all of the svg's children elements).
 */
Grapher.prototype._clearSvg = function () {
    this._drawTarget.find("svg").empty();
};

/**
 * Draw, on this Grapher's draw target, an svg containing a representation of
 * a college football field, with a background, borders, yardlines (without
 * numbers) and hash marks.
 */
Grapher.prototype._drawCollegeField = function() {
    // for referencing this grapher object inside of anonymous functions
    var _this = this;

    // append the field background (green part)
    this._svg.append("g")
        .attr("class", "field-wrap")
        .append("rect")
            .attr("class", "field")
            .attr("width", this._svgWidth)
            .attr("height", this._svgHeight);

    var yScale = this._getVerticalStepScale(Grapher.COLLEGE_FIELD_PADDING);
    var xScale = this._getHorizontalStepScale(Grapher.COLLEGE_FIELD_PADDING);

    // append the field lines
    var endLinesGroup = this._svg.append("g")
        .attr("class", "end-lines-wrap");

    // endzone lines
    endLinesGroup.selectAll("line.endline.vertical")
        .data([0, Grapher.COLLEGE_FIELD_STEPS_HORIZONTAL])
        .enter()
        .append("line")
        .attr("class", "endline vertical")
        // x coordinates are dictaged by the xScale, which here works as a function
        .attr("x1", xScale)
        .attr("x2", xScale)
        // y coords are edges of the y scale
        .attr("y1", yScale(0))
        .attr("y2", yScale(Grapher.COLLEGE_FIELD_STEPS_VERTICAL));

    // top lines
    endLinesGroup.selectAll("line.endline.horizontal")
        .data([0, Grapher.COLLEGE_FIELD_STEPS_VERTICAL])
        .enter()
        .append("line")
        .attr("class", "endline horizontal")
        // y coords are dictated by the y scale
        .attr("y1", yScale)
        .attr("y2", yScale)
        // and the x coords are the edges of the x scale
        .attr("x1", xScale(0))
        .attr("x2", xScale(Grapher.COLLEGE_FIELD_STEPS_HORIZONTAL));

    // append the yardlines
    var yardLineSteps = this._generateYardlineSteps();
    this._svg.append("g")
        .attr("class", "yardlines-wrap")
        .selectAll("line.yardline")
        .data(yardLineSteps)
        .enter()
        .append("line")
            .attr("class", "yardline")
            .attr("x1", xScale)
            .attr("x2", xScale)
            .attr("y1", yScale(0))
            .attr("y2", yScale(Grapher.COLLEGE_FIELD_STEPS_VERTICAL));

    /**
     * How wide, in pixels, a hashmark is.
     * @type {int}
     */
    var hashWidth = 10; // pixels

    // draw hash marks
    var hashSteps = [32, 52];
    hashSteps.forEach(function (value) {
        _this._svg.append("g")
            .attr("class", "hashes-wrap")
            .selectAll("line.hash")
            .data(yardLineSteps)
            .enter()
            .append("line")
                .attr("class", "hash")
                .attr("y1", yScale(value))
                .attr("y2", yScale(value))
                .attr("x1", function (d) { return xScale(d) - (hashWidth / 2); })
                .attr("x2", function (d) { return xScale(d) + (hashWidth / 2); });
    });
};

/**
 * Given a stuntsheet, the currentBeat relative to the beginning of that sheet,
 * and the dot label of a selected dot, draw the dots in this stuntsheet at
 * that beat onto the svg context of this grapher.
 *
 * @param  {Sheet} sheet stuntsheet to draw
 * @param  {int} currentBeat beat of stuntsheet to draw
 * @param  {string} selectedDotLabel label of selected dot, if any
 */
Grapher.prototype._drawStuntsheetAtBeat = function (sheet, currentBeat, selectedDotLabel) {
    var dots = sheet.getDots();
    var xScale = this._getHorizontalStepScale(Grapher.COLLEGE_FIELD_PADDING);
    var yScale = this._getVerticalStepScale(Grapher.COLLEGE_FIELD_PADDING);
    var colorScale = this._getAngleColorScale();
    var purple = "#F19DF5";

    var colorForDot = function (dot) {
        if (dot.getLabel() === selectedDotLabel) {
            return purple;
        }
        return  colorScale(dot.getAnimationState(currentBeat).angle);
    };

    // pixels, represents length and width since the dots are square
    var dotRectSize = 5;

    var dotsGroup = this._svg.append("g")
        .attr("class", "dots-wrap");

    dotsGroup.selectAll("rect.dot")
        .data(dots)
        .enter()
        .append("rect")
            .attr("class", "dot")
            .attr("x", function (dot) { return xScale(dot.getAnimationState(currentBeat).x) - dotRectSize / 2; })
            .attr("y", function (dot) { return yScale(dot.getAnimationState(currentBeat).y) - dotRectSize / 2; })
            .attr("width", dotRectSize)
            .attr("height", dotRectSize)
            .attr("fill", colorForDot)
            .style("cursor", "pointer")
            .on("click", function (dot) {
                var label = dot.getLabel();
                $("[value='" + label + "']").prop("selected", true);
                $(".js-dot-labels")
                    .trigger("chosen:updated")
                    .trigger("change", {selected: label});
            });

    var selectedDot = sheet.getDotByLabel(selectedDotLabel);
    if (selectedDot) {
        var circleSize = dotRectSize * 2;
        var circleX = xScale(selectedDot.getAnimationState(currentBeat).x);
        var circleY = yScale(selectedDot.getAnimationState(currentBeat).y);
        dotsGroup.append("circle")
            .attr("class", "selected-dot-highlight")
            .attr("cx", circleX)
            .attr("cy", circleY)
            .attr("r", dotRectSize * 2)
            .attr("stroke", purple)
            .attr("stroke-width", "2px")
            .attr("fill", "transparent");
    }
};


module.exports = Grapher;
