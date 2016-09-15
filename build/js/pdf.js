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

	var PDFGenerator = __webpack_require__(4);
	var ShowUtils = __webpack_require__(3);
	var JSUtils = __webpack_require__(2);

	var options = JSUtils.getAllURLParams();
	options.dots = options.dots ? options.dots.split(",") : [];
	var keys = ["md-orientation", "bev-orientation", "sd-orientation", "layout-order", "endsheet-widget"];

	/**
	 * Shows an error text
	 */
	function showError(message) {
	    $(".js-pdf-loading h1").addClass("error").text(message);
	    $(".js-pdf-loading .progress-bar").remove();
	};

	/**
	 * Refresh page with the current options
	 */
	function refreshPage() {
	    window.location.search = $.map(options, function(val, key) {
	        if (key === "dots") {
	            val = val.join(",");
	        }
	        return key + "=" + val;
	    }).join("&");
	};

	/**
	 * Add a dot label to the dot label select box
	 */
	function addDotLabel(i, dot) {
	    $("<option>")
	        .text(dot)
	        .attr("value", dot)
	        .appendTo(".js-dot-labels");
	};

	/**
	 * If it takes too long, remove the IFrame and prompt user to download
	 */
	function removeIFrame() {
	    $(".js-pdf-preview").remove();
	    showError("Displaying preview timed out");
	    var link = $("<a>")
	        .text("Download here")
	        .attr("href", "#")
	        .click(function() {
	            window.generator.pdf.save();
	            return false;
	        });
	    $("<p>")
	        .append(link)
	        .appendTo(".js-pdf-loading");
	};

	/**
	 * This function will be executed by jQuery when the HTML DOM is loaded. Here,
	 * we automatically load the show and generate a live preview of the PDF generated
	 * by the PDFGenerator
	 */
	$(document).ready(function() {
	    if (!options.show) {
	        showError("No show selected.");
	        return;
	    }

	    keys.forEach(function(key) {
	        var allOptions = $(".pdf-option input[name=" + key + "]");
	        var selected = allOptions.filter("[value=" + options[key] + "]");
	        if (options[key] === undefined || selected.length === 0) {
	            // choose first option by default
	            allOptions.filter(":first").prop("checked", true);
	        } else {
	            selected.prop("checked", true);
	        }
	    });

	    // changing options
	    $("input").change(function() {
	        options[$(this).attr("name")] = $(this).val();
	        refreshPage();
	    });
	    $.each(options.dots, addDotLabel)
	    $(".js-dot-labels")
	        .val(options.dots)
	        .chosen({
	            placeholder_text_multiple: "Type in a dot",
	        })
	        .change(function() {
	            options.dots = $(this).val() || [];
	            refreshPage();
	        });
	    // add link to select all dots; adding here because dots not all populated
	    // until this point
	    $("<a>")
	        .addClass("choose-all-dots")
	        .text("Select all")
	        .attr("href", "#")
	        .click(function() {
	            options.dots = $(".js-dot-labels option")
	                .map(function() {
	                    return $(this).attr("value");
	                })
	                .get();
	            refreshPage();
	        })
	        .appendTo(".choose-dots h3");

	    // add link for back-link
	    var backDot = options.dots[0] || "";
	    var url = "index.html?show=" + options.show + "&dot=" + backDot;
	    $(".back-link").attr("href", url);

	    $.ajax({
	        url: "https://calchart-server.herokuapp.com/viewer/" + options.show + "/",
	        dataType: "text",
	        xhr: function() {
	            var xhr = $.ajaxSettings.xhr();
	            // update progress bar
	            xhr.onprogress = function(evt) {
	                if (evt.lengthComputable) {
	                    var percentComplete = evt.loaded / evt.total;
	                    $(".js-pdf-loading .progress-bar").css({
	                        width: percentComplete * 50 + "%",
	                    });
	                }
	            };
	            return xhr;
	        },
	        success: function(data) {
	            $(".js-pdf-loading .progress-bar").css("width", "50%");
	            var show = ShowUtils.fromJSONString(data);

	            // update dot labels
	            $(".js-dot-labels").empty();
	            $.each(show.getDotLabels(), addDotLabel);
	            $(".js-dot-labels")
	                .val(options.dots)
	                .trigger("chosen:updated");

	            if (options.dots.length === 0) {
	                showError("No dot selected.");
	                return;
	            }

	            // generate pdf
	            window.generator = new PDFGenerator(show, options.dots)
	            try {
	                window.generator.generate(options);
	            } catch(err) {
	                showError("An error occurred.");
	                throw err;
	            }
	            $("<iframe>")
	                .addClass("js-pdf-preview")
	                .attr("src", window.generator.data)
	                .appendTo("body")
	                .hide()
	                .load(function() {
	                    $(".js-pdf-loading").remove();
	                    $(this).show();
	                    // cancel remove
	                    clearTimeout(window.removeIFrame);
	                });
	            // after 5 seconds, timeout PDF generation
	            window.removeIFrame = setTimeout(removeIFrame, 5000);
	        },
	        error: function() {
	            showError("Could not reach server.");
	        },
	    });
	});


/***/ },
/* 1 */,
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines miscellaneous utility functions.
	 */

	/**
	 * A collection of javascript utility functions.
	 */
	var JSUtils = {};
	 
	/**
	 * Causes a child class to inherit from a parent class.
	 *
	 * @param {function} ChildClass The class that will inherit
	 *   from another.
	 * @param {function} ParentClass The class to inherit from.
	 */
	JSUtils.extends = function (ChildClass, ParentClass) {
	    var Inheritor = function () {}; // dummy constructor
	    Inheritor.prototype = ParentClass.prototype;
	    ChildClass.prototype = new Inheritor();
	};

	/**
	 * Returns the value of the given name in the URL query string
	 *
	 * getQueryValue("hello") on http://foo.bar?hello=world should return "world"
	 *
	 * @param {String} name
	 * @returns {String|null} the value of the name or null if name not in URL query string
	 */
	JSUtils.getURLValue = function(name) {
	    var vals = this.getAllURLParams();
	    if (vals[name] !== undefined) {
	        return vals[name];
	    } else {
	        return null;
	    }
	};

	/**
	 * Returns all name-value pairs in the URL query string
	 *
	 * @returns {object} a dictionary mapping name to value
	 */
	JSUtils.getAllURLParams = function() {
	    var vals = {};
	    var query = window.location.search.substr(1);
	    var vars = query.split("&");
	    for (var i = 0; i < vars.length; i++) {
	        var pair = vars[i].split("=");
	        var name = decodeURIComponent(pair[0]);
	        var value = decodeURIComponent(pair[1]);
	        vals[name] = value;
	    }
	    return vals;
	};

	module.exports = JSUtils;

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines a collection of functions that are
	 *   used to create and manage Show objects.
	 */

	 var ViewerFileLoadSelector = __webpack_require__(11);
	 var Version = __webpack_require__(8);
	 
	 /**
	  * The collection of all functions related to creating and
	  * managing Show objects.
	  */
	 var ShowUtils = {};
	 
	/**
	 * Builds a show from a viewer file, given the content
	 * of a viewer file as a string.
	 *
	 * @param {string} fileContent The content of the
	 *   viewer file to load the show from.
	 * @return {Show} The show represented in the viewer
	 *   file.
	 */
	ShowUtils.fromJSONString = function(fileContent) {
	    var viewerObject = JSON.parse(fileContent); //Parse the JSON file text into an object
	    return this.fromJSON(viewerObject);
	};
	 
	/**
	 * Builds a show from a viewer file, as a JSON object
	 *
	 * @param {object} viewerObject The content of the
	 *   viewer file to load the show from.
	 * @return {Show} The show represented in the viewer
	 *   file.
	 */
	ShowUtils.fromJSON = function(viewerObject) {
	    var fileVersion = Version.parse(viewerObject.meta.version); //Get the version of the viewer file
	    return ViewerFileLoadSelector.getInstance().getAppropriateLoader(fileVersion).loadFile(viewerObject); //Get the appropriate ViewerLoader and use it to load the file
	};

	module.exports = ShowUtils;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var PDFUtils = __webpack_require__(12);
	var HeaderWidget = __webpack_require__(13);
	var DotContinuityWidget = __webpack_require__(14);
	var IndividualContinuityWidget = __webpack_require__(15);
	var MovementDiagramWidget = __webpack_require__(16);
	var BirdsEyeWidget = __webpack_require__(17);
	var SurroundingDotsWidget = __webpack_require__(18);

	/**
	 * @constant WIDTH is the width of the PDF document, in millimeters
	 * @constant HEIGHT is the height of the PDF document, in millimeters
	 * @constant QUADRANT contains (x,y) coordinates for the top left corner of each quadrant
	 *      of the document. y coordinates offset by headers
	 */
	var WIDTH = 215.9;
	var HEIGHT = 279.4;

	var QUADRANT = [
	    {x: 3, y: 24},                     // top left
	    {x: WIDTH/2 + 3, y: 24},           // top right
	    {x: 3, y: HEIGHT/2 + 16},          // bottom left
	    {x: WIDTH/2 + 3, y: HEIGHT/2 + 16} // bottom right
	];
	var QUADRANT_HEIGHT = HEIGHT/2 - 22;
	var QUADRANT_WIDTH = WIDTH/2 - 6;

	/**
	 * This PDFGenerator class will be able to generate the PDF representation of the given
	 * show, for the given dot.
	 *
	 * @param {Show} show
	 * @param {Array<String>} dots is the list of dot labels to include in the PDF
	 */
	var PDFGenerator = function(show, dots) {
	    this.pdf = jsPDF("portrait", "mm", "letter");
	    this.show = show;
	    this.dots = dots;
	    this.sheets = show.getSheets();
	    this.data = null;
	    // tracking for progress bar
	    this.current = 0;
	    this.total = this.dots.length * this.sheets.length; // increment per dot per stuntsheet
	};

	/**
	 * generate a PDF for specified dots, containing its movements, positions, and continuities
	 * relevant to it.
	 *
	 * The function will display the pdf in the webpage's preview pane
	 *
	 * @param {Object} options, customizable options for the pdf. Current options include:
	 *      - Orientation for movement diagram (options["md-orientation"] = "west"|"east")
	 *      - Orientation for bird's eye view  (options["bev-orientation"] = "west"|"east")
	 *      - Orientation for surrounding dots (options["sd-orientation"] = "west"|"east")
	 *      - Layout order of stuntsheets      (options["layout-order"] = "ltr"|"ttb")
	 *      - Accompanying widget in endsheet  (options["endsheet-widget"] = "md"|"bev"|"sd")
	 *
	 * @return {string} the PDF data
	 */
	PDFGenerator.prototype.generate = function(options) {
	    for (var i = 0; i < this.dots.length; i++) {
	        if (i !== 0) {
	            this.pdf.addPage();
	        }
	        this.dot = this.dots[i];
	        this._generate(options);
	    }

	    this.data = this.pdf.output("datauristring");
	};

	/**
	 * Generate a PDF for one dot, given by this.dot
	 */
	PDFGenerator.prototype._generate = function(options) {
	    // Widgets
	    this.headerWidget = new HeaderWidget(this.pdf, {
	        dotLabel: this.dot,
	        title: this.show.getTitle(),
	        totalSheets: this.sheets.length
	    });
	    this.dotContinuityWidget = new DotContinuityWidget(this.pdf);
	    this.individualContinuityWidget = new IndividualContinuityWidget(this.pdf);
	    this.movementDiagramWidget = new MovementDiagramWidget(this.pdf, options["md-orientation"]);
	    this.birdsEyeWidget = new BirdsEyeWidget(this.pdf, options["bev-orientation"]);
	    this.surroundingDotsWidget = new SurroundingDotsWidget(this.pdf, options["sd-orientation"]);

	    var movements = this._getMovements();
	    for (var pageNum = 0; pageNum < Math.ceil(this.sheets.length / 4); pageNum++) {
	        if (pageNum != 0) {
	            this.pdf.addPage();
	        }

	        var pageSheets = []
	        for (var i = 0; i < 4; i++) {
	            var sheet = pageNum * 4 + i;
	            if (sheet == this.sheets.length) {
	                break;
	            }
	            pageSheets.push(this.sheets[sheet]);
	        }

	        this.headerWidget.draw({
	            pageNum: pageNum + 1,
	            isLeftToRight: options["layout-order"] === "ltr"
	        });
	        // drawing lines between quadrants
	        this.pdf.setDrawColor(150);
	        this.pdf.line(
	            WIDTH/2, 24,
	            WIDTH/2, HEIGHT
	        );
	        this.pdf.line(
	            0, HEIGHT/2 + 2.5,
	            WIDTH, HEIGHT/2 + 2.5
	        );
	        this.pdf.setDrawColor(0);

	        var quadrantOrder = [0, 1, 2, 3]; // top left, top right, bottom left, bottom right
	        if (options["layout-order"] === "ttb") {
	            quadrantOrder = [0, 2, 1, 3];
	        }

	        for (var i = 0; i < pageSheets.length; i++) {
	            var x = QUADRANT[quadrantOrder[i]].x;
	            var y = QUADRANT[quadrantOrder[i]].y;
	            var sheet = pageSheets[i];
	            var dot = sheet.getDotByLabel(this.dot);
	            this.dotContinuityWidget.draw(
	                x,
	                y,
	                QUADRANT_WIDTH,
	                QUADRANT_HEIGHT/5,
	                {
	                    sheet: sheet,
	                    dotType: sheet.getDotType(this.dot)
	                }
	            );
	            this.individualContinuityWidget.draw(
	                x,
	                y + QUADRANT_HEIGHT / 5,
	                QUADRANT_WIDTH / 2,
	                QUADRANT_HEIGHT * 2/5,
	                {
	                    dot: dot,
	                    duration: sheet.getDuration()
	                }
	            );
	            this.movementDiagramWidget.draw(
	                x + QUADRANT_WIDTH/2 + 1,
	                y + QUADRANT_HEIGHT/5,
	                QUADRANT_WIDTH/2,
	                QUADRANT_HEIGHT * 2/5,
	                {
	                    movements: movements[pageNum * 4 + i]
	                }
	            );
	            this.birdsEyeWidget.draw(
	                x,
	                y + QUADRANT_HEIGHT * 3/5,
	                QUADRANT_WIDTH/2,
	                QUADRANT_HEIGHT * 2/5,
	                {
	                    sheet: sheet,
	                    dot: dot
	                }
	            );
	            this.surroundingDotsWidget.draw(
	                x + QUADRANT_WIDTH/2 + 1,
	                y + QUADRANT_HEIGHT * 3/5,
	                QUADRANT_WIDTH/2,
	                QUADRANT_HEIGHT * 2/5,
	                {
	                    sheet: sheet,
	                    dot: dot
	                }
	            );
	            // increment progress bar
	            this.current++;
	            var percentage = this.current / this.total;
	            $(".js-pdf-loading .progress-bar").css({
	                width: (50 + percentage * 50) + "%", // 50% from loading server
	            });
	        }
	    }
	    var endsheetWidget;
	    switch(options["endsheet-widget"]) {
	        case "md":
	            endsheetWidget = this.movementDiagramWidget;
	            break;
	        case "bev":
	            endsheetWidget = this.birdsEyeWidget;
	            break;
	        case "sd":
	            endsheetWidget = this.surroundingDotsWidget;
	            break;
	        default:
	            throw new Error(options["endsheet-widget"] + " is not a valid option for endsheet widget");
	    }
	    if (endsheetWidget instanceof MovementDiagramWidget) {
	        this._addEndSheet(endsheetWidget, {movements: movements});
	    } else {
	        this._addEndSheet(endsheetWidget);
	    }
	};

	/**
	 * Returns a list of movements for each stuntsheet, which are changes in position with
	 * respect to the previous position
	 * @return {Array<Array<Object>>} where each element is a list of movements for each
	 *   stuntsheet. The Object contains:
	 *      - {Coordinate} startPosition
	 *      - {int} deltaX
	 *      - {int} deltaY
	 */
	PDFGenerator.prototype._getMovements = function() {
	    var moves = [];
	    var dotLabel = this.dot;
	    this.sheets.forEach(function(sheet) {
	        var lines = [];
	        var movements = sheet.getDotByLabel(dotLabel).getMovementCommands();
	        var startPosition = movements[0].getStartPosition();
	        movements.forEach(function(movement) {
	            var endPosition = movement.getEndPosition();
	            if (movement.getMiddlePoints === undefined) {
	                lines.push({
	                    startPosition: startPosition,
	                    deltaX: endPosition.x - startPosition.x,
	                    deltaY: endPosition.y - startPosition.y
	                });
	            } else { // movement is a MovementCommandArc
	                // each item is an Array of (deltaX, deltaY) pairs
	                movement.getMiddlePoints().forEach(function(move) {
	                    lines.push({
	                        startPosition: startPosition,
	                        deltaX: move[0],
	                        deltaY: move[1]
	                    });
	                });
	            }
	            startPosition = endPosition;
	        });
	        moves.push(lines);
	    });
	    return moves;
	};

	/**
	 * Draws the end sheet containing a compilation of all the continuities and movements diagrams
	 * 
	 * @param {PDFWidget} the widget to place next to the individual continuity
	 * @param {object} options, contains options for the widgets, if necessary.
	 */
	PDFGenerator.prototype._addEndSheet = function(widget, options) {
	    this.pdf.addPage();
	    this.pdf.line(
	        WIDTH/2, 10,
	        WIDTH/2, HEIGHT
	    );
	    var title = this.show.getTitle() + " - Dot " + this.dot;
	    this.pdf.setFontSize(15);
	    this.pdf.text(title, WIDTH/2 - PDFUtils.getTextWidth(title, 15)/2, 8);
	    var paddingX = 2;
	    var paddingY = .5;
	    var textSize = 10;
	    var textHeight = PDFUtils.getTextHeight(textSize);
	    var labelSize = 20;
	    var labelWidth = PDFUtils.getTextWidth("00", labelSize) + paddingX * 2;
	    var labelHeight = PDFUtils.getTextHeight(labelSize);
	    var widgetSize = 30;
	    var continuitySize = WIDTH/2 - widgetSize - labelWidth - paddingX * 4;
	    var x = 0;
	    var y = 10;
	    for (var i = 0; i < this.sheets.length; i++) {
	        var sheet = this.sheets[i];
	        var dot = sheet.getDotByLabel(this.dot);

	        var height = widgetSize - 5;
	        var continuityHeight = (dot.getMovementCommands().length + 1) * (textHeight + 1) + 2*paddingY;
	        if (continuityHeight > height) {
	            height = continuityHeight;
	        }

	        if (y + height > HEIGHT - 5) {
	            if (x == 0) {
	                x = WIDTH/2 + paddingX;
	            } else {
	                this.pdf.addPage();
	                this.pdf.line(
	                    WIDTH/2, 10,
	                    WIDTH/2, HEIGHT
	                );
	                this.pdf.setFontSize(15);
	                this.pdf.text(title, WIDTH/2 - PDFUtils.getTextWidth(title, 15)/2, 8);
	                x = 0;
	            }
	            y = 10;
	        }
	        this.pdf.setFontSize(labelSize);
	        this.pdf.text(
	            String(i + 1),
	            x + paddingX * 2,
	            y + paddingY + labelHeight
	        );
	        this.individualContinuityWidget.draw(
	            x + labelWidth + paddingX,
	            y + paddingY,
	            continuitySize,
	            height,
	            {
	                dot: dot,
	                duration: this.sheets[i].getDuration()
	            }
	        );
	        var widgetOptions = {
	            sheet: sheet,
	            dot: dot,
	            minimal: true
	        };
	        if (widget instanceof MovementDiagramWidget) {
	            widgetOptions["movements"] = options["movements"][i];
	        }
	        widget.draw(
	            x + labelWidth + continuitySize + paddingX * 2,
	            y + paddingY,
	            widgetSize,
	            height,
	            widgetOptions
	        );
	        y += height + 2 * paddingY;
	    }
	};

	module.exports = PDFGenerator;


