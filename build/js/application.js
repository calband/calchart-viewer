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

	var ApplicationController = __webpack_require__(2);
	var JSUtils = __webpack_require__(4);

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

	    // bindings for file uploads
	    $(".js-beats-file-btn").click(function() {
	        $(".js-beats-file").click();
	    });
	    $(".js-beats-file").change(applicationController.getBeatsFileHandler());

	    $(".js-viewer-file-btn").click(function() {
	        $(".js-viewer-file").click();
	    });
	    $(".js-viewer-file").change(applicationController.getViewerFileHandler());

	    $(".js-audio-file-btn").click(function() {
	        $(".js-audio-file").click();
	    });
	    $(".js-audio-file").change(applicationController.getMusicFileHandler());

	    // bindings for user interface components
	    $(".js-prev-beat").click(function () {
	        applicationController.applyAnimationAction("prevBeat");
	    });
	    $(".js-prev-stuntsheet").click(function () {
	        applicationController.applyAnimationAction("prevSheet");
	    });
	    $(".js-next-beat").click(function () {
	        applicationController.applyAnimationAction("nextBeat");
	    });
	    $(".js-next-stuntsheet").click(function () {
	        applicationController.applyAnimationAction("nextSheet");
	    });

	    // global window actions for detecting arrow key presses
	    $(window).keydown(function (event) {
	        if (event.keyCode === 39) { // right arrow
	            applicationController.applyAnimationAction("nextBeat");
	        } else if (event.keyCode === 37) { // left arrow
	            applicationController.applyAnimationAction("prevBeat");
	        } else if (event.keyCode === 32) { // space
	            var _animator = applicationController.getAnimator();
	            if (_animator && _animator.isReady()) {
	                applicationController.toggleAnimation();
	            }
	        }
	    });

	    $(".js-animate").click(function () {
	        applicationController.toggleAnimation();
	    });

	    $(".js-generate-continuity").click(function () {
	        var show = $(".js-select-show").val();
	        var dot = $(".js-dot-labels").val();
	        var defaults = "&md-orientation=west&bev-orientation=east&sd-orientation=east&layout-order=ltr&endsheet-widget=md";
	        window.location.href = "pdf.html?show=" + show + "&dots=" + dot + defaults;
	    });
	    
	    $(".js-dot-labels").chosen({
	        allow_single_deselect: true,
	        width: "90px"
	    }).change(function(evt, params){
	        if (params) {
	            applicationController.applyAnimationAction("selectDot", params.selected);
	        } else {
	            applicationController.applyAnimationAction("clearSelectedDot");
	        }
	    });

	    $(".js-select-show")
	        .chosen({
	            width: "150px",
	            disable_search_threshold: 4, // if there are less than 4 shows, hide search
	            allow_single_deselect: true
	        })
	        .change(function() {
	            window.location.search = "show=" + $(this).val();
	        });

	    // Detect browser from http://stackoverflow.com/questions/5899783/detect-safari-using-jquery
	    var browserString = navigator.userAgent;
	    var isSafari = (browserString.indexOf("Safari") > -1) && (browserString.indexOf("Chrome") == -1);
	    // alert about safari not supporting ogg files. can remove if we stop using ogg files completely
	    if (isSafari) {
	        alert("You may not be able to upload .ogg files using Safari. Either use an mp3 version of the file or use the Viewer on another browser.")
	    }

	    applicationController.getShows().complete(function() {
	        // URL options
	        var options = JSUtils.getAllURLParams();
	        applicationController.autoloadShow(options.show, options.dot);
	    });
	});


