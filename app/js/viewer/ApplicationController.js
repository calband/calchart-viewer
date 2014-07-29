/**
 * @fileOverview The ApplicationController singleton class is defined here.
 */

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
var ApplicationController = function () {
    console.log("ApplicationController loaded.");
    this.applicationStateDelegate = null;
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
ApplicationController.prototype.init = function (applicationStateDelegate, grapher) {
    /* Your code here */
};
module.exports = ApplicationController;