/***/ },
/* 5 */,
/* 6 */,
/* 7 */,
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines the Version class.
	 */

	/**
	 * Version objects represent a version of a file
	 * or application in the following format:
	 * [major].[minor].[revision].
	 *
	 * @param {int} major The major version.
	 * @param {int} minor The minor version.
	 * @param {int} revision The revision number.
	 */
	var Version = function(major, minor, revision) {
	    this._major = major;
	    this._minor = minor;
	    this._revision = revision;
	};

	/**
	 * Builds a string representation of the Version.
	 * String representations take the format:
	 * [major].[minor].[revision].
	 *
	 * @return {string} A string representation of this
	 *   version.
	 */
	Version.prototype.stringify = function() {
	    return this._major + "." + this._minor + "." + this._revision;
	};

	/**
	 * Compares this Version to another, and indicates which
	 * version is an earlier one.
	 *
	 * @param {Version} otherVersion The version to compare
	 *   this one against.
	 * @return {int} A negative value if this version is
	 *   an earlier one than the other; a positive value
	 *   if this version is later than the other one;
	 *   zero if the versions are identical.
	 */
	Version.prototype.compareTo = function(otherVersion) {
	    var delta = this._major - otherVersion._major;
	    if (delta != 0) {
	        return delta;
	    }
	    delta = this._minor - otherVersion._minor;
	    if (delta != 0) {
	        return delta;
	    }
	    delta = this._revision - otherVersion._revision;
	    return delta;
	};

	/**
	 * Builds a Version object from a string.
	 * These strings should be in the format:
	 * [major].[minor].[revision].
	 *
	 * @param {string} stringVersion A string representation
	 *   of a Version.
	 * @return {Version} A Version which matches the
	 *   provided string.
	 */
	Version.parse = function(stringVersion) {
	    var versionPieces = stringVersion.split(".");
	    return new Version(parseInt(versionPieces[0]), parseInt(versionPieces[1]), parseInt(versionPieces[2]));
	};

	module.exports = Version;

