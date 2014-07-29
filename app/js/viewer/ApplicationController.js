var ApplicationController = function () {
    this.applicationStateDelegate = null;
    this.show = null;
};

ApplicationController._instance = null;

ApplicationController.getInstance = function () {
    if (ApplicationController._instance === null) {
        ApplicationController._instance = new ApplicationController();
    }
    return ApplicationController._instance;
};

ApplicationController.prototype.init = function () {
    /* Your code here */
};
module.exports = ApplicationController;