/***/ },
/* 1 */,
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview The ApplicationController singleton class is defined here.
	 */

	var Grapher = __webpack_require__(6);
	var ShowUtils = __webpack_require__(3);
	var TimedBeatsUtils = __webpack_require__(7);
	var MusicAnimator = __webpack_require__(17);
	var MusicPlayerFactory = __webpack_require__(18);
	var AnimationStateDelegate = __webpack_require__(8);

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
	var ApplicationController = window.ApplicationController = function () {
	    this._musicPlayer = null;
	    this._animationStateDelegate = null;
	    this._grapher = null;
	    this._show = null;
	    this._animator = null;
	};

	/**
	 * Return the currently loaded show, or null if one has not been set yet.
	 * @return {Show|null} the currently loaded show
	 */
	ApplicationController.prototype.getShow = function () { return this._show; };

	/**
	 * Set the show to the given Show and instantate a new AnimationStateDelegate
	 * to go with the selected show.
	 * @param {Show} show the show to set
	 */
	ApplicationController.prototype.setShow = function (show) {
	    this._show = show;
	    this._animationStateDelegate = new AnimationStateDelegate(this._show);
	    this._animator.setAnimationStateDelegate(this._animationStateDelegate);
	    this._syncWithDelegate();
	    this._updateUIWithShow();
	};

	/**
	 * Sends a GET call to the Calchart server and retrieves all shows from the
	 * server and adds it to the HTML UI
	 *
	 * @return {Promise} the jQuery AJAX promise object
	 */
	ApplicationController.prototype.getShows = function() {
	    return $.ajax({
	        url: "https://calchart-server.herokuapp.com/list/",
	        dataType: "json",
	        xhr: function() {
	            var xhr = $.ajaxSettings.xhr();
	            // update loading bar
	            xhr.onprogress = function(evt) {
	                if (evt.lengthComputable) {
	                    var percentComplete = evt.loaded / evt.total;
	                    $(".loading .progress-bar").css({
	                        width: percentComplete * 35 + "%",
	                    });
	                }
	            };
	            return xhr;
	        },
	        success: function(data) {
	            $("<option>").appendTo(".js-select-show");
	            data.shows.forEach(function(show) {
	                $("<option>")
	                    .attr("value", show.slug)
	                    .text(show.name)
	                    .appendTo(".js-select-show");
	            });
	            $(".js-select-show").trigger("chosen:updated");
	        },
	    });
	};

	/**
	 * Autoloads given show and dot from the Calchart server from the URL parameters
	 */
	ApplicationController.prototype.autoloadShow = function(show, dot) {
	    if (show === "" || show === undefined) {
	        $(".loading").remove();
	        return;
	    }
	    var optionElem = $(".js-select-show option[value=" + show + "]");
	    optionElem.prop("selected", true);
	    $(".js-select-show").trigger("chosen:updated");

	    var _this = this;
	    // load all show data
	    $.ajax({
	        url: "https://calchart-server.herokuapp.com/get/" + show + "/",
	        dataType: "json",
	        xhr: function() {
	            var xhr = $.ajaxSettings.xhr();
	            // update loading bar
	            xhr.onprogress = function(evt) {
	                if (evt.lengthComputable) {
	                    var percentComplete = evt.loaded / evt.total;
	                    $(".loading .progress-bar").css({
	                        width: (35 + percentComplete * 65) + "%",
	                    });
	                }
	            };
	            return xhr;
	        },
	        success: function(data) {
	            // load viewer file
	            var viewer = ShowUtils.fromJSON(data.viewer);
	            _this.setShow(viewer);
	            _this._setFileInputText(".js-viewer-file-btn", show);
	            if (dot !== undefined && dot !== "") {
	                _this.applyAnimationAction("selectDot", dot);
	                $("option[value=" + dot + "]").prop("selected", true);
	                $(".js-dot-labels").trigger("chosen:updated");
	            }

	            // load beats file
	            var beats = TimedBeatsUtils.fromJSON(data.beats);
	            _this._animator.setBeats(beats);
	            _this._setFileInputText(".js-beats-file-btn", show);

	            // load audio file
	            var newSound = _this._musicPlayer.createSound();
	            var onMusicLoaded = function() {
	                _this._animator.setMusic(newSound);
	                _this._setFileInputText(".js-audio-file-btn", show);

	                // close loading screen
	                $(".loading").remove();
	            };
	            newSound.registerEventHandler("finishedLoading", onMusicLoaded);
	            newSound.load(data.audio);
	        },
	    });
	};

	/**
	 * Update the html ui with various properties about the show. Assumes that
	 * this._show has already been loaded.
	 */
	ApplicationController.prototype._updateUIWithShow = function () {
	    if (this._show.getTitle() === undefined) {
	        $(".js-show-title").text("Untitled Show");
	    } else {
	        $(".js-show-title").text(this._show.getTitle());
	    }
	    this._show.getDotLabels().forEach(function(dot) {
	        $("<option>")
	            .attr("value", dot)
	            .attr("data-dot-label", dot)
	            .text(dot)
	            .appendTo(".js-dot-labels");
	    });
	    $(".js-dot-labels").trigger("chosen:updated");
	};

	/**
	 * Returns the MusicAnimator or null if one hasn't been instantiated.
	 * @return {MusicAnimator|null} the music animator
	 */
	ApplicationController.prototype.getAnimator = function() {
	    return this._animator;
	}

	/**
	 * Return the AnimationStateDelegate or null if one hasn't been instantiated.
	 * @return {AnimationStateDelegate|null} the delegate
	 */
	ApplicationController.prototype.getAnimationStateDelegate = function () {
	    return this._animationStateDelegate;
	};

	/**
	 * Given an action that is "{previous|next}{Sheet|Beat}", apply the correct
	 * action to the animation state delegate.
	 * @param  {string} action action to the apply
	 */
	ApplicationController.prototype.applyAnimationAction = function(action) {
	    // if we don't have an animation state delegate or we dont recognize the
	    // action, just return without doing anything
	    var actions = ["prevSheet", "nextSheet", "prevBeat", "nextBeat", "selectDot", "clearSelectedDot"];
	    var acceptOneArgument = ["selectDot"];
	    if (this._animationStateDelegate === null || actions.indexOf(action) === -1) {
	        return;
	    }
		var restartAnimator = false;
		if (this._animator.isPlaying()) {
			this._animator.stop();
			restartAnimator = true;
		}
	    if (acceptOneArgument.indexOf(action) !== -1) {
	        // call the specified function, passing in the second argument to
	        // applyAnimationAction as the first argument to the specified function
	        this._animationStateDelegate[action]([].slice.call(arguments)[1]);
	    } else {
	        this._animationStateDelegate[action]();
	    }
	    this._syncWithDelegate();
		if (restartAnimator) {
			this._animator.start();
		}
	};

	/**
	 * When the AnimationStateDelegate changes, respond by redrawing
	 * the graph and updating the UI.
	 */
	ApplicationController.prototype._syncWithDelegate = function() {
	    this._updateUIWithAnimationState();

	    this._grapher.draw(
	        this._animationStateDelegate.getCurrentSheet(),
	        this._animationStateDelegate.getCurrentBeatNum(),
	        this._animationStateDelegate.getSelectedDot()
	    );
	};

	/**
	 * Update the DOM with the correct stuntsheet number, beat number, and number
	 * of beats in the current stuntsheet depending on the state of the
	 * animationStateDelegate.
	 */
	ApplicationController.prototype._updateUIWithAnimationState = function () {
	    $(".js-stuntsheet-total").text(this._animationStateDelegate.getCurrentSheet().getDuration());
	    var currBeat = this._animationStateDelegate.getCurrentBeatNum();
	    if (currBeat === 0) {
	        $(".js-beat-number").text("Hup");
	    } else {
	        $(".js-beat-number").text(currBeat);
	    }
	    var sheetNum = this._animationStateDelegate.getCurrentSheetNum() + 1;
	    var sheetPage = sheetNum + "/" + this.getShow().getNumSheets();
	    var sheetLabel = this._animationStateDelegate.getCurrentSheet().getSheetLabel();
	    if (sheetLabel === "" || parseInt(sheetLabel) === sheetNum) {
	        $(".js-stuntsheet-label").text(sheetPage);
	    } else {
	        $(".js-stuntsheet-label").text(sheetLabel + " (" + sheetPage + ")");
	    }

	    $(".js-dot-continuity").empty();
	    if (this._animationStateDelegate.getSelectedDot() !== null) {
	        var selectedDot = this._animationStateDelegate.getSelectedDot();
	        $(".js-selected-dot-label").text(selectedDot);
	        var currentSheet = this._animationStateDelegate.getCurrentSheet();
	        var typeOfDot = currentSheet.getDotType(selectedDot);
	        var continuities = currentSheet.getContinuityTexts(typeOfDot);
	        if (continuities !== undefined) {
	            continuities.forEach(function(continuity) {
	                $("<div>")
	                    .addClass("dot-continuity")
	                    .text(continuity)
	                    .appendTo(".js-dot-continuity");
	            })
	        }
	    } else {
	        $(".js-selected-dot-label").text("dots");
	    }
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
	    this._musicPlayer = new MusicPlayerFactory().createMusicPlayer();
	    this._animator = new MusicAnimator();
	    var _this = this;
	    this._animator.registerEventHandler("beat", function() {_this._syncWithDelegate();});
	    this._animator.registerEventHandler("ready", function () {
	        _this._updateAnimationControl();
	    });
	    this._animator.registerEventHandler("finished", function() {
	        _this._updateAnimationControl();
	    });
	    this._grapher = new Grapher("college", $(".js-grapher-draw-target"));
	    this._grapher.draw(null, null, null);
	};

	/**
	 * Sets the text of the file input buttons to be the name of the file
	 * 
	 * @param {String} selector, i.e. ".js-beats-file-btn"
	 * @param {String} fileName
	 */
	ApplicationController.prototype._setFileInputText = function(selector, fileName) {
	    var MAX_LENGTH = 16;
	    if (fileName.length > MAX_LENGTH) {
	        fileName = fileName.substring(0, MAX_LENGTH) + "...";
	    }
	    $(selector).text(fileName);
	};

	/**
	 * Given a callback function which expects to process the contents of a file
	 * as UTF-8 encoded text, return a function which takes an event (an event
	 * handler, to be used with the jquery change function) and reads the files
	 * for that event's current target (a file input). The returned function then
	 * passes the file's contents to the provided callback.
	 *
	 * Note: this handler function that this method generates will return undefined
	 * if there have been no files uploaded to the input, of if the input accepts
	 * multiple files and has more than one.
	 *
	 * Example useage of this:
	 *
	 * $(".my-input-target").change(_createFileHandler(function (contents) {
	 *     console.log(contents);
	 * }));
	 * @param  {Function(string)} callback a callback which accepts the file
	 *   contents
	 * @return {Function(jQuery.Event)} event handler function which reads the file
	 *   and passes its contents to the callback
	 */
	ApplicationController.prototype._createFileHandler = function (callback) {
	    return function (event) {
	        var files = event.currentTarget.files;
	        if (!files || files.length !== 1) {
	            return;
	        }
	        var reader = new window.FileReader();
	        reader.onload = function () {
	            callback(reader.result, files[0].name);
	        };
	        reader.readAsText(files[0]);
	    };
	};

	/**
	 * Given a callback function which expects to process the URL for a file,
	 * return a function that takes an event (an event handler, to be used with
	 * the jquery change function) and finds the URL for the event's current
	 * target (a file input). The returned function then passes the URL to
	 * the provided callback.
	 *
	 * Note: this handler function that this method generates will return undefined
	 * if there have been no files uploaded to the input, of if the input accepts
	 * multiple files and has more than one.
	 *
	 * Example useage of this:
	 *
	 * $(".my-input-target").change(_createFileURLHandler(function (fileURL) {
	 *     console.log(fileURL);
	 *
	 * @param {Function(*)} callback A callback which accepts a file's URL.
	 * @return {Function(jQuery.Event)} An event handler function which passes
	 *   a file's URL to the callback.
	 */
	ApplicationController.prototype._createFileURLHandler = function (callback) {
	    return function(event) {
	        var files = event.currentTarget.files;
	        if (!files || files.length !== 1) {
	            return;
	        }
	        callback(URL.createObjectURL(files[0]), files[0].name);
	    };
	};

	/**
	 * Return an event handler function which reads the beats file and operates on
	 * it.
	 * @return {Function(jQuery.Event)} the event handler
	 */
	ApplicationController.prototype.getBeatsFileHandler = function () {
	    var _this = this;
	    return this._createFileHandler(function (fileContentsAsText, fileName) {
	        try {
	            var beats = TimedBeatsUtils.fromJSONString(fileContentsAsText);
	            _this._animator.setBeats(beats);
	            _this._setFileInputText(".js-beats-file-btn", fileName);
	        } catch (err) {
	            $(".js-beats-file").val("");
	            if (err.name === "SyntaxError") {
	                _this.displayFileInputError("Please upload a valid beats file.");
	            } else if (err.name === "InvalidFileTypeError") {
	                _this.displayFileInputError(err.message);
	            }
	        }
	    });
	};

	/**
	 * Return an event handler function which reads the viewer file and operates on
	 * it.
	 * @return {Function(jQuery.Event)} the event handler
	 */
	ApplicationController.prototype.getViewerFileHandler = function () {
	    var _this = this;
	    return this._createFileHandler(function (fileContentsAsText, fileName) {
	        try {
	            var show = ShowUtils.fromJSONString(fileContentsAsText);
	            _this.setShow(show);
	            _this._setFileInputText(".js-viewer-file-btn", fileName);
	        } catch (err) {
	            $(".js-viewer-file").val("");
	            if (err.name === "SyntaxError") {
	                _this.displayFileInputError("Please upload a valid viewer file.");
	            } else if (err.name === "InvalidFileTypeError") {
	                _this.displayFileInputError(err.message);
	            }
	        }
	    });
	};

	/**
	 * Return an event handler function which loads and operates on a music file.
	 *
	 * @return {Function(jQuery.Event)} the event handler
	 */
	ApplicationController.prototype.getMusicFileHandler = function () {
	    var _this = this;
	    return this._createFileURLHandler(function (fileURL, fileName) {
	        if (fileURL !== undefined) {
	            var newSound = _this._musicPlayer.createSound();
	            var onMusicLoaded = function() {
	                if (newSound.errorFlag()) {
	                    $(".js-audio-file").val("");
	                    _this.displayFileInputError("Please upload a valid audio file.");
	                } else {
	                    _this._animator.setMusic(newSound);
	                    _this._setFileInputText(".js-audio-file-btn", fileName);
	                }
	            };
	            newSound.registerEventHandler("finishedLoading", onMusicLoaded);
	            newSound.load(fileURL);
	        }
	    });
	};

	/**
	 * Displays error message in the UI for invalid file uploads.
	 *
	 * @param {String} message to be displayed
	 */
	ApplicationController.prototype.displayFileInputError = function(message) {
	    $(".file-input-error")
	        .text(message)
	        .fadeIn(1000)
	        .delay(1000)
	        .fadeOut(500);
	}


	/**
	 * Begins or stops a show animation. If the animation is not currently running,
	 * this will start animating at the current beat, with the MusicAnimator.
	 * Otherwise, this will stop the animation.
	 */
	ApplicationController.prototype.toggleAnimation = function() {
	    if (this._animator.isPlaying()) {
	        this._animator.stop();
	    } else if (this._animator.isReady()) {
	        this._animator.start();
	    } else {
	        console.log("Animator is not ready!");
	    }
	    this._updateAnimationControl();
	};


	/**
	 * Updates the animation button, making sure that it tells the user whether it
	 * will start or stop the animation. The button should also indicate when it is
	 * disabled (e.g. when the music and beats files have not been loaded, and the
	 * show cannot be animated).
	 */
	ApplicationController.prototype._updateAnimationControl = function() {
	    if (this._animator.isPlaying()) {
	        $(".js-animate").text("Stop animation");
	    } else {
	        $(".js-animate").text("Animate with music");
	        if (this._animator.isReady()) {
	            $(".js-animate").removeClass("disabled");
	        } else {
	            $(".js-animate").addClass("disabled");
	        }
	    }
	};

	module.exports = ApplicationController;


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines a collection of functions that are
	 *   used to create and manage Show objects.
	 */

	 var ViewerFileLoadSelector = __webpack_require__(16);
	 var Version = __webpack_require__(5);
	 
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
/* 5 */
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
/* 6 */
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
	                $(".js-dot-labels option[data-dot-label=" + label + "]").prop("selected", true);
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


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines a collection of functions that are
	 *   used to create and manage TimedBeats objects.
	 */

	 var BeatsFileLoadSelector = __webpack_require__(19);
	 var Version = __webpack_require__(5);
	 
	 /**
	  * The collection of all functions related to creating and
	  * managing TimedBeats objects.
	  */
	 var TimedBeatsUtils = {};
	 
	/**
	 * Builds a TimedBeats object from a beats file, given the content
	 * of a beats file as a string.
	 *
	 * @param {string} fileContent The content of the
	 *   beats file to load the TimedBeats from.
	 * @return {TimedBeats} The TimedBeats object represented in the
	 *   beats file.
	 */
	TimedBeatsUtils.fromJSONString = function(fileContent) {
	    var beatsObject = JSON.parse(fileContent); //Parse the JSON file text into an object
	    return this.fromJSON(beatsObject);
	};
	 
	/**
	 * Builds a TimedBeats object from a beats file, as a JSON object
	 *
	 * @param {object} beatsObject The content of the
	 *   beats file to load the TimedBeats from.
	 * @return {TimedBeats} The TimedBeats object represented in the
	 *   beats file.
	 */
	TimedBeatsUtils.fromJSON = function(beatsObject) {
	    var fileVersion = Version.parse(beatsObject.meta.version); //Get the version of the beats file
	    return BeatsFileLoadSelector.getInstance().getAppropriateLoader(fileVersion).loadFile(beatsObject); //Get the appropriate file loader and use it to load the file
	};

	module.exports = TimedBeatsUtils;

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines the AnimationStateDelegate class. The Grapher
	 *   gets the sheet and beat that it draws from one of these objects.
	 *
	 *   A NOTE ABOUT THE ZEROTH BEATS:
	 *   If a stuntsheet is N beats long, then you can access any
	 *   beat of that stuntsheet in the range [0, N) (notice that
	 *   the upper bound is exclusive). The zeroth beat is NOT the
	 *   first beat of movement - it is BEFORE the first beat of
	 *   movement. Beat ONE is the first beat of movement. Beat
	 *   zero could be considered the last step of the previous
	 *   movement.
	 */
	 
	/**
	 * AnimationStateDelegate objects are used to explore a show. You
	 * can browse the show beat-by-beat, or sheet-by-sheet.
	 *
	 * @param {Show} The show to explore.
	 */
	var AnimationStateDelegate = function(show) {
	    this.setShow(show);
	};

	/**
	 * Sets the show that this AnimationStateDelegate will browse.
	 * When the show is set, the AnimationStateDelegate automatically
	 * resets, so that it is looking at the zeroth beat of the show.
	 *
	 * @param {Show} The new show to browse.
	 */
	AnimationStateDelegate.prototype.setShow = function(show) {
	    this._show = show;
	    this._currSheet = 0;
	    this._currBeat = 0;
	    this._selectedDot = null;
	};

	/**
	 * Steps to the next beat in the show, transitioning to the next
	 * stuntsheet if necessary.
	 */
	AnimationStateDelegate.prototype.nextBeat = function() {
	    if (this.hasNextBeatInCurrentSheet()) {
	        this._currBeat++;
	    } else if (this.hasNextSheet()) {
	        this.nextSheet();
	    }
	};

	/**
	 * Steps back to the previous beat in the show, transitioning to the
	 * previous stuntsheet if necessary.
	 */
	AnimationStateDelegate.prototype.prevBeat = function() {
	    if (this.hasPrevBeatInCurrentSheet()) {
	        this._currBeat--;
	    } else if (this.hasPrevSheet()) {
	        this.prevSheet();
	        this._currBeat = this.getCurrentSheet().getDuration() - 1;
	    }
	};

	/**
	 * Jumps to the zeroth beat of the next stuntsheet.
	 */
	AnimationStateDelegate.prototype.nextSheet = function() {
	    if (this.hasNextSheet()) {
	        this._currSheet++;
	        this._currBeat = 0;
	    } else {
	        this._currBeat = this.getCurrentSheet().getDuration() - 1;
	    }
	};

	/**
	 * Jumps to the zeroth beat of the previous stuntsheet.
	 */
	AnimationStateDelegate.prototype.prevSheet = function() {
	    if (this.hasPrevSheet()) {
	        this._currSheet--;
	    }
	    this._currBeat = 0;
	};

	/**
	 * Returns whether or not there is another beat in the show
	 * relative to the current one.
	 *
	 * @return {boolean} True if there is another beat in the show;
	 *   false otherwise.
	 */
	AnimationStateDelegate.prototype.hasNextBeat = function() {
	    return (this.hasNextBeatInCurrentSheet() || this.hasNextSheet());
	};

	/**
	 * Returns whether or not there is a previous beat in the show
	 * relative to the current one.
	 *
	 * @return {boolean} True if there is a previous beat in the show;
	 *   false otherwise.
	 */
	AnimationStateDelegate.prototype.hasPrevBeat = function() {
	    return (this.hasPrevBeatInCurrentSheet() || this.hasPrevSheet());
	};

	/**
	 * Returns whether or not there is a next stuntsheet in the
	 * show relative to the current one.
	 *
	 * @return {boolean} True if there is a next stuntsheet in the
	 *   show; false otherwise.
	 */
	AnimationStateDelegate.prototype.hasNextSheet = function() {
	    return (this._currSheet < this._show.getNumSheets() - 1);
	};

	/**
	 * Returns whether or not there is a previous stuntsheet in the
	 * show relative to the current one.
	 *
	 * @return {boolean} True if there is a previous stuntsheet in the
	 *   show; false otherwise.
	 */
	AnimationStateDelegate.prototype.hasPrevSheet = function() {
	    return (this._currSheet > 0);
	};

	/**
	 * Returns whether or not there is a next beat in the current
	 * stuntsheet.
	 *
	 * @return {boolean} True if there is another beat in the current
	 *   stuntsheet; false otherwise.
	 */
	AnimationStateDelegate.prototype.hasNextBeatInCurrentSheet = function() {
	    return (this._currBeat < this.getCurrentSheet().getDuration() - 1);
	};

	/**
	 * Returns whether or not there is a previous beat in the current
	 * stuntsheet.
	 *
	 * @return {boolean} True if there is a previous beat in the current
	 *   stuntsheet; false otherwise.
	 */
	AnimationStateDelegate.prototype.hasPrevBeatInCurrentSheet = function() {
	    return (this._currBeat > 0);
	};

	/**
	 * Returns the current beat in the current stuntsheet.
	 *
	 * @return {int} The current beat number in the current
	 *   stuntsheet.
	 */
	AnimationStateDelegate.prototype.getCurrentBeatNum = function() {
	    return this._currBeat;
	};

	/**
	 * Returns the index of the current stuntsheet.
	 *
	 * @return {int} The index of the current stuntsheet.
	 */
	AnimationStateDelegate.prototype.getCurrentSheetNum = function() {
	    return this._currSheet;
	};

	/**
	 * Returns the current stuntsheet.
	 *
	 * @return {Sheet} The current stuntsheet.
	 */
	AnimationStateDelegate.prototype.getCurrentSheet = function() {
	    return this._show.getSheet(this._currSheet);
	};

	/**
	 * Returns the show.
	 *
	 * @return {Show} The show that this object is
	 *   browsing.
	 */
	AnimationStateDelegate.prototype.getShow = function() {
	    return this._show;
	};

	/**
	 * Returns the label of the selected dot.
	 *
	 * @return {string} The label of the currently-selected dot.
	 *   If no dot is selected, will return null.
	 */
	AnimationStateDelegate.prototype.getSelectedDot = function() {
	    return this._selectedDot;
	};

	/**
	 * Selects a dot.
	 *
	 * @param {string} dotLabel The label of the dot to select.
	 */
	AnimationStateDelegate.prototype.selectDot = function(dotLabel) {
	    this._selectedDot = dotLabel;
	};

	/**
	 * Deselects the selected dot.
	 */
	AnimationStateDelegate.prototype.clearSelectedDot = function() {
	    this._selectedDot = null;
	};

	module.exports = AnimationStateDelegate;



