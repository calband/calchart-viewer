/**
 * @fileOverview The ApplicationController singleton class is defined here.
 */

var Grapher = require("./Grapher");
var ShowUtils = require("./utils/ShowUtils");
var TimedBeatsUtils = require("./utils/TimedBeatsUtils");
var MusicAnimator = require("./player/MusicAnimator");
var MusicPlayerFactory = require("./player/MusicPlayerFactory");
var AnimationStateDelegate = require("./AnimationStateDelegate");

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
 * Sends a GET call to the Calchart server and retrieves all charts from the 
 * given year and adds it to the HTML UI
 * @param {int} the year of the desired shows
 */
ApplicationController.prototype.getShows = function(year) {
    var url = "https://calchart-server.herokuapp.com/list/" + year;
    $.getJSON(url, function(data) {
        $(".js-select-show").append("<option>");
        data.shows.forEach(function(show) {
            $("<option>")
                .attr("value", show["index_name"])
                .text(show["title"])
                .appendTo(".js-select-show");
        });
        this[year + "_shows"] = data.shows;
    });
};

/**
 * Autoloads given show and dot from the Calchart server from the URL parameters
 */
ApplicationController.prototype.autoloadShow = function(show, dot) {
    var optionElem = $(".js-select-show option[value=" + show + "]");
    if (optionElem.length === 0) {
        return;
    }
    optionElem.prop("selected", true);
    $(".js-select-show").trigger("chosen:updated");

    var url = "https://calchart-server.herokuapp.com/";
    var _this = this;
    $.getJSON(url + "chart/" + show, function(data) {
        var response = JSON.stringify(data);
        var viewer = ShowUtils.fromJSON(response);
        _this.setShow(viewer);
        _this._setFileInputText(".js-viewer-file-btn", show);
        if (dot !== undefined && dot !== "") {
            _this.applyAnimationAction("selectDot", dot);
            $("option[value=" + dot + "]").prop("selected", true);
            $(".js-dot-labels").trigger("chosen:updated");
        }
    });

    $.getJSON(url + "beats/" + show, function(data) {
        var response = JSON.stringify(data);
        var beats = TimedBeatsUtils.fromJSON(response);
        _this._animator.setBeats(beats);
        _this._setFileInputText(".js-beats-file-btn", show);
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
    $.ajaxSetup({ async: false });
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
            var beats = TimedBeatsUtils.fromJSON(fileContentsAsText);
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
            var show = ShowUtils.fromJSON(fileContentsAsText);
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
