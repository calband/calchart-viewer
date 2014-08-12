/**
 * @fileOverview Defines the SM_Sound class. This sound plays audio through
 *   SoundManager2.
 */
 
var Sound = require("./Sound");
var ClassUtils = require("./ClassUtils");
 
/**
 * SM_Sound objects play music through SoundManager2.
 */
var SM_Sound = function(musicURL) {
    this._sound = null;
    this.reset();
    if (musicURL != undefined) {
        this.load(musicURL);
    }
};

ClassUtils.extends(SM_Sound, Sound);

SM_Sound.prototype.load = function(musicURL) {
    this.stop();
    this.unload();
    var _this = this;
    this._sound = soundManager.createSound({
        url: musicURL,
        onplay: this._makeEventRouter("onPlayHandler"),
        onstop: this._makeEventRouter("onStopHandler"),
        onfinish: this._makeEventRouter("onFinishedHandler"),
    });
    this._installTimedEvents();
};

SM_Sound.prototype.unload = function() {
    if (this._sound != null) {
        this._sound.destruct();
        this._sound = null;
    }
};

SM_Sound.prototype.reset = function() {
    this.unload();
    this._eventHandlers = {
        onPlayHandler: null,
        onStopHandler: null,
        onFinishedHandler: null,
    };
    this._timedEvents = [];
};

SM_Sound.prototype.play = function(startTime) {
    if (this._sound != null) {
        this._sound.setPosition(startTime);
        this._sound.play();
    }
};

SM_Sound.prototype.stop = function() {
    if (this._sound != null) {
        this._sound.stop();
    }
};

Sound.prototype.isLoaded = function() {
    return this._sound != null;
};

SM_Sound.prototype.isPlaying = function() {
    return (this._sound != null && this._sound.playState === 1);
};

SM_Sound.prototype.onPlay = function(eventHandler) {
    this._eventHandlers["onPlayHandler"] = eventHandler;
};

SM_Sound.prototype.onStop = function(eventHandler) {
    this._eventHandlers["onStopHandler"] = eventHandler;
};

SM_Sound.prototype.onFinished = function(eventHandler) {
    this._eventHandlers["onFinishedHandler"] = eventHandler;
};

SM_Sound.prototype.addTimedEvent = function(time, eventHandler) {
    this._timedEvents.push({time: time, eventHandler: eventHandler});
    if (this._sound != null) {
        this._sound.onPosition(time, eventHandler);
    }
};

SM_Sound.prototype.clearTimedEvents = function() {
    for (var index = 0; index < this._timedEvents.length; index++) {
        this._sound.clearOnPosition(this._timedEvents[index].time);
    }
    this._timedEvents = [];
};

/**
 * Installs all timed events to the current soundmanager
 * sound object.
 */
SM_Sound.prototype._installTimedEvents = function() {
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
SM_Sound.prototype._callEventHandler = function(eventHandlerName) {
    if (this._eventHandlers[eventHandlerName] != null) {
        this._eventHandlers[eventHandlerName]();
    }
};

/**
 * Creates a function that will respond to soundmanager object
 * events. It routes the event to an event handler, but only
 * if the event handler is set. Furthermore, the generated
 * function will always point to the event handler that
 * is currently associated with this SM_Sound object.
 *
 * @param {string} eventHandlerName The name of the event handler
 *   to route the event to.
 * @return {function():undefined} A function that will inform
 *   an event handler about an event, if the event handler has
 *   been set.
 */
SM_Sound.prototype._makeEventRouter = function(eventHandlerName) {
    var _this = this;
    return function() {
        _this._callEventHandler(eventHandlerName);
    };
};

module.exports = SM_Sound;