/***/ },
/* 9 */,
/* 10 */,
/* 11 */,
/* 12 */,
/* 13 */,
/* 14 */,
/* 15 */,
/* 16 */
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
	var JSUtils = __webpack_require__(4);
	var Version = __webpack_require__(5);
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
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines the MusicAnimator class. This is used to animate
	 *   with music. For a basic description on how to use it, check the class
	 *   description.
	 *   To help keep the UI updated, the MusicAnimator can be set up to inform
	 *   you when it changes state (e.g. when it starts, stops, finishes, etc.).
	 *   You can submit event handlers to the MusicAnimator through the
	 *   registerEventHandler(...) method.
	 */

	/**
	 * A MusicAnimator will animate the show in sync with
	 * music. To get the MusicAnimator to work, you must provide
	 * it with music (through the setMusic(...) method)
	 * and a TimedBeats object (through the setBeats(...) method), and
	 * with an AnimationStateDelegate object (through the setAnimationStateDelegate(...) method).
	 * After you set up the object, you should check if the MusicAnimator is 
	 * ready to play using the isReady(...) method, since it may have encountered
	 * an error while loading. If it is ready, then feel free to start and stop the
	 * animator with the start(...) and stop(...) methods. The animator
	 * will automatically stop when it reaches the end of the show, or when
	 * it runs out of beats to animate in the music.
	 *
	 * @param {AnimationStateDelegate} The AnimationStateDelegate that will
	 *   be used to animate the show. Whenever the music advances a beat, the
	 *   delegate will advance a beat as well.
	 * @param {MusicPlayer} The music player.
	 */
	var MusicAnimator = function() {
	    this._animStateDelegate = null;
	    this._sound = null;
	    this._timedBeats = null;
	    this._eventHandlers = {};
	    this._blockStopEvent = false;
	};

	/**
	 * Event strings that the music animator recognizes as hooks.
	 * @type {Array}
	 */
	MusicAnimator.eventTypes = ["start", "stop", "finished", "beat", "ready"];

	/**
	 * Set the animation state delegate.
	 */
	MusicAnimator.prototype.setAnimationStateDelegate = function(animationStateDelegate) {
	    this.stop(); // Stop before making changes - we don't want the sound to fire events while we work
	    this._animStateDelegate = animationStateDelegate; // Set up the new delegate
	};


	/**
	 * Sets the music to animate the show with.
	 *
	 * @param {Sound} soundObject The music.
	 */
	MusicAnimator.prototype.setMusic = function(soundObject) {
	    this.stop(); //Stop before loading, so that the sound doesn't fire events while we work
	    var _this = this;
	    this._sound = soundObject;
	    this._sound.registerEventHandler("play", this._makeEventRouter("start"));
	    this._sound.registerEventHandler("stop", function() {_this._musicStopped();});
	    this._sound.registerEventHandler("finished", this._makeEventRouter("finished"));
	    this._loadBeatsOntoSound();
	    if (this.isReady()) {
	        this._callEventHandler("ready");
	    }
	};

	/**
	 * Sets the TimedBeats object that will determine
	 * where beats fall in the music.
	 *
	 * @param {TimedBeats} timedBeats The beats to associate with
	 *   the music.
	 */
	MusicAnimator.prototype.setBeats = function(timedBeats) {
	    this.stop(); //Stop before loading, so that the sound doesn't fire events while we work
	    this._beats = timedBeats;
	    this._loadBeatsOntoSound();
	    if (this.isReady()) {
	        this._callEventHandler("ready");
	    }
	};

	/**
	 * Makes sure that the sound is prepared to inform us every
	 * time one of the beats is reached in the music.
	 */
	MusicAnimator.prototype._loadBeatsOntoSound = function() {
	    if (this._beats && this._sound) {
	        this._sound.clearTimedEvents();
	        var _this = this;
	        var timedEventHandler = function() {
	            _this._nextBeat();
	        };
	        var endBeatEventHandler = function() {
	            _this._animStateDelegate.nextBeat();
	            _this._callEventHandler("beat");
	            _this._endOfShow();
	        };
	        //Beat 0 is the "start beat" - don't associate a timed event with it, just start the music at that time
	        //The last beat is the "end beat" - make sure that the show finishes when this beat is hit
	        for (var beatNum = 1; beatNum < this._beats.getNumBeats() - 1; beatNum++) {
	            this._sound.addTimedEvent(this._beats.getBeatTime(beatNum), timedEventHandler);
	        }
	        this._sound.addTimedEvent(this._beats.getBeatTime(this._beats.getNumBeats() - 1), endBeatEventHandler);
	    }
	};

	/**
	 * Start playing the animation with music.
	 */
	MusicAnimator.prototype.start = function() {
	    this.stop();
	    // beat "0" of a given stuntsheet is really the last beat of the stuntsheet before
	    var overallBeat = -1;
	    var show = this._animStateDelegate.getShow();
	    for (var sheet = 0; sheet < this._animStateDelegate.getCurrentSheetNum(); sheet++) {
	        overallBeat += show.getSheet(sheet).getDuration();
	    }
	    overallBeat += this._animStateDelegate.getCurrentBeatNum();
	    if (this._animStateDelegate.hasNextBeat() && overallBeat < this._beats.getNumBeats() - 1) {
	        if (overallBeat < 0) {
	            this._animStateDelegate.nextBeat();
	            $(".js-beat-number").text("1");
	            this._sound.play(0);
	        } else {
	            this._sound.play(this._beats.getBeatTime(overallBeat));
	        }
	    } else {
	        this._endOfShow();
	    }
	};

	/**
	 * Stop playing the animation with music.
	 */
	MusicAnimator.prototype.stop = function() {
	    if (this._sound !== null && this._sound.isPlaying()) {
	        this._sound.stop();
	    }
	};

	/**
	 * Returns whether or not the animator is currently playing.
	 *
	 * @return {boolean} True if the animator is currently playing; false
	 *   otherwise.
	 */
	MusicAnimator.prototype.isPlaying = function() {
	    if (this._sound !== null) {
	        return this._sound.isPlaying();
	    } else {
	        return false;
	    }
	};

	/**
	 * Returns whether or not the animator is ready to play.
	 *
	 * @return {boolean} True if the animator is ready to play; false
	 *   otherwise.
	 */
	MusicAnimator.prototype.isReady = function() {
	    return (
	        this._sound && this._sound.isReady() &&
	        this._beats &&
	        this._animStateDelegate !== null
	    );
	};

	/**
	 * Registers an event handler, so that whenever a particular event occurs,
	 * the event handler function is called.
	 *
	 * @param {string} eventName This is the name of the event to connect
	 *   the event handler to. When this event occurs, the eventHandler will
	 *   be called. Possible eventName inputs are:
	 *     - "start" : occurs when the animator starts
	 *     - "stop" : occurs when the animator stops, but NOT when the
	 *         animator stops because it has finished
	 *     - "finished" : occurs when the animator finishes
	 *     - "beat" : occurs when the animator advances to the next beat
	 * @param {function():*} eventHandler The function that will be called
	 *   when the specified event occurs.
	 */
	MusicAnimator.prototype.registerEventHandler = function(eventName, eventHandler) {
	    this._eventHandlers[eventName] = eventHandler;
	};

	/**
	 * Makes a function that will call the event handler with the given
	 * name. The returned function is flexible: it will call whatever
	 * event handler is associated with the MusicAnimator (so if the
	 * event handlers are changed in the MusicAnimator, they will be
	 * be changed in the function), and it will skip a call to the
	 * event handler if it is unset.
	 *
	 * @param {string} eventName The name of the event whose handler
	 *   should be called.
	 * @return {function():*} A function that, when called, will
	 *   call the event handler associated with the specified event
	 *   (but only if that event handler is set).
	 */
	MusicAnimator.prototype._makeEventRouter = function(eventName) {
	    var _this = this;
	    return function() {
	        _this._callEventHandler(eventName);
	    };
	};

	/**
	 * Calls an event handler, if it is set.
	 *
	 * @param {string} eventName The event whose handler should be called.
	 */
	MusicAnimator.prototype._callEventHandler = function(eventName) {
	    if (this._eventHandlers[eventName]) {
	        this._eventHandlers[eventName]();
	    }
	};

	/**
	 * Responds to a timed event in the sound, and moves to the next
	 * beat.
	 */
	MusicAnimator.prototype._nextBeat = function() {
	    this._animStateDelegate.nextBeat();
	    this._callEventHandler("beat");
	    if (!this._animStateDelegate.hasNextBeat()) {
	        this._endOfShow();
	    }
	};

	/**
	 * Called when the end of the show is reached before the
	 * end of the music. This stops the animation and alerts
	 * the event handler that the animation has finished.
	 */
	MusicAnimator.prototype._endOfShow = function() {
	    this._stopAndBlockEvent();
	    this._callEventHandler("finished");
	};

	/**
	 * Stops the animation and the sound, but makes sure that
	 * the music's "stop" event never reaches the event handler.
	 * This is useful when the show finishes before the music,
	 * because in that case, we need to stop the music prematurely,
	 * but we want to throw a "finished" event instead of a "stopped"
	 * event.
	 */
	MusicAnimator.prototype._stopAndBlockEvent = function() {
	    this._blockStopEvent = true;
	    this.stop();
	};

	/**
	 * An intermediate event handler for when the music is stopped.
	 * It can block stop events from reaching the real event handler.
	 */
	MusicAnimator.prototype._musicStopped = function() {
	    if (this._blockStopEvent) {
	        this._blockStopEvent = false;
	    } else {
	        this._callEventHandler("stop");
	    }
	};

	module.exports = MusicAnimator;

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines the MusicPlayerFactory class, which is used to
	 *   generate a MusicPlayer that will play audio for us.
	 */

	var SMMusicPlayer = __webpack_require__(32);
	 
	/**
	 * MusicPlayerFactory objects can create an appropriate MusicPlayer object
	 * for on the current environment and settings.
	 */
	var MusicPlayerFactory = function() {
	};

	/**
	 * Creates and returns an appropriate MusicPlayer for the current
	 * environment and settings.
	 *
	 * @return {MusicPlayer} A MusicPlayer object to play audio for
	 *   the application.
	 */
	MusicPlayerFactory.prototype.createMusicPlayer = function() {
	    return new SMMusicPlayer();
	};

	module.exports = MusicPlayerFactory;

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview This file describes how beats files are loaded.
	 *   A singleton of the BeatsFileLoadSelector class
	 *   is used to determine how to load a specific version of the
	 *   beats file. For more information about how a FileLoadSelector
	 *   like the BeatsFileLoadSelector works, @see FileLoadSelector.js.
	 *   Here are the steps that you should follow when the file format
	 *   changes:
	 *     - Define a FileLoadSelector.FileLoader that can load the
	 *         new file version
	 *     - Register your new file loader in 
	 *         BeatsFileLoadSelector._setupInstance(...)
	 *   
	 */

	var Version = __webpack_require__(5);
	var FileLoadSelector = __webpack_require__(21);
	var JSUtils = __webpack_require__(4);
	var TimedBeats = __webpack_require__(33);
	var InvalidFileTypeError = __webpack_require__(22);
	 
	/**
	 * Every version of the Beats File needs to be loaded in a different way -
	 * this class is responsible for finding the appropriate BeatsFileLoader
	 * object for loading a particular Beats File version.
	 */
	var BeatsFileLoadSelector = function() {
	    FileLoadSelector.apply(this, []);
	};

	JSUtils.extends(BeatsFileLoadSelector, FileLoadSelector);

	/**
	 * The BeatsFileLoadSelector is a singleton, and this is its
	 * instance.
	 * @type {BeatsFileLoadSelector}
	 */
	BeatsFileLoadSelector._instance = undefined;

	/**
	 * Returns the BeatsFileLoadSelector singleton instance. If it doesn't exist,
	 * it is created and then returned.
	 *
	 * @return {BeatsFileLoadSelector} The BeatsFileLoadSelector singleton instance.
	 */
	BeatsFileLoadSelector.getInstance = function() {
	    if (BeatsFileLoadSelector._instance === undefined) {
	        BeatsFileLoadSelector._instance = new BeatsFileLoadSelector();
	        BeatsFileLoadSelector._setupInstance(BeatsFileLoadSelector._instance);
	    }
	    return BeatsFileLoadSelector._instance;    
	};

	/**
	 * Loads a new BeatsFileLoadSelector with all of the known BeatsFileLoader
	 * types, so that it understands how to load every Beats File version.
	 *
	 * @param {BeatsFileLoadSelector} instance The BeatsFileLoadSelector to set up.
	 */
	BeatsFileLoadSelector._setupInstance = function(instance) {
	    instance.registerLoader(new Version(1, 0, 0), new BeatsFileLoad_1_0_0());
	};
	 
	/**
	 * This class is responsible for loading beats files of a particular version.
	 */
	BeatsFileLoadSelector.BeatsFileLoader = function() {
	};

	JSUtils.extends(BeatsFileLoadSelector.BeatsFileLoader, FileLoadSelector.FileLoader); 


	/**
	 *=================================================================
	 *====================-- LOAD BEATS FILE 1.0.0
	 *=================================================================
	 * ALL AVAILABLE METHODS IN THIS VERSION:
	 *   loadFile
	 *   loadBeats
	 * ADDED METHODS IN THIS VERSION:
	 *  all available METHODS
	 * REMOVED METHODS IN THIS VERSION:
	 *   none
	 * MODIFIED METHODS IN THIS VERSION:
	 *   none
	 * 
	 * To use: call the loadFile method.
	 */
	var BeatsFileLoad_1_0_0 = function() {
	};

	JSUtils.extends(BeatsFileLoad_1_0_0, BeatsFileLoadSelector.BeatsFileLoader);

	/**
	 * Loads an entire beats file, and returns the result. For
	 * beats file version 1.0.0, the result is just a TimedBeats object.
	 *
	 * @param {object} beatsFileObject The main object from a
	 *   beats file.
	 * @return {TimedBeats} An object which records the beats
	 *   described in the file.
	 */
	BeatsFileLoad_1_0_0.prototype.loadFile = function (beatsFileObject) {
	    return this.loadBeats(beatsFileObject.beats);
	};

	/**
	 * Loads the "beats" array of a beats file.
	 *
	 * @param {Array<int>} beatsArray The "beats" property of
	 *   the main object in the file.
	 * @return {TimedBeats} An object that tracks all of the beats
	 *   described in the array.
	 */
	BeatsFileLoad_1_0_0.prototype.loadBeats = function (beatsArray) {
	    if (typeof beatsArray === "undefined") {
	        throw new InvalidFileTypeError("Please upload a proper beats file.");
	    }
	    var returnVal = new TimedBeats();
	    var overallTime = 0;
	    for (var index = 0; index < beatsArray.length; index++) {
	        overallTime += beatsArray[index];
	        returnVal.addBeat(overallTime);
	    }
	    return returnVal;
	};

	module.exports = BeatsFileLoadSelector;

