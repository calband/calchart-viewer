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