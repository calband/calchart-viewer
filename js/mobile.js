var FieldOrientation = require("./viewer/FieldOrientation");

window.isMobile = true;

$(document).ready(function() {
    /*
     * DotNav mobile rehearsal/navigation layer.
     *
     * BLUE   = phone/self direction (fixed screen-up)
     * RED    = current required target
     * YELLOW = next movement target
     */

    var graphContainer = $(".graph-container");
    var graph = $(".graph-container .graph");
    var width = graphContainer.outerWidth();

    graph.css("height", Math.round(width * 0.82));

    var selectedVenue = null;
    var compassEnabled = false;
    var lastRawHeading = null;
    var lastRawHeadingIsAbsolute = null;
    var fieldEastHeading = null;
    var fieldEastHeadingIsAbsolute = null;
    var lastFieldHeading = null;
    var absoluteHeadingSeen = false;

    /*
     * Map view modes.
     *
     * NORMAL keeps the current navigation framing.
     * 4 YL is approximately four 5-yard-line intervals across the screen.
     * 2 YL doubles that close-up scale for local spacing / collision checks.
     */
    var NAVIGATION_SCALE_NORMAL = 2.3;
    var NAVIGATION_SCALE_FOUR_YARD_LINES = 5.0;
    var NAVIGATION_SCALE_TWO_YARD_LINES = 10.0;
    var zoomMode = "normal";
    var navigationScale = NAVIGATION_SCALE_NORMAL;

    var tempoScale = 1.0;

    var FIELD_STEPS_HORIZONTAL = 160;
    var FIELD_STEPS_VERTICAL = 84;
    var FIELD_PADDING = 10;
    var FIELD_ASPECT_RATIO = 0.5333;

    /* ------------------------------------------------------------
     * Map zoom mode
     * ------------------------------------------------------------ */

    function updateZoomModeUI() {
        $(".js-dotnav-zoom-mode")
            .removeClass("is-active")
            .attr("aria-pressed", "false");

        $(".js-dotnav-zoom-mode[data-zoom-mode='" + zoomMode + "']")
            .addClass("is-active")
            .attr("aria-pressed", "true");
    }

    function setZoomMode(mode) {
        if (mode === "2yl") {
            zoomMode = "2yl";
            navigationScale = NAVIGATION_SCALE_TWO_YARD_LINES;
        } else if (mode === "4yl") {
            zoomMode = "4yl";
            navigationScale = NAVIGATION_SCALE_FOUR_YARD_LINES;
        } else {
            zoomMode = "normal";
            navigationScale = NAVIGATION_SCALE_NORMAL;
        }

        updateZoomModeUI();

        var svg = $(".js-grapher-draw-target svg");

        if (svg.length !== 0) {
            svg.find(".dotnav-route").remove();
            drawMovementRoute();
        }

        if (lastFieldHeading !== null) {
            applyHeadingUpView(lastFieldHeading);
        }
    }

    $(document).on("click", ".js-dotnav-zoom-mode", function(event) {
        event.preventDefault();
        event.stopPropagation();

        setZoomMode($(this).attr("data-zoom-mode"));
    });

    updateZoomModeUI();

    /*
     * Compass action button state.
     *
     * Before permission:
     *     Enable Compass
     *
     * After compass is active:
     *     Recalibrate
     *
     * Recalibrate replaces Enable Compass instead of stacking below it.
     * The V1 compass card is height-limited, so two stacked buttons can
     * clip the calibration control.
     */
    function updateCompassActionUI() {
        var venueId = $(".js-dotnav-field").val();
        var hasSelectedField = (
            venueId !== null &&
            venueId !== undefined &&
            venueId !== ""
        );

        if (!compassEnabled) {
            $(".js-dotnav-enable-compass").show();
            $(".js-dotnav-set-east").hide();
            return;
        }

        $(".js-dotnav-enable-compass").hide();
        $(".js-dotnav-set-east").toggle(hasSelectedField);
    }

    updateCompassActionUI();

    /*
     * Keep the internal field/calibration state synchronized with the
     * selector that is actually visible in Tools.
     *
     * Chosen / restored form state can leave the <select> showing Maxwell
     * or Memorial before this module has received a native change event.
     * In that case Enable Compass previously worked, but fieldEastHeading
     * could still be null, so incoming sensor data only showed
     * "Raw ... point phone toward Field East" and never entered heading-up
     * navigation.
     *
     * Do not overwrite a user's Recalibrate value while the same preset
     * field remains selected.
     */
    function ensureFieldSelectionState() {
        var venueId = $(".js-dotnav-field").val();

        if (
            venueId === null ||
            venueId === undefined ||
            venueId === ""
        ) {
            return;
        }

        if (venueId === "manual") {
            if (
                selectedVenue === null ||
                selectedVenue.name !== "Manual / Other"
            ) {
                selectedVenue = {
                    name: "Manual / Other"
                };
                fieldEastHeading = null;
                fieldEastHeadingIsAbsolute = null;
            }

            return;
        }

        var venue = FieldOrientation.VENUES[venueId] || null;

        if (venue === null) {
            return;
        }

        if (selectedVenue !== venue) {
            selectedVenue = venue;
            fieldEastHeading = venue.eastHeading;
            fieldEastHeadingIsAbsolute = true;
            return;
        }

        if (
            fieldEastHeading === null &&
            typeof venue.eastHeading === "number" &&
            !isNaN(venue.eastHeading)
        ) {
            fieldEastHeading = venue.eastHeading;
            fieldEastHeadingIsAbsolute = true;
        }
    }

    /* ------------------------------------------------------------
     * Field selection / orientation offset
     * ------------------------------------------------------------ */

    $(".js-dotnav-field").change(function() {
        var venueId = $(this).val();

        updateCompassActionUI();

        lastFieldHeading = null;
        resetHeadingUpView();
        updateVisualCompass(null);

        if (venueId === "manual") {
            selectedVenue = {
                name: "Manual / Other"
            };
            fieldEastHeading = null;
            fieldEastHeadingIsAbsolute = null;

            $(".js-dotnav-phone-heading").text(
                "Enable compass, point phone toward Field East, then tap Recalibrate"
            );

            return;
        }

        selectedVenue = FieldOrientation.VENUES[venueId] || null;

        if (selectedVenue === null) {
            console.log("[DotNav] No field selected");
            fieldEastHeading = null;
            $(".js-dotnav-phone-heading").text("Select field");
            return;
        }

        fieldEastHeading = selectedVenue.eastHeading;
        fieldEastHeadingIsAbsolute = true;

        console.log(
            "[DotNav] Field:",
            selectedVenue.name,
            "East heading:",
            fieldEastHeading
        );

        if (compassEnabled && lastRawHeading !== null) {
            applyRawHeading(lastRawHeading);
        }
    });

    $(".js-dotnav-set-east").click(function() {
        if (selectedVenue === null) {
            $(".js-dotnav-phone-heading").text("Select field first");
            return;
        }

        if (!compassEnabled) {
            $(".js-dotnav-phone-heading").text("Enable compass first");
            return;
        }

        if (lastRawHeading === null) {
            $(".js-dotnav-phone-heading").text(
                "Point phone toward Field East and wait for a compass heading"
            );
            return;
        }

        fieldEastHeading = lastRawHeading;
        fieldEastHeadingIsAbsolute = lastRawHeadingIsAbsolute;

        console.log(
            "[DotNav] Field East recalibrated:",
            fieldEastHeading
        );

        applyRawHeading(lastRawHeading);
    });

    /* ------------------------------------------------------------
     * Compass permission
     * ------------------------------------------------------------ */

    $(".js-dotnav-enable-compass").click(function() {
        ensureFieldSelectionState();

        if (selectedVenue === null) {
            $(".js-dotnav-phone-heading").text("Select field first");
            return;
        }

        if (typeof window.DeviceOrientationEvent === "undefined") {
            $(".js-dotnav-phone-heading").text("Compass unavailable");
            return;
        }

        if (typeof window.DeviceOrientationEvent.requestPermission === "function") {
            window.DeviceOrientationEvent.requestPermission()
                .then(function(permissionState) {
                    if (permissionState === "granted") {
                        enableCompass();
                    } else {
                        $(".js-dotnav-phone-heading").text("Permission denied");
                    }
                })
                .catch(function(error) {
                    console.log("[DotNav] Compass error:", error);
                    $(".js-dotnav-phone-heading").text("Compass unavailable");
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
        updateCompassActionUI();

        window.addEventListener(
            "deviceorientation",
            handleDeviceOrientation
        );

        window.addEventListener(
            "deviceorientationabsolute",
            handleDeviceOrientation
        );

        if (fieldEastHeading === null) {
            $(".js-dotnav-phone-heading").text(
                "Waiting for raw heading — point toward Field East"
            );
        } else {
            $(".js-dotnav-phone-heading").text("Waiting for heading...");
        }

        updateVisualCompass(null);
    }

    /* ------------------------------------------------------------
     * Rehearsal tempo scale
     *
     * SoundManager2 already tracks beat events against source-audio
     * positions. On mobile/HTML5 audio, changing playbackRate therefore
     * slows/speeds the music while those beat events remain synchronized.
     *
     * Silent animation does not have audio position, so its timer interval
     * is divided by the same tempo scale.
     * ------------------------------------------------------------ */

    function getDotNavAnimator() {
        if (
            window.ApplicationController === undefined ||
            typeof window.ApplicationController.getInstance !== "function"
        ) {
            return null;
        }

        var controller = window.ApplicationController.getInstance();

        if (
            !controller ||
            typeof controller.getAnimator !== "function"
        ) {
            return null;
        }

        return controller.getAnimator();
    }

    function applyAnimatorSoundTempo(animator) {
        if (!animator || !animator._sound) {
            return false;
        }

        var soundWrapper = animator._sound;
        var rate = animator._dotNavTempoScale || 1.0;

        /*
         * Prefer a wrapper-level API if one is added later.
         */
        if (typeof soundWrapper.setPlaybackRate === "function") {
            soundWrapper.setPlaybackRate(rate);
            return true;
        }

        /*
         * Current SMSound wraps a SoundManager2 SMSound in _sound.
         * SoundManager2 2.97a exposes setPlaybackRate() for HTML5 audio.
         */
        if (
            soundWrapper._sound &&
            typeof soundWrapper._sound.setPlaybackRate === "function"
        ) {
            soundWrapper._sound.setPlaybackRate(rate);
            return true;
        }

        /*
         * Last-resort HTML5 Audio fallback.
         */
        if (
            soundWrapper._sound &&
            soundWrapper._sound._a &&
            typeof soundWrapper._sound._a.playbackRate === "number"
        ) {
            soundWrapper._sound._a.playbackRate = rate;
            return true;
        }

        return false;
    }

    function installAnimatorTempoSupport(animator) {
        if (!animator || animator._dotNavTempoInstalled) {
            return;
        }

        animator._dotNavTempoInstalled = true;
        animator._dotNavTempoScale = tempoScale;

        /*
         * Make sure music loaded after the user chooses a practice speed
         * inherits the selected tempo.
         */
        if (typeof animator.setMusic === "function") {
            var originalSetMusic = animator.setMusic;

            animator.setMusic = function(soundObject) {
                originalSetMusic.call(this, soundObject);
                applyAnimatorSoundTempo(this);
            };
        }

        /*
         * Re-apply the selected rate immediately before playback starts.
         */
        if (typeof animator.start === "function") {
            var originalStart = animator.start;

            animator.start = function() {
                applyAnimatorSoundTempo(this);
                return originalStart.apply(this, arguments);
            };
        }

        /*
         * Replace only the silent timer path so practice speed also works
         * when the user has not loaded music.
         */
        animator._startSilentAnimation = function(overallBeat) {
            this._callEventHandler("start");

            var startBeatNum = overallBeat;

            if (startBeatNum < 0) {
                startBeatNum = 0;
            }

            var beatTimeMs = this._beats.getBeatTime(startBeatNum);
            var nextBeatTimeMs = this._beats.getBeatTime(startBeatNum + 1);
            var scale = this._dotNavTempoScale || 1.0;
            var animationStartTimeMs = performance.now();

            this._nextBeatTime = (
                animationStartTimeMs +
                (nextBeatTimeMs - beatTimeMs) / scale
            );

            var _this = this;
            var animationFrameHandler = function(timestampMs) {
                if (_this._silentAnimationTimer === null) {
                    return;
                }

                if (timestampMs >= _this._nextBeatTime) {
                    _this._nextBeat();

                    var nextBeatNum =
                        _this._getCurrentOverallBeatNum() + 1;

                    if (nextBeatNum < _this._beats.getNumBeats()) {
                        var beatDurationMs = (
                            _this._beats.getBeatTime(nextBeatNum) -
                            _this._beats.getBeatTime(nextBeatNum - 1)
                        );

                        _this._nextBeatTime = (
                            timestampMs +
                            beatDurationMs /
                                (_this._dotNavTempoScale || 1.0)
                        );
                    }
                }

                _this._silentAnimationTimer =
                    requestAnimationFrame(animationFrameHandler);
            };

            this._silentAnimationTimer =
                requestAnimationFrame(animationFrameHandler);
        };
    }

    function updateTempoUI() {
        $(".js-dotnav-tempo")
            .removeClass("is-active")
            .filter('[data-tempo="' + tempoScale + '"]')
            .addClass("is-active");

        $(".js-dotnav-tempo-status").text(
            Math.round(tempoScale * 100) + "%"
        );
    }

    function applyTempoScale(newScale) {
        var parsedScale = parseFloat(newScale);

        if (isNaN(parsedScale)) {
            return;
        }

        tempoScale = Math.max(0.5, Math.min(1.0, parsedScale));
        updateTempoUI();

        var animator = getDotNavAnimator();

        if (animator === null) {
            return;
        }

        installAnimatorTempoSupport(animator);

        var wasSilentPlaying =
            animator._silentAnimationTimer !== null;

        if (wasSilentPlaying) {
            cancelAnimationFrame(animator._silentAnimationTimer);
            animator._silentAnimationTimer = null;
        }

        animator._dotNavTempoScale = tempoScale;
        applyAnimatorSoundTempo(animator);

        if (
            wasSilentPlaying &&
            typeof animator._startSilentAnimation === "function"
        ) {
            animator._startSilentAnimation(
                animator._getCurrentOverallBeatNum()
            );
        }
    }

    $(document).on("click", ".js-dotnav-tempo", function(event) {
        event.preventDefault();
        event.stopPropagation();

        applyTempoScale($(this).attr("data-tempo"));
    });

    /*
     * Install/apply the selected tempo before Play or Load Music.
     * This keeps the control order independent of when a show/audio loads.
     */
    $(".js-animate, .js-load-song").click(function() {
        var animator = getDotNavAnimator();

        if (animator === null) {
            return;
        }

        installAnimatorTempoSupport(animator);
        animator._dotNavTempoScale = tempoScale;
        applyAnimatorSoundTempo(animator);
    });

    updateTempoUI();

    /* ------------------------------------------------------------
     * Application / movement state
     * ------------------------------------------------------------ */

    function getApplicationState() {
        if (
            window.ApplicationController === undefined ||
            typeof window.ApplicationController.getInstance !== "function"
        ) {
            return null;
        }

        var controller = window.ApplicationController.getInstance();
        var delegate = controller.getAnimationStateDelegate();

        if (delegate === null) {
            return null;
        }

        return {
            controller: controller,
            delegate: delegate
        };
    }

    function getCurrentMovementContext() {
        var state = getApplicationState();

        if (state === null) {
            return null;
        }

        var delegate = state.delegate;
        var selectedDot = delegate.getSelectedDot();

        if (selectedDot === null) {
            return null;
        }

        var sheet = delegate.getCurrentSheet();
        var beat = delegate.getCurrentBeatNum();
        var dot = sheet.getDotByLabel(selectedDot);

        if (dot === null) {
            return null;
        }

        var movementInfo = dot.getMovementAtBeat(beat);

        if (movementInfo === null) {
            return null;
        }

        return {
            state: state,
            delegate: delegate,
            selectedDot: selectedDot,
            sheet: sheet,
            beat: beat,
            dot: dot,
            movementInfo: movementInfo,
            movement: movementInfo.movement
        };
    }

    function isArcMovement(movement) {
        return (
            movement !== null &&
            movement !== undefined &&
            typeof movement.getMiddlePoints === "function"
        );
    }

    function isEvenMovement(movement) {
        return (
            movement !== null &&
            movement !== undefined &&
            !isArcMovement(movement) &&
            typeof movement.getBeatsPerStep === "function"
        );
    }

    /*
     * CalChart/Grapher facing:
     *
     * E =   0
     * S =  90
     * W = 180
     * N = 270
     *
     * DotNav field heading:
     *
     * N =   0
     * E =  90
     * S = 180
     * W = 270
     */

    function grapherAngleToFieldHeading(angle) {
        if (
            angle === null ||
            angle === undefined ||
            typeof angle !== "number" ||
            isNaN(angle)
        ) {
            return null;
        }

        return FieldOrientation.normalizeDegrees(angle + 90);
    }

    function getMovementOrientationHeading(movement, localBeat) {
        if (movement === null || movement === undefined) {
            return null;
        }

        if (typeof movement.getAnimationState === "function") {
            var animationState = movement.getAnimationState(localBeat || 0);

            if (
                animationState !== null &&
                animationState !== undefined &&
                typeof animationState.angle === "number"
            ) {
                return grapherAngleToFieldHeading(animationState.angle);
            }
        }

        if (typeof movement.getOrientation === "function") {
            return FieldOrientation.getHeadingForDirection(
                movement.getOrientation()
            );
        }

        return null;
    }

    /*
     * Arc target heading is the local direction of travel.
     *
     * Instead of pointing at the final endpoint, find the next
     * actual changed animation position and use that local segment.
     */

    function getArcTravelHeading(movement, localBeat) {
        if (
            !isArcMovement(movement) ||
            typeof movement.getAnimationState !== "function" ||
            typeof movement.getBeatDuration !== "function"
        ) {
            return null;
        }

        var duration = movement.getBeatDuration();
        var beat = Math.max(
            0,
            Math.min(localBeat || 0, duration)
        );
        var currentState = movement.getAnimationState(beat);

        if (currentState === null || currentState === undefined) {
            return null;
        }

        var epsilon = 0.0001;
        var futureBeat;

        for (futureBeat = beat + 1; futureBeat <= duration; futureBeat++) {
            var futureState = movement.getAnimationState(futureBeat);
            var dx = futureState.x - currentState.x;
            var dy = futureState.y - currentState.y;

            if (Math.abs(dx) > epsilon || Math.abs(dy) > epsilon) {
                return FieldOrientation.getTravelHeading(dx, dy);
            }
        }

        var previousBeat;

        for (previousBeat = beat - 1; previousBeat >= 0; previousBeat--) {
            var previousState = movement.getAnimationState(previousBeat);
            var previousDx = currentState.x - previousState.x;
            var previousDy = currentState.y - previousState.y;

            if (
                Math.abs(previousDx) > epsilon ||
                Math.abs(previousDy) > epsilon
            ) {
                return FieldOrientation.getTravelHeading(
                    previousDx,
                    previousDy
                );
            }
        }

        return null;
    }

    function getMovementTravelHeading(movement, localBeat) {
        if (movement === null || movement === undefined) {
            return null;
        }

        if (isArcMovement(movement)) {
            return getArcTravelHeading(movement, localBeat);
        }

        if (
            typeof movement.getStartPosition !== "function" ||
            typeof movement.getEndPosition !== "function"
        ) {
            return null;
        }

        var start = movement.getStartPosition();
        var end = movement.getEndPosition();

        if (!start || !end) {
            return null;
        }

        return FieldOrientation.getTravelHeading(
            end.x - start.x,
            end.y - start.y
        );
    }

    function getMovementTargetHeading(movement, localBeat) {
        var travelHeading = getMovementTravelHeading(
            movement,
            localBeat
        );

        if (travelHeading !== null) {
            return travelHeading;
        }

        return getMovementOrientationHeading(movement, localBeat);
    }

    function getTargetHeading() {
        var context = getCurrentMovementContext();

        if (context === null) {
            return null;
        }

        return getMovementTargetHeading(
            context.movement,
            context.movementInfo.localBeat
        );
    }

    function getNextMovement() {
        var context = getCurrentMovementContext();

        if (context === null) {
            return null;
        }

        var movements = context.dot.getMovementCommands();
        var nextIndex = context.movementInfo.movementIndex + 1;

        if (!movements || nextIndex >= movements.length) {
            return null;
        }

        return movements[nextIndex];
    }

    function getNextTargetHeading() {
        var nextMovement = getNextMovement();

        if (nextMovement === null) {
            return null;
        }

        return getMovementTargetHeading(nextMovement, 0);
    }

    /* ------------------------------------------------------------
     * Heading / turn formatting
     * ------------------------------------------------------------ */

    function getTurnInstruction(currentHeading, targetHeading) {
        if (
            currentHeading === null ||
            targetHeading === null ||
            currentHeading === undefined ||
            targetHeading === undefined
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

    function formatHeading(heading) {
        if (heading === null || heading === undefined) {
            return "—";
        }

        return (
            FieldOrientation.getDirectionLabel(heading) +
            " " +
            Math.round(heading) +
            "°"
        );
    }

    function updateVisualCompass(currentHeading) {
        var targetHeading = getTargetHeading();
        var nextTargetHeading = getNextTargetHeading();
        var rose = $(".js-dotnav-compass-rose");
        var headingMarker = $(".js-dotnav-compass-heading-marker");
        var currentTargetMarker = $(
            ".js-dotnav-compass-current-target-marker"
        );
        var nextTargetMarker = $(
            ".js-dotnav-compass-next-target-marker"
        );

        $(".js-dotnav-compass-current").text(
            formatHeading(currentHeading)
        );
        $(".js-dotnav-compass-target").text(
            formatHeading(targetHeading)
        );
        $(".js-dotnav-compass-next-target").text(
            formatHeading(nextTargetHeading)
        );
        $(".js-dotnav-compass-turn").text(
            getTurnInstruction(currentHeading, targetHeading)
        );

        if (currentHeading === null || currentHeading === undefined) {
            headingMarker.hide();
            rose.css("transform", "rotate(0deg)");
        } else {
            headingMarker.show();
            rose.css("transform", "rotate(" + (-currentHeading) + "deg)");
        }

        if (targetHeading === null || targetHeading === undefined) {
            currentTargetMarker.hide();
        } else {
            currentTargetMarker
                .show()
                .css("transform", "rotate(" + targetHeading + "deg)");
        }

        if (
            nextTargetHeading === null ||
            nextTargetHeading === undefined
        ) {
            nextTargetMarker.hide();
        } else {
            nextTargetMarker
                .show()
                .css("transform", "rotate(" + nextTargetHeading + "deg)");
        }
    }

    /* ------------------------------------------------------------
     * SVG field geometry / pacing grid
     * ------------------------------------------------------------ */

    function getFieldGeometry(svg) {
        var svgWidth = parseFloat(svg.attr("width"));
        var svgHeight = parseFloat(svg.attr("height"));

        if (isNaN(svgWidth) || isNaN(svgHeight)) {
            return null;
        }

        var fieldWidth = svgWidth - FIELD_PADDING * 2;
        var fieldHeight = fieldWidth * FIELD_ASPECT_RATIO;
        var verticalPadding = (svgHeight - fieldHeight) / 2;

        return {
            svgWidth: svgWidth,
            svgHeight: svgHeight,
            xScale: function(step) {
                return (
                    FIELD_PADDING +
                    step / FIELD_STEPS_HORIZONTAL * fieldWidth
                );
            },
            yScale: function(step) {
                return (
                    verticalPadding +
                    step / FIELD_STEPS_VERTICAL * fieldHeight
                );
            }
        };
    }

    function getPacingLabel(step) {
        if (step === 32) {
            return "WH";
        }

        if (step === 52) {
            return "EH";
        }

        if (step < 32) {
            return String(Math.min(step, 32 - step));
        }

        if (step < 52) {
            return String(Math.min(step - 32, 52 - step));
        }

        return String(Math.min(step - 52, 84 - step));
    }

    function drawPacingGrid() {
        var svg = $(".js-grapher-draw-target svg");

        if (
            svg.length === 0 ||
            svg.find(".dotnav-pacing-grid").length !== 0
        ) {
            return;
        }

        var geometry = getFieldGeometry(svg);

        if (geometry === null) {
            return;
        }

        var xScale = geometry.xScale;
        var yScale = geometry.yScale;
        var svgSelection = d3.select(svg.get(0));
        var grid = svgSelection
            .append("g")
            .attr("class", "dotnav-pacing-grid");

        var splitSteps = [];
        var x;

        for (x = 4; x < FIELD_STEPS_HORIZONTAL; x += 4) {
            if (x % 8 !== 0) {
                splitSteps.push(x);
            }
        }

        grid
            .selectAll("line.dotnav-pacing-split")
            .data(splitSteps)
            .enter()
            .append("line")
            .attr("class", "dotnav-pacing-split")
            .attr("x1", function(step) {
                return xScale(step);
            })
            .attr("x2", function(step) {
                return xScale(step);
            })
            .attr("y1", yScale(0))
            .attr("y2", yScale(FIELD_STEPS_VERTICAL));

        var crossFieldSteps = [];
        var y;

        for (y = 2; y < FIELD_STEPS_VERTICAL; y += 2) {
            crossFieldSteps.push(y);
        }

        grid
            .selectAll("line.dotnav-pacing-crossfield")
            .data(crossFieldSteps)
            .enter()
            .append("line")
            .attr("class", function(step) {
                if (step === 32 || step === 52) {
                    return "dotnav-pacing-crossfield dotnav-pacing-hash";
                }

                return "dotnav-pacing-crossfield";
            })
            .attr("x1", xScale(0))
            .attr("x2", xScale(FIELD_STEPS_HORIZONTAL))
            .attr("y1", function(step) {
                return yScale(step);
            })
            .attr("y2", function(step) {
                return yScale(step);
            });

        var pacingColumnSteps = [40, 80, 120];
        var pacingLabels = [];
        var columnIndex;
        var labelStep;

        for (
            columnIndex = 0;
            columnIndex < pacingColumnSteps.length;
            columnIndex++
        ) {
            for (
                labelStep = 0;
                labelStep <= FIELD_STEPS_VERTICAL;
                labelStep += 2
            ) {
                pacingLabels.push({
                    x: pacingColumnSteps[columnIndex],
                    step: labelStep
                });
            }
        }

        grid
            .selectAll("text.dotnav-pacing-label")
            .data(pacingLabels)
            .enter()
            .append("text")
            .attr("class", function(label) {
                if (label.step === 32 || label.step === 52) {
                    return "dotnav-pacing-label dotnav-pacing-hash-label";
                }

                return "dotnav-pacing-label";
            })
            .attr("x", function(label) {
                return xScale(label.x) + 3;
            })
            .attr("y", function(label) {
                return yScale(label.step) + 1.5;
            })
            .text(function(label) {
                return getPacingLabel(label.step);
            });

        var dotsGroup = svg.find(".dots-wrap").get(0);

        if (dotsGroup) {
            svg.get(0).insertBefore(grid.node(), dotsGroup);
        }
    }

    /* ------------------------------------------------------------
     * Full current-stuntsheet route
     * ------------------------------------------------------------ */

    function appendRoutePoint(points, state) {
        if (
            !state ||
            typeof state.x !== "number" ||
            typeof state.y !== "number" ||
            isNaN(state.x) ||
            isNaN(state.y)
        ) {
            return;
        }

        if (points.length !== 0) {
            var previous = points[points.length - 1];

            if (
                Math.abs(previous.x - state.x) < 0.0001 &&
                Math.abs(previous.y - state.y) < 0.0001
            ) {
                return;
            }
        }

        points.push({
            x: state.x,
            y: state.y
        });
    }

    function appendMovementRoutePoints(points, movement) {
        if (!movement) {
            return;
        }

        if (
            typeof movement.getAnimationState === "function" &&
            typeof movement.getBeatDuration === "function"
        ) {
            var duration = Math.max(
                0,
                Math.round(movement.getBeatDuration())
            );
            var beat;

            for (beat = 0; beat <= duration; beat++) {
                appendRoutePoint(
                    points,
                    movement.getAnimationState(beat)
                );
            }

            return;
        }

        if (typeof movement.getStartPosition === "function") {
            appendRoutePoint(points, movement.getStartPosition());
        }

        if (typeof movement.getEndPosition === "function") {
            appendRoutePoint(points, movement.getEndPosition());
        }
    }

    function getCurrentSheetRoute() {
        var context = getCurrentMovementContext();

        if (context === null) {
            return null;
        }

        var movements = context.dot.getMovementCommands();

        if (!movements || movements.length === 0) {
            return null;
        }

        var segments = [];
        var finalPoint = null;
        var movementIndex;

        function addSegment(startState, endState, isPassed) {
            if (!startState || !endState) {
                return;
            }

            if (
                typeof startState.x !== "number" ||
                typeof startState.y !== "number" ||
                typeof endState.x !== "number" ||
                typeof endState.y !== "number"
            ) {
                return;
            }

            if (
                Math.abs(startState.x - endState.x) < 0.0001 &&
                Math.abs(startState.y - endState.y) < 0.0001
            ) {
                return;
            }

            segments.push({
                start: {
                    x: startState.x,
                    y: startState.y
                },
                end: {
                    x: endState.x,
                    y: endState.y
                },
                isPassed: isPassed
            });

            finalPoint = {
                x: endState.x,
                y: endState.y
            };
        }

        for (
            movementIndex = 0;
            movementIndex < movements.length;
            movementIndex++
        ) {
            var movement = movements[movementIndex];

            if (
                typeof movement.getAnimationState === "function" &&
                typeof movement.getBeatDuration === "function"
            ) {
                var duration = Math.max(
                    0,
                    Math.round(movement.getBeatDuration())
                );
                var previousState = movement.getAnimationState(0);
                var beat;

                if (previousState && finalPoint === null) {
                    finalPoint = {
                        x: previousState.x,
                        y: previousState.y
                    };
                }

                for (beat = 1; beat <= duration; beat++) {
                    var state = movement.getAnimationState(beat);
                    var isPassed = (
                        movementIndex < context.movementInfo.movementIndex ||
                        (
                            movementIndex ===
                                context.movementInfo.movementIndex &&
                            beat <= context.movementInfo.localBeat
                        )
                    );

                    addSegment(
                        previousState,
                        state,
                        isPassed
                    );

                    if (state) {
                        finalPoint = {
                            x: state.x,
                            y: state.y
                        };
                    }

                    previousState = state;
                }

                continue;
            }

            if (
                typeof movement.getStartPosition === "function" &&
                typeof movement.getEndPosition === "function"
            ) {
                var startPosition = movement.getStartPosition();
                var endPosition = movement.getEndPosition();

                addSegment(
                    startPosition,
                    endPosition,
                    movementIndex < context.movementInfo.movementIndex
                );

                if (endPosition) {
                    finalPoint = {
                        x: endPosition.x,
                        y: endPosition.y
                    };
                }
            }
        }

        if (segments.length === 0 || finalPoint === null) {
            return null;
        }

        var currentState = null;

        if (typeof context.movement.getAnimationState === "function") {
            currentState = context.movement.getAnimationState(
                context.movementInfo.localBeat
            );
        }

        if (!currentState) {
            currentState = segments[0].start;
        }

        return {
            segments: segments,
            current: {
                x: currentState.x,
                y: currentState.y
            },
            target: finalPoint
        };
    }

    function drawMovementRoute() {
        var svg = $(".js-grapher-draw-target svg");

        if (
            svg.length === 0 ||
            svg.find(".dotnav-route").length !== 0
        ) {
            return;
        }

        var route = getCurrentSheetRoute();

        if (route === null) {
            return;
        }

        var geometry = getFieldGeometry(svg);

        if (geometry === null) {
            return;
        }

        var svgSelection = d3.select(svg.get(0));
        var routeGroup = svgSelection
            .append("g")
            .attr("class", "dotnav-route");

        route.segments.forEach(function(segment) {
            routeGroup
                .append("line")
                .attr(
                    "class",
                    segment.isPassed ?
                        "dotnav-route-line dotnav-route-passed" :
                        "dotnav-route-line dotnav-route-remaining"
                )
                .attr("x1", geometry.xScale(segment.start.x))
                .attr("y1", geometry.yScale(segment.start.y))
                .attr("x2", geometry.xScale(segment.end.x))
                .attr("y2", geometry.yScale(segment.end.y));
        });

        /*
         * The selected-dot highlight already marks the marcher's current
         * position, so DotNav only adds the final-target X here.
         */
        var targetX = geometry.xScale(route.target.x);
        var targetY = geometry.yScale(route.target.y);
        var crossSize = 3 / navigationScale;

        routeGroup
            .append("line")
            .attr("class", "dotnav-route-target")
            .attr("x1", targetX - crossSize)
            .attr("y1", targetY - crossSize)
            .attr("x2", targetX + crossSize)
            .attr("y2", targetY + crossSize);

        routeGroup
            .append("line")
            .attr("class", "dotnav-route-target")
            .attr("x1", targetX + crossSize)
            .attr("y1", targetY - crossSize)
            .attr("x2", targetX - crossSize)
            .attr("y2", targetY + crossSize);

        var dotsGroup = svg.find(".dots-wrap").get(0);

        if (dotsGroup) {
            svg.get(0).insertBefore(routeGroup.node(), dotsGroup);
        }
    }

    /* ------------------------------------------------------------
     * Movement semantics
     * ------------------------------------------------------------ */

    function getMovementText(movement) {
        if (
            movement === null ||
            movement === undefined ||
            typeof movement.getContinuityText !== "function"
        ) {
            return "";
        }

        var movementText = movement.getContinuityText();

        if (movementText === null || movementText === undefined) {
            return "";
        }

        return String(movementText);
    }

    function getSheetContinuityText(sheet, selectedDot) {
        if (
            !sheet ||
            selectedDot === null ||
            selectedDot === undefined
        ) {
            return "";
        }

        var dotType = sheet.getDotType(selectedDot);
        var continuities = sheet.getContinuityTexts(dotType);

        if (!continuities) {
            return "";
        }

        return continuities.join(" | ").toUpperCase();
    }

    function getUniqueSemanticMatch(continuityText, candidates) {
        var matches = [];

        candidates.forEach(function(candidate) {
            if (candidate.pattern.test(continuityText)) {
                matches.push(candidate.label);
            }
        });

        if (matches.length === 1) {
            return matches[0];
        }

        return null;
    }

    function getMovementSemantic(movement, sheet, selectedDot) {
        var movementText = getMovementText(movement);
        var upperMovementText = movementText.toUpperCase();
        var continuityText = getSheetContinuityText(
            sheet,
            selectedDot
        );
        var start = (
            typeof movement.getStartPosition === "function" ?
                movement.getStartPosition() :
                null
        );
        var end = (
            typeof movement.getEndPosition === "function" ?
                movement.getEndPosition() :
                null
        );
        var isMoving = false;

        if (start && end) {
            isMoving = (
                Math.abs(end.x - start.x) > 0.001 ||
                Math.abs(end.y - start.y) > 0.001
            );
        }

        var pathType = "";

        if (isArcMovement(movement)) {
            pathType = "ARC";
        } else if (isEvenMovement(movement)) {
            pathType = "EVEN";
        }

        if (upperMovementText.indexOf("CLOSE") === 0) {
            return {
                stepType: "CLOSE",
                mode: "STOP",
                colorClass: "is-stop",
                pathType: pathType
            };
        }

        if (
            !isMoving &&
            /\bHUP\s+VAMP\b/.test(continuityText)
        ) {
            var conflictingMarkTechnique = (
                /\bMTHS\b/.test(continuityText) ||
                /\bMTMM\b/.test(continuityText)
            );

            if (!conflictingMarkTechnique) {
                return {
                    stepType: "HUP VAMP",
                    mode: "HOLD",
                    colorClass: "is-stop",
                    pathType: pathType
                };
            }
        }

        if (upperMovementText.indexOf("STAND & PLAY") === 0) {
            return {
                stepType: "STAND & PLAY",
                mode: "HOLD",
                colorClass: "is-stop",
                pathType: pathType
            };
        }

        if (upperMovementText.indexOf("MT ") === 0) {
            var markTechnique = getUniqueSemanticMatch(
                continuityText,
                [
                    {
                        label: "MTHS",
                        pattern: /\bMTHS\b/
                    },
                    {
                        label: "MTMM",
                        pattern: /\bMTMM\b/
                    },
                    {
                        label: "HUP VAMP",
                        pattern: /\bHUP\s+VAMP\b/
                    }
                ]
            );

            if (markTechnique === "HUP VAMP") {
                return {
                    stepType: "HUP VAMP",
                    mode: "HOLD",
                    colorClass: "is-stop",
                    pathType: pathType
                };
            }

            return {
                stepType: markTechnique || "MARK TIME",
                mode: "MARK TIME",
                colorClass: "is-mark-time",
                pathType: pathType
            };
        }

        if (isMoving) {
            var locomotionTechnique = getUniqueSemanticMatch(
                continuityText,
                [
                    {
                        label: "FMHS",
                        pattern: /\bFMHS\b/
                    },
                    {
                        label: "FMMM",
                        pattern: /\bFMMM\b/
                    },
                    {
                        label: "FMSH",
                        pattern: /\bFMSH\b/
                    },
                    {
                        label: "GVFW",
                        pattern: /\bGVFW\b/
                    }
                ]
            );

            if (
                locomotionTechnique === null &&
                isEvenMovement(movement)
            ) {
                locomotionTechnique = "EVEN MOVE";
            }

            if (
                locomotionTechnique === null &&
                isArcMovement(movement)
            ) {
                locomotionTechnique = "MOVE";
            }

            return {
                stepType: locomotionTechnique || "MOVE",
                mode: "MOVING",
                colorClass: "is-moving",
                pathType: pathType
            };
        }

        return {
            stepType: "UNCLASSIFIED",
            mode: "CURRENT",
            colorClass: "is-neutral",
            pathType: pathType
        };
    }

    /* ------------------------------------------------------------
     * Current-stuntsheet step / direction summary
     * ------------------------------------------------------------ */

    function getMovementDuration(movement) {
        if (
            !movement ||
            typeof movement.getBeatDuration !== "function"
        ) {
            return null;
        }

        var duration = movement.getBeatDuration();

        if (typeof duration !== "number" || isNaN(duration)) {
            return null;
        }

        return Math.max(0, Math.round(duration));
    }

    function getCompactDirection(heading) {
        if (
            heading === null ||
            heading === undefined
        ) {
            return null;
        }

        return FieldOrientation.getDirectionLabel(heading);
    }

    function getStepSegment(
        movement,
        sheet,
        selectedDot
    ) {
        var steps = getMovementDuration(movement);

        if (steps === null) {
            return null;
        }

        if (isArcMovement(movement)) {
            return {
                key: "ARC",
                steps: steps,
                label: "ARC"
            };
        }

        var travelHeading = getMovementTravelHeading(
            movement,
            0
        );

        if (travelHeading !== null) {
            var direction = getCompactDirection(travelHeading);

            return {
                key: "TRAVEL:" + direction,
                steps: steps,
                label: direction
            };
        }

        var semantic = getMovementSemantic(
            movement,
            sheet,
            selectedDot
        );
        var orientationHeading = getMovementOrientationHeading(
            movement,
            0
        );
        var faceDirection = getCompactDirection(
            orientationHeading
        );
        var actionLabel = semantic.stepType || "HOLD";

        if (faceDirection !== null) {
            actionLabel += " " + faceDirection;
        }

        return {
            key: "ACTION:" + actionLabel,
            steps: steps,
            label: actionLabel
        };
    }

    function mergeStepSegments(segments) {
        var merged = [];

        segments.forEach(function(segment) {
            if (
                segment === null ||
                segment.steps === null
            ) {
                return;
            }

            if (
                merged.length !== 0 &&
                merged[merged.length - 1].key === segment.key
            ) {
                merged[merged.length - 1].steps += segment.steps;
                return;
            }

            merged.push({
                key: segment.key,
                steps: segment.steps,
                label: segment.label
            });
        });

        return merged;
    }

    function getCurrentSheetPreview(context) {
        if (context === null) {
            return {
                title: "—",
                path: "—"
            };
        }

        var movements = context.dot.getMovementCommands();

        if (!movements || movements.length === 0) {
            return {
                title: "—",
                path: "—"
            };
        }

        var rawSegments = [];
        var totalSteps = 0;
        var movementIndex;

        for (
            movementIndex = 0;
            movementIndex < movements.length;
            movementIndex++
        ) {
            var segment = getStepSegment(
                movements[movementIndex],
                context.sheet,
                context.selectedDot
            );

            if (segment !== null) {
                rawSegments.push(segment);
                totalSteps += segment.steps;
            }
        }

        var segments = mergeStepSegments(rawSegments);
        var parts = segments.map(function(segment) {
            return segment.steps + " " + segment.label;
        });

        return {
            title:
                totalSteps +
                (totalSteps === 1 ? " STEP" : " STEPS"),
            path:
                parts.length !== 0 ?
                    parts.join(" + ") :
                    "—"
        };
    }

    function updateCurrentSheetPreview(context) {
        var preview = getCurrentSheetPreview(context);

        $(".js-dotnav-current-sheet-title").text(
            preview.title
        );
        $(".js-dotnav-current-sheet-path").text(
            preview.path
        );
    }

    /* ------------------------------------------------------------
     * NEXT movement preview
     * ------------------------------------------------------------ */

    function clearNextGuidance() {
        $(".dotnav-v1-next-card")
            .removeClass(
                "is-moving is-mark-time is-stop is-neutral"
            )
            .addClass("is-neutral");

        $(".js-dotnav-next-mode").text("—");
        $(".js-dotnav-next-primary").text("—");
        $(".js-dotnav-next-secondary").text("");
        $(".js-dotnav-next-timing").text("");
    }

    function getMovementPreview(movement, sheet, selectedDot) {
        if (movement === null || movement === undefined) {
            return null;
        }

        var semantic = getMovementSemantic(
            movement,
            sheet,
            selectedDot
        );
        var movementText = getMovementText(movement);
        var travelHeading = getMovementTravelHeading(movement, 0);
        var orientationHeading = getMovementOrientationHeading(
            movement,
            0
        );
        var targetHeading = getMovementTargetHeading(movement, 0);
        var duration = getMovementDuration(movement);
        var secondary = movementText;

        if (
            travelHeading !== null &&
            orientationHeading !== null &&
            Math.round(travelHeading) !== Math.round(orientationHeading)
        ) {
            secondary = "FACE " + formatHeading(orientationHeading);
        }

        if (
            semantic.mode === "HOLD" ||
            semantic.mode === "STOP" ||
            semantic.mode === "MARK TIME"
        ) {
            secondary = movementText;
        }

        var compactTarget =
            getCompactDirection(
                targetHeading
            );

        var primary =
            compactTarget !== null ?
                compactTarget :
                "—";

        if (duration !== null) {
            primary +=
                " · " +
                duration +
                (
                    duration === 1 ?
                        " STEP" :
                        " STEPS"
                );
        }

        return {
            mode: (
                semantic.stepType +
                (
                    semantic.pathType ?
                        " · " + semantic.pathType :
                        ""
                )
            ),
            primary: primary,
            secondary: secondary,
            targetHeading: targetHeading,
            colorClass: semantic.colorClass
        };
    }

    function applyNextGuidancePreview(
        preview,
        beatsRemaining,
        timingPrefix
    ) {
        if (preview === null) {
            return;
        }

        $(".dotnav-v1-next-card")
            .removeClass(
                "is-moving is-mark-time is-stop is-neutral"
            )
            .addClass(preview.colorClass || "is-neutral");

        $(".js-dotnav-next-mode").text(preview.mode);
        $(".js-dotnav-next-primary").text(preview.primary);
        $(".js-dotnav-next-secondary").text(preview.secondary);

        $(".js-dotnav-next-timing").text(
            (timingPrefix || "IN ") +
            beatsRemaining +
            (beatsRemaining === 1 ? " BEAT" : " BEATS")
        );
    }

    function updateNextGuidance(context) {
        clearNextGuidance();

        if (context === null) {
            return;
        }

        var movements = context.dot.getMovementCommands();
        var nextIndex = context.movementInfo.movementIndex + 1;
        var beatsRemaining = (
            context.movement.getBeatDuration() -
            context.movementInfo.localBeat
        );

        /*
         * First preference: the next MovementCommand in this sheet.
         */
        if (movements && nextIndex < movements.length) {
            applyNextGuidancePreview(
                getMovementPreview(
                    movements[nextIndex],
                    context.sheet,
                    context.selectedDot
                ),
                beatsRemaining,
                "IN "
            );
            return;
        }

        /*
         * If the current command is the last one in this sheet, preview the
         * selected marcher's FIRST movement in the next sheet instead of
         * leaving NEXT neutral. This is the common case where the old code
         * displayed "NEXT SHEET" but could not assign a semantic color.
         */
        var delegate = context.delegate;

        if (
            !delegate ||
            typeof delegate.hasNextSheet !== "function" ||
            !delegate.hasNextSheet()
        ) {
            $(".js-dotnav-next-mode").text("END");
            $(".js-dotnav-next-primary").text("—");
            return;
        }

        var show = delegate.getShow();
        var nextSheetIndex = delegate.getCurrentSheetNum() + 1;
        var nextSheet = show.getSheet(nextSheetIndex);
        var nextDot = nextSheet.getDotByLabel(context.selectedDot);

        if (nextDot === null || nextDot === undefined) {
            $(".js-dotnav-next-mode").text("NEXT SHEET");
            $(".js-dotnav-next-primary").text("—");
            $(".js-dotnav-next-timing").text(
                "IN " +
                beatsRemaining +
                (beatsRemaining === 1 ? " BEAT" : " BEATS")
            );
            return;
        }

        var nextSheetMovements = nextDot.getMovementCommands();

        if (!nextSheetMovements || nextSheetMovements.length === 0) {
            $(".js-dotnav-next-mode").text("NEXT SHEET");
            $(".js-dotnav-next-primary").text("—");
            $(".js-dotnav-next-timing").text(
                "IN " +
                beatsRemaining +
                (beatsRemaining === 1 ? " BEAT" : " BEATS")
            );
            return;
        }

        var nextSheetPreview = getMovementPreview(
            nextSheetMovements[0],
            nextSheet,
            context.selectedDot
        );

        applyNextGuidancePreview(
            nextSheetPreview,
            beatsRemaining,
            "NEXT SS · IN "
        );
    }

    /* ------------------------------------------------------------
     * Current guidance
     * ------------------------------------------------------------ */

    function updateMovementGuidance() {
        var context = getCurrentMovementContext();
        var guidanceCard = $(".dotnav-guidance-primary");
        var stepTypeLabel = $(".js-dotnav-step-type");
        var modeLabel = $(".js-dotnav-mode");
        var pathTypeLabel = $(".js-dotnav-path-type");
        var countdown = $(".js-dotnav-countdown");

        guidanceCard.removeClass(
            "is-moving is-mark-time is-stop is-neutral"
        );

        countdown
            .text("")
            .removeClass("is-active");

        stepTypeLabel.text("—");
        modeLabel.text("CURRENT");
        pathTypeLabel.text("");

        if (context === null) {
            guidanceCard.addClass("is-neutral");
            clearNextGuidance();
            updateCurrentSheetPreview(null);
            return;
        }

        var movement = context.movement;
        var movementInfo = context.movementInfo;
        var semantic = getMovementSemantic(
            movement,
            context.sheet,
            context.selectedDot
        );

        updateNextGuidance(context);
        updateCurrentSheetPreview(context);

        guidanceCard.addClass(semantic.colorClass);
        stepTypeLabel.text(semantic.stepType);
        modeLabel.text(semantic.mode);
        pathTypeLabel.text(semantic.pathType);

        var duration = movement.getBeatDuration();
        var remaining = duration - movementInfo.localBeat;

        if (remaining >= 1 && remaining <= 4) {
            countdown.text(remaining === 1 ? "1!" : remaining);
            countdown.addClass("is-active");
        }

        var travelHeading = getMovementTravelHeading(
            movement,
            movementInfo.localBeat
        );
        var orientationHeading = getMovementOrientationHeading(
            movement,
            movementInfo.localBeat
        );
        var targetHeading = getMovementTargetHeading(
            movement,
            movementInfo.localBeat
        );

        $(".js-dotnav-travel").text(formatHeading(travelHeading));
        $(".js-dotnav-orient").text(formatHeading(orientationHeading));
        $(".js-dotnav-target").text(formatHeading(targetHeading));

        context.state.controller._dotNavTargetHeading = targetHeading;
    }

    /* ------------------------------------------------------------
     * Zoomed navigation dot labels
     *
     * In heading-up / zoomed mode, show the labels of dots that are
     * currently inside the visible map viewport. Labels are rendered
     * in a separate root-level SVG group so they stay screen-upright
     * even while the field rotates.
     * ------------------------------------------------------------ */

    var nearbyDotLabelCacheKey = null;
    var nearbyDotLabelCache = [];
    var lastNearbyDotLabelRenderTime = 0;
    var nearbyDotLabelRenderIntervalMs = 100;

    function clearNearbyDotLabels() {
        $(".js-grapher-draw-target svg .dotnav-nearby-labels").remove();
        nearbyDotLabelCacheKey = null;
        nearbyDotLabelCache = [];
        lastNearbyDotLabelRenderTime = 0;
    }

    function isLandscapeNavigationView() {
        return (
            window.matchMedia &&
            window.matchMedia("(orientation: landscape)").matches
        );
    }

    function getNavigationViewportNode() {
        if (isLandscapeNavigationView()) {
            var mapCard = $(".dotnav-v1-map-card").get(0);

            if (mapCard) {
                return mapCard;
            }
        }

        return graphContainer.get(0);
    }

    function getDotLabelCssMetrics() {
        if (zoomMode === "2yl") {
            return {
                fontSize: 7.5,
                selectedFontSize: 8.5,
                strokeWidth: 1.1
            };
        }

        if (zoomMode === "4yl") {
            return {
                fontSize: 6.5,
                selectedFontSize: 7.5,
                strokeWidth: 1.0
            };
        }

        /*
         * NORMAL: transformed dot boxes are much smaller, so keep labels
         * inside the square instead of letting the text dominate the map.
         */
        if (isLandscapeNavigationView()) {
            return {
                fontSize: 3.0,
                selectedFontSize: 4.0,
                strokeWidth: 0.55
            };
        }

        return {
            fontSize: 4.5,
            selectedFontSize: 5.5,
            strokeWidth: 0.75
        };
    }

    function getDotAnimationStateAtBeat(dot, beat) {
        if (!dot || typeof dot.getMovementAtBeat !== "function") {
            return null;
        }

        var movementInfo = dot.getMovementAtBeat(beat);

        if (
            movementInfo === null ||
            movementInfo === undefined ||
            !movementInfo.movement
        ) {
            return null;
        }

        var movement = movementInfo.movement;

        if (typeof movement.getAnimationState === "function") {
            var state = movement.getAnimationState(
                movementInfo.localBeat || 0
            );

            if (
                state &&
                typeof state.x === "number" &&
                typeof state.y === "number"
            ) {
                return state;
            }
        }

        if (typeof movement.getStartPosition === "function") {
            var start = movement.getStartPosition();

            if (
                start &&
                typeof start.x === "number" &&
                typeof start.y === "number"
            ) {
                return start;
            }
        }

        return null;
    }

    function buildNearbyDotLabelCache(context, geometry) {
        if (
            context === null ||
            !context.state ||
            !context.state.controller ||
            typeof context.state.controller.getShow !== "function"
        ) {
            nearbyDotLabelCacheKey = null;
            nearbyDotLabelCache = [];
            return;
        }

        var show = context.state.controller.getShow();

        if (
            !show ||
            typeof show.getDotLabels !== "function"
        ) {
            nearbyDotLabelCacheKey = null;
            nearbyDotLabelCache = [];
            return;
        }

        var sheetNumber = (
            typeof context.delegate.getCurrentSheetNum === "function" ?
                context.delegate.getCurrentSheetNum() :
                0
        );

        var cacheKey = (
            sheetNumber +
            ":" +
            context.beat +
            ":" +
            context.selectedDot
        );

        if (cacheKey === nearbyDotLabelCacheKey) {
            return;
        }

        nearbyDotLabelCacheKey = cacheKey;
        nearbyDotLabelCache = [];

        show.getDotLabels().forEach(function(label) {
            var dot = context.sheet.getDotByLabel(label);

            if (dot === null || dot === undefined) {
                return;
            }

            var state = getDotAnimationStateAtBeat(
                dot,
                context.beat
            );

            if (state === null) {
                return;
            }

            nearbyDotLabelCache.push({
                label: label,
                x: geometry.xScale(state.x),
                y: geometry.yScale(state.y),
                isSelected: label === context.selectedDot
            });
        });
    }

    function updateNearbyDotLabels(svg, geometry, matrixValues) {
        var now = Date.now();
        var existingLabelGroup = (
            svg && svg.length ?
                svg.find(".dotnav-nearby-labels") :
                $()
        );
        var overlayWasCleared = existingLabelGroup.length === 0;

        /*
         * Grapher clears every SVG child on each beat. If that just happened,
         * redraw the overlay immediately instead of obeying the normal sensor
         * throttle. This prevents the label layer from blinking off between
         * beats in Safari.
         */
        if (
            !overlayWasCleared &&
            now - lastNearbyDotLabelRenderTime <
            nearbyDotLabelRenderIntervalMs
        ) {
            return;
        }

        lastNearbyDotLabelRenderTime = now;

        var context = getCurrentMovementContext();

        if (
            context === null ||
            !matrixValues ||
            !svg ||
            svg.length === 0
        ) {
            clearNearbyDotLabels();
            return;
        }

        buildNearbyDotLabelCache(context, geometry);

        var svgNode = svg.get(0);
        var containerNode = getNavigationViewportNode();

        if (!svgNode || !containerNode) {
            clearNearbyDotLabels();
            return;
        }

        var svgWidth = parseFloat(svg.attr("width"));
        var svgHeight = parseFloat(svg.attr("height"));
        var svgRect = svgNode.getBoundingClientRect();
        var containerRect = containerNode.getBoundingClientRect();

        if (
            isNaN(svgWidth) ||
            isNaN(svgHeight) ||
            svgRect.width <= 0 ||
            svgRect.height <= 0 ||
            containerRect.width <= 0 ||
            containerRect.height <= 0
        ) {
            return;
        }

        /*
         * Convert the clipped CSS viewport into SVG user coordinates.
         */
        var cssToSvgX = svgWidth / svgRect.width;
        var cssToSvgY = svgHeight / svgRect.height;

        var visibleLeft =
            (containerRect.left - svgRect.left) * cssToSvgX;
        var visibleRight =
            (containerRect.right - svgRect.left) * cssToSvgX;
        var visibleTop =
            (containerRect.top - svgRect.top) * cssToSvgY;
        var visibleBottom =
            (containerRect.bottom - svgRect.top) * cssToSvgY;

        /*
         * Keep text approximately 11 CSS px regardless of SVG dimensions.
         */
        var cssPxToSvg = (
            cssToSvgX + cssToSvgY
        ) / 2;

        /*
         * Symbols sit directly inside each dot square. NORMAL uses smaller
         * type because its transformed dot boxes are much smaller than the
         * 4 YL / 2 YL views.
         */
        var labelMetrics = getDotLabelCssMetrics();
        var fontSize = labelMetrics.fontSize * cssPxToSvg;
        var selectedFontSize =
            labelMetrics.selectedFontSize * cssPxToSvg;
        var strokeWidth =
            labelMetrics.strokeWidth * cssPxToSvg;
        var edgePadding = 8 * cssPxToSvg;

        var labelGroup = svg.find(".dotnav-nearby-labels");

        if (labelGroup.length === 0) {
            labelGroup = $(
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "g"
                )
            )
                .attr("class", "dotnav-nearby-labels")
                .appendTo(svg);
        }

        labelGroup.empty();

        nearbyDotLabelCache.forEach(function(dotLabel) {
            var sourceX = dotLabel.x;
            var sourceY = dotLabel.y;

            /*
             * Grapher is the visual source of truth for the selected marcher.
             * Use its exact selected-dot-highlight center so the B4/A8/etc.
             * symbol cannot drift inside the pink ring because of beat
             * interpretation differences in the overlay cache.
             */
            if (
                dotLabel.isSelected &&
                typeof matrixValues.selectedDotX === "number" &&
                typeof matrixValues.selectedDotY === "number"
            ) {
                sourceX = matrixValues.selectedDotX;
                sourceY = matrixValues.selectedDotY;
            }

            var screenX = (
                matrixValues.a * sourceX +
                matrixValues.c * sourceY +
                matrixValues.e
            );

            var screenY = (
                matrixValues.b * sourceX +
                matrixValues.d * sourceY +
                matrixValues.f
            );

            if (
                screenX < visibleLeft + edgePadding ||
                screenX > visibleRight - edgePadding ||
                screenY < visibleTop + edgePadding ||
                screenY > visibleBottom - edgePadding
            ) {
                return;
            }

            var text = $(
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "text"
                )
            );

            text
                .attr("x", screenX)
                .attr("y", screenY)
                .attr("class", (
                    dotLabel.isSelected ?
                        "dotnav-nearby-dot-label is-selected" :
                        "dotnav-nearby-dot-label"
                ))
                .attr("font-size", (
                    dotLabel.isSelected ?
                        selectedFontSize :
                        fontSize
                ))
                .attr("font-family", "Open Sans, Arial, sans-serif")
                .attr("font-weight", dotLabel.isSelected ? "800" : "700")
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central")
                .attr("fill", dotLabel.isSelected ? "#ffd84a" : "#ffffff")
                .attr("stroke", "#0b315d")
                .attr("stroke-width", strokeWidth)
                .attr("paint-order", "stroke")
                .attr("stroke-linejoin", "round")
                .attr("pointer-events", "none")
                .text(dotLabel.label)
                .appendTo(labelGroup);
        });
    }

    /* ------------------------------------------------------------
     * Heading-up field
     * ------------------------------------------------------------ */

    function applyHeadingUpView(fieldHeading) {
        var svg = $(".js-grapher-draw-target svg");

        if (svg.length === 0) {
            return;
        }

        var selectedDot = svg.find(".selected-dot-highlight").get(0);

        if (!selectedDot) {
            resetHeadingUpView();
            return;
        }

        var svgWidth = parseFloat(svg.attr("width"));
        var svgHeight = parseFloat(svg.attr("height"));
        var dotX = parseFloat(selectedDot.getAttribute("cx"));
        var dotY = parseFloat(selectedDot.getAttribute("cy"));

        if (
            isNaN(svgWidth) ||
            isNaN(svgHeight) ||
            isNaN(dotX) ||
            isNaN(dotY)
        ) {
            return;
        }

        /*
         * Anchor the selected marcher relative to the visible map viewport,
         * not the full SVG canvas. The graph can be taller than the clipped
         * mobile viewport, so svgHeight / 2 does not necessarily look centered
         * on screen.
         *
         * Target:
         *   horizontal = 50% of visible map
         *   vertical   = 31% from top
         */
        var svgNode = svg.get(0);
        var containerNode = getNavigationViewportNode();
        var screenX = svgWidth / 2;
        var screenY = svgHeight * 0.6;

        if (isLandscapeNavigationView() && svgNode && containerNode) {
            /*
             * Landscape:
             * use ONE visual anchor for NORMAL / 4 YL / 2 YL.
             *
             * Convert the desired point in the visible map card from browser
             * screen pixels into the root SVG coordinate system. This avoids
             * Safari clipping/scaling errors and keeps the selected marcher
             * at the same visual location regardless of zoom level.
             */
            var mapRect = containerNode.getBoundingClientRect();
            var targetPixelX =
                mapRect.left + mapRect.width * 0.50;
            var targetPixelY =
                mapRect.top + mapRect.height * 0.47;

            var screenCTM = svgNode.getScreenCTM();

            if (
                screenCTM &&
                typeof window.DOMPoint === "function"
            ) {
                var targetPoint = new window.DOMPoint(
                    targetPixelX,
                    targetPixelY
                ).matrixTransform(screenCTM.inverse());

                screenX = targetPoint.x;
                screenY = targetPoint.y;
            } else {
                var svgRect = svgNode.getBoundingClientRect();

                if (
                    svgRect.width > 0 &&
                    svgRect.height > 0
                ) {
                    screenX =
                        (targetPixelX - svgRect.left) *
                        (svgWidth / svgRect.width);

                    screenY =
                        (targetPixelY - svgRect.top) *
                        (svgHeight / svgRect.height);
                }
            }
        } else if (svgNode && containerNode) {
            var svgRect = svgNode.getBoundingClientRect();
            var containerRect = containerNode.getBoundingClientRect();

            if (
                svgRect.width > 0 &&
                svgRect.height > 0 &&
                containerRect.width > 0 &&
                containerRect.height > 0
            ) {
                var targetPixelX =
                    containerRect.left + containerRect.width * 0.5;
                var targetPixelY =
                    containerRect.top + containerRect.height * 0.31;

                screenX =
                    (targetPixelX - svgRect.left) *
                    (svgWidth / svgRect.width);

                screenY =
                    (targetPixelY - svgRect.top) *
                    (svgHeight / svgRect.height);
            }
        }

        var rotationDegrees = -(fieldHeading + 90);
        var rotationRadians = rotationDegrees * Math.PI / 180;
        var cosValue = Math.cos(rotationRadians);
        var sinValue = Math.sin(rotationRadians);
        var a = navigationScale * cosValue;
        var b = navigationScale * sinValue;
        var c = -navigationScale * sinValue;
        var d = navigationScale * cosValue;
        var e = screenX - a * dotX - c * dotY;
        var f = screenY - b * dotX - d * dotY;
        var matrix = (
            "matrix(" +
            a + " " +
            b + " " +
            c + " " +
            d + " " +
            e + " " +
            f +
            ")"
        );

        svg.children("g")
            .not(".dotnav-nearby-labels")
            .attr("transform", matrix);

        updateNearbyDotLabels(
            svg,
            getFieldGeometry(svg),
            {
                a: a,
                b: b,
                c: c,
                d: d,
                e: e,
                f: f,
                selectedDotX: dotX,
                selectedDotY: dotY
            }
        );
    }

    function resetHeadingUpView() {
        $(".js-grapher-draw-target svg")
            .children("g")
            .not(".dotnav-nearby-labels")
            .attr("transform", null);

        clearNearbyDotLabels();
    }

    /* ------------------------------------------------------------
     * Grapher redraw handling
     * ------------------------------------------------------------ */

    function refreshDotNavField() {
        drawPacingGrid();
        drawMovementRoute();
        updateMovementGuidance();
        updateVisualCompass(lastFieldHeading);

        if (lastFieldHeading !== null) {
            applyHeadingUpView(lastFieldHeading);
        }
    }

    var graphElement = $(".js-grapher-draw-target").get(0);

    if (
        graphElement &&
        typeof window.MutationObserver !== "undefined"
    ) {
        function isNearbyLabelNode(node) {
            if (!node || node.nodeType !== 1) {
                return false;
            }

            var $node = $(node);

            return (
                $node.hasClass("dotnav-nearby-labels") ||
                $node.hasClass("dotnav-nearby-dot-label") ||
                $node.closest(".dotnav-nearby-labels").length > 0
            );
        }

        function isNearbyLabelOnlyMutation(mutation) {
            if (
                mutation.target &&
                mutation.target.nodeType === 1 &&
                $(mutation.target)
                    .closest(".dotnav-nearby-labels")
                    .length > 0
            ) {
                return true;
            }

            var changedNodes = [];

            if (mutation.addedNodes) {
                changedNodes = changedNodes.concat(
                    Array.prototype.slice.call(mutation.addedNodes)
                );
            }

            if (mutation.removedNodes) {
                changedNodes = changedNodes.concat(
                    Array.prototype.slice.call(mutation.removedNodes)
                );
            }

            if (changedNodes.length === 0) {
                return false;
            }

            return changedNodes.every(isNearbyLabelNode);
        }

        var graphObserver = new window.MutationObserver(function(mutations) {
            var hasRealGraphMutation = mutations.some(function(mutation) {
                return !isNearbyLabelOnlyMutation(mutation);
            });

            if (hasRealGraphMutation) {
                refreshDotNavField();
            }
        });

        graphObserver.observe(
            graphElement,
            {
                childList: true,
                subtree: true
            }
        );
    }

    /* ------------------------------------------------------------
     * Viewport / orientation changes
     * ------------------------------------------------------------ */

    var viewportRefreshTimer = null;

    $(window).on("resize orientationchange", function() {
        if (viewportRefreshTimer !== null) {
            window.clearTimeout(viewportRefreshTimer);
        }

        viewportRefreshTimer = window.setTimeout(function() {
            viewportRefreshTimer = null;

            /*
             * CSS handles the portrait/landscape layout itself.
             * Re-apply only the map transform here so the selected marcher
             * remains anchored correctly after the visible map rectangle
             * changes size.
             */
            if (lastFieldHeading !== null) {
                applyHeadingUpView(lastFieldHeading);
            }
        }, 140);
    });

    /* ------------------------------------------------------------
     * Device orientation / field offset calibration
     * ------------------------------------------------------------ */

    function applyRawHeading(rawHeading) {
        if (fieldEastHeading === null) {
            lastFieldHeading = null;

            $(".js-dotnav-phone-heading").text(
                "Raw " +
                Math.round(rawHeading) +
                "° · point phone toward Field East, then tap Recalibrate"
            );

            updateVisualCompass(null);
            resetHeadingUpView();
            return;
        }

        var fieldHeading = FieldOrientation.toFieldHeading(
            rawHeading,
            fieldEastHeading
        );

        lastFieldHeading = fieldHeading;

        var direction = FieldOrientation.getDirectionLabel(fieldHeading);
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
            "° · East offset " +
            Math.round(fieldEastHeading) +
            "°)" +
            " | " +
            turnInstruction
        );

        updateVisualCompass(fieldHeading);
        applyHeadingUpView(fieldHeading);
    }

    function getOrientationReading(event) {
        if (
            typeof event.webkitCompassHeading === "number" &&
            !isNaN(event.webkitCompassHeading)
        ) {
            return {
                rawHeading: FieldOrientation.normalizeDegrees(
                    event.webkitCompassHeading
                ),
                isAbsolute: true,
                source: "webkitCompassHeading"
            };
        }

        if (
            typeof event.alpha !== "number" ||
            isNaN(event.alpha)
        ) {
            return null;
        }

        var rawHeading = FieldOrientation.normalizeDegrees(
            360 - event.alpha
        );

        if (event.type === "deviceorientationabsolute") {
            return {
                rawHeading: rawHeading,
                isAbsolute: true,
                source: "deviceorientationabsolute"
            };
        }

        if (event.absolute === true) {
            return {
                rawHeading: rawHeading,
                isAbsolute: true,
                source: "deviceorientation-absolute"
            };
        }

        return {
            rawHeading: rawHeading,
            isAbsolute: false,
            source: "deviceorientation-relative"
        };
    }

    function handleDeviceOrientation(event) {
        ensureFieldSelectionState();

        if (selectedVenue === null) {
            return;
        }

        var reading = getOrientationReading(event);

        if (reading === null) {
            $(".js-dotnav-phone-heading").text("No heading data");
            updateVisualCompass(null);
            return;
        }

        if (reading.isAbsolute) {
            absoluteHeadingSeen = true;
        } else if (
            absoluteHeadingSeen &&
            fieldEastHeadingIsAbsolute !== false
        ) {
            return;
        }

        var isManualField = $(".js-dotnav-field").val() === "manual";

        if (!reading.isAbsolute && !isManualField) {
            lastFieldHeading = null;

            $(".js-dotnav-phone-heading").text(
                "Absolute compass unavailable — use Manual / Other"
            );

            updateVisualCompass(null);
            resetHeadingUpView();
            return;
        }

        if (
            isManualField &&
            fieldEastHeading !== null &&
            fieldEastHeadingIsAbsolute !== null &&
            fieldEastHeadingIsAbsolute !== reading.isAbsolute
        ) {
            return;
        }

        lastRawHeading = reading.rawHeading;
        lastRawHeadingIsAbsolute = reading.isAbsolute;

        applyRawHeading(reading.rawHeading);
    }

    /* ------------------------------------------------------------
     * Initial UI
     * ------------------------------------------------------------ */

    clearNextGuidance();
    updateCurrentSheetPreview(null);
    updateVisualCompass(null);
});