/***/ },
/* 20 */,
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
	var Version = __webpack_require__(5);
	 
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

	var JSUtils = __webpack_require__(4);
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

	var JSUtils = __webpack_require__(4);
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

	var JSUtils = __webpack_require__(4);
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

	var JSUtils = __webpack_require__(4);
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

	var JSUtils = __webpack_require__(4);
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

	var JSUtils = __webpack_require__(4);
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
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines the SMMusicPlayer class, a MusicPlayer
	 *   type that uses SoundManager2 to play audio.
	 */

	var JSUtils = __webpack_require__(4);
	var SMSound = __webpack_require__(38);
	var MusicPlayer = __webpack_require__(39);
	 
	/**
	 * A MusicPlayer that uses SoundManager2.
	 */
	var SMMusicPlayer = function() {
	    this._onReadyHandler = null;
	    this._isReady = false;
	    this._error = false;
	    var _this = this;
	    soundManager.setup({
	        url: './soundmanager/swf/',
	        onready: function() {
	            _this._isReady = true;
	            _this._informReadyEventHandler();
	        },
	        ontimeout: function() {
	            _this._error = true;
	        },
	        html5PollingInterval: 20,
	        flashPollingInterval: 20
	    });
	};

	JSUtils.extends(SMMusicPlayer, MusicPlayer);


	SMMusicPlayer.prototype.createSound = function(musicURL) {
	    return new SMSound(musicURL);
	};


	SMMusicPlayer.prototype.isReady = function() {
	    this._isReady = true;
	};

	SMMusicPlayer.prototype.onReady = function(eventHandler) {
	    this._onReadyHandler = eventHandler;
	    if (this.isReady()) {
	        this._informReadyEventHandler();
	    }
	};

	/**
	 * Returns whether or not an error was encountered while setting
	 * up the MusicPlayer.
	 *
	 * @return {boolean} True if an error was encountered; false otherwise.
	 */
	SMMusicPlayer.prototype.errorFlag = function() {
	    return this._error;
	};

	/**
	 * Tells the event handler that the MusicPlayer is now ready.
	 */
	SMMusicPlayer.prototype._informReadyEventHandler = function() {
	    if (this._onReadyHandler !== null) {
	        this._onReadyHandler();
	    }
	};

	module.exports = SMMusicPlayer;

