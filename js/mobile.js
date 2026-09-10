var FieldOrientation = require("./viewer/FieldOrientation");

window.isMobile = true;

$(document).ready(function() {
    // rescale grapher to correct aspect ratio
    var width = $(".graph-container").outerWidth();
    $(".graph-container .graph").css("height", width / 1.5);

    var selectedVenue = null;

    $(".js-dotnav-field").change(function() {
        var venueId = $(this).val();

        selectedVenue = FieldOrientation.VENUES[venueId] || null;

        if (selectedVenue === null) {
            console.log("[DotNav] No field selected");
            return;
        }

        console.log(
            "[DotNav] Field:",
            selectedVenue.name,
            "East heading:",
            selectedVenue.eastHeading
        );
    });
});