/***/ },
/* 9 */,
/* 10 */,
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview This file describes how viewer files are loaded.
	 *   A singleton of the ViewerFileLoadSelector class
	 *   is used to determine how to load a specific version of the
	 *   viewer file. For more information about how a FileLoadSelector
	 *   like the ViewerFileLoadSelector works, @see FileLoadSelector.js.
	 *   Here are the steps that you should follow when the file format
	 *   changes:
	 *     - Define a FileLoadSelector.FileLoader that can load the
	 *         new file version
	 *     - Register your new file loader in 
	 *         ViewerFileLoadSelector._setupInstance(...)
	 *   
	 */

	var FileLoadSelector = __webpack_require__(21);
	var InvalidFileTypeError = __webpack_require__(22);
	var JSUtils = __webpack_require__(2);
	var Version = __webpack_require__(8);
	var Dot = __webpack_require__(23);
	var Sheet = __webpack_require__(24);
	var Show = __webpack_require__(25);
	var MovementCommandStand = __webpack_require__(26);
	var MovementCommandMarkTime = __webpack_require__(27);
	var MovementCommandArc = __webpack_require__(28);
	var MovementCommandMove = __webpack_require__(29);
	var MovementCommandGoto = __webpack_require__(30);
	var MovementCommandEven = __webpack_require__(31);
	 
	/**
	 * Every version of the Viewer File needs to be loaded in a different way -
	 * this class is responsible for finding the appropriate ViewerFileLoader
	 * object for loading a particular Viewer File version.
	 */
	var ViewerFileLoadSelector = function() {
	    FileLoadSelector.apply(this, []);
	};

	JSUtils.extends(ViewerFileLoadSelector, FileLoadSelector);

	/**
	 * The ViewerFileLoadSelector is a singleton, and this is its
	 * instance.
	 * @type {ViewerFileLoadSelector}
	 */
	ViewerFileLoadSelector._instance = undefined;

	/**
	 * Returns the ViewerFileLoadSelector singleton instance. If it doesn't exist,
	 * it is created and then returned.
	 *
	 * @return {ViewerFileLoadSelector} The ViewerFileLoadSelector singleton instance.
	 */
	ViewerFileLoadSelector.getInstance = function() {
	    if (ViewerFileLoadSelector._instance === undefined) {
	        ViewerFileLoadSelector._instance = new ViewerFileLoadSelector();
	        ViewerFileLoadSelector._setupInstance(ViewerFileLoadSelector._instance);
	    }
	    return ViewerFileLoadSelector._instance;    
	};

	/**
	 * Loads a new ViewerFileLoadSelector with all of the known ViewerFileLoader
	 * types, so that it understands how to load every Viewer File version.
	 *
	 * @param {ViewerFileLoadSelector} instance The ViewerFileLoadSelector to set up.
	 */
	ViewerFileLoadSelector._setupInstance = function(instance) {
	    instance.registerLoader(new Version(1, 0, 0), new ViewerFileLoad_1_0_0());
	};
	 
	/**
	 * This class is responsible for loading viewer files of a particular version.
	 */
	ViewerFileLoadSelector.ViewerFileLoader = function() {
	};

	JSUtils.extends(ViewerFileLoadSelector.ViewerFileLoader, FileLoadSelector.FileLoader); 


	/**
	 *=================================================================
	 *====================-- LOAD VIEWER FILE 1.0.0
	 *=================================================================
	 * ALL AVAILABLE METHODS IN THIS VERSION:
	 *   loadFile
	 *   loadShow
	 *   loadSheets
	 *   buildIndividualSheet
	 *   buildDots
	 *   buildDotMovements
	 *   buildIndividualMovement
	 *   buildStandMovement
	 *   buildMarkMovement
	 *   buildMoveMovement
	 *   buildGotoMovement
	 *   buildArcMovement
	 *   buildEvenMovement
	 * ADDED METHODS IN THIS VERSION:
	 *  all available METHODS
	 * REMOVED METHODS IN THIS VERSION:
	 *   none
	 * MODIFIED METHODS IN THIS VERSION:
	 *   none
	 * 
	 * To use: call the loadFile method.
	 */
	var ViewerFileLoad_1_0_0 = function() {
	};

	JSUtils.extends(ViewerFileLoad_1_0_0, ViewerFileLoadSelector.ViewerFileLoader);

	/**
	 * Loads an entire viewer file, and returns the result. For
	 * viewer file version 1.0.0, the result is just a Show object.
	 *
	 * @param {object} viewerFileObject The main object from a
	 *   viewer file.
	 * @return {Show} The show described by the viewer file.
	 */
	ViewerFileLoad_1_0_0.prototype.loadFile = function (viewerFileObject) {
	    return this.loadShow(viewerFileObject.show);
	};

	/**
	 * Loads a show from a viewer file.
	 *
	 * @param {object} showToLoad The show object, as it is represented
	 *   in the JSON viewer file.
	 * @return {Show} The show represented in the viewer file.
	 */
	ViewerFileLoad_1_0_0.prototype.loadShow = function(showToLoad) {
	    if (typeof showToLoad === "undefined") {
	        throw new InvalidFileTypeError("Please upload a proper viewer file.");
	    }
	    var show = new Show(showToLoad.title, showToLoad.year, showToLoad.description, showToLoad.labels);
	    this.loadSheets(show, showToLoad.sheets);
	    return show;
	};

	/**
	 * Builds the stuntsheets represented in the viewer file, and appends them
	 * to the show.
	 *
	 * @param {Show} show The show to append the sheets to.
	 * @param {object} sheetsToLoad The show.sheets array in the viewer
	 *   file.
	 */
	ViewerFileLoad_1_0_0.prototype.loadSheets = function(show, sheetsToLoad) {
	    for (var index = 0; index < sheetsToLoad.length; index++) {
	        show.appendSheet(this.buildIndividualSheet(sheetsToLoad[index]));
	    }
	};

	/**
	 * Builds a stuntsheet that is represented in the viewer file.
	 *
	 * @param {object} sheetToBuild The object representing the stuntsheet
	 *   in the viewer file.
	 * @return {Sheet} The Sheet object represented in the viewer file.
	 */
	ViewerFileLoad_1_0_0.prototype.buildIndividualSheet = function(sheetToBuild) {
	    return new Sheet(
	        sheetToBuild.label,
	        sheetToBuild.field_type,
	        sheetToBuild.dot_types,
	        sheetToBuild.dot_labels,
	        sheetToBuild.continuities,
	        sheetToBuild.beats,
	        this.buildDots(sheetToBuild.movements),
	        Object.keys(sheetToBuild.movements)
	    );
	};

	/**
	 * Builds the dots for a particular stuntsheet from their
	 * representations in the viewer file.
	 *
	 * @param {object} dotsToBuild An array with all of the dots for the sheet,
	 *   as represented in the viewer file.
	 * @return {array} An array of all dots on the sheet.
	 */
	ViewerFileLoad_1_0_0.prototype.buildDots = function(dotsToBuild) {
	    var allDots = [];
	    for (var dotLabel in dotsToBuild) {
	        allDots.push(new Dot(dotLabel, this.buildDotMovements(dotsToBuild[dotLabel])));
	    }
	    return allDots;
	};

	/**
	 * Builds an array of movements for a particular dot from their
	 * representations in the viewer file.
	 *
	 * @param {object} movementsToBuild An array of all of the movements
	 *   executed by the dot, as represented in the viewer file.
	 * @return {array} An array of all MovementCommands that the
	 *   dot will execute.
	 */
	ViewerFileLoad_1_0_0.prototype.buildDotMovements = function(movementsToBuild) {
	    var allMovements = [];
	    for (var index = 0; index < movementsToBuild.length; index++) {
	        allMovements.push(this.buildIndividualMovement(movementsToBuild[index]));
	    }
	    return allMovements;
	};

	/**
	 * Builds a MovementCommand from its representation
	 * in the viewer file.
	 *
	 * @param {object} movementToBuild The movement to build, as
	 *   represented in the viewer file.
	 * @return {MovementCommand} The MovementCommand that was
	 *   represented in the viewer file.
	 */
	ViewerFileLoad_1_0_0.prototype.buildIndividualMovement = function(movementToBuild) {
	    switch (movementToBuild.type) {
	        case "stand":
	            return this.buildStandMovement(movementToBuild);
	        case "mark":
	            return this.buildMarkMovement(movementToBuild);
	        case "move":
	            return this.buildMoveMovement(movementToBuild);
	        case "goto":
	            return this.buildGotoMovement(movementToBuild);
	        case "arc":
	            return this.buildArcMovement(movementToBuild);
	        case "even":
	            return this.buildEvenMovement(movementToBuild);
	        default:
	            throw new TypeError("Movement type unrecognized.");
	    }
	};

	/**
	 * Builds a MovementCommandStand from its representation in
	 * a viewer file.
	 *
	 * @param {object} movementToBuild The MovementCommand's representation
	 *   in the viewer file.
	 * @return {MovementCommandStand} The MovementCommandStand represented
	 *   in the viewer file.
	 */
	ViewerFileLoad_1_0_0.prototype.buildStandMovement = function(movementToBuild) {
	    return new MovementCommandStand(movementToBuild.x, movementToBuild.y, movementToBuild.facing, movementToBuild.beats);
	};

	/**
	 * Builds a MovementCommandMarkTime from its representation in
	 * a viewer file.
	 *
	 * @param {object} movementToBuild The MovementCommand's representation
	 *   in the viewer file.
	 * @return {MovementCommandMarkTime} The MovementCommandMarkTime represented
	 *   in the viewer file.
	 */
	ViewerFileLoad_1_0_0.prototype.buildMarkMovement = function(movementToBuild) {
	    return new MovementCommandMarkTime(movementToBuild.x, movementToBuild.y, movementToBuild.facing, movementToBuild.beats);
	};

	/**
	 * Builds a MovementCommandMove from its representation in
	 * a viewer file.
	 *
	 * @param {object} movementToBuild The MovementCommand's representation
	 *   in the viewer file.
	 * @return {MovementCommandMove} The MovementCommandMove represented
	 *   in the viewer file.
	 */
	ViewerFileLoad_1_0_0.prototype.buildMoveMovement = function(movementToBuild) {
	    return new MovementCommandMove(movementToBuild.start_x, movementToBuild.start_y, movementToBuild.step_size, movementToBuild.direction, movementToBuild.facing, movementToBuild.beats, movementToBuild.beats_per_step);
	};

	/**
	 * Builds a MovementCommandGoto from its representation in
	 * a viewer file.
	 *
	 * @param {object} movementToBuild The MovementCommand's representation
	 *   in the viewer file.
	 * @return {MovementCommandGoto} The MovementCommandGoto represented
	 *   in the viewer file.
	 */
	ViewerFileLoad_1_0_0.prototype.buildGotoMovement = function(movementToBuild) {
	    return new MovementCommandGoto(movementToBuild.from_x, movementToBuild.from_y, movementToBuild.to_x, movementToBuild.to_y, movementToBuild.facing, movementToBuild.beats);
	};

	/**
	 * Builds a MovementCommandArc from its representation in
	 * a viewer file.
	 *
	 * @param {object} movementToBuild The MovementCommand's representation
	 *   in the viewer file.
	 * @return {MovementCommandArc} The MovementCommandArc represented
	 *   in the viewer file.
	 */
	ViewerFileLoad_1_0_0.prototype.buildArcMovement = function(movementToBuild) {
	    return new MovementCommandArc(movementToBuild.start_x, movementToBuild.start_y, movementToBuild.center_x, movementToBuild.center_y, movementToBuild.angle, movementToBuild.facing_offset, movementToBuild.beats, movementToBuild.beats_per_step);
	};

	/**
	 * Builds a MovementCommandEven from its representation in
	 * a viewer file.
	 *
	 * @param {object} movementToBuild The MovementCommand's representation
	 *   in the viewer file.
	 * @return {MovementCommandEven} The MovementCommandEven represented
	 *   in the viewer file.
	 */
	ViewerFileLoad_1_0_0.prototype.buildEvenMovement = function(movementToBuild) {
	    return new MovementCommandEven(movementToBuild.x1, movementToBuild.y1, movementToBuild.x2, movementToBuild.y2, movementToBuild.facing, movementToBuild.beats, movementToBuild.beats_per_step);
	};

	module.exports = ViewerFileLoadSelector;

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines functions that will be useful for generating the PDF
	 */

	/**
	 * The collection of all the utility functions defined in this file
	 * @type {object}
	 */
	PDFUtils = {};

	PDFUtils.DUMMY_PDF = jsPDF("portrait", "mm", "letter");

	PDFUtils.SCALE_FACTOR = PDFUtils.DUMMY_PDF.internal.scaleFactor;

	PDFUtils.DEFAULT_FONT_SIZE = 12;

	/**
	 * Returns the width of a String in millimeters
	 * @param {String} text
	 * @param {int} size, font size the text will be in
	 */
	PDFUtils.getTextWidth = function(text, size) {
	    return this.DUMMY_PDF.getStringUnitWidth(text) * size/this.SCALE_FACTOR
	};

	/**
	 * Returns the height of text in the current fontsize in millimeters
	 * @param {int} size, font size the text will be in
	 */
	PDFUtils.getTextHeight = function(size) {
	    return size/this.SCALE_FACTOR;
	};

	/**
	 * Returns the text that will be shown for the given x-coordinate in
	 * the form of "4N N40" to mean "4 steps North of the North-40"
	 *
	 * @param {int} x, the x-coordinate
	 * @return {String} the display text for the x-coordinate
	 */
	PDFUtils.getXCoordinateText = function(x) {
	    var steps = x % 8;
	    var yardline = Math.floor(x / 8) * 5;

	    if (steps > 4) { // closer to North-side yardline
	        yardline += 5;
	    }

	    if (yardline < 50) {
	        yardline = "S" + yardline;
	    } else if (yardline == 50) {
	        yardline = "50";
	    } else {
	        yardline = "N" + (100 - yardline);
	    }

	    if (steps > 4) {
	        steps = 8 - steps;
	        steps = Math.round(steps * 10) / 10;
	        return steps + "S " + yardline;
	    } else if (steps == 0) {
	        return yardline;
	    } else {
	        steps = Math.round(steps * 10) / 10;
	        return steps + "N " + yardline;
	    }
	};

	/**
	 * Returns the text that will be shown for the given y-coordinate in
	 * the form of "8E EH" to mean "8 steps East of the East Hash"
	 *
	 * @param {int} y, the y-coordinate
	 * @return {String} the display text for the y-coordinate
	 */
	PDFUtils.getYCoordinateText = function(y) {
	    function round(val) {
	        return Math.round(val * 10) / 10;
	    };

	    // West Sideline
	    if (y == 0) {
	        return "WS";
	    }
	    // Near West Sideline
	    if (y <= 16) {
	        return round(y) + " WS";
	    }
	    // West of West Hash
	    if (y < 32) {
	        return round(32 - y) + "W WH";
	    }
	    // West Hash
	    if (y == 32) {
	        return "WH";
	    }
	    // East of West Hash
	    if (y <= 40) {
	        return round(y - 32) + "E WH";
	    }
	    // West of East Hash
	    if (y < 52) {
	        return round(52 - y) + "W EH";
	    }
	    // East Hash
	    if (y == 52) {
	        return "EH";
	    }
	    // East of East Hash
	    if (y <= 68) {
	        return round(y - 52) + "E EH";
	    }
	    // Near East Sideline
	    if (y < 84) {
	        return round(84 - y) + " ES";
	    }
	    // East Sideline
	    return "ES";
	};

	/**
	 * Various jsPDF plugins that can be called by the jsPDF object itself
	 */
	(function (jsPDFAPI) {
	    "use strict";

	    /**
	     * This jsPDF plugin draws a dot for the given dot type at the given coordinates
	     * @param {String} dotType
	     * @param {float} x
	     * @param {float} y
	     * @param {float} radius
	     */
	    jsPDFAPI.drawDot = function(dotType, x, y, radius) {
	        this.setLineWidth(.1);
	        if (dotType.indexOf("open") != -1) {
	            this.setFillColor(255);
	            this.circle(x, y, radius, "FD");
	        } else {
	            this.setFillColor(0);
	            this.circle(x, y, radius, "FD");
	        }

	        radius += .1; // line radius sticks out of the circle
	        if (dotType.indexOf("backslash") != -1 || dotType.indexOf("x") != -1) {
	            this.line(
	                x - radius, y - radius,
	                x + radius, y + radius
	            );
	        }

	        if (dotType.indexOf("forwardslash") != -1 || dotType.indexOf("x") != -1) {
	            this.line(
	                x - radius, y + radius,
	                x + radius, y - radius
	            );
	        }
	        this.setLineWidth(.3);
	        this.setFillColor(0);
	        return this;
	    };

	    /**
	     * This jsPDF plugin resets PDF drawing options to default values, such as black
	     * stroke, white fill, black text, etc.
	     */
	    jsPDFAPI.resetFormat = function() {
	        this.setFontSize(PDFUtils.DEFAULT_FONT_SIZE);
	        this.setTextColor(0);
	        this.setDrawColor(0);
	        this.setFillColor(255);
	        this.setLineWidth(.3);
	        return this;
	    };
	})(jsPDF.API);

	module.exports = PDFUtils;

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines the widget for generating the page's headers
	 */

	var JSUtils = __webpack_require__(2);
	var PDFUtils = __webpack_require__(12);
	var PDFWidget = __webpack_require__(20);

	/**
	 * @constant WIDTH is the width of the PDF document, in millimeters
	 * @constant HEIGHT is the height of the PDF document, in millimeters
	 */
	var WIDTH = 215.9;
	var HEIGHT = 279.4;

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
	        x: WIDTH * 1/6,
	        y: 5,
	        width: WIDTH * 2/3,
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
	        marginX: 4,
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

	    x = WIDTH * 5/6 - header.paddingX - PDFUtils.getTextWidth("Page 0/0", pageInfo.size);
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

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines the widget for generating a dot type's continuity
	 */

	var JSUtils = __webpack_require__(2);
	var PDFUtils = __webpack_require__(12);
	var PDFWidget = __webpack_require__(20);

	/**
	 * Represents the widget for a given dot type's continuity
	 *
	 * This widget will include an image of the dot type and the overall dot type continuity
	 *
	 * @param {jsPDF} pdf, the jsPDF object to be written to
	 */
	var DotContinuityWidget = function(pdf) {
	    PDFWidget.apply(this, [pdf]);
	};

	JSUtils.extends(DotContinuityWidget, PDFWidget);

	/**
	 * Draws the Dot Continuity Widget with the given options:
	 *      - {Sheet} sheet, the current sheet
	 *      - {String} dotType, the type of dot to draw
	 */
	DotContinuityWidget.prototype.draw = function(x, y, width, height, options) {
	    var _this = this;

	    var box = {
	        paddingX: 2,
	        paddingY: 1
	    };
	    var text = {
	        x: x + box.paddingX,
	        y: y + box.paddingY,
	        size: 10
	    };
	    var dotType = options["dotType"];
	    var maxWidth = width - box.paddingX * 2 - 6;
	    var maxHeight = height - box.paddingY * 2 - 3;
	    var continuities = options["sheet"].getContinuityTexts(dotType);

	    this.pdf.rect(x, y, width, height - 1.5);

	    // fail-safe for sheets without Continuity Texts
	    if (typeof continuities === "undefined") {
	        return;
	    }

	    continuities = continuities.map(function(continuity) {
	        while (PDFUtils.getTextWidth(continuity, text.size) > maxWidth) {
	            text.size--;
	        }
	        return continuity;
	    });

	    while (continuities.length * PDFUtils.getTextHeight(text.size) > maxHeight) {
	        text.size--;
	    }

	    this.pdf.drawDot(
	        dotType,
	        text.x + 1.5,
	        text.y + 2,
	        1.5
	    );
	    text.x += 4;
	    this.pdf.setFontSize(10);
	    this.pdf.text(
	        ":",
	        text.x,
	        text.y + PDFUtils.getTextHeight(10)
	    );
	    this.pdf.setFontSize(text.size);
	    text.x += 2;
	    text.y += PDFUtils.getTextHeight(text.size);
	    this.pdf.text(
	        continuities,
	        text.x,
	        text.y
	    );
	    this.pdf.resetFormat();
	};

	module.exports = DotContinuityWidget;

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines the widget for generating a dot's individual continuity
	 */

	var JSUtils = __webpack_require__(2);
	var PDFUtils = __webpack_require__(12);
	var PDFWidget = __webpack_require__(20);

	/**
	 * Represents the widget for a given dot's individual continuity
	 *
	 * This widget will include each movement for the dot and the duration of the stuntsheet
	 *
	 * @param {jsPDF} pdf, the jsPDF object to be written to
	 */
	var IndividualContinuityWidget = function(pdf) {
	    PDFWidget.apply(this, [pdf]);
	};

	JSUtils.extends(IndividualContinuityWidget, PDFWidget);

	/**
	 * Draws the Individual Continuity Widget with the given options:
	 *      - {Dot} dot, the selected dot
	 *      - {int} duration, the total beats of all the continuities
	 */
	IndividualContinuityWidget.prototype.draw = function(x, y, width, height, options) {
	    var continuities = this._getContinuityTexts(options["dot"]);

	    var box = {
	        paddingX: 2,
	        paddingY: 1,
	        size: 10
	    };
	    var textHeight = PDFUtils.getTextHeight(box.size);
	    var textY = y + box.paddingY;
	    var textX = x + box.paddingX;
	    var maxWidth = 0; // keeps track of longest continuity length
	    var deltaY = 0; // keeps track of total height of all continuities

	    this.pdf.rect(x, y, width, height);
	    this.pdf.setFontSize(box.size);

	    for (var i = 0; i < continuities.length; i++) {
	        var continuity = continuities[i];
	        var length = PDFUtils.getTextWidth(continuity, box.size);
	        if (length > maxWidth) {
	            maxWidth = length;
	        }
	        deltaY += textHeight + .7;
	        if (deltaY > height - textHeight - box.paddingY) {
	            if (maxWidth < width/2 && textX < width/2) {
	                textX += width/2;
	                deltaY = textHeight + .7;
	            } else {
	                this.pdf.text("...", textX, textY + deltaY - textHeight/2);
	                break;
	            }
	        }

	        this.pdf.text(
	            continuity,
	            textX,
	            textY + deltaY
	        );
	    }

	    var totalLabel = options["duration"] + " beats total";
	    this.pdf.text(
	        totalLabel,
	        x + width/2 - PDFUtils.getTextWidth(totalLabel, box.size)/2 - 3,
	        y + height - box.paddingY
	    );
	    this.pdf.resetFormat();
	};

	/*
	 * Returns the selected dot's individual continuity texts
	 *
	 * @param {Dot} dot, the selected dot
	 * @return {Array<String>} an Array of continuity texts for each sheet
	 */
	IndividualContinuityWidget.prototype._getContinuityTexts = function(dot) {
	    var continuities = [];
	    dot.getMovementCommands().forEach(function(movement) {
	        var text = movement.getContinuityText();
	        if (text !== "") {
	            continuities.push(text);
	        }
	    });
	    return continuities;
	};

	module.exports = IndividualContinuityWidget;

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines the widget for generating a dot's movement diagram
	 */

	var JSUtils = __webpack_require__(2);
	var PDFUtils = __webpack_require__(12);
	var PDFWidget = __webpack_require__(20);

	/**
	 * Represents the widget for a given dot's movement diagram
	 *
	 * This widget will include lines that show the movement of the dot, with
	 * a circle at the start and a cross at the end.
	 *
	 * @param {jsPDF} pdf, the jsPDF object to be written to
	 * @param {String} orientation, the direction on the top of the box
	 */
	var MovementDiagramWidget = function(pdf, orientation) {
	    this.westUp = orientation == "west";
	    PDFWidget.apply(this, [pdf]);
	};

	JSUtils.extends(MovementDiagramWidget, PDFWidget);

	/**
	 * Draws the Movement Diagram Widget with the given options:
	 *      - {Array<Object>} movements, a list of every movement as an object containing:
	 *          + startPosition
	 *          + deltaX
	 *          + deltaY
	 *      - {boolean} minimal, true if drawing as little of the widget as possible, false otherwise
	 */
	MovementDiagramWidget.prototype.draw = function(x, y, width, height, options) {
	    var _this = this;
	    var movements = options["movements"];

	    var textWidth = PDFUtils.getTextWidth("S", PDFUtils.DEFAULT_FONT_SIZE);
	    var textHeight = PDFUtils.getTextHeight(PDFUtils.DEFAULT_FONT_SIZE);

	    var box = {
	        x: x,
	        y: y,
	        width: width - 2 * (textWidth + 2),
	        height: height - 2 * textHeight
	    };

	    box.x += width/2 - box.width/2;
	    box.y += height/2 - box.height/2;

	    if (options["minimal"]) {
	        box.y -= textHeight;
	    }

	    this._drawBox(
	        box.x,
	        box.y,
	        box.width,
	        box.height,
	        this.westUp,
	        options["minimal"]
	    );

	    var start = movements[0].startPosition;

	    // calculates scale of viewport
	    var viewport = {
	        startX: start.x,
	        startY: start.y,
	        minX: 0, // minX <= 0, maximum movement South
	        minY: 0, // minY <= 0, maximum movement West
	        maxX: 0, // maxX >= 0, maximum movement North
	        maxY: 0, // maxY >= 0, maximum movement East
	        deltaX: 0, // overall change in NS
	        deltaY: 0, // overall change in EW
	        width: 20, // in steps
	        height: box.height/box.width * 20, // in steps, keeping height/width ratio
	        update: function(x, y) {
	            this.deltaX += x;
	            this.deltaY += y;
	            if (this.deltaX < this.minX) {
	                this.minX = this.deltaX;
	            } else if (this.deltaX > this.maxX) {
	                this.maxX = this.deltaX;
	            }

	            if (this.deltaY < this.minY) {
	                this.minY = this.deltaY;
	            } else if (this.deltaY > this.maxY) {
	                this.maxY = this.deltaY;
	            }
	        },
	        getOverallX: function() {
	            return this.maxX - this.minX;
	        },
	        getOverallY: function() {
	            return this.maxY - this.minY;
	        },
	        scale: function() {
	            var deltaX = this.getOverallX();
	            var deltaY = this.getOverallY();
	            if (deltaX > this.width - 4) {
	                this.width = deltaX + 4;
	                this.height = box.height/box.width * this.width;
	            }
	            if (deltaY > this.height - 4) {
	                this.height = deltaY + 4;
	                this.width = box.width/box.height * this.height;
	            }
	        }
	    };

	    movements.forEach(function(move) {
	        viewport.update(move.deltaX, move.deltaY);
	    });
	    viewport.scale();

	    var scale = box.width / viewport.width;

	    // steps from sideline until start of viewport
	    var south = viewport.startX + viewport.maxX - viewport.getOverallX()/2 - viewport.width/2;
	    var west = viewport.startY + viewport.maxY - viewport.getOverallY()/2 - viewport.height/2;
	    var north = south + viewport.width;
	    var east = west + viewport.height;

	    // renaming variables in terms of box for ease of abstraction
	    var top, bottom, left, right;
	    // first yardline in viewport
	    var yardline;
	    if (_this.westUp) {
	        top = west;
	        bottom = east;
	        left = south;
	        right = north;
	        yardline = Math.ceil(left/8) * 5;
	    } else {
	        top = east;
	        bottom = west;
	        left = north;
	        right = south;
	        yardline = Math.floor(left/8) * 5;
	    }

	    this._drawYardlines(box, top, right, bottom, left, yardline, scale);

	    var currX = box.x + Math.abs(left - viewport.startX) * scale;
	    var currY = box.y + Math.abs(top - viewport.startY) * scale;
	    var spotRadius = box.height / 15;
	    var orientationFactor = (this.westUp) ? 1 : -1;

	    this.pdf.circle(currX, currY, spotRadius);
	    this._drawPosition(
	        box,
	        viewport.startY,
	        currY - box.y,
	        Math.abs(left - viewport.startX) < Math.abs(left - right) / 2
	    );

	    this.pdf.setLineWidth(0.5);
	    movements.forEach(function(movement) {
	        var deltaX = orientationFactor * movement.deltaX * scale;
	        var deltaY = orientationFactor * movement.deltaY * scale;
	        _this.pdf.line(currX, currY, currX + deltaX, currY + deltaY);
	        currX += deltaX;
	        currY += deltaY;
	    });

	    this.pdf.setLineWidth(0.1);
	    this.pdf.line(
	        currX - spotRadius, currY - spotRadius,
	        currX + spotRadius, currY + spotRadius
	    );
	    this.pdf.line(
	        currX + spotRadius, currY - spotRadius,
	        currX - spotRadius, currY + spotRadius
	    );
	    if (viewport.deltaY != 0) {
	        this._drawPosition(
	            box,
	            viewport.startY + viewport.deltaY,
	            currY - box.y,
	            Math.abs(left - viewport.startX - viewport.deltaX) < Math.abs(left - right) / 2
	        );
	    }
	    this.pdf.resetFormat();
	};

	/**
	 * Draws the yardlines for this widget with the given parameters
	 *
	 * @param {object} box, holds the various properties of the enclosing box
	 * @param {float} top, steps from the corresponding sideline to the edge of the view
	 * @param {float} right, steps from the corresponding sideline to the edge of the view
	 * @param {float} bottom, steps from the corresponding sideline to the edge of the view
	 * @param {float} left, steps from the corresponding sideline to the edge of the view
	 * @param {int} yardline, the first yardline in view, from 0 to 100
	 * @param {float} scale, the multiplier to convert from steps to pdf units
	 */
	MovementDiagramWidget.prototype._drawYardlines = function(box, top, right, bottom, left, yardline, scale) {
	    var x = box.x;
	    var y = box.y;
	    var width = box.width;
	    var height = box.height;

	    var yardlineSize = height * 12/47.1; // at the usual height, yardline text should be 12
	    this.pdf.setFontSize(yardlineSize);

	    var westHash, eastHash, westHashY, eastHashY;
	    if (this.westUp) {
	        westHash = top < 32 && bottom > 32;
	        eastHash = top < 52 && bottom > 52;
	        westHashY = y + (32 - top) * scale;
	        eastHashY = y + (52 - top) * scale;
	    } else {
	        eastHash = top > 52 && bottom < 52;
	        westHash = top > 32 && bottom < 32;
	        eastHashY = y + (top - 52) * scale;
	        westHashY = y + (top - 32) * scale;
	    }

	    // position of first yardline from edge of viewport
	    var deltaX = Math.abs(yardline * 8/5 - left) * scale;
	    var hashLength = 3;
	    var isSplitting = false;

	    // 4-step line before first line
	    if (deltaX > scale * 4) {
	        deltaX -= scale * 4;
	        isSplitting = true;
	    }

	    // draw yardlines
	    this.pdf.setTextColor(150);
	    for (; deltaX < width; deltaX += scale * 4, isSplitting = !isSplitting) {
	        var yardlineX = x + deltaX;

	        // drawing the yardline
	        if (isSplitting) {
	            this.pdf.setDrawColor(200);
	            this.pdf.line(
	                yardlineX, y,
	                yardlineX, y + height
	            );
	            continue;
	        }
	        this.pdf.setDrawColor(0);
	        this.pdf.line(
	            yardlineX, y,
	            yardlineX, y + height
	        );

	        // drawing hashes
	        if (westHash) {
	            this.pdf.line(
	                yardlineX - hashLength/2, westHashY,
	                yardlineX + hashLength/2, westHashY
	            );
	        }
	        if (eastHash) {
	            this.pdf.line(
	                yardlineX - hashLength/2, eastHashY,
	                yardlineX + hashLength/2, eastHashY
	            );
	        }

	        // writing yardline numbers
	        var yardlineText = "";
	        if (yardline < 50) {
	            yardlineText = String(yardline);
	        } else {
	            yardlineText = String(100 - yardline);
	        }
	        if (yardlineText.length === 1) {
	            yardlineText = "0" + yardlineText;
	        }
	        var halfTextWidth = PDFUtils.getTextWidth(yardlineText, yardlineSize)/2;
	        if (deltaX > halfTextWidth) { // include first character if room
	            this.pdf.text(
	                yardlineText[0],
	                yardlineX - halfTextWidth - .5,
	                y + height - 2
	            );
	        }
	        if (deltaX < width - halfTextWidth) { // include second character if room
	            this.pdf.text(
	                yardlineText[1],
	                yardlineX + .5,
	                y + height - 2
	            );
	        }

	        // go to next yardline
	        yardline += this.westUp ? 5 : -5;
	        if (yardline < 0 || yardline > 100) {
	            break;
	        }
	    }
	    this.pdf.resetFormat();
	};

	/**
	 * Draws the lines for the y-coordinate of the given position
	 *
	 * @param {object} box, holds the various properties of the enclosing box
	 * @param {int} y, the y-coordinate of the dot's position in steps from west sideline
	 * @param {float} offset, distance from top of box to dot position
	 * @param {boolean} closeToLeft, true if dot is close to the left side of the box, false otherwise
	 */
	MovementDiagramWidget.prototype._drawPosition = function(box, y, offset, closeToLeft) {
	    var lineY = box.y + offset;
	    var text = PDFUtils.getYCoordinateText(y);
	    this.pdf.line(
	        box.x, lineY,
	        box.x + box.width, lineY
	    );
	    this.pdf.setFontSize(8);
	    if (closeToLeft) {
	        this.pdf.text(
	            text,
	            box.x + box.width - PDFUtils.getTextWidth(text, 8) - .5,
	            lineY - .5
	        );
	    } else {
	        this.pdf.text(
	            text,
	            box.x + .5,
	            lineY - .5
	        );
	    }
	    this.pdf.resetFormat();
	};

	module.exports = MovementDiagramWidget;


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines the widget for generating the bird's eye view widget
	 */

	var JSUtils = __webpack_require__(2);
	var PDFUtils = __webpack_require__(12);
	var PDFWidget = __webpack_require__(20);

	/**
	 * Represents the widget for the bird's eye view
	 *
	 * This widget will include the overall formation with grayed out dots, with
	 * the selected dot being darkened, and coordinates for the selected dot. (See
	 * the PDFUtils file for the format of the coordinates)
	 *
	 * @param {jsPDF} pdf, the jsPDF object to be written to
	 * @param {String} orientation, the direction on the top of the box
	 */
	var BirdsEyeWidget = function(pdf, orientation) {
	    this.westUp = (orientation === "west") ? true : false;
	    PDFWidget.apply(this, [pdf]);
	};

	JSUtils.extends(BirdsEyeWidget, PDFWidget);

	/**
	 * Draws the Bird's Eye Widget with the given options:
	 *      - {Sheet} sheet, the current sheet
	 *      - {Dot} dot, the selected dot
	 *      - {boolean} minimal, true if drawing as little of the widget as possible, false otherwise
	 */
	BirdsEyeWidget.prototype.draw = function(x, y, width, height, options) {
	    var _this = this;

	    var textWidth = PDFUtils.getTextWidth("S", PDFUtils.DEFAULT_FONT_SIZE);
	    var textHeight = PDFUtils.getTextHeight(PDFUtils.DEFAULT_FONT_SIZE);
	    var boxWidth = width - 2 * (textWidth + 1.5);

	    var box = {
	        x: x,
	        y: y,
	        width: boxWidth,
	        height: boxWidth * 84/160 // maintain aspect ratio of field
	    };

	    // center box
	    box.x += width/2 - box.width/2;
	    box.y += height/2 - box.height/2;

	    this._drawBox(box.x, box.y, box.width, box.height, this.westUp, options["minimal"]);

	    var dots = options["sheet"].getDots();
	    var selectedDot = options["dot"];
	    var scale = box.width / 160; // units per step

	    // drawing hashes
	    this.pdf.setLineWidth(.2);
	    var numDashes = 21;
	    var dashLength = box.width / numDashes;
	    var topHash = box.y + 32 * scale;
	    var bottomHash = box.y + 52 * scale;
	    this.pdf.setDrawColor(150);
	    for (var i = 0; i < numDashes; i += 2) {
	        var x = box.x + i * dashLength;
	        this.pdf.line(
	            x, topHash,
	            x + dashLength, topHash
	        );
	        this.pdf.line(
	            x, bottomHash,
	            x + dashLength, bottomHash
	        );
	    }

	    // drawing all the dots
	    this.pdf.setFillColor(210);
	    dots.forEach(function(dot) {
	        if (dot === selectedDot) {
	            return;
	        }
	        var position = dot.getAnimationState(0);
	        if (!_this.westUp) {
	            position.x = 160 - position.x;
	            position.y = 84 - position.y;
	        }
	        _this.pdf.circle(
	            box.x + position.x * scale,
	            box.y + position.y * scale,
	            .5,
	            "F"
	        );
	    });

	    // drawing selected dot
	    var position = selectedDot.getAnimationState(0);
	    var coordinates = {
	        textSize: 8,
	        textX: PDFUtils.getXCoordinateText(position.x),
	        textY: PDFUtils.getYCoordinateText(position.y)
	    };

	    if (!this.westUp) {
	        position.x = 160 - position.x;
	        position.y = 84 - position.y;
	    }
	    var x = position.x * scale;
	    var y = position.y * scale;

	    coordinates.x = box.x + x - PDFUtils.getTextWidth(coordinates.textX, coordinates.textSize)/2;
	    coordinates.y = box.y + y + PDFUtils.getTextHeight(coordinates.textSize)/4;

	    this.pdf.setFillColor(0);
	    this.pdf.setDrawColor(180);
	    this.pdf.setFontSize(coordinates.textSize);

	    this.pdf.line(
	        box.x + x, box.y,
	        box.x + x, box.y + box.height
	    );
	    this.pdf.line(
	        box.x, box.y + y,
	        box.x + box.width, box.y + y
	    );

	    // Put vertical coordinate text on opposite side of the field
	    if (position.x > 80) {
	        this.pdf.text(
	            coordinates.textY,
	            box.x + 1,
	            coordinates.y
	        );
	    } else {
	        this.pdf.text(
	            coordinates.textY,
	            box.x + box.width - PDFUtils.getTextWidth(coordinates.textY, coordinates.textSize) - 1,
	            coordinates.y
	        );
	    }

	    // Put horizontal coordinate text on opposite side of the field
	    if (position.y > 42) {
	        this.pdf.text(
	            coordinates.textX,
	            coordinates.x,
	            box.y + PDFUtils.getTextHeight(coordinates.textSize)
	        );
	    } else {
	        this.pdf.text(
	            coordinates.textX,
	            coordinates.x,
	            box.y + box.height - 1
	        );
	    }
	    this.pdf.circle(box.x + x, box.y + y, .5, "F");
	    this.pdf.resetFormat();
	};

	module.exports = BirdsEyeWidget;

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines the widget for generating the surrounding dots widget
	 */

	var JSUtils = __webpack_require__(2);
	var PDFUtils = __webpack_require__(12);
	var PDFWidget = __webpack_require__(20);

	/**
	 * Represents the widget for the surrounding dots
	 *
	 * This widget will include a close up of the surrounding area of a 4-step radius,
	 * with dots and dot labels marking any dots nearby the selected dot, which is
	 * in the middle of the widget.
	 *
	 * @param {jsPDF} pdf, the jsPDF object to be written to
	 * @param {String} orientation, the direction on the top of the box
	 */
	var SurroundingDotsWidget = function(pdf, orientation) {
	    this.westUp = (orientation === "west") ? true : false;
	    PDFWidget.apply(this, [pdf]);
	};

	JSUtils.extends(SurroundingDotsWidget, PDFWidget);

	/**
	 * Draws the Surrounding Dots Widget with the given options:
	 *      - {Sheet} sheet, the current sheet
	 *      - {Dot} dot, the selected dot
	 *      - {boolean} minimal, true if drawing as little of the widget as possible, false otherwise
	 */
	SurroundingDotsWidget.prototype.draw = function(x, y, width, height, options) {
	    var _this = this;

	    var textWidth = PDFUtils.getTextWidth("S", PDFUtils.DEFAULT_FONT_SIZE);
	    var textHeight = PDFUtils.getTextHeight(PDFUtils.DEFAULT_FONT_SIZE);
	    var boxSize = height - 2 * (textHeight + 2);

	    var box = {
	        x: x,
	        y: y,
	        width: boxSize,
	        height: boxSize
	    };

	    // center box
	    box.x += width/2 - box.width/2;
	    box.y += height/2 - box.height/2;

	    if (options["minimal"]) {
	        box.y -= textHeight;
	    }

	    this._drawBox(box.x, box.y, box.width, box.height, this.westUp, options["minimal"]);

	    var origin = {
	        x: box.x + box.width/2,
	        y: box.y + box.height/2
	    };

	    this.pdf.setDrawColor(150);
	    this.pdf.setLineWidth(.1);
	    // cross hairs for selected dot
	    this.pdf.line(
	        origin.x, box.y,
	        origin.x, box.y + box.height
	    );
	    this.pdf.line(
	        box.x, origin.y,
	        box.x + box.width, origin.y
	    );

	    var sheet = options["sheet"];
	    var start = options["dot"].getAnimationState(0);
	    var orientationFactor = this.westUp ? 1 : -1;

	    var allDots = sheet.getDots();
	    var surroundingDots = [];
	    allDots.forEach(function(dot) {
	        var position = dot.getAnimationState(0);
	        var deltaX = orientationFactor * (position.x - start.x);
	        var deltaY = orientationFactor * (position.y - start.y);
	        if (Math.abs(deltaX) <= 4 && Math.abs(deltaY) <= 4) {
	            var label = dot.getLabel();
	            surroundingDots.push({
	                deltaX: deltaX,
	                deltaY: deltaY,
	                label: label,
	                type: sheet.getDotType(label)
	            });
	        }
	    });

	    var scale = box.height / 11.5; // radius of 4 steps + 1.75 steps of padding
	    var labelSize = box.height * 7/29;
	    var dotRadius = box.height * .04;
	    this.pdf.setFontSize(labelSize);
	    for (var i = 0; i < surroundingDots.length; i++) {
	        var dot = surroundingDots[i];
	        var x = dot.deltaX * scale + origin.x;
	        var y = dot.deltaY * scale + origin.y;
	        this.pdf.drawDot(dot.type, x, y, dotRadius);
	        this.pdf.text(dot.label, x - dotRadius * 2, y - dotRadius * 1.5);
	    }
	    this.pdf.resetFormat();
	};

	module.exports = SurroundingDotsWidget;