/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines the TimedBeats class.
	 *   TimedBeats objects are loaded from beats files,
	 *   and are used to help the MusicAnimator find
	 *   beats in the music.
	 */
	 
	 var ArrayUtils = __webpack_require__(34);

	/**
	 * TimedBeats objects record a sequence of
	 * timed beats, and can be used to get
	 * information about them.
	 *
	 * @param {Array<int>=} An array containing
	 *   the times at which beats occur, in
	 *   milliseconds. TimedBeats objects are
	 *   generally used to locate the beats in
	 *   a music file, so the times are usually
	 *   relative to the start of an audio file.
	 *   The array MUST be sorted from least
	 *   to greatest.
	 */
	var TimedBeats = function(beats) {
	    if (beats !== undefined) {
	        this._beats = beats;
	    } else {
	        this._beats = [];
	    }
	};

	/**
	 * Adds a beat to the TimedBeats object at
	 * the specified time.
	 *
	 * @param {int} beatTime The time of the beat,
	 *   measured in milliseconds.
	 */
	TimedBeats.prototype.addBeat = function(beatTime) {
	    this.addBeats([beatTime]);
	};

	/**
	 * Adds a sequence of beats to the TimedBeats object.
	 *
	 * @param {Array<int>} beats An array of times at
	 *   which beats occur, in milliseconds. This array
	 *   MUST be sorted from least to greatest.
	 */
	TimedBeats.prototype.addBeats = function(beats) {
	    this._beats = ArrayUtils.mergeSortedArrays(this._beats, beats, this._timeComparator);
	};

	/**
	 * Returns the beat number which is active at a particular
	 * time. An individual beat spans a range of time equal
	 * to [beatTime, nextBeatTime) (note that the upper bound
	 * is exclusive). That is, if you ask for a time between
	 * two beats, this will always return the lower of the two
	 * beats. This will return undefined if you ask for the
	 * beat number before the zeroth beat in the show.
	 *
	 * @param {int} time The time to check, in milliseconds.
	 * @return {int} The beat number that is active at the
	 *   given time, or undefined if the time requested
	 *   is before the zeroth beat of the show.
	 */
	TimedBeats.prototype.getBeatNumAtTime = function(time) {
	    return ArrayUtils.binarySearchForClosestSmaller(this._beats, time, this._timeComparator);
	};

	/**
	 * Returns the time at which the specified beat starts.
	 *
	 * @param {int} beatNum The beat to find the start
	 *   time for.
	 * @return {int} The time at which the beat starts, in
	 *   milliseconds.
	 */
	TimedBeats.prototype.getBeatTime = function(beatNum) {
	    return this._beats[beatNum];
	};

	/**
	 * Returns the number of recorded beats in this object.
	 *
	 * @return {int} The number of beats.
	 */
	TimedBeats.prototype.getNumBeats = function() {
	    return this._beats.length;
	};

	/**
	 * A comparator used to order the beats in chronological order.
	 *
	 * @param {int} firstTime The time of some beat, in milliseconds.
	 * @param {int} secondTime The time of some other beat, in milliseconds.
	 * @return {int} A positive value if the first time should come after
	 *   the second in chronological order; a negative value if the first
	 *   should come before the second in chronological order; zero if the
	 *   times are the same.
	 */
	TimedBeats.prototype._timeComparator = function(firstTime, secondTime) {
	    return firstTime - secondTime;
	};

	module.exports = TimedBeats;

