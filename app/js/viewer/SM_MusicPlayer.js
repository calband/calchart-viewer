/**
 * @fileOverview Defines the SM_MusicPlayer class, a MusicPlayer
 *   type that uses SoundManager2 to play audio.
 */

var ClassUtils = require("./ClassUtils");
var SM_Sound = require("./SM_Sound");
var MusicPlayer = require("./MusicPlayer");
 
/**
 * A MusicPlayer that uses SoundManager2.
 */
var SM_MusicPlayer = function() {
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
        }
    });
};

ClassUtils.extends(SM_MusicPlayer, MusicPlayer);


SM_MusicPlayer.prototype.createSound = function(musicURL) {
    return new SM_Sound(musicURL);
};


SM_MusicPlayer.prototype.isReady = function() {
    this._isReady;
};

SM_MusicPlayer.prototype.onReady = function(eventHandler) {
    this._onReadyHandler = eventHandler;
    if (this.isReady()) {
        this._informReadyEventHandler;
    }
};

/**
 * Returns whether or not an error was encountered while setting
 * up the MusicPlayer.
 *
 * @return {boolean} True if an error was encountered; false otherwise.
 */
SM_MusicPlayer.prototype.experiencedError = function() {
    return this._error;
};

/**
 * Tells the event handler that the MusicPlayer is now ready.
 */
SM_MusicPlayer.prototype._informReadyEventHandler = function() {
    if (this._onReadyHandler != null) {
        this._onReadyHandler();
    }
};

module.exports = SM_MusicPlayer;