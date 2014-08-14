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
    this._eventHandlers = [];
    for (var index = 0; index < this._eventTypes.length; index++) {
        this._eventHandlers.push(null);
    }
    this._blockStopEvent = false;
};

MusicAnimator.prototype._eventTypes = ["start", "stop", "finished", "beat"];

MusicAnimator.prototype.setAnimationStateDelegate = function(animationStateDelegate) {
    this.stop(); //Stop before making changes - we don't want the sound to fire events while we work
    this._animStateDelegate = animationStateDelegate; //Set up the new delegate
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
    var overallBeat = 0;
    var show = this._animStateDelegate.getShow();
    for (var sheet = 0; sheet < this._animStateDelegate.getCurrentSheetNum(); sheet++) {
        overallBeat += show.getSheet(sheet).getDuration();
    }
    overallBeat += this._animStateDelegate.getCurrentBeatNum();
    if (this._animStateDelegate.hasNextBeat() && overallBeat < this._beats.getNumBeats() - 1) {
        this._sound.play(this._beats.getBeatTime(overallBeat));
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
 * Returns whether or not the animator is ready to play.
 *
 * @return {boolean} True if the animator is ready to play; false
 *   otherwise.
 */
MusicAnimator.prototype.isReady = function() {
    return (this._sound != null && this._sound.isReady() && this._beats != null && this._animStateDelegate != null);
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
    var handlerIndex = this._eventTypes.indexOf(eventName);
    if (handlerIndex != -1) {
        this._eventHandlers[handlerIndex] = eventHandler;
    }
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
    var index = this._eventTypes.indexOf(eventName);
    if (index != -1 && this._eventHandlers[index] != null) {
        this._eventHandlers[index]();
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