/***/ },
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
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines the SMSound class. This sound plays audio through
	 *   SoundManager2.
	 */
	 
	var Sound = __webpack_require__(41);
	var JSUtils = __webpack_require__(4);
	 
	/**
	 * SMSound objects play music through SoundManager2.
	 *
	 * @param {string} The URL of the music to load. This
	 *   will be released when SoundManager2 no longer
	 *   needs it.
	 */
	var SMSound = function(musicURL) {
	    /** 
	     * Used to prevent soundmanager from throwing timed events that
	     * occur before the start time (e.g. if the sound is started at
	     * time 4000 instead of 0, don't throw the timed events occuring before 4000).
	     * @type {int}
	     */
	    this._startTime = 0;
	    /**
	     * The actual Sound Manager sound object: this class is a wrapper around it
	     * @type {soundManager.Sound}
	     */
	    this._sound = null;
	    this._url = musicURL;
	    this.reset();
	    if (musicURL !== undefined) {
	        this.load(musicURL);
	    }
	};

	JSUtils.extends(SMSound, Sound);

	/**
	 * A list of all events emitted by this class.
	 * Any of these can be used as names for events in the registerEventHandler(...) method.
	 * @type {Array<string>}
	 */
	SMSound.prototype._eventTypes = ["play", "stop", "finished", "startLoading", "finishedLoading"];

	SMSound.prototype.load = function(musicURL) {
	    this.stop();
	    this.unload();
	    var _this = this;
	    this._sound = soundManager.createSound({
	        url: musicURL,
	        onplay: this._makeEventRouter("play"),
	        onstop: this._makeEventRouter("stop"),
	        onfinish: _this._handleFinished,
	        onload: function() {
	            _this._destroyURL();
	            _this._callEventHandler("finishedLoading");
	        }
	    });
	    this._installTimedEvents();
	    this._callEventHandler("startLoading");
	    this._sound.load();
	};

	SMSound.prototype.unload = function() {
	    /**
	     * This member variable is designed to make sure that timed events are 
	     * not thrown after the music finishes. It is true when the music stops 
	     * or finishes, but false when the music is playing. Its value is used
	     * to differentiate between timed events that are thrown while the music
	     * is playing from those thrown when the music is stopped.
	     * @type {boolean}
	     */
	    this._stopTimedEvents = true;
	    this._destroyURL();
	    if (this._sound !== null) {
	        this._sound.destruct();
	        this._sound = null;
	        
	    }
	};

	/**
	 * Destroys the URL associated with this sound, for the sake
	 * of saving space.
	 */
	SMSound.prototype._destroyURL = function() {
	    if (this._url !== null) {
	        URL.revokeObjectURL(this._url);
	        this._url = null;
	    }
	};

	/**
	 * Get ride of the soundmanager sound, release the mp3 url, reset all the event
	 * handlers;
	 */
	SMSound.prototype.reset = function() {
	    this.unload();
	    this._eventHandlers = {};
	    /**
	     * An array of objects in which each has a time, in milliseconds, and a
	     * function which will be executed at that time.
	     * @type {Array}
	     */
	    this._timedEvents = [];
	};

	/**
	 * Play the mp3 fron the given start time.
	 * @param  {int} startTime the time to play the sound at, in milliseconds
	 */
	SMSound.prototype.play = function(startTime) {
	    this._stopTimedEvents = false; //Timed events are allowed
	    if (this._sound !== null) {
	        this._startTime = startTime;
	        this._sound.play({position: startTime});
	    }
	};

	/**
	 * Stop playing the sound and disallow any further events from happening.
	 */
	SMSound.prototype.stop = function() {
	    this._stopTimedEvents = true; //Don't allow any timed events to be thrown after the music is stopped
	    if (this._sound !== null) {
	        this._sound.stop();
	    }
	};

	/**
	 * @return {Boolean} whether the soundmanager sound has actually been loaded
	 * or not.
	 */
	SMSound.prototype.isLoaded = function() {
	    return this._sound !== null;
	};

	/**
	 * @return {Boolean} true if the sound is playing right now.
	 */
	SMSound.prototype.isPlaying = function() {
	    return (this._sound !== null && this._sound.playState === 1);
	};

	/**
	 * @return {Boolean} true if the sound is ready to play
	 */
	SMSound.prototype.isReady = function() {
	    return (this._sound.readyState === 3);
	};

	/**
	 * @return {Boolean} true if there was an error parsing the sound file.
	 */
	SMSound.prototype.errorFlag = function() {
	    return (this._sound.readyState === 2);
	};

	/**
	 * Return a description of the error that happened with the sound. Right now,
	 * this simply says that the sound failed to load, but could be extended to
	 * use other readable error strings as well, if needed.
	 * @return {string|null} The error string if there was an error, null otherwise
	 */
	SMSound.prototype.getError = function() {
	    if (this.errorFlag()) {
	        return "Sound failed to load.";
	    } else {
	        return null;
	    }
	};

	/**
	 * Registers an event handler, so that whenever a particular event occurs,
	 * the event handler function is called.
	 *
	 * @param {string} eventName This is the name of the event to connect
	 *   the event handler to. When this event occurs, the eventHandler will
	 *   be called. Possible eventName inputs are:
	 *     - "play" : occurs when the Sound begins to play
	 *     - "stop" : occurs when the Sound stops playing, but NOT when the
	 *         sound stops playing because it has finished
	 *     - "finished" : occurs when the Sound finishes playing
	 *     - "startLoading" : occurs when the Sound starts loading
	 *     - "finishedLoading" : occurs when the Sound finishes loading
	 * @param {function():*} eventHandler The function that will be called
	 *   when the specified event occurs.
	 */
	Sound.prototype.registerEventHandler = function(eventName, eventHandler) {
	    var handlerIndex = this._eventTypes.indexOf(eventName);
	    if (handlerIndex != -1) {
	        this._eventHandlers[eventName] = eventHandler;
	    }
	};

	/**
	 * Push a timed event (an object with keys time and eventHandler, where the
	 * handler is executed at the specified time) onto the internal queue of timed
	 * events. If we have a sound, actually tell the sound to do the eventHandler
	 * at the specified time.
	 * @param {int} time time to execute the handler, in milliseconds
	 * @param {function():undefined} eventHandler the handler to execute
	 */
	SMSound.prototype.addTimedEvent = function(time, eventHandler) {
	    var newEvent = {time: time, eventHandler: eventHandler};
	    this._timedEvents.push(newEvent);
	    if (this._sound !== null) {
	        this._installOneTimedEvent(newEvent);
	    }
	};

	/**
	 * Tell the soundmanager sound not to execute any more timed events, and reset
	 * the queue of timed events that this Sound knows about.
	 */
	SMSound.prototype.clearTimedEvents = function() {
	    for (var index = 0; index < this._timedEvents.length; index++) {
	        this._sound.clearOnPosition(this._timedEvents[index].time);
	    }
	    this._timedEvents = [];
	};

	/**
	 * Installs all timed events to the current soundmanager (i.e. tells the
	 * soundmanager sound that it should execute all the timed events at their
	 * respective times).
	 */
	SMSound.prototype._installTimedEvents = function() {
	    for (var index = 0; index < this._timedEvents.length; index++) {
	        this._installOneTimedEvent(this._timedEvents[index]);
	    }
	};

	/**
	 * Installs one timed event to the current soundmanager sound
	 * object.
	 */
	SMSound.prototype._installOneTimedEvent = function(timedEvent) {
	    var _this = this;
	    var eventTime = timedEvent.time;
	    var newEventHandler = function() {
	        // If we don't add this if clause, soundmanager will throw timed 
	        // events when we don't want it to (specifically, it will continue
	        // to throw some events after we stop playing, and it will throw
	        // events between the start of the audio and the position where
	        // we started playing the audio
	        if (!_this._stopTimedEvents && eventTime > _this._startTime) {
	            timedEvent.eventHandler();
	        }
	    };
	    this._sound.onPosition(timedEvent.time, newEventHandler);
	};

	/**
	 * Calls the event handler with the specified name, if it is set.
	 *
	 * @param {string} eventName The name of the event associated
	 *   with the handler to call.
	 */
	SMSound.prototype._callEventHandler = function(eventName) {
	    if (this._eventHandlers[eventName]) {
	        this._eventHandlers[eventName]();
	    }
	};

	/**
	 * Creates a function that will respond to soundmanager object
	 * events. It routes the event to an event handler, but only
	 * if the event handler is set. Furthermore, the generated
	 * function will always point to the event handler that
	 * is currently associated with this SMSound object.
	 *
	 * @param {string} eventName The name of the event to route.
	 * @return {function():undefined} A function that will inform
	 *   an event handler about an event, if the event handler has
	 *   been set.
	 */
	SMSound.prototype._makeEventRouter = function(eventName) {
	    var _this = this;
	    return function() {
	        _this._callEventHandler(eventName);
	    };
	};

	/**
	 * An event handler for when the music finished.
	 */
	SMSound.prototype._handleFinished = function() {
	    this._stopTimedEvents = true; // Make sure that no timed events are thrown after the music ends
	    this._callEventHandler("finished");
	};

	module.exports = SMSound;

