/**
 * @fileOverview Defines the SMMusicPlayer class, a MusicPlayer
 *   type that uses SoundManager2 to play audio.
 */

var ClassUtils = require("../../ClassUtils");
var SMSound = require("./SMSound");
var MusicPlayer = require("../MusicPlayer");
 
/**
 * A MusicPlayer that uses SoundManager2.
 */
var SMMusicPlayer = function() {
    this._onReadyHandler = null;
    this._isReady = false;
    this._error = false;
    var _this = this;
    soundManager.setup({
        url: '/soundmanager/swf/',
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

ClassUtils.extends(SMMusicPlayer, MusicPlayer);


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