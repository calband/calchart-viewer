var ApplicationController = require("./viewer/ApplicationController");

/**
 * This function will be executed by jQuery when the HTML DOM is loaded. Here,
 * we should instantiate the ApplicationController and bind the necessary click
 * events on elements.
 *
 * @todo: implement the Calchart Viewer app here
 */
$(document).ready(function () {
    var applicationController = ApplicationController.getInstance();
    applicationController.init();

    // bindings for file uploads
    $(".js-beats-file").change(applicationController.getBeatsFileHandler());
    $(".js-viewer-file").change(applicationController.getViewerFileHandler());

    // bindings for user interface components
    $(".js-prev-beat").click(function () {
        console.log("click received");
    });
    $(".js-prev-stuntsheet").click(function () {
        console.log("click received");
    });
    $(".js-next-beat").click(function () {
        console.log("click received");
    });
    $(".js-next-stuntsheet").click(function () {
        console.log("click received");
    });
    $(".js-animate").click(function () {
        console.log("click received");
    });
    $(".js-generate-continuity").click(function () {
        console.log("click received");
    });
    $(".js-show-selected-dot").change(function () {
        console.log("change received");
    });
    $(".js-dot-labels").change(function () {
        console.log("change received");
    });
});