/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines the MusicPlayer class. We are using third-party code to
	 *   play music, so this class is designed to help us easily replace the third-party
	 *   code with something else if we ever need to. If you want to install some third-party
	 *   to play music, you must do a few things to allow it to interface with the rest of our
	 *   program:
	 *     1. Make a child class of MusicPlayer that uses the third-party code.
	 *     2. Make a child class of the Sound class that uses the third-party code.
	 *     3. Make sure that the ApplicationController creates an instance of your
	 *          MusicPlayer child class upon initialization.
	 */

	/**
	 * MusicPlayer objects allow us to play audio. You can use
	 * MusicPlayer objects to create Sound objects, and you can
	 * instruct Sound objects to play, stop, etc.
	 */
	var MusicPlayer = function() {
	};

	/**
	 * Makes a Sound object that can be used to play audio.
	 *
	 * @param {string=} musicURL A music file to load into
	 *   the new Sound object.
	 * @return {Sound} A sound object that can be used to
	 *   play audio.
	 */
	MusicPlayer.prototype.createSound = function(musicURL) {
	    console.log("MusicPlayer.createSound(...) called");
	};

	/**
	 * Returns whether or not the MusicPlayer is ready.
	 *
	 * @return {boolean} True if the MusicPlayer is ready
	 *   to be used; false otherwise.
	 */
	MusicPlayer.prototype.isReady = function() {
	    console.log("MusicPlayer.isReady(...) called");
	};

	/**
	 * Will inform the eventHandler function when the MusicPlayer
	 * is ready. If the eventHandler is installed after the
	 * MusicPlayer is already ready, it should be called
	 * immediately.
	 *
	 * @param {function():*} A function that will be called
	 *   when the MusicPlayer is ready.
	 */
	MusicPlayer.prototype.onReady = function(eventHandler) {
	    console.log("MusicPlayer.onReady(...) called");
	};

	module.exports = MusicPlayer;

