window.isMobile = true;

$(document).ready(function() {
    // rescale grapher to correct aspect ratio
    var width = $(".graph-container").outerWidth();
    $(".graph-container .graph").css("height", width / 1.5);

    // choosing a dot now goes directly to the individual continuity page
    $(".js-dot-labels").change(function() {
        var show = $(".js-select-show").val();
        var dot = $(this).val();
        var defaults = "&md-orientation=east&bev-orientation=east&sd-orientation=east&layout-order=ltr&endsheet-widget=md";
        window.location.href = "pdf.html?show=" + show + "&dots=" + dot + defaults;
    });
});