/***/ },
/* 19 */,
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines a base class for the PDFGenerator Widget classes
	 */

	 var PDFUtils = __webpack_require__(12);

	/**
	 * PDFWidget class
	 *
	 * Represents one of the widgets available on the PDFGenerator. Each widget draws
	 * a different component of the PDF, which shows detailed information about a
	 * given marcher on a given stuntsheet. This is an abstract class; do not make
	 * an instance of this class directly.
	 *
	 * @param {jsPDF} pdf, the jsPDF object to be written to
	 */
	var PDFWidget = function(pdf) {
	    this.pdf = pdf;
	};

	/**
	 * Draws this widget onto the pdf, with whatever options passed into it as key-value
	 * pairs. For example, the options passed into the individual continuity widget might be:
	 *     {
	 *          continuities: [<String>, <String>],
	 *          duration: 32,
	 *          ...
	 *     }
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

	/**
	 * A helper method for widgets that utilize a box that draws field-related
	 * information such as movements, formations, or nearby dots. Draws the confining
	 * box and the EWNS directions.
	 *
	 * @param {float} x, the x-coordinate of the top-left corner of the box
	 * @param {float} y, the y-coordinate of the top-left corner of the box
	 * @param {float} width, the width of the box
	 * @param {float} height, the height of the box
	 * @param {boolean} westUp, true if West on top of the box, false otherwise
	 * @param {boolean} minimal, true to draw as little of the box as possible, false otherwise
	 */
	PDFWidget.prototype._drawBox = function(x, y, width, height, westUp, minimal) {
	    var textHeight = PDFUtils.getTextHeight(PDFUtils.DEFAULT_FONT_SIZE);
	    var textWidth = PDFUtils.getTextWidth("S", PDFUtils.DEFAULT_FONT_SIZE);

	    // labels for sides of box
	    var top, bottom, left, right;
	    if (westUp) {
	        top = "W";
	        bottom = "E";
	        left = "S";
	        right = "N";
	    } else {
	        top = "E";
	        bottom = "W";
	        left = "N";
	        right = "S";
	    }

	    this.pdf.setFontSize(PDFUtils.DEFAULT_FONT_SIZE);
	    if (!minimal) {
	        this.pdf.text(
	            top,
	            x + width/2 - textWidth/2 - .5,
	            y - 2
	        );
	        this.pdf.text(
	            bottom,
	            x + width/2 - textWidth/2 - .5,
	            y + height + textHeight
	        );
	    }
	    this.pdf.text(
	        left,
	        x - textWidth - 1,
	        y + height/2 + textHeight/2
	    );
	    this.pdf.text(
	        right,
	        x + width + 1,
	        y + height/2 + textHeight/2
	    );
	    this.pdf.rect(x, y, width, height);
	    this.pdf.resetFormat();
	};

	module.exports = PDFWidget;

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview This file defines the FileLoadSelector class,
	 *   which is used to track changes to file formats and to make
	 *   sure that different versions of a file type get loaded properly.
	 *   Here's how the loading process works:
	 *   A file format can change over time, so not all
	 *   files will be loaded in the same way. Thus, before
	 *   loading a particular file, you first need to fetch
	 *   a loader object that can load your particular file. To do this,
	 *   you need to call the getAppropriateLoader(version) method
	 *   on a FileLoadSelector object.
	 *   Once you have the appropriate loader for your file version, you
	 *   can call its loadFile(...) method to load the file.
	 *
	 *   WHAT TO DO WHEN A FILE FORMAT CHANGES:
	 *   When a file format changes, you need to add
	 *   the ability to load the new file format while preserving
	 *   the ability to load older file versions. To do this, you
	 *   first need to define a child class of FileLoader
	 *   that can load the new file version. Often,
	 *   file format changes are small, and you only need to change
	 *   the way in which a particular piece of the file is loaded.
	 *   In these cases, it can be helpful to derive your new
	 *   FileLoader from the loader for the previous version
	 *   (e.g. FileLoad_1_0_1 might inherit from FileLoad_1_0_0
	 *   in order to get access to all of the methods used to load
	 *   file version 1.0.0; it may then change only a few of the original
	 *   methods to accomodate for the file changes).
	 *   After you make a new FileLoader, you need to register it
	 *   with the FileLoadSelector. To do that, call
	 *   loadSelector.registerLoader(fileVersionHere, new YourFileLoaderHere());
	 *   In summary:
	 *     - Define a new FileLoader to load the new file format
	 *     - Register the new FileLoader with the FileLoadSelector by
	 *         calling loadSelector.registerLoader(...)
	 */

	var ArrayUtils = __webpack_require__(34);
	var Version = __webpack_require__(8);
	 
	/**
	 * Every version of a file needs to be loaded in a different way -
	 * this class is responsible for finding the appropriate FileLoader
	 * object for loading a particular file version.
	 */
	var FileLoadSelector = function() {
	    this._loaders = [];
	};

	/**
	 * Associates a particular file version with a FileLoader
	 * that can load files of that version.
	 *
	 * @param {Version} version The file version.
	 * @param {FileLoader} loader A FileLoader that can load
	 *   files of the given version.
	 */
	FileLoadSelector.prototype.registerLoader = function(version, loader) {
	    var insertIndex = ArrayUtils.binarySearchForClosestLarger(this._loaders, version, FileLoadSelector._versionLocator);
	    var loaderVersionPair = {
	        version: version,
	        loader: loader
	    };
	    this._loaders.splice(insertIndex, 0, loaderVersionPair);
	};

	/**
	 * Returns the FileLoader that can load a file of the
	 * given version.
	 *
	 * @param {Version} version The file version to load.
	 * @return {FileLoader} A FileLoader that can load
	 *   files with the provided version.
	 */
	FileLoadSelector.prototype.getAppropriateLoader = function(version) {
	    var targetIndex = ArrayUtils.binarySearchForClosestSmaller(this._loaders, version, FileLoadSelector._versionLocator);
	    return this._loaders[targetIndex].loader;
	};

	/**
	 * Used in a binary search to find the position where a particular version
	 * fits into an array of loader-version pairs sorted from earliest version
	 * to latest version.
	 *
	 * @param {Version} versionToLocate The version to find in the array.
	 * @param {object} relativeTo A loader-version pair to compare against the
	 *   versionToLocate.
	 * @return {int} A negative value if the versionToLocate comes before
	 *   relativeTo in the array; positive value if the versionToLocate comes
	 *   after relativeTo in the array; zero if versionToLocate and relativeTo
	 *   have identical versions.
	 */
	FileLoadSelector._versionLocator = function(versionToLocate, relativeTo) {
	    return versionToLocate.compareTo(relativeTo.version);
	};
	 
	/**
	 * This class is responsible for loading files of a particular version.
	 */
	FileLoadSelector.FileLoader = function() {
	};

	/**
	 * Loads an entire file, and returns the result.
	 *
	 * @param {object} fileObject The file content.
	 * @return {*} Depends on the version of the file.
	 */
	FileLoadSelector.FileLoader.prototype.loadFile = function(fileObject) {
	    console.log("FileLoader.loadFile(...) called");
	};


	module.exports = FileLoadSelector;

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * An Exception thrown by the FileLoadSelectors if the loaded file is of the wrong
	 * file type.
	 *
	 * @param {String} message The message to accompany the error.
	 */
	var InvalidFileTypeError = function(message) {
	    this.message = message;
	    this.name = "InvalidFileTypeError";
	};

	module.exports = InvalidFileTypeError;

