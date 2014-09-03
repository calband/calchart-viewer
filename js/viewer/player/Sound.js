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
 * Returns whether or not the sound is ready to play.
 *
 * @return {boolean} True if the sound is ready to play;
 *   false otherwise.
 */
Sound.prototype.isReady = function() {
    console.log("Sound.isReady(...) called");
};

/**
 * Returns whether or not an error occurred.
 *
 * @return {boolean} True if an error occurred; false
 *   otherwise.
 */
Sound.prototype.errorFlag = function() {
    console.log("Sound.errorFlag(...) called");
};

/**
 * Returns an error message if an error was experienced
 * while setting up the sound.
 *
 * @return {string} An error message, if an error occurred.
 *   If no error occurred, then returns null.
 */
Sound.prototype.getError = function() {
    console.log("Sound.getError(...) called");
};

/**
 * Registers an event handler, so that whenever a particular event occurs,
 * the event handler function is called.
 *
 * @param {string} eventName This is the name of the event to connect
 *   the event handler to. When this event occurs, the eventHandler will
 *   be called. 
 * @param {function():*} eventHandler The function that will be called
 *   when the specified event occurs.
 */
Sound.prototype.registerEventHandler = function(eventName, eventHandler) {
    console.log("Sound.registerEventHandler(...) called");
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
