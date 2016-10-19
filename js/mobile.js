window.isMobile = true;

$(document).ready(function() {
    // rescale grapher to correct aspect ratio
    var width = $(".graph-container").outerWidth();
    $(".graph-container .graph").css("height", width / 1.5);
});
