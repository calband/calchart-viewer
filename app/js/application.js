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
    $(".js-show-selected-dot").change(function () {
        var checked = $(this).is(":checked");
        if (checked) {
            applicationController.applyAnimationAction("selectDot", $(".js-dot-labels").val());
        } else {
            applicationController.applyAnimationAction("clearSelectedDot");
        }
    });
    $(".js-dot-labels").change(function () {
        if ($(".js-show-selected-dot").is(":checked")) {
            applicationController.applyAnimationAction("selectDot", $(this).val());
        }
    });
});