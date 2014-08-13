/**
 * @fileOverview Defines the TimedBeats class.
 *   TimedBeats objects are loaded from beats files,
 *   and are used to help the MusicAnimator find
 *   beats in the music.
 */
 
 var ArrayBuildUtils = require("./ArrayBuildUtils");

/**
 * TimedBeats objects record a sequence of
 * timed beats, and can be used to get
 * information about them.
 *
 * @param {Array<int>=} An array containing
 *   the times at which beats occur, in
 *   milliseconds. TimedBeats objects are
 *   generally used to locate the beats in
 *   a music file, so the times are usually
 *   relative to the start of an audio file.
 *   The array MUST be sorted from least
 *   to greatest.
 */
var TimedBeats = function(beats) {
    if (beats != undefined) {
        this._beats = beats;
    } else {
        this._beats = [];
    }
};

/**
 * Adds a beat to the TimedBeats object at
 * the specified time.
 *
 * @param {int} beatTime The time of the beat,
 *   measured in milliseconds.
 */
TimedBeats.prototype.addBeat = function(beatTime) {
    this.addBeats([beatTime]);
};

/**
 * Adds a sequence of beats to the TimedBeats object.
 *
 * @param {Array<int>} beats An array of times at
 *   which beats occur, in milliseconds. This array
 *   MUST be sorted from least to greatest.
 */
TimedBeats.prototype.addBeats = function(beats) {
    this._beats = ArrayBuildUtils.mergeSortedArrays(this._beats, beats, this._timeComparator);
};

/**
 * Returns the beat number which is active at a particular
 * time. An individual beat spans a range of time equal
 * to [beatTime, nextBeatTime) (note that the upper bound
 * is exclusive). That is, if you ask for a time between
 * two beats, this will always return the lower of the two
 * beats. This will return undefined if you ask for the
 * beat number before the zeroth beat in the show.
 *
 * @param {int} time The time to check, in milliseconds.
 * @return {int} The beat number that is active at the
 *   given time, or undefined if the time requested
 *   is before the zeroth beat of the show.
 */
TimedBeats.prototype.getBeatNumAtTime = function(time) {
    return ArraySearchUtils.binarySearchForClosestSmaller(this._beats, time, this._timeComparator);
};

/**
 * Returns the time at which the specified beat starts.
 *
 * @param {int} beatNum The beat to find the start
 *   time for.
 * @return {int} The time at which the beat starts, in
 *   milliseconds.
 */ 
TimedBeats.prototype.getBeatTime = function(beatNum) {
    return this._beats[beatNum];
};

/**
 * Returns the number of recorded beats in this object.
 *
 * @return {int} The number of beats.
 */
TimedBeats.prototype.getNumBeats = function() {
    return this._beats.length;
};

/**
 * A comparator used to order the beats in chronological order.
 *
 * @param {int} firstTime The time of some beat, in milliseconds.
 * @param {int} secondTime The time of some other beat, in milliseconds.
 * @return {int} A positive value if the first time should come after
 *   the second in chronological order; a negative value if the first
 *   should come before the second in chronological order; zero if the
 *   times are the same.
 */
TimedBeats.prototype._timeComparator = function(firstTime, secondTime) {
    return firstTime - secondTime;
};

module.exports = TimedBeats;