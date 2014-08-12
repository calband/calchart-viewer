/**
 * @fileOverview The ApplicationController singleton class is defined here.
 */

var Grapher = require("./Grapher");
var ShowUtils = require("./ShowUtils");

/**
 * The ApplicationController is the backbone of how functional components
 * communicate with each other in the Calchart Viewer. It knows about the
 * currently selected Show, the Grapher to render the preview, the
 * AnimationStateDelegate which controls where the animation is in the current
 * Show, and other information about the app's state.
 *
 * Note that this class is a singleton, which means that there can only ever be
 * one of it. This is a good thing, because since the ApplicationController
 * controls important state about the app, there should never be two operating
 * at one time. This also means that we can access the ApplicationController
 * from anywhere by calling ApplicationController.getInstance() - the class
 * itself saves its instance and will automatically create an instance of itself
 * if needed when this function is called.
 */
var ApplicationController = window.ApplicationController = function () {
    this.applicationStateDelegate = null;
    this.grapher = null;
    this.show = null;
};

/**
 * The internal instance of the ApplicationController. Nothing outside of this
 * class hsould ever access this.
 * @type {ApplicationController|null}
 */
ApplicationController._instance = null;

/**
 * Return the singleton instance of the application controller, and create the
 * internal instance if it has not been created already.
 * @return {ApplicationController} the controller
 */
ApplicationController.getInstance = function () {
    if (ApplicationController._instance === null) {
        ApplicationController._instance = new ApplicationController();
    }
    return ApplicationController._instance;
};

/**
 * Set the controller up with instances of various classes that control
 * their respective parts of the application. These are null until they are set
 * here.
 * 
 * @param  {ApplicationStateDelegate} applicationStateDelegate
 * @param  {Grapher} grapher
 */
ApplicationController.prototype.init = function () {
    this.grapher = new Grapher("college", $(".js-grapher-draw-target"));
    this.grapher.draw(null, null, null);
};

/**
 * Given a callback function which expects to process the contents of a file
 * as UTF-8 encoded text, return a function which takes an event (an event
 * handler, to be used with the jquery change function) and reads the files
 * for that event's current target (a file input). The returned function then
 * passes the file's contents to the provided callback.
 *
 * Note: this handler function that this method generates will return undefined
 * if there have been no files uploaded to the input, of if the input accepts
 * multiple files and has more than one.
 *
 * Example useage of this:
 *
 * $(".my-input-target").change(_createFileHandler(function (contents) {
 *     console.log(contents);
 * }));
 * @param  {Function(string)} callback a callback which accepts the file
 *   contents
 * @return {Function(jQuery.Event)} event handler function which reads the file
 *   and passes its contents to the callback
 */
ApplicationController.prototype._createFileHandler = function (callback) {
    return function (event) {
        var files = event.currentTarget.files;
        if (!files || files.length !== 1) {
            return;
        }
        var reader = new window.FileReader();
        reader.onload = function () {
            callback(reader.result);
        };
        reader.readAsText(files[0]);
    };
};

/**
 * Return an event handler function which reads the beats file and operates on
 * it.
 * @return {Function(jQuery.Event)} the event handler
 */
ApplicationController.prototype.getBeatsFileHandler = function () {
    return this._createFileHandler(function (fileContentsAsText) {
        console.log("Beats file found with the following content:");
        console.log(JSON.parse(fileContentsAsText));
    });
};

/**
 * Return an event handler function which reads the viewer file and operates on
 * it.
 * @return {Function(jQuery.Event)} the event handler
 */
ApplicationController.prototype.getViewerFileHandler = function () {
    var _this = this;
    return this._createFileHandler(function (fileContentsAsText) {
        var show = ShowUtils.fromJSON(fileContentsAsText);
        _this.show = show;
        _this.grapher.draw(show.getSheets()[0], 0, null);
    });
};

module.exports = ApplicationController;