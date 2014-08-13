/**
 * @fileOverview Defines the MusicAnimator class. This is used to animate
 *   with music. For a basic description on how to use it, check the class
 *   description.
 *   To help keep the UI updated, the MusicAnimator can be set up to inform
 *   you when it changes state (e.g. when it starts, stops, finishes, etc.).
 *   You can submit event handlers to the MusicAnimator through the following
 *   methods:
 *       1. onStart (will inform you when the animator starts animating the show)
 *       2. onStop (will inform you when the animator stops animating the show, but
 *            NOT when it finishes its animation)
 *       3. onFinished (will inform you when the animator finishes animating the show)
 *       4. onBeat (will inform you when the animator has changed beats)
 */

/**
 * A MusicAnimator will animate the show in sync with
 * music. To get the MusicAnimator to work, you must provide
 * it with a music file (through the setMusic(...) method)
 * and a TimedBeats object (through the setBeats(...) method).
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
var MusicAnimator = function(animationStateDelegate, musicPlayer) {
    this._animStateDelegate = animationStateDelegate;
    this._musicPlayer = musicPlayer;
    this._sound = null;
    this._timedBeats = null;
    this._eventHandlers = {
        onStartHandler: null,
        onStopHandler: null,
        onFinishedHandler: null,
		onBeatHandler: null
    };
	this._blockStopEvent = false;
};

/**
 * Sets the music file to animate the show with.
 *
 * @param {string} The URL of the music file to load.
 */
MusicAnimator.prototype.setMusic = function(musicURL) {
    this.stop(); //Stop before loading, so that the sound doesn't fire events while we work
    this._loadSound(musicURL); //Load the new music
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
    this._loadBeats(timedBeats); //Load the new beats
};

/**
 * Makes sure that the sound associated with the animator exists,
 * and that it is prepared to play the specified music file.
 *
 * @param {string} musicURL The URL of the music file to play.
 */
MusicAnimator.prototype._loadSound = function(musicURL) {
    var _this = this;
	if (this._sound === null) {
        this._sound = this._musicPlayer.createSound();
        this._sound.onPlay(this._makeEventRouter("onStartHandler"));
        this._sound.onStop(function() {_this._musicStopped();});
        this._sound.onFinished(this._makeEventRouter("onFinishedHandler"));
        this._loadBeatsOntoSound();
    }
    this._sound.load(musicURL);
};

/**
 * Installs the beats to the MusicAnimator object.
 *
 * @param {TimedBeats} timedBeats The beats to install.
 */
MusicAnimator.prototype._loadBeats = function(timedBeats) {
    this._beats = timedBeats;
    this._loadBeatsOntoSound();
};

/**
 * Makes sure that the sound is prepared to inform us every
 * time one of the beats is reached in the music.
 */
MusicAnimator.prototype._loadBeatsOntoSound = function() {
    if (this._beats != null && this._sound != null) {
        this._sound.clearTimedEvents();
		var _this = this;
		var timedEventHandler = function() {
			_this._nextBeat();
		};
        for (var beatNum = 0; beatNum < this._beats.getNumBeats(); beatNum++) {
            this._sound.addTimedEvent(this._beats.getBeatTime(beatNum), timedEventHandler);
        }
    }
};

/**
 * Start playing the animation with music.
 */
MusicAnimator.prototype.start = function() {
    this.stop();
    if (this._animStateDelegate.hasNextBeat()) {
        this._sound.play();
    } else {
        this._endOfShow();
    }
};

/**
 * Stop playing the animation with music.
 */
MusicAnimator.prototype.stop = function() {
    if (this._sound != null && this._sound.isPlaying()) {
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
    if (this._sound != null) {
        return this._sound.isPlaying();
    } else {
        return false;
    }
};

/**
 * Returns whether or not the animator is currently loading.
 *
 * @return {boolean} True if the animator is ready to play; false
 *   otherwise.
 */
MusicAnimator.prototype.isReady = function() {
    return (this._sound != null && this._beats != null);
};

/**
 * Hooks an event handler to the "start" event. Every time
 * the animator starts animating the show, it will call the
 * eventHandler function.
 *
 * @param {function():*} A function that will be called when
 *   the animator starts playing.
 */
MusicAnimator.prototype.onStart = function(eventHandler) {
    this._eventHandlers["onStartHandler"] = eventHandler;
};

/**
 * Hooks an event handler to the "stop" event. Every time
 * the animator stops animating the show, it will call the
 * eventHandler function. The "stop" event and the "finished"
 * event are two SEPARATE events - this will not inform
 * the event handler when the MusicAnimator has finished animating
 * the show on its own.
 *
 * @param {function():*} A function that will be called when
 *   the animator stops playing.
 */
MusicAnimator.prototype.onStop = function(eventHandler) {
    this._eventHandlers["onStopHandler"] = eventHandler;
};

/**
 * Hooks an event handler to the "finished" event. Every time
 * the animator finishes animating the show, it will call the
 * eventHandler function.
 *
 * @param {function():*} A function that will be called
 *   when the animator finishes.
 */
MusicAnimator.prototype.onFinished = function(eventHandler) {
    this._eventHandlers["onFinishedHandler"] = eventHandler;
};

/**
 * Hooks an event handler to the "beat" event. Every time
 * the animator hits a new beat, it will call the eventHandler
 * function.
 *
 * @param {function():*} A function that will be called
 *   when the animator pushes forward a beat.
 */
MusicAnimator.prototype.onBeat = function(eventHandler) {
	this._eventHandlers["onBeatHandler"] = eventHandler;
};

/**
 * Makes a function that will call the event handler with the given
 * name. The returned function is flexible: it will call whatever
 * event handler is associated with the MusicAnimator (so if the
 * event handlers are changed in the MusicAnimator, they will be
 * be changed in the function), and it will skip a call to the
 * event handler if it is unset.
 *
 * @param {string} eventHandlerName The name of the event handler to call.
 * @return {function():*} A function that, when called, will
 *   call the specified event handler (but only if that event
 *   handler is set).
 */
MusicAnimator.prototype._makeEventRouter = function(eventHandlerName) {
    var _this = this;
    return function() {
        _this._callEventHandler(eventHandlerName);
    };
};

/**
 * Calls an event handler, if it is set.
 *
 * @param {string} eventHandlerName The event handler to call.
 */
MusicAnimator.prototype._callEventHandler = function(eventHandlerName) {
	if (this._eventHandlers[eventHandlerName] != null) {
		this._eventHandlers[eventHandlerName]();
	}
};

/**
 * Responds to a timed event in the sound, and moves to the next
 * beat.
 */
MusicAnimator.prototype._nextBeat = function() {
    this._animStateDelegate.nextBeat();
	this._callEventHandler("onBeatHandler");
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
	this._callEventHandler("onFinished");
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
		this._callEventHandler("onStop");
	}
};

module.exports = MusicAnimator;