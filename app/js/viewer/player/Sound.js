/**
 * @fileOverview Defines the Sound class. We are using third-party code to
 *   play music, so this class is designed to help us easily replace the third-party
 *   code with something else if we ever need to. For more information, @see MusicPlayer.js.
 */

/**
 * Sound objects can play audio. They are
 * created through the MusicPlayer.
 */ 
var Sound = function() {
};

/**
 * Loads an audio file to play.
 *
 * @param {string} musicURL The URL of the audio
 *   to load.
 */
Sound.prototype.load = function(musicURL) {
    console.log("Sound.load(...) called");
};

/**
 * Unloads the audio file, so that the sound is
 * not ready to play. This will clear the errors
 * from the last load.
 */
Sound.prototype.unload = function() {
    console.log("Sound.unload(...) called");
};

/**
 * Resets the sound, so that it no longer
 * has audio loaded. This will also clear
 * the event handlers and timed events.
 */
Sound.prototype.reset = function() {
    console.log("Sound.reset(...) called");
};

/**
 * Plays the sound, starting at the
 * given time.
 *
 * @param {int} The time in the audio to
 *   start playing at. The time is measured
 *   in milliseconds, relative to the start
 *   of the audio.
 */
Sound.prototype.play = function(startTime) {
    console.log("Sound.play(...) called");
};

/**
 * Stops the sound.
 */
Sound.prototype.stop = function() {
    console.log("Sound.stop(...) called");
};

/**
 * Returns whether or not the sound is playing.
 *
 * @return {boolean} True if the sound is playing;
 *   false otherwise.
 */
Sound.prototype.isPlaying = function() {
    console.log("Sound.isPlaying(...) called");
};

/**
 * Returns whether or not a sound is loaded.
 *
 * @return {boolean} True if a sound is loaded; false
 *   otherwise.
 */
Sound.prototype.isLoaded = function() {
    console.log("Sound.isLoaded(...) called");
};

/**
 * Makes sure that the eventHandler is informed
 * when the sound starts to play.
 *
 * @param {function():*} eventHandler This function will be
 *   called when the sound starts to play.
 */
Sound.prototype.onPlay = function(eventHandler) {
    console.log("Sound.onPlay(...) called");
};

/**
 * Makes sure that the eventHandler is informed
 * when the sound stops playing. This function
 * will NOT cause the eventHandler to be informed
 * when the Sound finishes.
 *
 * @param {function():*} eventHandler This function 
 *   will be called when the sound stops playing.
 */
Sound.prototype.onStop = function(eventHandler) {
    console.log("Sound.onStop(...) called");
};

/**
 * Makes sure that the eventHandler is informed
 * when the sound finishes playing.
 *
 * @param {function():*} eventHandler This function 
 *   will be called when the sound finishes playing.
 */
Sound.prototype.onFinished = function(eventHandler) {
    console.log("Sound.onFinished(...) called");
};

/**
 * Makes sure that the eventHandler is informed when
 * a particular time is reached while playing.
 *
 * @param {int} time The time at which the event will
 *   be fired, in milliseconds releative to the start of
 *   the audio.
 * @param {function():*} eventHandler This function 
 *   will be called when the time is reached.
 */
Sound.prototype.addTimedEvent = function(time, eventHandler) {
    console.log("Sound.addTimedEvent(...) called");
};

/**
 * Clears all timed events.
 */
Sound.prototype.clearTimedEvents = function() {
    console.log("Sound.clearTimedEvents(...) called");
};

module.exports = Sound;