/***/ },
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

/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileOverview Defines the Sound class. We are using third-party code to
	 *   play music, so this class is designed to help us easily replace the third-party
	 *   code with something else if we ever need to. For more information, @see MusicPlayer.js.
	 */

	/**
	 * Sound objects can play audio. They are
	 * created through the MusicPlayer.
	 */ 
	var Sound = function() {
	};

	/**
	 * Loads an audio file to play.
	 *
	 * @param {string} musicURL The URL of the audio
	 *   to load.
	 */
	Sound.prototype.load = function(musicURL) {
	    console.log("Sound.load(...) called");
	};

	/**
	 * Unloads the audio file, so that the sound is
	 * not ready to play. This will clear the errors
	 * from the last load.
	 */
	Sound.prototype.unload = function() {
	    console.log("Sound.unload(...) called");
	};

	/**
	 * Resets the sound, so that it no longer
	 * has audio loaded. This will also clear
	 * the event handlers and timed events.
	 */
	Sound.prototype.reset = function() {
	    console.log("Sound.reset(...) called");
	};

	/**
	 * Plays the sound, starting at the
	 * given time.
	 *
	 * @param {int} The time in the audio to
	 *   start playing at. The time is measured
	 *   in milliseconds, relative to the start
	 *   of the audio.
	 */
	Sound.prototype.play = function(startTime) {
	    console.log("Sound.play(...) called");
	};

	/**
	 * Stops the sound.
	 */
	Sound.prototype.stop = function() {
	    console.log("Sound.stop(...) called");
	};

	/**
	 * Returns whether or not the sound is playing.
	 *
	 * @return {boolean} True if the sound is playing;
	 *   false otherwise.
	 */
	Sound.prototype.isPlaying = function() {
	    console.log("Sound.isPlaying(...) called");
	};

	/**
	 * Returns whether or not a sound is loaded.
	 *
	 * @return {boolean} True if a sound is loaded; false
	 *   otherwise.
	 */
	Sound.prototype.isLoaded = function() {
	    console.log("Sound.isLoaded(...) called");
	};

	/**
	 * Returns whether or not the sound is ready to play.
	 *
	 * @return {boolean} True if the sound is ready to play;
	 *   false otherwise.
	 */
	Sound.prototype.isReady = function() {
	    console.log("Sound.isReady(...) called");
	};

	/**
	 * Returns whether or not an error occurred.
	 *
	 * @return {boolean} True if an error occurred; false
	 *   otherwise.
	 */
	Sound.prototype.errorFlag = function() {
	    console.log("Sound.errorFlag(...) called");
	};

	/**
	 * Returns an error message if an error was experienced
	 * while setting up the sound.
	 *
	 * @return {string} An error message, if an error occurred.
	 *   If no error occurred, then returns null.
	 */
	Sound.prototype.getError = function() {
	    console.log("Sound.getError(...) called");
	};

	/**
	 * Registers an event handler, so that whenever a particular event occurs,
	 * the event handler function is called.
	 *
	 * @param {string} eventName This is the name of the event to connect
	 *   the event handler to. When this event occurs, the eventHandler will
	 *   be called. 
	 * @param {function():*} eventHandler The function that will be called
	 *   when the specified event occurs.
	 */
	Sound.prototype.registerEventHandler = function(eventName, eventHandler) {
	    console.log("Sound.registerEventHandler(...) called");
	};

	/**
	 * Makes sure that the eventHandler is informed when
	 * a particular time is reached while playing.
	 *
	 * @param {int} time The time at which the event will
	 *   be fired, in milliseconds releative to the start of
	 *   the audio.
	 * @param {function():*} eventHandler This function 
	 *   will be called when the time is reached.
	 */
	Sound.prototype.addTimedEvent = function(time, eventHandler) {
	    console.log("Sound.addTimedEvent(...) called");
	};

	/**
	 * Clears all timed events.
	 */
	Sound.prototype.clearTimedEvents = function() {
	    console.log("Sound.clearTimedEvents(...) called");
	};

	module.exports = Sound;


/***/ }
/******/ ])