/**
 * @fileOverview The ApplicationController singleton class is defined here.
 */

var Grapher = require("./Grapher");
var ShowUtils = require("./ShowUtils");
var TimedBeatsUtils = require("./TimedBeatsUtils");
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
 * Update the html ui with various properties about the show. Assumes that
 * this._show has already been loaded.
 */
ApplicationController.prototype._updateUIWithShow = function () {
    $(".js-show-title").text(this._show.getTitle());
    var options = this._show.getDotLabels().map(function (value) {
        return "<option value='" + value + "'>" + value + "</option>";
    });
    var optionsHtml = options.join("");
    $(".js-dot-labels").html(optionsHtml);
};

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
    if (acceptOneArgument.indexOf(action) !== -1) {
        // call the specified function, passing in the second argument to
        // applyAnimationAction as the first argument to the specified function
        this._animationStateDelegate[action]([].slice.call(arguments)[1]);
    } else {
        this._animationStateDelegate[action]();
    }
    this._syncWithDelegate();
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
 * of beats in teh current stuntsheet depending on the state of the
 * animationStateDelegate.
 */
ApplicationController.prototype._updateUIWithAnimationState = function () {
    $(".js-stuntsheet-total").text(this._animationStateDelegate.getCurrentSheet().getDuration());
    $(".js-beat-number").text(this._animationStateDelegate.getCurrentBeatNum() + 1);
    $(".js-stuntsheet-number").text(this._animationStateDelegate.getCurrentSheetNum() + 1);
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
        _this._updateAnimateControl();
    });
    this._grapher = new Grapher("college", $(".js-grapher-draw-target"));
    this._grapher.draw(null, null, null);
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
            callback(reader.result);
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
        callback(URL.createObjectURL(files[0]));
    };
};

/**
 * Return an event handler function which reads the beats file and operates on
 * it.
 * @return {Function(jQuery.Event)} the event handler
 */
ApplicationController.prototype.getBeatsFileHandler = function () {
    var _this = this;
    return this._createFileHandler(function (fileContentsAsText) {
        var beats = TimedBeatsUtils.fromJSON(fileContentsAsText);
        _this._animator.setBeats(beats);
    });
};

/**
 * Return an event handler function which reads the viewer file and operates on
 * it.
 * @return {Function(jQuery.Event)} the event handler
 */
ApplicationController.prototype.getViewerFileHandler = function () {
    var _this = this;
    return this._createFileHandler(function (fileContentsAsText) {
        var show = ShowUtils.fromJSON(fileContentsAsText);
        _this.setShow(show);
    });
};

/**
 * Return an event handler function which loads and operates on a music file.
 *
 * @return {Function(jQuery.Event)} the event handler
 */
ApplicationController.prototype.getMusicFileHandler = function () {
    var _this = this;
    return this._createFileURLHandler(function (fileURL) {
        if (fileURL !== undefined) {
            var newSound = _this._musicPlayer.createSound();
            var onMusicLoaded = function() {
                if (newSound.errorFlag()) {
                    console.log(newSound.getError());
                } else {
                    _this._animator.setMusic(newSound);
                }
            };
            newSound.registerEventHandler("finishedLoading", onMusicLoaded);
            newSound.load(fileURL);
        }
    });
};


/**
 * Animates the show, starting at the current beat, with the MusicAnimator.
 */
ApplicationController.prototype.animate = function() {
     if (this._animator.isPlaying()) {
        this._animator.stop();
    } else if (this._animator.isReady()) {
        this._animator.start();
    } else {
        console.log("Animator is not ready!");
    }
    this._updateAnimateControl();
};


/**
 * Updates the animation button, making sure that it reads the correct text
 * and is crossed out if disabled.
 */
ApplicationController.prototype._updateAnimateControl = function() {
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