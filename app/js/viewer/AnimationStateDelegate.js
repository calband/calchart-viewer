/**
 * @fileOverview Defines the AnimationStateDelegate class. The Grapher
 *   gets the sheet and beat that it draws from one of these objects.
 *
 *   A NOTE ABOUT THE ZEROTH BEATS:
 *   If a stuntsheet is N beats long, then you can access any
 *   beat of that stuntsheet in the range [0, N) (notice that
 *   the upper bound is exclusive). The zeroth beat is NOT the
 *   first beat of movement - it is BEFORE the first beat of
 *   movement. Beat ONE is the first beat of movement. Beat
 *   zero could be considered the last step of the previous
 *   movement.
 */
 
/**
 * AnimationStateDelegate objects are used to explore a show. You
 * can browse the show beat-by-beat, or sheet-by-sheet.
 *
 * @param {Show} The show to explore.
 */
var AnimationStateDelegate = function(show) {
    this.setShow(show);
};

/**
 * Sets the show that this AnimationStateDelegate will browse.
 * When the show is set, the AnimationStateDelegate automatically
 * resets, so that it is looking at the zeroth beat of the show.
 *
 * @param {Show} The new show to browse.
 */
AnimationStateDelegate.prototype.setShow = function(show) {
    this._show = show;
    this._currSheet = 0;
    this._currBeat = 0;
    this._selectedDot = undefined;
};

/**
 * Steps to the next beat in the show, transitioning to the next
 * stuntsheet if necessary.
 */
AnimationStateDelegate.prototype.nextBeat = function() {
    if (this.hasNextBeatInCurrentStuntsheet()) {
        this._currBeat++;
    } else if (this.hasNextStuntsheet()) {
        this.nextSheet();
    }
};

/**
 * Steps back to the previous beat in the show, transitioning to the
 * previous stuntsheet if necessary.
 */
AnimationStateDelegate.prototype.prevBeat = function() {
    if (this.hasPrevBeatInCurrentStuntsheet()) {
        this._currBeat--;
    } else if (this.hasPrevStuntsheet()) {
        this.prevSheet();
        this._currBeat = this.getCurrentSheet().getDuration() - 1;
    }
};

/**
 * Jumps to the zeroth beat of the next stuntsheet.
 */ 
AnimationStateDelegate.prototype.nextStuntsheet = function() {
    if (this.hasNextStuntsheet()) {
        this._currSheet++;
        this._currBeat = 0;
    }
};

/**
 * Jumps to the zeroth beat of the previous stuntsheet.
 */
AnimationStateDelegate.prototype.prevStuntsheet = function() {
    if (this.hasPrevStuntsheetheet()) {
        this._currSheet--;
        this._currBeat = 0;
    }
};

/**
 * Returns whether or not there is another beat in the show
 * relative to the current one.
 *
 * @return {bool} True if there is another beat in the show;
 *   false otherwise.
 */
AnimationStateDelegate.prototype.hasNextBeat = function() {
    return (this.hasNextBeatInCurrentStuntsheet() || this.hasNextStuntsheet());
};

/**
 * Returns whether or not there is a previous beat in the show
 * relative to the current one.
 *
 * @return {bool} True if there is a previous beat in the show;
 *   false otherwise.
 */
AnimationStateDelegate.prototype.hasPrevBeat = function() {
    return (this.hasPrevBeatInCurrentStuntsheet() || this.hasPrevStuntsheet());
};

/**
 * Returns whether or not there is a next stuntsheet in the
 * show relative to the current one.
 *
 * @return {bool} True if there is a next stuntsheet in the
 *   show; false otherwise.
 */
AnimationStateDelegate.prototype.hasNextStuntsheet = function() {
    return (this._currSheet < this._show.getNumSheets() - 1);
};

/**
 * Returns whether or not there is a previous stuntsheet in the
 * show relative to the current one.
 *
 * @return {bool} True if there is a previous stuntsheet in the
 *   show; false otherwise.
 */
AnimationStateDelegate.prototype.hasPrevStuntsheet = function() {
    return (this._currSheet > 0);
};

/**
 * Returns whether or not there is a next beat in the current
 * stuntsheet.
 *
 * @return {bool} True if there is another beat in the current
 *   stuntsheet; false otherwise.
 */
AnimationStateDelegate.prototype.hasNextBeatInCurrentStuntsheet = function() {
    return (this._currBeat < this.getCurrentSheet().getDuration() - 1);
};

/**
 * Returns whether or not there is a previous beat in the current
 * stuntsheet.
 *
 * @return {bool} True if there is a previous beat in the current
 *   stuntsheet; false otherwise.
 */
AnimationStateDelegate.prototype.hasPrevBeatInCurrentStuntsheet = function() {
    return (this._currBeat > 0);
};

/**
 * Returns the current beat in the current stuntsheet.
 *
 * @return {int} The current beat number in the current
 *   stuntsheet.
 */
AnimationStateDelegate.prototype.getCurrentBeatNum = function() {
    return this._currBeat;
};

/**
 * Returns the index of the current stuntsheet.
 *
 * @return {int} The index of the current stuntsheet.
 */
AnimationStateDelegate.prototype.getCurrentSheetNum = function() {
    return this._currSheet;
};

/**
 * Returns the current stuntsheet.
 *
 * @return {Sheet} The current stuntsheet.
 */
AnimationStateDelegate.prototype.getCurrentSheet = function() {
    return this._show.getSheet(this._currSheet);
};

/**
 * Returns the show.
 *
 * @return {Show} The show that this object is
 *   browsing.
 */
AnimationStateDelegate.prototype.getShow = function() {
    return this._show;
};

/**
 * Returns the label of the selected dot.
 *
 * @return {string} The label of the currently-selected dot.
 */
AnimationStateDelegate.prototype.getSelectedDot = function() {
    return this._selectedDot;
};

/**
 * Selects a dot.
 *
 * @param {string} dotLabel The label of the dot to select.
 */
AnimationStateDelegate.prototype.selectDot = function(dotLabel) {
    this._selectedDot = dotLabel;
};

/**
 * Deselects the selected dot.
 */
AnimationStateDelegate.prototype.clearSelectedDot = function() {
    this._selectedDot = undefined;
};

module.exports = AnimationStateDelegate;

