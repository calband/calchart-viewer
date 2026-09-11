var FieldOrientation = require("./viewer/FieldOrientation");

window.isMobile = true;

$(document).ready(function() {
    /*
     * DotNav mobile field view
     *
     * The regular CalChart grapher is already a true top-down SVG view.
     * DotNav keeps that geometry and rotates/translates the rendered field
     * so the direction the phone is pointing is always toward the top
     * of the screen.
     */

    var graphContainer = $(".graph-container");
    var graph = $(".graph-container .graph");

    var width = graphContainer.outerWidth();

    /*
     * Give the navigation view more vertical room than the original
     * CalChart mobile viewer.
     */
    graph.css(
        "height",
        Math.round(width * 0.82)
    );

    var selectedVenue = null;
    var compassEnabled = false;

    /*
     * Last known marching-field heading of the phone.
     *
     * 0   = North
     * 90  = East
     * 180 = South
     * 270 = West
     */
    var lastFieldHeading = null;

    /*
     * Zoom the existing CalChart SVG slightly so the selected marcher
     * sees the local neighborhood rather than the entire field.
     */
    var navigationScale = 1.35;

    /*
     * Prevent multiple redraw requests from stacking up.
     */
    var viewUpdateQueued = false;


    /*
     * Field selection
     */

    $(".js-dotnav-field").change(function() {
        var venueId = $(this).val();

        selectedVenue =
            FieldOrientation.VENUES[venueId] || null;

        if (selectedVenue === null) {
            console.log("[DotNav] No field selected");

            $(".js-dotnav-phone-heading").text(
                "Select field"
            );

            resetHeadingUpView();

            return;
        }

        console.log(
            "[DotNav] Field:",
            selectedVenue.name,
            "East heading:",
            selectedVenue.eastHeading
        );
    });


    /*
     * Compass permission
     */

    $(".js-dotnav-enable-compass").click(function() {
        if (selectedVenue === null) {
            $(".js-dotnav-phone-heading").text(
                "Select field first"
            );

            return;
        }

        if (
            typeof window.DeviceOrientationEvent ===
            "undefined"
        ) {
            $(".js-dotnav-phone-heading").text(
                "Compass unavailable"
            );

            return;
        }

        if (
            typeof window.DeviceOrientationEvent
                .requestPermission === "function"
        ) {
            window.DeviceOrientationEvent
                .requestPermission()
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
                    console.log(
                        "[DotNav] Compass error:",
                        error
                    );

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

        $(".js-dotnav-phone-heading").text(
            "Waiting for heading..."
        );
    }


    /*
     * DotNav target
     */

    function getTargetHeading() {
        if (
            window.ApplicationController === undefined ||
            typeof window.ApplicationController
                .getInstance !== "function"
        ) {
            return null;
        }

        var applicationController =
            window.ApplicationController.getInstance();

        var delegate =
            applicationController
                .getAnimationStateDelegate();

        if (
            delegate === null ||
            delegate.getSelectedDot() === null
        ) {
            return null;
        }

        return applicationController
            ._dotNavTargetHeading;
    }


    /*
     * Turn instruction
     */

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

        var turnError =
            FieldOrientation.getTurnError(
                currentHeading,
                targetHeading
            );

        var roundedTurn =
            Math.round(turnError);

        var absoluteTurn =
            Math.abs(roundedTurn);

        if (absoluteTurn === 0) {
            return "STRAIGHT";
        }

        if (absoluteTurn === 180) {
            return "TURN 180°";
        }

        if (roundedTurn > 0) {
            return (
                "TURN RIGHT " +
                absoluteTurn +
                "°"
            );
        }

        return (
            "TURN LEFT " +
            absoluteTurn +
            "°"
        );
    }


    /*
     * Heading-up top-down field
     *
     * CalChart coordinates render as:
     *
     *     +x = marching North
     *     +y = marching East
     *
     * In the normal Grapher:
     *
     *     marching North -> screen right
     *     marching East  -> screen down
     *     marching South -> screen left
     *     marching West  -> screen up
     *
     * We rotate that coordinate system so the phone's current
     * marching direction always points toward screen-up.
     */

    function applyHeadingUpView(fieldHeading) {
        var svg =
            $(".js-grapher-draw-target svg");

        if (svg.length === 0) {
            return;
        }

        var selectedDot =
            svg.find(
                ".selected-dot-highlight"
            ).get(0);

        /*
         * No dot selected yet.
         * Keep the ordinary full-field top-down view.
         */
        if (!selectedDot) {
            resetHeadingUpView();
            return;
        }

        var svgWidth =
            parseFloat(svg.attr("width"));

        var svgHeight =
            parseFloat(svg.attr("height"));

        var dotX =
            parseFloat(
                selectedDot.getAttribute("cx")
            );

        var dotY =
            parseFloat(
                selectedDot.getAttribute("cy")
            );

        if (
            isNaN(svgWidth) ||
            isNaN(svgHeight) ||
            isNaN(dotX) ||
            isNaN(dotY)
        ) {
            return;
        }

        /*
         * Put the marcher slightly below screen center.
         *
         * This leaves more map visible in front of the marcher,
         * similar to a navigation app.
         */
        var screenX =
            svgWidth / 2;

        var screenY =
            svgHeight * 0.62;

        /*
         * Convert field heading into rotation of the existing
         * CalChart SVG.
         *
         * Example:
         *
         * Phone West  (270°) -> existing field already has W up
         * Phone North (0°)   -> rotate field -90°
         */
        var rotationDegrees =
            -(fieldHeading + 90);

        var rotationRadians =
            rotationDegrees *
            Math.PI /
            180;

        var cosValue =
            Math.cos(rotationRadians);

        var sinValue =
            Math.sin(rotationRadians);

        /*
         * SVG affine transformation:
         *
         * 1. zoom around the selected marcher
         * 2. rotate so phone-forward is screen-up
         * 3. translate selected marcher to our navigation anchor
         */

        var a =
            navigationScale *
            cosValue;

        var b =
            navigationScale *
            sinValue;

        var c =
            -navigationScale *
            sinValue;

        var d =
            navigationScale *
            cosValue;

        var e =
            screenX -
            a * dotX -
            c * dotY;

        var f =
            screenY -
            b * dotX -
            d * dotY;

        var matrix =
            "matrix(" +
            a + " " +
            b + " " +
            c + " " +
            d + " " +
            e + " " +
            f +
            ")";

        /*
         * Grapher draws the field as several top-level SVG groups:
         * field, yardlines, hashes, and dots.
         *
         * Apply exactly the same transform to all of them so
         * CalChart geometry itself is not changed.
         */
        svg.children("g").attr(
            "transform",
            matrix
        );
    }


    function resetHeadingUpView() {
        $(".js-grapher-draw-target svg")
            .children("g")
            .attr(
                "transform",
                null
            );
    }


    /*
     * Grapher redraws the SVG every time the beat changes.
     *
     * Reapply heading-up after each redraw.
     */
    function queueHeadingUpView() {
        if (
            lastFieldHeading === null ||
            viewUpdateQueued
        ) {
            return;
        }

        viewUpdateQueued = true;

        window.requestAnimationFrame(
            function() {
                viewUpdateQueued = false;

                applyHeadingUpView(
                    lastFieldHeading
                );
            }
        );
    }


    var graphElement =
        $(".js-grapher-draw-target").get(0);

    if (
        graphElement &&
        typeof window.MutationObserver !==
            "undefined"
    ) {
        var graphObserver =
            new window.MutationObserver(
                function() {
                    queueHeadingUpView();
                }
            );

        graphObserver.observe(
            graphElement,
            {
                childList: true,
                subtree: true
            }
        );
    }


    /*
     * Device heading
     */

    function handleDeviceOrientation(event) {
        if (selectedVenue === null) {
            return;
        }

        var rawHeading = null;

        if (
            typeof event.webkitCompassHeading ===
            "number"
        ) {
            rawHeading =
                event.webkitCompassHeading;
        } else if (
            event.absolute &&
            typeof event.alpha === "number"
        ) {
            rawHeading =
                FieldOrientation.normalizeDegrees(
                    360 - event.alpha
                );
        }

        if (rawHeading === null) {
            $(".js-dotnav-phone-heading").text(
                "No absolute heading"
            );

            return;
        }

        var fieldHeading =
            FieldOrientation.toFieldHeading(
                rawHeading,
                selectedVenue.eastHeading
            );

        lastFieldHeading =
            fieldHeading;

        var direction =
            FieldOrientation.getDirectionLabel(
                fieldHeading
            );

        var targetHeading =
            getTargetHeading();

        var turnInstruction =
            getTurnInstruction(
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

        /*
         * Phone-forward becomes screen-up.
         */
        applyHeadingUpView(
            fieldHeading
        );
    }
});