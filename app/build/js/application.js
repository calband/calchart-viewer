/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var ApplicationController = __webpack_require__(1);

	/**
	 * This function will be executed by jQuery when the HTML DOM is loaded. Here,
	 * we should instantiate the ApplicationController and bind the necessary click
	 * events on elements.
	 *
	 * @todo: implement the Calchart Viewer app here
	 */
	$(document).ready(function () {
	    var applicationController = ApplicationController.getInstance();
	    applicationController.init();

	    // bindings for user interface components
	    $(".js-prev-beat").click(function () {
	        console.log("click received");
	    });
	    $(".js-prev-stuntsheet").click(function () {
	        console.log("click received");
	    });
	    $(".js-next-beat").click(function () {
	        console.log("click received");
	    });
	    $(".js-next-stuntsheet").click(function () {
	        console.log("click received");
	    });
	    $(".js-animate").click(function () {
	        console.log("click received");
	    });
	    $(".js-generate-continuity").click(function () {
	        console.log("click received");
	    });
	    $(".js-show-selected-dot").change(function () {
	        console.log("change received");
	    });
	    $(".js-dot-labels").change(function () {
	        console.log("change received");
	    });
	});

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview The ApplicationController singleton class is defined here.
	 */

	var Grapher = __webpack_require__(2);

	/**
	 * The ApplicationController is the backbone of how functional components
	 * communicate with each other in the Calchart Viewer. It knows about the
	 * currently selected Show, the Grapher to render the preview, the
	 * AnimationStateDelegate which controls where the animation is in the current
	 * Show, and other information about the app's state.
	 *
	 * Note that this class is a singleton, which means that there can only ever be
	 * one of it. This is a good thing, because since the ApplicationController
	 * controls important state about the app, there should never be two operating
	 * at one time. This also means that we can access the ApplicationController
	 * from anywhere by calling ApplicationController.getInstance() - the class
	 * itself saves its instance and will automatically create an instance of itself
	 * if needed when this function is called.
	 */
	var ApplicationController = function () {
	    this.applicationStateDelegate = null;
	    this.grapher = null;
	    this.show = null;
	};

	/**
	 * The internal instance of the ApplicationController. Nothing outside of this
	 * class hsould ever access this.
	 * @type {ApplicationController|null}
	 */
	ApplicationController._instance = null;

	/**
	 * Return the singleton instance of the application controller, and create the
	 * internal instance if it has not been created already.
	 * @return {ApplicationController} the controller
	 */
	ApplicationController.getInstance = function () {
	    if (ApplicationController._instance === null) {
	        ApplicationController._instance = new ApplicationController();
	    }
	    return ApplicationController._instance;
	};

	/**
	 * Set the controller up with instances of various classes that control
	 * their respective parts of the application. These are null until they are set
	 * here.
	 * 
	 * @param  {ApplicationStateDelegate} applicationStateDelegate
	 * @param  {Grapher} grapher
	 */
	ApplicationController.prototype.init = function () {
	    this.grapher = new Grapher("college", $(".js-grapher-draw-target"));
	    this.grapher.draw(null, null, null);
	};

	module.exports = ApplicationController;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

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
	 * The aspect ratio of a college football field, given in height/width.
	 * @type {float}
	 */
	Grapher.COLLEGE_FIELD_ASPECT_RATIO = 0.5333;

	/**
	 * How many steps there are horizontally across a regular college football
	 * field.
	 * @type {int}
	 */
	Grapher.COLLEGE_FIELD_STEPS_HORIZONTAL = 84;

	/**
	 * How many steps there are vertically across a regular college football field.
	 * @type {int}
	 */
	Grapher.COLLEGE_FIELD_STEPS_VERTICAL = 160;

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
	    if (!d3) {
	        return;
	    }
	    if (this._fieldType === "college") {
	        this._drawCollegeField();
	    }
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
	 * @param  {Number} fieldWidth the width of the field, in pixels: we need this
	 *   in order to preserve the football field aspect ratio.
	 * @param  {Number} svgHeight the total height of the svg container which
	 *   this scale will be relevant to.
	 * @return {function(int):Number} the scale
	 */
	Grapher.prototype._getVerticalStepScale = function (fieldWidth, svgHeight) {
	    var fieldHeight = fieldWidth * Grapher.COLLEGE_FIELD_ASPECT_RATIO;
	    var fieldVerticalPadding = (svgHeight - fieldHeight) / 2;
	    var top = fieldVerticalPadding;
	    var bottom = svgHeight - fieldVerticalPadding;
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
	 * @param  {Number} svgWidth the total width of the svg container
	 * @param  {object} fieldPadding a dict with "left" and "right" keys,
	 *   specifying the space that should be between the edges of the svg
	 *   container and the edges of the left and right 0 yardlines, respectively.
	 * @return {function(int):Number} the x scale
	 */
	Grapher.prototype._getHorizontalStepScale = function (svgWidth, fieldPadding) {
	    return d3.scale.linear()
	        .domain([0, Grapher.COLLEGE_FIELD_STEPS_HORIZONTAL]) // 160 8-per-5 steps from field end to end
	        .range([fieldPadding.left, svgWidth - fieldPadding.right]);
	};

	Grapher.prototype._drawCollegeField = function() {
	    // remove any preexisting svgs
	    this._drawTarget.find("svg").remove();
	    var svgWidth = parseInt(this._drawTarget.css("width"), 10); // outer width
	    var svgHeight = parseInt(this._drawTarget.css("height"), 10); // outer height
	    // since d3 requires a node, and not a jquery, we need to do .get(0)
	    var svg = d3.select(this._drawTarget.get(0))
	        .append("svg")
	        .attr("width", svgWidth)
	        .attr("height", svgHeight);

	    // the space inside the green area, but outside the white field lines
	    var fieldPadding = {
	        left: 10, // pixels
	        right: 10
	    };

	    // append the field background (green part)
	    svg.append("g")
	        .attr("class", "field-wrap")
	        .append("rect")
	        .attr("class", "field")
	        .attr("width", svgWidth)
	        .attr("height", svgHeight);

	    var svgContentWidth = svgWidth - fieldPadding.left - fieldPadding.right;
	    var yScale = this._getVerticalStepScale(svgContentWidth, svgHeight);
	    var xScale = this._getHorizontalStepScale(svgWidth, fieldPadding);

	    // append the field lines
	    var endLinesGroup = svg.append("g")
	        .attr("class", "end-lines-wrap");

	    // endzone lines
	    endLinesGroup.selectAll("line.endline.vertical")
	        .data([0, Grapher.COLLEGE_FIELD_STEPS_HORIZONTAL])
	        .enter()
	        .append("line")
	        .attr("class", "endline vertical")
	        .attr("x1", xScale)
	        .attr("x2", xScale)
	        .attr("y1", yScale(0))
	        .attr("y2", yScale(Grapher.COLLEGE_FIELD_STEPS_VERTICAL));

	    // top lines
	    endLinesGroup.selectAll("line.endline.horizontal")
	        .data([0, Grapher.COLLEGE_FIELD_STEPS_VERTICAL])
	        .enter()
	        .append("line")
	        .attr("class", "endline horizontal")
	        .attr("y1", yScale)
	        .attr("y2", yScale)
	        .attr("x1", xScale(0))
	        .attr("x2", xScale(Grapher.COLLEGE_FIELD_STEPS_HORIZONTAL));
	};


	module.exports = Grapher;


/***/ }
/******/ ])