/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines the Dot class.
	 */

	/**
	 * Dot objects represent marchers. They execute a sequence
	 * of MovementCommands, which define their position and orientation
	 * on any given beat. Every Stuntsheet has its own set of Dot objects,
	 * so a marcher will be represented by more than one of them throughout
	 * a show. Specifically, every marcher is associated with AT MOST one
	 * Dot object per Stuntsheet (some Stuntsheets may not include certain
	 * marchers).
	 *
	 * @param {string} label The dot's label. This is also the label of
	 *   the marcher associated with this dot.
	 * @param {Array<MovementCommand>} movementCommands All of the MovementCommand
	 *   objects that this Dot will execute. The commands must be sorted in the
	 *   order in which they will be executed.
	 */
	var Dot = function(label, movementCommands) {
	    this._label = label;
	    this._movements = movementCommands;
	};

	/**
	 * Returns the label for this dot.
	 *
	 * @return {string} The dot's label.
	 */
	Dot.prototype.getLabel = function() {
	    return this._label;
	};

	/**
	 * Returns this dot's movement commands.
	 *
	 * @return {Array<MovementCommand>} The dot's movements.
	 */
	Dot.prototype.getMovementCommands = function() {
	    return this._movements;
	};

	/**
	 * Returns an AnimationState object that describes the Dot's
	 * position, orientation, etc. at a specific moment in the show.
	 *
	 * @param {int} beatNum The Dot's AnimationState will be
	 *   relevant to the beat indicated by this value. The beat
	 *   is relative to the start of the stuntsheet.
	 * @return {AnimationState} An AnimationState that
	 *   describes the Dot at a moment of the show,. If the Dot
	 *   has no movement at the specified beat, returns undefined.
	 */
	Dot.prototype.getAnimationState = function(beatNum) {
	    for (var commandIndex = 0; commandIndex < this._movements.length; commandIndex++) {
	        if (beatNum < this._movements[commandIndex].getBeatDuration()) {
	            return this._movements[commandIndex].getAnimationState(beatNum);
	        }
	        beatNum -= this._movements[commandIndex].getBeatDuration();
	    }
	};

	module.exports = Dot;

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines the Sheet class.
	 */

	/**
	 * Sheets represent stuntsheets in a show. Each has a collection of
	 * all of the Dots involved in its formations, and those Dots,
	 * in turn, know their positions and orientations for all beats during
	 * the Sheet's duration.
	 *
	 * @param {string} label The label/name for the sheet.
	 * @param {string} fieldType A string that indicates the type of field that this sheet
	 *   is performed on.
	 * @param {Array<string>} dotTypes An array of all dot types used in this sheet.
	 * @param {object} dotTypeAssignments An object that maps each dot label to the dot type
	 *   associated with that dot.
	 * @param {object} continuityTexts An object that maps each dot type to an array
	 *   containing all of the continuity instructions associated with that dot type.
	 * @param {int} duration The duration of the sheet, in beats.
	 * @param {Array<Dot>} dots An array of all dots involved in this sheet's
	 *   movements. Note that all of these dots already have their
	 *   MovementCommands before the Sheet is constructed.
	 * @param {Array<string>} dotLabels an array, in sync with dots, which specifies the
	 *   dot labels of the dots
	 */
	var Sheet = function(sheetLabel, fieldType, dotTypes, dotTypeAssignments, continuityTexts, duration, dots, dotLabels) {
	    this._sheetLabel = sheetLabel;
	    this._fieldType = fieldType;
	    this._dotTypes = dotTypes;
	    this._dotTypeAssignments = dotTypeAssignments;
	    this._continuityTexts = continuityTexts;
	    this._duration = duration;
	    this._dots = dots;
	    this._dotLabels = dotLabels;
	};

	/**
	 * Returns the sheet's label.
	 *
	 * @return {string} The sheet's label.
	 */
	Sheet.prototype.getSheetLabel = function() {
	    return this._sheetLabel;
	};

	/**
	 * Returns the type of field that this sheet is performed on.
	 *
	 * @return {string} A string that indicates what kind of field
	 *   the sheet is performed on.
	 */
	Sheet.prototype.getFieldType = function() {
	    return this._fieldType;
	};

	/**
	 * Returns an array of all dot types involved with this
	 * sheet.
	 *
	 * @return {Array<string>} An array of all dot types involved in
	 *   this sheet. Dot types are given as strings.
	 */
	Sheet.prototype.getAllDotTypes = function() {
	    return this._dotTypes;
	};

	/**
	 * Returns the dot type associated with a particular
	 * dot.
	 *
	 * @param {string} dotLabel The label of the dot whose
	 *   dot type will be returned.
	 * @return {string} The dot label of the specified dot.
	 */
	Sheet.prototype.getDotType = function(dotLabel) {
	    return this._dotTypeAssignments[dotLabel];
	};

	/**
	 * Returns an array containing the continuities associated
	 * with a particular dot type. Each continuity is a human-readable
	 * instruction as would appear on a printed version of a stuntsheet.
	 *
	 * @param {string} dotType The dot type to retrieve continuities for.
	 * @return {Array<string>} An array containing all continuities associated
	 *   with the specified dot type. Each continuity is a human-readable
	 *   text instruction.
	 */
	Sheet.prototype.getContinuityTexts = function(dotType) {
	    return this._continuityTexts[dotType];
	};

	/**
	 * Returns an array of all dots involved in this sheet's movements.
	 *
	 * @return {Array<Dot>} An array of all dots involved in this sheet's
	 *   movements.
	 */
	Sheet.prototype.getDots = function() {
	    return this._dots;
	};

	/**
	 * Get a dot in this sheet by its dot label.
	 * @param  {string} dotLabel the dots label, e.g. "A1" or "15"
	 * @return {Dot|null} the dot, or null if a dot with the given label does not
	 *   exist in the sheet
	 */
	Sheet.prototype.getDotByLabel = function (dotLabel) {
	    var index = this._dotLabels.indexOf(dotLabel);
	    if (index === -1) {
	        return null;
	    }
	    return this._dots[index];
	};

	/**
	 * Returns the duration of this sheet, in beats.
	 *
	 * @return {int} The duration of this sheet, in beats.
	 */
	Sheet.prototype.getDuration = function() {
	    return this._duration;
	};

	module.exports = Sheet;

