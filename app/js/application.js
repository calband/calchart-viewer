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
    $(".js-mp3-file").change(applicationController.getMusicFileHandler());

    // bindings for user interface components
    $(".js-prev-beat").click(function () {
        applicationController.applyAnimationAction("prevBeat");
    });
    $(".js-prev-stuntsheet").click(function () {
        applicationController.applyAnimationAction("prevSheet");
    });
    $(".js-next-beat").click(function () {
        applicationController.applyAnimationAction("nextBeat");
    });
    $(".js-next-stuntsheet").click(function () {
        applicationController.applyAnimationAction("nextSheet");
    });

    // global window actions for detecting arrow key presses
    $(window).keydown(function (event) {
        if (event.keyCode === 39) { // right arrow
            applicationController.applyAnimationAction("nextBeat");
        } else if (event.keyCode === 37) { // left arrow
            applicationController.applyAnimationAction("prevBeat");
        }
    });

    $(".js-animate").click(function () {
        applicationController.toggleAnimation();
    });
    $(".js-generate-continuity").click(function () {
        console.log("click received");
    });
    
    $(".js-dot-labels").chosen({
        allow_single_deselect: true,
        width: "90px"
    }).change(function(evt, params){
        if (typeof params === "undefined") {
            applicationController.applyAnimationAction("clearSelectedDot");
        } else {
            applicationController.applyAnimationAction("selectDot", params.selected);
        }
    });
});