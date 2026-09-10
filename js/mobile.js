var FieldOrientation = require("./viewer/FieldOrientation");

window.isMobile = true;

$(document).ready(function() {
    // rescale grapher to correct aspect ratio
    var width = $(".graph-container").outerWidth();
    $(".graph-container .graph").css("height", width / 1.5);

    var selectedVenue = null;
    var compassEnabled = false;

    $(".js-dotnav-field").change(function() {
        var venueId = $(this).val();

        selectedVenue = FieldOrientation.VENUES[venueId] || null;

        if (selectedVenue === null) {
            console.log("[DotNav] No field selected");
            $(".js-dotnav-phone-heading").text("Select field");
            return;
        }

        console.log(
            "[DotNav] Field:",
            selectedVenue.name,
            "East heading:",
            selectedVenue.eastHeading
        );
    });

    $(".js-dotnav-enable-compass").click(function() {
        if (selectedVenue === null) {
            $(".js-dotnav-phone-heading").text("Select field first");
            return;
        }

        if (typeof DeviceOrientationEvent === "undefined") {
            $(".js-dotnav-phone-heading").text("Compass unavailable");
            return;
        }

        if (
            typeof DeviceOrientationEvent.requestPermission === "function"
        ) {
            DeviceOrientationEvent.requestPermission()
                .then(function(permissionState) {
                    if (permissionState === "granted") {
                        enableCompass();
                    } else {
                        $(".js-dotnav-phone-heading").text(
                            "Permission denied"
                        );
                    }
                })
                .catch(function(error) {
                    console.log("[DotNav] Compass error:", error);

                    $(".js-dotnav-phone-heading").text(
                        "Compass unavailable"
                    );
                });

            return;
        }

        enableCompass();
    });

    function enableCompass() {
        if (compassEnabled) {
            return;
        }

        compassEnabled = true;

        window.addEventListener(
            "deviceorientation",
            handleDeviceOrientation
        );

        $(".js-dotnav-phone-heading").text("Waiting for heading...");
    }

    function getTargetHeading() {
        if (
            window.ApplicationController === undefined ||
            typeof window.ApplicationController.getInstance !== "function"
        ) {
            return null;
        }

        var applicationController =
            window.ApplicationController.getInstance();

        return applicationController._dotNavTargetHeading;
    }

    function getTurnInstruction(
        currentHeading,
        targetHeading
    ) {
        if (
            currentHeading === null ||
            targetHeading === null
        ) {
            return "TURN —";
        }

        var turnError = FieldOrientation.getTurnError(
            currentHeading,
            targetHeading
        );

        var roundedTurn = Math.round(turnError);
        var absoluteTurn = Math.abs(roundedTurn);

        if (absoluteTurn === 0) {
            return "STRAIGHT";
        }

        if (absoluteTurn === 180) {
            return "TURN 180°";
        }

        if (roundedTurn > 0) {
            return "TURN RIGHT " + absoluteTurn + "°";
        }

        return "TURN LEFT " + absoluteTurn + "°";
    }

    function handleDeviceOrientation(event) {
        if (selectedVenue === null) {
            return;
        }

        var rawHeading = null;

        if (typeof event.webkitCompassHeading === "number") {
            rawHeading = event.webkitCompassHeading;
        } else if (
            event.absolute &&
            typeof event.alpha === "number"
        ) {
            rawHeading = FieldOrientation.normalizeDegrees(
                360 - event.alpha
            );
        }

        if (rawHeading === null) {
            $(".js-dotnav-phone-heading").text(
                "No absolute heading"
            );
            return;
        }

        var fieldHeading = FieldOrientation.toFieldHeading(
            rawHeading,
            selectedVenue.eastHeading
        );

        var direction = FieldOrientation.getDirectionLabel(
            fieldHeading
        );

        var targetHeading = getTargetHeading();

        var turnInstruction = getTurnInstruction(
            fieldHeading,
            targetHeading
        );

        $(".js-dotnav-phone-heading").text(
            direction +
            " " +
            Math.round(fieldHeading) +
            "°" +
            " (raw " +
            Math.round(rawHeading) +
            "°)" +
            " | " +
            turnInstruction
        );
    }
});