/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

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
	 * Returns a particular sheet from the show.
	 *
	 * @param {int} index The index of the sheet to retrieve.
	 *   This can be any integer in the range [0, num_sheets).
	 *   Notice that the upper bound of the range is exclusive.
	 *   To find the Nth sheet in a show, you need to request
	 *   the sheet with an index of N-1 (e.g. to retrive the 5th
	 *   sheet, you would call getSheet(4)).
	 * @return {Sheet} The stuntsheet with the specified index.
	 */
	Show.prototype.getSheet = function(index) {
	    return this._sheets[index];
	};

	/**
	 * Returns the number of sheets in the show.
	 *
	 * @return {int} The number of sheets in the show.
	 */
	Show.prototype.getNumSheets = function() {
	    return this._sheets.length;
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

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines the MovementCommandStand class.
	 */

	var JSUtils = __webpack_require__(2);
	var MovementCommand = __webpack_require__(35);
	var AnimationState = __webpack_require__(36);
	 
	/**
	 * A MovementCommand representing a period of standing.
	 * @param {float} x The x coordinate to stand at.
	 * @param {float} y The y coordinate to stand at.
	 * @param {float} orientation The angle at which the marcher will
	 *   face while standing. This is measured in degrees relative
	 *   to Grapher standard position (@see MathUtils.js for a definition
	 *   of "grapher standard position).
	 * @param {int} beats The duration of the movement, in beats.
	 */
	var MovementCommandStand = function(x, y, orientation, beats) {
	    this._orientation = orientation;
	    MovementCommand.apply(this, [x, y, x, y, beats]);
	};

	JSUtils.extends(MovementCommandStand, MovementCommand);

	MovementCommandStand.prototype.getAnimationState = function(beatNum) {
	    return new AnimationState(this._startX, this._startY, this._orientation);
	};

	/**
	 * Returns the continuity text for this movement
	 * @return {String} the continuity text in the form of "Close 16E"
	 */
	MovementCommandStand.prototype.getContinuityText = function() {
	    return "Close " + this._numBeats + this.getOrientation();
	};

	module.exports = MovementCommandStand;

/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines the MovementCommandMarkTime class.
	 */

	var JSUtils = __webpack_require__(2);
	var MovementCommand = __webpack_require__(35);
	var AnimationState = __webpack_require__(36);

	/**
	 * A MovementCommand that represents a period of mark time.
	 *
	 * @param {float} x The x position where the mark time takes place.
	 * @param {float} y The y position where the mark time takes place.
	 * @param {float} orientation The direction toward which the marcher
	 *   faces while marking time. This is measured in degrees,
	 *   relative to Grapher standard position (@see MathUtils.js
	 *   for a definition of "Grapher standard position").
	 * @param {int} beats The duration of the movement, in beats.
	 */
	var MovementCommandMarkTime = function(x, y, orientation, beats) {
	    this._orientation = orientation;
	    MovementCommand.apply(this, [x, y, x, y, beats]);
	};

	JSUtils.extends(MovementCommandMarkTime, MovementCommand);

	MovementCommandMarkTime.prototype.getAnimationState = function(beatNum) {
	    return new AnimationState(this._startX, this._startY, this._orientation);
	};

	/**
	 * Returns the continuity text for this movement
	 * @return {String} the continuity text in the form "MT 16 E"
	 */
	MovementCommandMarkTime.prototype.getContinuityText = function() {
	    return (this._numBeats == 0) ? "" : "MT " + this._numBeats + " " + this.getOrientation();
	};

	module.exports = MovementCommandMarkTime;

/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines the MovementCommandArc class.
	 */

	var JSUtils = __webpack_require__(2);
	var MathUtils = __webpack_require__(37);
	var MovementCommand = __webpack_require__(35);
	var AnimationState = __webpack_require__(36);
	 
	/**
	 * A MovementCommandArc object represents a movement along the
	 * perimeter of a circular arc.
	 *
	 * @param {float} startX The x coordinate of the movement's start position.
	 * @param {float} startY The y coordinate of the movement's start position.
	 * @param {float} centerX The x coordinate of the arc center.
	 * @param {float} centerY The y coordinate of the arc center.
	 * @param {float angleTorotate The amount to rotate about the center, in
	 *   degrees. Positive values indicate a rotation in the clockwise
	 *   direction, negative values indicate a rotation in the
	 *   counterclockwise direction.
	 * @param {float} facingOffset The difference between the direction
	 *   in which a marcher is travelling and the direction in
	 *   which a marcher is facing. This angle is measured in degrees,
	 *   where positive angles indicate a clockwise offset, and
	 *   negative angles indicate a counterclockwise one.
	 * @param {int} beats The duration of the movement, in beats.
	 * @param {int} beatsPerStep The duration of each step, in beats.
	 */
	var MovementCommandArc = function(startX, startY, centerX, centerY, angleToRotate, facingOffset, beats, beatsPerStep) {
	    this._beatsPerStep = beatsPerStep;
	    this._centerX = centerX;
	    this._centerY = centerY;
	    this._radius = MathUtils.calcDistance(startX, startY, this._centerX, this._centerY);
	    this._startAngle = MathUtils.calcAngleAbout(startX, startY, centerX, centerY);
	    if (isNaN(this._startAngle)) {
	        this._startAngle = 0;
	    }
	    this._stepAngleDelta = MathUtils.toRadians(angleToRotate) / Math.floor(beats / this._beatsPerStep);
	    this._movementIsCW = this._stepAngleDelta >= 0;
	    this._orientationOffset = MathUtils.toRadians(facingOffset);
	    var finalAnimState = this.getAnimationState(beats);
	    MovementCommand.apply(this, [startX, startY, finalAnimState.x, finalAnimState.y, beats]);
	};

	JSUtils.extends(MovementCommandArc, MovementCommand);

	MovementCommandArc.prototype.getAnimationState = function(beatNum) {
	    var numSteps = Math.floor(beatNum / this._beatsPerStep);
	    var finalAngle = this._startAngle + (this._stepAngleDelta * numSteps);
	    var finalX = this._radius * MathUtils.calcRotatedXPos(finalAngle) + this._centerX;
	    var finalY = this._radius * MathUtils.calcRotatedYPos(finalAngle) + this._centerY;
	    var finalOrientation = MathUtils.quarterTurn(finalAngle, this._movementIsCW) + this._orientationOffset;
	    return new AnimationState(finalX, finalY, MathUtils.toDegrees(finalOrientation));
	};

	/**
	 * Returns a list of (deltaX, deltaY) pairs that lie along the arc
	 *
	 * @return {Array<Array<int>>} an array of (deltaX, deltaY) pairs
	 */
	MovementCommandArc.prototype.getMiddlePoints = function() {
	    var totalAngle = this._startAngle;
	    var prevX = this._startX;
	    var prevY = this._startY;
	    var points = [];
	    for (var i = 0; i < this._numBeats / this._beatsPerStep; i++) {
	        totalAngle += this._stepAngleDelta;
	        var x = this._radius * MathUtils.calcRotatedXPos(totalAngle) + this._centerX;
	        var y = this._radius * MathUtils.calcRotatedYPos(totalAngle) + this._centerY;
	        points.push([x - prevX, y - prevY]);
	        prevX = x;
	        prevY = y;
	    }
	    return points;
	};

	/**
	 * Returns the continuity text for this movement
	 * @return {String} the continuity text in the form of "GT CW 90 deg. (16 steps)"
	 */
	MovementCommandArc.prototype.getContinuityText = function() {
	    var steps = this._numBeats / this._beatsPerStep;
	    var orientation = (this._movementIsCW) ? "CW" : "CCW";
	    var angle = Math.abs(Math.floor(MathUtils.toDegrees(this._numBeats * this._stepAngleDelta)));
	    return "GT " + orientation + " " + angle + " deg. (" + steps + " steps)";
	};

	module.exports = MovementCommandArc;

/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines the MovementCommandMove class.
	 */

	var JSUtils = __webpack_require__(2);
	var MathUtils = __webpack_require__(37);
	var MovementCommand = __webpack_require__(35);
	var AnimationState = __webpack_require__(36);
	 
	/**
	 * A MovementCommand which represents a constant movement in a
	 * particular direction.
	 *
	 * @param {float} startX The x component of the movement's start position.
	 * @param {float} startY The y component of the movement's start position.
	 * @param {float} stepSize the size of each step, relative to standard
	 *   stepsize (standard stepsize is 8 steps per 5 yards).
	 * @param {float} movementDirection The direction toward which the marcher
	 *   will move. This is measured in degrees relative to Grapher standard
	 *   position (@see MathUtils.js for a definition of "Grapher standard
	 *   position").
	 * @param {float} faceOrientation the direction toward which the marcher
	 *   will face while executing the movement. This is measured in degrees,
	 *   relative to Grapher standard position.
	 * @param {int} beats The duration of the movement, in beats.
	 * @param {int} beatsPerStep the number of beats per each step of the movement.
	 */ 
	var MovementCommandMove = function(startX, startY, stepSize, movementDirection, faceOrientation, beats, beatsPerStep) {
	    movementDirection = MathUtils.toRadians(movementDirection);
	    this._deltaXPerStep = MathUtils.calcRotatedXPos(movementDirection) * stepSize;
	    this._deltaYPerStep = MathUtils.calcRotatedYPos(movementDirection) * stepSize;
	    this._orientation = faceOrientation;
	    this._beatsPerStep = beatsPerStep;
	    numSteps = Math.floor(beats / this._beatsPerStep);
	    MovementCommand.apply(this, [startX, startY, startX + (this._deltaXPerStep * numSteps), startY + (this._deltaYPerStep * numSteps), beats]);
	};

	JSUtils.extends(MovementCommandMove, MovementCommand);

	MovementCommandMove.prototype.getAnimationState = function(beatNum) {
	    numSteps = Math.floor(beatNum / this._beatsPerStep);
	    return new AnimationState(this._startX + (this._deltaXPerStep * numSteps), this._startY + (this._deltaYPerStep * numSteps), this._orientation);
	};

	/**
	 * Returns the continuity text for this movement
	 * @return {String} the continuity text in the form "Move 4 E"
	 */
	MovementCommandMove.prototype.getContinuityText = function() {
	    var deltaX = this._endX - this._startX;
	    var deltaY = this._endY - this._startY;
	    var dirX = (deltaX < 0) ? "S" : "N";
	    var dirY = (deltaY < 0) ? "W" : "E";
	    // This movement can only move in one direction
	    if (deltaX == 0) {
	        return "Move " + Math.abs(deltaY) + " " + dirY;
	    } else {
	        return "Move " + Math.abs(deltaX) + " " + dirX;
	    }
	};

	module.exports = MovementCommandMove;

/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines the MovementCommandGoto class.
	 */

	var JSUtils = __webpack_require__(2);
	var MovementCommand = __webpack_require__(35);
	var AnimationState = __webpack_require__(36);
	 
	/**
	 * A MovementCommand that represents a "Goto" movement:
	 * dots executing this movement simply jump to the movement's final
	 * position and orientation at every beat of the movement.
	 *
	 * @param {float} startX The x component of the movement's start position.
	 * @param {float} startY The y component of the movement's start position.
	 * @param {float} endX The x component of the movement's end position.
	 * @param {float} endY The y component of the movement's end position.
	 * @param {float} orientation The direction in which the marcher will face
	 *   while executing the movement. The direction is measured in degrees relative
	 *   to Grapher standard position (@see MathUtils.js for the definition of
	 *   "Grapher standard position").
	 * @param {int} beats The duration of the movement, in beats.
	 */
	var MovementCommandGoto = function(startX, startY, endX, endY, orientation, beats) {
	    this._orientation = orientation;
	    MovementCommand.apply(this, [startX, startY, endX, endY, beats]);
	};

	JSUtils.extends(MovementCommandGoto, MovementCommand);

	MovementCommandGoto.prototype.getAnimationState = function(beatNum) {
	    return new AnimationState(this._endX, this._endY, this._orientation);
	};

	/**
	 * Returns the continuity text for this movement
	 * @return {String} the continuity text in the form of "See Continuity (16 beats)"
	 */
	MovementCommandGoto.prototype.getContinuityText = function() {
	    return "See Continuity (" + this._numBeats + " beats)";
	};

	module.exports = MovementCommandGoto;

/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines the MovementCommandEven class.
	 */

	var JSUtils = __webpack_require__(2);
	var MovementCommand = __webpack_require__(35);
	var AnimationState = __webpack_require__(36);
	 
	 
	/**
	 * A MovementCommand that defines an even-step transition between
	 * two points.
	 *
	 * @param {float} startX The x component of the movement's start position.
	 * @param {float} startY The y component of the movement's start position.
	 * @param {float} endX The x component of the movement's end position.
	 * @param {float} endY The y component of the movement's end position.
	 * @param {float} orientation The angle toward which the marcher is facing while
	 *   executing the movement. The angle is measured in degrees relative to
	 *   Grapher standard position. (@see MathUtils.js for definition of
	 *   "Grapher standard position")
	 * @param {int} beats The duration of the movement, in beats.
	 * @param {int} beatsPerStep The number of beats per each step.
	 */
	var MovementCommandEven = function(startX, startY, endX, endY, orientation, beats, beatsPerStep) {
	    this._orientation = orientation;
	    this._beatsPerStep = beatsPerStep;
	    var numSteps = Math.floor(beats / this._beatsPerStep);
	    this._deltaXPerStep = (endX - startX) / numSteps;
	    this._deltaYPerStep = (endY - startY) / numSteps;

	    MovementCommand.apply(this, [startX, startY, endX, endY, beats]);
	};

	JSUtils.extends(MovementCommandEven, MovementCommand);

	MovementCommandEven.prototype.getAnimationState = function(beatNum) {
	    var stepNum = Math.floor(beatNum / this._beatsPerStep);
	    return new AnimationState(this._startX + (this._deltaXPerStep * stepNum), this._startY + (this._deltaYPerStep * stepNum), this._orientation);
	};

	/**
	 * Returns the number of beats in this movement
	 * @return {int}
	 */
	MovementCommandEven.prototype.getBeatsPerStep = function() {
	    return this._beatsPerStep;
	}

	/**
	 * Returns the continuity text for this movement
	 * @return {String} the continuity text in the form "Even 8 E, 4 S" or "Move 8 E" if
	 * in one direction
	 */
	MovementCommandEven.prototype.getContinuityText = function() {
	    var deltaX = this._endX - this._startX;
	    var deltaY = this._endY - this._startY;
	    var dirX = (deltaX < 0) ? "S" : "N";
	    var dirY = (deltaY < 0) ? "W" : "E";
	    var steps = this._numBeats / this._beatsPerStep;
	    deltaX = Math.abs(deltaX);
	    deltaY = Math.abs(deltaY);

	    // Check if movement only in one direction and same number of steps as change in position
	    if (deltaX == 0 && deltaY == steps) {
	        return "Move " + steps + " " + dirY;
	    } else if (deltaY == 0 && deltaX == steps) {
	        return "Move " + steps + " " + dirX;
	    } else if (deltaY == deltaX && deltaX == steps) { // Diagonal
	        return "Move " + steps + " " + dirX + dirY;
	    }

	    var text = "Even ";
	    // If movement is a fraction of steps, simply say "NE" or "S"
	    if (deltaX % 1 != 0 || deltaY % 1 != 0) {
	        text += (deltaX != 0) ? dirX : "";
	        text += (deltaY != 0) ? dirY : "";
	    } else {
	        // End result will be concat. of directions, e.g. "Even 8E, 4S"
	        var moveTexts = [];
	        if (deltaY != 0) {
	            moveTexts.push(Math.abs(deltaY) + " " + dirY);
	        }
	        if (deltaX != 0) {
	            moveTexts.push(Math.abs(deltaX) + " " + dirX);
	        }
	        text += moveTexts.join(", ");
	    }
	    // Error checking for an even move without movement in any direction
	    if (text === "Even ") {
	        text += "0";
	    }
	    return text + " (" + steps + " steps)";
	};

	module.exports = MovementCommandEven;

/***/ },
/* 32 */,
/* 33 */,
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines various utility functions that can be used
	 *   to search/sort/operate on arrays.
	 */

	/**
	 * A collection of all of the array functions.
	 * @type {object}
	 */
	var ArrayUtils = {};

	/**
	 * A function that explores a sorted array using a binary search.
	 * This function DOES NOT RETURN ANYTHING. However, the
	 * guidFunc function (@see guideFunc) is called througout
	 * the search, and can potentially collect results from the
	 * search so that they can be accessed later.
	 *
	 * @param {Array<*>} array The array to search. The array MUST
	 *   be sorted for the function to work. The ordering of the array
	 *   is assumed to be 'smallest' to 'largest'.
	 * @param {function(*,int):int} guideFunc A function that takes two parameters:
	 *   first, an element from the array being searched; second, the
	 *   index associated with that element. The function must return
	 *   a number that indicates how to procede with the search: a negative
	 *   value if the search should procede by looking at values that are
	 *   'smaller' (earlier in the array) than the one passed in the first parameter;
	 *   a positive value if the search should procede by looking at values that
	 *   are 'larger' (later in the array) than the one passed in the first
	 *   parameter; zero if the search should end. Though the binary
	 *   search gives no return value, this function could be used to collect
	 *   information about the findings of a search.
	 */
	ArrayUtils.binarySearchBase = function(array, guideFunc) {
	    var currentBlockSize = array.length;
	    var firstHalfBlockSize;
	    var currentIndexOffset = 0;
	    var guideVal;
	    var targetIndex;
	    var frontShave;
	    while (currentBlockSize > 0) {
	        firstHalfBlockSize = Math.floor(currentBlockSize / 2);
	        targetIndex = currentIndexOffset + firstHalfBlockSize;
	        guideVal = guideFunc(array[targetIndex], targetIndex);
	        if (guideVal === 0) {
	            break;
	        }
	        if (guideVal > 0) {
	            frontShave = firstHalfBlockSize + 1;
	            currentIndexOffset += frontShave;
	            currentBlockSize -= frontShave;
	        } else {
	            currentBlockSize = firstHalfBlockSize;
	        }
	    }
	};

	/**
	 * Searches a sorted array for a particular value. If
	 * the value is found, its index in the array will be returned.
	 * If the value is not found, then the index of the closest value
	 * that is 'larger' (later in the array than the place where the
	 * value would have been found) will be returned. This function
	 * uses a binary search.
	 *
	 * @param {Array<*>} array The array to search. The array must be
	 *   sorted. It is assumed that the array is sorted from 'smallest'
	 *   to 'largest'.
	 * @param {*} value The value to search for in the array.
	 * @param {function(*,*):int} comparatorFunc A function that can
	 *   be used to locate a particular element in the sorted array. It takes two
	 *   parameters (of any type), and returns: a negative value
	 *   if the first of the two values is 'smaller' (comes before the other
	 *   in the sorted array); a positive value if the first of the two values
	 *   is 'larger' (comes after the other value in the sorted array); zero
	 *   if the two values are IDENTICAL and would ideally occupy the same position
	 *   in the sorted array. The first value passed to this function will always
	 *   be the value being searched for.
	 * @return {int} The index of the specified value in the array, if it is found.
	 *   If the value is not found, then the index of the closest value that
	 *   is 'larger'. Returns undefined if the value is not in the array and
	 *   no larger value is found.
	 */
	ArrayUtils.binarySearchForClosestLarger = function(array, value, comparatorFunc) {
	    var searchResult;
	    var guideFunc = function(checkValue, index) {
	        var compResult = comparatorFunc(value, checkValue);
	        if (compResult <= 0) {
	            searchResult = index;
	        }
	        return compResult;
	    };
	    ArrayUtils.binarySearchBase(array, guideFunc);
	    return searchResult;
	};

	/**
	 * Searches a sorted array for a particular value. If
	 * the value is found, its index in the array will be returned.
	 * If the value is not found, then the index of the closest value
	 * that is 'smaller' (earlier in the array than the place where the
	 * value would have been found) will be returned. This function uses
	 * a binary search.
	 *
	 * @param {Array<*>} array The array to search. The array must be
	 *   sorted. It is assumed that the array is sorted from 'smallest'
	 *   to 'largest'.
	 * @param {*} value The value to search for in the array.
	 * @param {function(*,*):int} comparatorFunc A function that can
	 *   be used to locate a particular element in the sorted array. It takes two
	 *   parameters (of any type), and returns: a negative value
	 *   if the first of the two values is 'smaller' (comes before the other
	 *   in the sorted array); a positive value if the first of the two values
	 *   is 'larger' (comes after the other value in the sorted array); zero
	 *   if the two values are IDENTICAL and would ideally occupy the same position
	 *   in the sorted array. The first value passed to this function will always
	 *   be the value being searched for.
	 * @return {int} The index of the specified value in the array, if it is found.
	 *   If the value is not found, then the index of the closest value that
	 *   is 'smaller'. Returns undefined if the value is not found in the array,
	 *   and no smaller value is found either.
	 */
	ArrayUtils.binarySearchForClosestSmaller = function(array, value, comparatorFunc) {
	    var searchResult;
	    var guideFunc = function(checkValue, index) {
	        var compResult = comparatorFunc(value, checkValue);
	        if (compResult >= 0) {
	            searchResult = index;
	        }
	        return compResult;
	    };
	    ArrayUtils.binarySearchBase(array, guideFunc);
	    return searchResult;
	};

	/**
	 * Searches a sorted array for a particular value. If
	 * the value is found, its index in the array will be returned.
	 * This function uses a binary search.
	 *
	 * @param {Array<*>} array The array to search. The array must be
	 *   sorted. It is assumed that the array is sorted from 'smallest'
	 *   to 'largest'.
	 * @param {*} value The value to search for in the array.
	 * @param {function(*,*):int} comparatorFunc A function that can
	 *   be used to locate a particular element in the sorted array. It takes two
	 *   parameters (of any type), and returns: a negative value
	 *   if the first of the two values is 'smaller' (comes before the other
	 *   in the sorted array); a positive value if the first of the two values
	 *   is 'larger' (comes after the other value in the sorted array); zero
	 *   if the two values are IDENTICAL and would ideally occupy the same position
	 *   in the sorted array. The first value passed to this function will always
	 *   be the value being searched for.
	 * @return {int} The index of the specified value in the array, if it is found;
	 *   undefined otherwise.
	 */
	ArrayUtils.binarySearch = function(array, value, comparatorFunc) {
	    var searchResult;
	    var guideFunc = function(checkValue, index) {
	        var compResult = comparatorFunc(value, checkValue);
	        if (compResult === 0) {
	            searchResult = index;
	        }
	        return compResult;
	    };
	    ArrayUtils.binarySearchBase(array, guideFunc);
	    return searchResult;
	};

	/**
	 * Merges two arrays into one large sorted array, given that the original
	 * two arrays are sorted according to the same ordering scheme that the
	 * final array will use.
	 *
	 * @param {Array<*>} first The first array to merge.
	 * @param {Array<*>} second The second array to merge.
	 * @param {function(*, *):int} comparator A function which will define
	 *   the order in which the final array will be sorted. The original
	 *   two arrays should also be sorted in a way that satisfies this function.
	 *   It will be passed two objects that will be placed into the final array,
	 *   and must return an integer indicating how they should be ordered in
	 *   the final array: a negative value if the first of the two objects
	 *   should come before the other in the final array; a positive value if
	 *   the first of the two objects should come after the other in the final
	 *   array; zero if the order in which the two objects appear in the final
	 *   array, relative to each other, does not matter.
	 * @return {Array<*>} A new array which contains all elements of the
	 *   original two arrays, in sorted order.
	 */
	ArrayUtils.mergeSortedArrays = function(first, second, comparator) {
	    var indexInFirst = 0;
	    var indexInSecond = 0;
	    var mergedArray = [];
	    while (indexInFirst < first.length && indexInSecond < second.length) {
	        if (comparator(first[indexInFirst], second[indexInSecond]) < 0) {
	            mergedArray.push(first[indexInFirst]);
	            indexInFirst++;
	        } else {
	            mergedArray.push(second[indexInSecond]);
	            indexInSecond++;
	        }
	    }
	    for (; indexInFirst < first.length; indexInFirst++) {
	        mergedArray.push(first[indexInFirst]);
	    }
	    for (; indexInSecond < second.length; indexInSecond++) {
	        mergedArray.push(second[indexInSecond]);
	    }
	    return mergedArray;
	};

	module.exports = ArrayUtils;

