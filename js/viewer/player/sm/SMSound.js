/**
 * @fileOverview Defines the SMSound class. This sound plays audio through
 *   SoundManager2.
 */
 
var Sound = require("../Sound");
var JSUtils = require("../../utils/JSUtils");
 
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
        },
        onerror: function(code, description) {
            console.log(this.id + ' failed?', code, description);
            // Did the sound fail to load entirely, or failed during playback / loading partially?
            if (this.loaded) {
                // HTML5 case: network error, or client aborted download etc.?
                this.stop(); // Reset sound state, to be safe
                // Show play / retry button to user in UI?
            } else {
                // Load failed entirely. 404, bad sound format, etc.
            }
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