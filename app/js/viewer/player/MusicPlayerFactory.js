/**
 * @fileOverview Defines the MusicPlayerFactory class, which is used to
 *   generate a MusicPlayer that will play audio for us.
 */

var SMMusicPlayer = require("./sm/SMMusicPlayer");
 
/**
 * MusicPlayerFactory objects can create an appropriate MusicPlayer object
 * for on the current environment and settings.
 */
var MusicPlayerFactory = function() {
};

/**
 * Creates and returns an appropriate MusicPlayer for the current
 * environment and settings.
 *
 * @return {MusicPlayer} A MusicPlayer object to play audio for
 *   the application.
 */
MusicPlayerFactory.prototype.createMusicPlayer = function() {
	return new SMMusicPlayer();
};

module.exports = MusicPlayerFactory;