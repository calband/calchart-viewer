var ApplicationController = require("./viewer/ApplicationController");
var JSUtils = require("./viewer/utils/JSUtils");

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
    $(".js-beats-file-btn").click(function() {
        $(".js-beats-file").click();
    });
    $(".js-beats-file").change(applicationController.getBeatsFileHandler());

    $(".js-viewer-file-btn").click(function() {
        $(".js-viewer-file").click();
    });
    $(".js-viewer-file").change(applicationController.getViewerFileHandler());

    $(".js-audio-file-btn").click(function() {
        $(".js-audio-file").click();
    });
    $(".js-audio-file").change(applicationController.getMusicFileHandler());

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
        } else if (event.keyCode === 32) { // space
            var _animator = applicationController.getAnimator();
            if (_animator && _animator.isReady()) {
                applicationController.toggleAnimation();
            }
        }
    });

    $(".js-animate").click(function () {
        applicationController.toggleAnimation();
    });

    $(".js-generate-continuity").click(function () {
        if (!$(this).hasClass("disabled") && $(".js-dot-labels") !== "") {
            var show = $(".js-select-show").val();
            var dot = $(".js-dot-labels").val();
            var defaults = "&md-orientation=west&bev-orientation=east&sd-orientation=east&layout-order=ltr&endsheet-widget=md";
            window.location.href = "pdf.html?show=" + show + "&dot=" + dot + defaults;
        }
    });
    
    $(".js-dot-labels").chosen({
        allow_single_deselect: true,
        width: "90px"
    }).change(function(evt, params){
        if (params) {
            applicationController.applyAnimationAction("selectDot", params.selected);
        } else {
            applicationController.applyAnimationAction("clearSelectedDot");
        }
    });

    applicationController.getShows(2015);

    $(".js-select-show")
        .chosen({
            width: "150px",
            disable_search_threshold: 4, // if there are less than 4 shows, hide search
            allow_single_deselect: true
        })
        .change(function(evt, params) {
            if (params) { // selected a show
                window.location.search = "show=" + params.selected;
            } else { // deselected a show
                window.location.search = "";
            }
        });

    // URL options
    var options = JSUtils.getAllURLParams();
    applicationController.autoloadShow(options["show"], options["dot"]);

    // Detect browser from http://stackoverflow.com/questions/5899783/detect-safari-using-jquery
    var browserString = navigator.userAgent;
    var isSafari = (browserString.indexOf("Safari") > -1) && (browserString.indexOf("Chrome") == -1);
    if (isSafari) {
        alert("You may not be able to upload .ogg files using Safari. Either use an mp3 version of the file or use the Viewer on another browser.")
    }
});
