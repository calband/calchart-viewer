var ApplicationController = require("./viewer/ApplicationController");
var JSUtils = require("./viewer/utils/JSUtils");

// will hold timeout event for long pressing buttons
var longPress = null;

/**
 * Run the callback on the given jQuery selector repeatedly when
 * held for a long period of time.
 */
var onLongPress = function(selector, callback) {
    var down = "mousedown";
    var up = "mouseup mouseleave";
    if (window.ontouchstart !== undefined) {
        var down = "touchstart";
        var up = "touchend touchcancel";
    }

    $(selector)
        .on(down, function() {
            callback();
            longPress = setTimeout(function() {
                longPress = setInterval(callback, 50);
            }, 500);
        })
        .on(up, function() {
            clearTimeout(longPress);
        });
};

/**
 * This function will be executed by jQuery when the HTML DOM is loaded. Here,
 * we should instantiate the ApplicationController and bind the necessary click
 * events on elements.
 *
 * @todo: implement the Calchart Viewer app here
 */
$(document).ready(function () {
    // if viewing on mobile, redirect to the mobile page
    var mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    if (!window.isMobile && mobileRegex.test(navigator.userAgent.toLowerCase())) {
        window.location = "mobile.html";
    }

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
    onLongPress(".js-prev-beat", function() {
        applicationController.applyAnimationAction("prevBeat");
    });
    $(".js-prev-stuntsheet").click(function () {
        applicationController.applyAnimationAction("prevSheet");
    });
    onLongPress(".js-next-beat", function() {
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
        var show = $(".js-select-show").val();
        var dot = $(".js-dot-labels").val();
        var defaults = "&md-orientation=east&bev-orientation=east&sd-orientation=east&layout-order=ltr&endsheet-widget=md";
        window.location.href = "pdf.html?show=" + show + "&dots=" + dot + defaults;
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

    $(".js-select-show")
        .chosen({
            width: "150px",
            disable_search_threshold: 4, // if there are less than 4 shows, hide search
            allow_single_deselect: true
        })
        .change(function() {
            window.location.search = "show=" + $(this).val();
        });

    // Detect browser from http://stackoverflow.com/questions/5899783/detect-safari-using-jquery
    var browserString = navigator.userAgent;
    var isSafari = !window.isMobile && (browserString.indexOf("Safari") > -1) && (browserString.indexOf("Chrome") == -1);
    // alert about safari not supporting ogg files. can remove if we stop using ogg files completely
    if (isSafari) {
        alert("You may not be able to upload .ogg files using Safari. Either use an mp3 version of the file or use the Viewer on another browser.")
    }

    applicationController.getShows().complete(function() {
        // URL options
        var options = JSUtils.getAllURLParams();
        applicationController.autoloadShow(options.show, options.dot);
    });
});