/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines the MovementCommand class.
	 */

	var Coordinate = __webpack_require__(40);

	/**
	 * MovementCommand class
	 *
	 * Represents an individual movement that a marcher executes during
	 * a show.
	 * 
	 * This is an abstract class - do not make an instance of this
	 * directly.
	 *
	 * @param {float} startX The x coordinate at which the movement starts.
	 * @param {float} startY The y coordinate at which the movement starts.
	 * @param {float} endX The x coordinate at which the movement starts.
	 * @param {float} endY The y coordinate at which the movement starts.
	 * @param {int} numBeats The duration of the movement, in beats. 
	 **/
	var MovementCommand = function(startX, startY, endX, endY, numBeats) {
	    /**
	     * The x component of the movement's start position, measured in
	     * steps from the upper left corner of the field.
	     * @type {float}
	     */
	    this._startX = startX;
	    
	    /**
	     * The y component of the movement's start position, measured in
	     * steps from the upper left corner of the field.
	     * @type {float}
	     */
	    this._startY = startY;
	    
	    /**
	     * The x component of the movement's end position, measured in
	     * steps from the upper left corner of the field.
	     * @type {float}
	     */
	    this._endX = endX;
	    
	    /**
	     * The y component of the movement's end position, measured in
	     * steps from the upper left corner of the field.
	     * @type {float}
	     */
	    this._endY = endY;
	    
	    /**
	     * The duration of the command, in beats.
	     * @type {int}
	     */
	    this._numBeats = numBeats;
	};

	/**
	 * Returns the position at which this movement starts.
	 *
	 * @return {Coordinate} The position where the movement begins.
	 */
	MovementCommand.prototype.getStartPosition = function() {
	        return new Coordinate(this._startX, this._startY);
	};

	/**
	 * Returns the position at which this movement ends.
	 *
	 * @return {Coordinate} The position where the movement ends.
	 */
	MovementCommand.prototype.getEndPosition = function() {
	    return new Coordinate(this._endX, this._endY);
	};

	/**
	 * Returns the number of beats required to complete this
	 * command.
	 *
	 * @return {int} The duration of this command, in beats.
	 */
	MovementCommand.prototype.getBeatDuration = function() {
	    return this._numBeats;
	};

	/**
	 * Returns an AnimationState describing a marcher
	 * who is executing this movement.
	 *
	 * @param {int} beatNum The beat of this movement that
	 * the marcher is currently executing (relative
	 * to the start of the movement).
	 * @return {AnimationState} An AnimationState describing
	 * a marcher who is executing this movement.
	 */
	MovementCommand.prototype.getAnimationState = function(beatNum) {
	    console.log("getAnimationState called");
	};

	/**
	 * Returns the continuity text associated with this movement
	 * @return {String} the text displayed for this movement
	 */
	MovementCommand.prototype.getContinuityText = function() {
	    console.log("getContinuityText called");
	};

	/**
	 * Returns this movement's orientation (E,W,N,S). If the orientation isn't one of
	 * 0, 90, 180, or 270, returns an empty String
	 * @return {String} the orientation or an empty String if invalid orientation
	 */
	MovementCommand.prototype.getOrientation = function() {
	    switch (this._orientation) {
	        case 0:
	            return "E";
	            break;
	        case 90:
	            return "S";
	            break;
	        case 180:
	            return "W";
	            break;
	        case 270:
	            return "N";
	            break;
	        default:
	            return "";
	    }
	};

	module.exports = MovementCommand;

