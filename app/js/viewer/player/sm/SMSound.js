/**
 * @fileOverview Defines the SMSound class. This sound plays audio through
 *   SoundManager2.
 */
 
var Sound = require("../Sound");
var ClassUtils = require("../../ClassUtils");
 
/**
 * SMSound objects play music through SoundManager2.
 *
 * @param {string} The URL of the music to load. This
 *   will be released when SoundManager2 no longer
 *   needs it.
 */
var SMSound = function(musicURL) {
    this._sound = null;
	this._url = musicURL;
    this.reset();
    if (musicURL != undefined) {
        this.load(musicURL);
    }
};

ClassUtils.extends(SMSound, Sound);

SMSound.prototype.load = function(musicURL) {
    this.stop();
    this.unload();
    var _this = this;
    this._sound = soundManager.createSound({
        url: musicURL,
        onplay: this._makeEventRouter("onPlayHandler"),
        onstop: this._makeEventRouter("onStopHandler"),
        onfinish: this._makeEventRouter("onFinishedHandler"),
		onload: function() {URL.revokeObjectURL(this._url);}
    });
    this._installTimedEvents();
};

SMSound.prototype.unload = function() {
    if (this._sound != null) {
        this._sound.destruct();
        this._sound = null;
    }
};

SMSound.prototype.reset = function() {
    this.unload();
    this._eventHandlers = {
        onPlayHandler: null,
        onStopHandler: null,
        onFinishedHandler: null,
    };
    this._timedEvents = [];
};

SMSound.prototype.play = function(startTime) {
    if (this._sound != null) {
        this._sound.setPosition(startTime);
        this._sound.play();
    }
};

SMSound.prototype.stop = function() {
    if (this._sound != null) {
        this._sound.stop();
    }
};

SMSound.prototype.isLoaded = function() {
    return this._sound != null;
};

SMSound.prototype.isPlaying = function() {
    return (this._sound != null && this._sound.playState === 1);
};

SMSound.prototype.onPlay = function(eventHandler) {
    this._eventHandlers["onPlayHandler"] = eventHandler;
};

SMSound.prototype.onStop = function(eventHandler) {
    this._eventHandlers["onStopHandler"] = eventHandler;
};

SMSound.prototype.onFinished = function(eventHandler) {
    this._eventHandlers["onFinishedHandler"] = eventHandler;
};

SMSound.prototype.addTimedEvent = function(time, eventHandler) {
    this._timedEvents.push({time: time, eventHandler: eventHandler});
    if (this._sound != null) {
        this._sound.onPosition(time, eventHandler);
    }
};

SMSound.prototype.clearTimedEvents = function() {
    for (var index = 0; index < this._timedEvents.length; index++) {
        this._sound.clearOnPosition(this._timedEvents[index].time);
    }
    this._timedEvents = [];
};

/**
 * Installs all timed events to the current soundmanager
 * sound object.
 */
SMSound.prototype._installTimedEvents = function() {
    for (var index = 0; index < this._timedEvents.length; index++) {
        this._sound.onPosition(this._timedEvents[index].time, this._timedEvents[index].eventHandler);
    }
};

/**
 * Calls the event handler with the specified name, if it is set.
 *
 * @param {string} eventHandlerName The name of the event
 *   handler to call.
 */
SMSound.prototype._callEventHandler = function(eventHandlerName) {
    if (this._eventHandlers[eventHandlerName] != null) {
        this._eventHandlers[eventHandlerName]();
    }
};

/**
 * Creates a function that will respond to soundmanager object
 * events. It routes the event to an event handler, but only
 * if the event handler is set. Furthermore, the generated
 * function will always point to the event handler that
 * is currently associated with this SMSound object.
 *
 * @param {string} eventHandlerName The name of the event handler
 *   to route the event to.
 * @return {function():undefined} A function that will inform
 *   an event handler about an event, if the event handler has
 *   been set.
 */
SMSound.prototype._makeEventRouter = function(eventHandlerName) {
    var _this = this;
    return function() {
        _this._callEventHandler(eventHandlerName);
    };
};

module.exports = SMSound;