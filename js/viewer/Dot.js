/**
 * @fileOverview Defines the Dot class.
 */

/**
 * Dot objects represent marchers. They execute a sequence
 * of MovementCommands, which define their position and orientation
 * on any given beat. Every Stuntsheet has its own set of Dot objects,
 * so a marcher will be represented by more than one of them throughout
 * a show. Specifically, every marcher is associated with AT MOST one
 * Dot object per Stuntsheet (some Stuntsheets may not include certain
 * marchers).
 *
 * @param {string} label The dot's label. This is also the label of
 *   the marcher associated with this dot.
 * @param {Array<MovementCommand>} movementCommands All of the MovementCommand
 *   objects that this Dot will execute. The commands must be sorted in the
 *   order in which they will be executed.
 */
var Dot = function(label, movementCommands) {
    this._label = label;
    this._movements = movementCommands;
};

/**
 * Returns the label for this dot.
 *
 * @return {string} The dot's label.
 */
Dot.prototype.getLabel = function() {
    return this._label;
};

/**
 * Returns this dot's movement commands.
 *
 * @return {Array<MovementCommand>} The dot's movements.
 */
Dot.prototype.getMovementCommands = function() {
    return this._movements;
};

/**
 * Returns an AnimationState object that describes the Dot's
 * position, orientation, etc. at a specific moment in the show.
 *
 * @param {int} beatNum The Dot's AnimationState will be
 *   relevant to the beat indicated by this value. The beat
 *   is relative to the start of the stuntsheet.
 * @return {AnimationState} An AnimationState that
 *   describes the Dot at a moment of the show,. If the Dot
 *   has no movement at the specified beat, returns undefined.
 */
Dot.prototype.getAnimationState = function(beatNum) {
    for (var commandIndex = 0; commandIndex < this._movements.length; commandIndex++) {
        if (beatNum < this._movements[commandIndex].getBeatDuration()) {
            return this._movements[commandIndex].getAnimationState(beatNum);
        }
        beatNum -= this._movements[commandIndex].getBeatDuration();
    }
};

module.exports = Dot;