/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines the AnimationState struct.
	 */

	/**
	 * An AnimationState struct describes the state of a dot at a specific time
	 * in the show. It contains all information required to properly draw
	 * the dot in the grapher.
	 *
	 * @param {float} posX The x position of the dot.
	 * @param {float} posY The y position of the dot.
	 * @param {float} facingAngle The angle at which the dot is oriented.
	 */
	var AnimationState = function(posX, posY, facingAngle) {
	    this.x = posX;
	    this.y = posY;
	    this.angle = facingAngle;
	};

	module.exports = AnimationState;

/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines various functions and constants that are
	 *   useful in mathematical calculations.
	 *
	 * NOTES ABOUT THE COORDINATE SYSTEM USED:
	 * Unless otherwise specified, all coordinates are expected to be
	 * measured according to the coordinate system used by the Grapher.
	 * That is, the positive y-axis points downward, and the positive
	 * x-axis points rightward.
	 
	 * NOTES ABOUT ANGLE MEASUREMENT:
	 * Unless otherwise specified, angles are measured in the same way
	 * as they are measured for the Grapher: clockwise from the positive
	 * y-axis. Thoughout this file, this angle measurement scheme will be
	 * referred to as being relative to "Grapher standard position." Note
	 * that this position derives from the fact that facing east, in the context of
	 * memorial stadium, is the default: 0 degrees in the Grapher standard position
	 * is straight east, and 90 degrees is south, etc.
	 */

	 
	/**
	 * The collection of all of the utility functions and constants defined in this
	 * file.
	 * @type {object}
	 */
	MathUtils = {};

	 
	//=============================================
	//===============-- CONSTANTS
	//=============================================
	 
	/**
	 * PI/2
	 * @type {float}
	 */
	MathUtils.PI_OVER_TWO = Math.PI / 2;

	/**
	 * 2*PI
	 * @type {float}
	 */
	MathUtils.TWO_PI = Math.PI * 2;

	/**
	 * When multiplied by an angle measured in degrees,
	 * this will produce an equivalent angle measured
	 * in radians.
	 * @type {float}
	 */
	MathUtils.DEGREES_TO_RADIANS_CONV_FACTOR = Math.PI/180;

	/**
	 * When multiplied by an angle measured in radians,
	 * this will produce an equivalent angle measured
	 * in degrees.
	 * @type {float}
	 */
	MathUtils.RADIANS_TO_DEGREES_CONV_FACTOR = 1 / MathUtils.DEGREES_TO_RADIANS_CONV_FACTOR;

	//=============================================
	//===============-- FUNCTIONS
	//=============================================

	/**
	 * Calculates the squared distance between two points.
	 *
	 * @param {float} fromX The x coordinate of the first point.
	 * @param {float} fromY The y coordinate of the first point.
	 * @param {float} toX The x coordinate of the second point.
	 * @param {float} toY The y coordinate of the second point.
	 * @return {float} The squared distance between points:
	 *   {fromX, fromY} and  {toX, toY}.
	 */
	MathUtils.calcSquaredDistance = function(fromX, fromY, toX, toY) {
	    var deltaX = toX - fromX;
	    var deltaY = toY - fromY;
	    return (deltaX * deltaX) + (deltaY * deltaY);
	};

	/**
	 * Calculates the distance between two points.
	 *
	 * @param {float} fromX The x coordinate of the first point.
	 * @param {float} fromY The y coordinate of the first point.
	 * @param {float} toX The x coordinate of the second point.
	 * @param {float} toY The y coordinate of the second point.
	 * @return {float} The distance between points:
	 *   {fromX, fromY} and  {toX, toY}.
	 */
	MathUtils.calcDistance = function(fromX, fromY, toX, toY) {
	    return Math.sqrt(this.calcSquaredDistance(fromX, fromY, toX, toY));
	};

	/**
	 * Calculates the angle toward which a vector is facing, in radians.
	 * The angle is measured relative to Grapher standard position.
	 *
	 * @param {float} vectorX The x component of the vector.
	 * @param {float} vectorY The y component of the vector.
	 * @return {float} The angle toward which the vector is pointing, in
	 * radians.
	 */
	MathUtils.calcAngle = function(vectorX, vectorY) {
	    var angle = Math.atan(-vectorX / vectorY);
	    if (vectorY < 0) {
	        angle += Math.PI;
	    }
	    return angle;
	};

	/**
	 * Returns the angle to which a point has been rotated
	 * around a center.
	 *
	 * @param {float} pointX The x coordinate of the rotated point.
	 * @param {float} pointY The y coordinate of the rotated point.
	 * @param {float} centerX The x coordinate of the center.
	 * @param {float} centerY The y coordinate of the center.
	 * @return {float} The angle to which a point has been rotated
	 *   around a center. The angle is measured in radians,
	 *   relative to Grapher standard position.
	 */
	MathUtils.calcAngleAbout = function(pointX, pointY, centerX, centerY) {
	    return this.calcAngle(pointX - centerX, pointY - centerY);
	};

	/**
	 * Calculates the x position of a point rotated along the unit
	 * circle by an angle measured relative to Grapher standard
	 * position.
	 *
	 * @param {float} angle The angle by which to rotate the point,
	 *   measured in radians relative to Grapher standard position.
	 * @return {float} The final x position of the point, rotated along the
	 *   unit circle.
	 */
	MathUtils.calcRotatedXPos = function(angle) {
	    return -Math.sin(angle);
	};

	/**
	 * Calculates the y position of a point rotated along the unit
	 * circle by an angle measured relative to Grapher standard
	 * position.
	 *
	 * @param {float} angle The angle by which to rotate the point,
	 *   measured in radians relative to Grapher standard position.
	 * @return {float} The final y position of the point, rotated along the
	 *   unit circle.
	 */
	MathUtils.calcRotatedYPos = function(angle) {
	    return Math.cos(angle);
	};

	/**
	 * Rotates an angle by a quarter-turn in
	 * a specified direction.
	 *
	 * @param {float} angle The angle to rotate, in radians.
	 * @param {bool} isCW True if the angle should be
	 *   rotated clockwise; false if the angle should 
	 *   be rotated counter-clockwise.
	 * @return The angle, rotated by a quarter turn.
	 *   This angle is measured in radians.
	 */
	MathUtils.quarterTurn = function(angle, isCW) {
	    return angle + ((isCW * 2 - 1) * this.PI_OVER_TWO);
	};

	/**
	 * For an angle measured in degrees, will
	 * find an equivalent angle between 0
	 * and 360 degrees.
	 *
	 * @param {float} angle An angle measured in degrees.
	 * @return {float} An equivalent angle between 0 and
	 *   360 degrees.
	 */
	MathUtils.wrapAngleDegrees = function(angle) {
	    while (angle >= 360) {
	        angle -= 360;
	    }
	    while (angle < 0) {
	        angle += 360;
	    }
	    return angle;
	};

	/**
	 * For an angle measured in radians, will
	 * find an equivalent angle between 0
	 * and 2*PI radians.
	 *
	 * @param {float} angle An angle measured in radians.
	 * @return {float} An equivalent angle between
	 *   0 and 2*PI radians.
	 */
	MathUtils.wrapAngleRadians = function(angle) {
	    while (angle >= TWO_PI) {
	        angle -= this.TWO_PI;
	    }
	    while (angle < 0) {
	        angle += this.TWO_PI;
	    }
	    return angle;
	};

	/**
	 * Converts an angle measured in degrees to one
	 * measured in radians.
	 *
	 * @param {float} angle An angle, measured in degrees.
	 * @return {float} The angle, measured in radians.
	 */
	MathUtils.toRadians = function(angle) {
	    return angle * this.DEGREES_TO_RADIANS_CONV_FACTOR;
	};

	/**
	 * Converts an angle measured in radians to one
	 * measured in degrees.
	 *
	 * @param {float} angle An angle, measured in radians.
	 * @return {float} The angle, measured in degrees.
	 */
	MathUtils.toDegrees = function(angle) {
	    return angle * this.RADIANS_TO_DEGREES_CONV_FACTOR;
	};

	module.exports = MathUtils;


/***/ },
/* 38 */,
/* 39 */,
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines the Coordinate struct.
	 */

	/**
	 * A Coordinate struct marks a two-dimensional position:
	 * {x: __,y: __}.
	 *
	 * @param {float} x The x component of the coordinate.
	 * @param {float} y The y component of the coordinate.
	 */
	var Coordinate = function(x, y) {
	    this.x = x;
	    this.y = y;
	};

	module.exports = Coordinate;

/***/ }
/******/ ])