var ApplicationController = require("./viewer/ApplicationController");
var JSUtils = require("./viewer/utils/JSUtils");
var PDFGenerator = require("./pdf/PDFGenerator");

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
    // Mobile
    $(".js-load-song").click(applicationController.mobileMusicLoader());

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
        var defaults = "&md-orientation=west&bev-orientation=west&sd-orientation=west&layout-order=ltr";
        window.location.href = "pdf.html?show=" + show + "&dots=" + dot + defaults;
    });

    $(".js-quick-generate-continuity").click(function () {
        var show = $(".js-viewer-file").val();
        var dot = $(".js-dot-labels").val();
        window.generator = new PDFGenerator(applicationController._show, [dot])
        try {
            var options = {
                "md-orientation":"west",
                "bev-orientation":"west",
                "sd-orientation":"west",
                "layout-order":"ltr"
            };
            window.generator.generate(options);
            window.generator.pdf.save();
        } catch(err) {
            console.log("Error occured ", err);
            $(".file-input-error")
            .text("Error occured " + err)
            .fadeIn(1000)
            .delay(1000)
            .fadeOut(500);
            throw err;
        }
    });
    
    $(".js-dot-labels").chosen({
        allow_single_deselect: true,
        width: "90px"
    }).change(function(evt, params){
        if (params) {
            applicationController.applyAnimationAction("selectDot", params.selected);
            $(".js-quick-generate-continuity").removeClass("disabled");
        } else {
            applicationController.applyAnimationAction("clearSelectedDot");
            $(".js-quick-generate-continuity").addClass("disabled");
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

    applicationController.getShows()
        .complete(function() {
            // URL options
            var options = JSUtils.getAllURLParams();
            applicationController.autoloadShow(options.show, options.dot);
        })
        .error(function(xhr) {
            alert("Could not load shows from the server");
            // just remove the loading page on error
            $(".loading").remove();
        });
});
