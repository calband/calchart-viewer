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
    var lastFieldHeading = null;
    var navigationScale = 2.3;

    var FIELD_STEPS_HORIZONTAL = 160;
    var FIELD_STEPS_VERTICAL = 84;
    var FIELD_PADDING = 10;
    var FIELD_ASPECT_RATIO = 0.5333;

    /* ------------------------------------------------------------
     * Field selection
     * ------------------------------------------------------------ */

    $(".js-dotnav-field").change(function() {
        var venueId = $(this).val();
        selectedVenue = FieldOrientation.VENUES[venueId] || null;

        if (selectedVenue === null) {
            console.log("[DotNav] No field selected");
            $(".js-dotnav-phone-heading").text("Select field");
            lastFieldHeading = null;
            resetHeadingUpView();
            updateVisualCompass(null);
            return;
        }

        console.log(
            "[DotNav] Field:",
            selectedVenue.name,
            "East heading:",
            selectedVenue.eastHeading
        );

        updateVisualCompass(lastFieldHeading);
    });

    /* ------------------------------------------------------------
     * Compass permission
     * ------------------------------------------------------------ */

    $(".js-dotnav-enable-compass").click(function() {
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

        window.addEventListener(
            "deviceorientation",
            handleDeviceOrientation
        );

        $(".js-dotnav-phone-heading").text(
            "Waiting for heading..."
        );

        updateVisualCompass(null);
    }

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

        var controller =
            window.ApplicationController.getInstance();

        var delegate =
            controller.getAnimationStateDelegate();

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

        var dot =
            sheet.getDotByLabel(
                selectedDot
            );

        if (dot === null) {
            return null;
        }

        var movementInfo =
            dot.getMovementAtBeat(
                beat
            );

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

        return FieldOrientation.normalizeDegrees(
            angle + 90
        );
    }

    function getMovementOrientationHeading(
        movement,
        localBeat
    ) {
        if (
            movement === null ||
            movement === undefined
        ) {
            return null;
        }

        if (
            typeof movement.getAnimationState ===
            "function"
        ) {
            var animationState =
                movement.getAnimationState(
                    localBeat || 0
                );

            if (
                animationState !== null &&
                animationState !== undefined &&
                typeof animationState.angle ===
                "number"
            ) {
                return grapherAngleToFieldHeading(
                    animationState.angle
                );
            }
        }

        if (
            typeof movement.getOrientation ===
            "function"
        ) {
            return FieldOrientation.getHeadingForDirection(
                movement.getOrientation()
            );
        }

        return null;
    }

    /*
     * Arc target heading is the local direction of travel.
     *
     * Instead of drawing a straight heading toward the final
     * endpoint, find the nearest changed arc position and use
     * that small segment as the local travel/tangent vector.
     */

    function getArcTravelHeading(
        movement,
        localBeat
    ) {
        if (
            !isArcMovement(movement) ||
            typeof movement.getAnimationState !==
                "function" ||
            typeof movement.getBeatDuration !==
                "function"
        ) {
            return null;
        }

        var duration =
            movement.getBeatDuration();

        var beat =
            Math.max(
                0,
                Math.min(
                    localBeat || 0,
                    duration
                )
            );

        var currentState =
            movement.getAnimationState(
                beat
            );

        if (
            currentState === null ||
            currentState === undefined
        ) {
            return null;
        }

        var epsilon = 0.0001;
        var futureBeat;

        for (
            futureBeat = beat + 1;
            futureBeat <= duration;
            futureBeat++
        ) {
            var futureState =
                movement.getAnimationState(
                    futureBeat
                );

            var dx =
                futureState.x -
                currentState.x;

            var dy =
                futureState.y -
                currentState.y;

            if (
                Math.abs(dx) > epsilon ||
                Math.abs(dy) > epsilon
            ) {
                return FieldOrientation.getTravelHeading(
                    dx,
                    dy
                );
            }
        }

        var previousBeat;

        for (
            previousBeat = beat - 1;
            previousBeat >= 0;
            previousBeat--
        ) {
            var previousState =
                movement.getAnimationState(
                    previousBeat
                );

            var previousDx =
                currentState.x -
                previousState.x;

            var previousDy =
                currentState.y -
                previousState.y;

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

    function getMovementTravelHeading(
        movement,
        localBeat
    ) {
        if (
            movement === null ||
            movement === undefined
        ) {
            return null;
        }

        if (isArcMovement(movement)) {
            return getArcTravelHeading(
                movement,
                localBeat
            );
        }

        if (
            typeof movement.getStartPosition !==
                "function" ||
            typeof movement.getEndPosition !==
                "function"
        ) {
            return null;
        }

        var start =
            movement.getStartPosition();

        var end =
            movement.getEndPosition();

        if (!start || !end) {
            return null;
        }

        return FieldOrientation.getTravelHeading(
            end.x - start.x,
            end.y - start.y
        );
    }

    function getMovementTargetHeading(
        movement,
        localBeat
    ) {
        var travelHeading =
            getMovementTravelHeading(
                movement,
                localBeat
            );

        /*
         * Translating:
         * TARGET = MOVE
         */

        if (travelHeading !== null) {
            return travelHeading;
        }

        /*
         * Stationary:
         * TARGET = ORIENT
         */

        return getMovementOrientationHeading(
            movement,
            localBeat
        );
    }

    function getTargetHeading() {
        var context =
            getCurrentMovementContext();

        if (context === null) {
            return null;
        }

        return getMovementTargetHeading(
            context.movement,
            context.movementInfo.localBeat
        );
    }

    function getNextMovement() {
        var context =
            getCurrentMovementContext();

        if (context === null) {
            return null;
        }

        var movements =
            context.dot.getMovementCommands();

        var nextIndex =
            context.movementInfo.movementIndex +
            1;

        if (
            !movements ||
            nextIndex >= movements.length
        ) {
            return null;
        }

        return movements[nextIndex];
    }

    function getNextTargetHeading() {
        var nextMovement =
            getNextMovement();

        if (nextMovement === null) {
            return null;
        }

        return getMovementTargetHeading(
            nextMovement,
            0
        );
    }

    /* ------------------------------------------------------------
     * Heading / turn formatting
     * ------------------------------------------------------------ */

    function getTurnInstruction(
        currentHeading,
        targetHeading
    ) {
        if (
            currentHeading === null ||
            targetHeading === null ||
            currentHeading === undefined ||
            targetHeading === undefined
        ) {
            return "TURN —";
        }

        var turnError =
            FieldOrientation.getTurnError(
                currentHeading,
                targetHeading
            );

        var roundedTurn =
            Math.round(
                turnError
            );

        var absoluteTurn =
            Math.abs(
                roundedTurn
            );

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

    function formatHeading(heading) {
        if (
            heading === null ||
            heading === undefined
        ) {
            return "—";
        }

        return (
            FieldOrientation.getDirectionLabel(
                heading
            ) +
            " " +
            Math.round(
                heading
            ) +
            "°"
        );
    }

    function updateVisualCompass(
        currentHeading
    ) {
        var targetHeading =
            getTargetHeading();

        var nextTargetHeading =
            getNextTargetHeading();

        var rose =
            $(".js-dotnav-compass-rose");

        var headingMarker =
            $(".js-dotnav-compass-heading-marker");

        var currentTargetMarker =
            $(
                ".js-dotnav-compass-current-target-marker"
            );

        var nextTargetMarker =
            $(
                ".js-dotnav-compass-next-target-marker"
            );

        /*
         * Readouts
         */

        $(".js-dotnav-compass-current")
            .text(
                formatHeading(
                    currentHeading
                )
            );

        $(".js-dotnav-compass-target")
            .text(
                formatHeading(
                    targetHeading
                )
            );

        $(".js-dotnav-compass-next-target")
            .text(
                formatHeading(
                    nextTargetHeading
                )
            );

        $(".js-dotnav-compass-turn")
            .text(
                getTurnInstruction(
                    currentHeading,
                    targetHeading
                )
            );

        /*
         * BLUE
         *
         * Phone/self remains screen-up.
         * Field compass rose rotates underneath it.
         */

        if (
            currentHeading === null ||
            currentHeading === undefined
        ) {
            headingMarker.hide();

            rose.css(
                "transform",
                "rotate(0deg)"
            );

        } else {
            headingMarker.show();

            rose.css(
                "transform",
                "rotate(" +
                (-currentHeading) +
                "deg)"
            );
        }

        /*
         * RED
         *
         * Current required target.
         */

        if (
            targetHeading === null ||
            targetHeading === undefined
        ) {
            currentTargetMarker.hide();

        } else {
            currentTargetMarker
                .show()
                .css(
                    "transform",
                    "rotate(" +
                    targetHeading +
                    "deg)"
                );
        }

        /*
         * YELLOW
         *
         * Next required target.
         */

        if (
            nextTargetHeading === null ||
            nextTargetHeading === undefined
        ) {
            nextTargetMarker.hide();

        } else {
            nextTargetMarker
                .show()
                .css(
                    "transform",
                    "rotate(" +
                    nextTargetHeading +
                    "deg)"
                );
        }
    }

    /* ------------------------------------------------------------
     * SVG field geometry / pacing grid
     * ------------------------------------------------------------ */

    function getFieldGeometry(svg) {
        var svgWidth =
            parseFloat(
                svg.attr("width")
            );

        var svgHeight =
            parseFloat(
                svg.attr("height")
            );

        if (
            isNaN(svgWidth) ||
            isNaN(svgHeight)
        ) {
            return null;
        }

        var fieldWidth =
            svgWidth -
            FIELD_PADDING * 2;

        var fieldHeight =
            fieldWidth *
            FIELD_ASPECT_RATIO;

        var verticalPadding =
            (
                svgHeight -
                fieldHeight
            ) / 2;

        return {
            svgWidth: svgWidth,
            svgHeight: svgHeight,

            xScale: function(step) {
                return (
                    FIELD_PADDING +
                    step /
                        FIELD_STEPS_HORIZONTAL *
                        fieldWidth
                );
            },

            yScale: function(step) {
                return (
                    verticalPadding +
                    step /
                        FIELD_STEPS_VERTICAL *
                        fieldHeight
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
            return String(
                Math.min(
                    step,
                    32 - step
                )
            );
        }

        if (step < 52) {
            return String(
                Math.min(
                    step - 32,
                    52 - step
                )
            );
        }

        return String(
            Math.min(
                step - 52,
                84 - step
            )
        );
    }

    function drawPacingGrid() {
        var svg =
            $(".js-grapher-draw-target svg");

        if (
            svg.length === 0 ||
            svg.find(
                ".dotnav-pacing-grid"
            ).length !== 0
        ) {
            return;
        }

        var geometry =
            getFieldGeometry(
                svg
            );

        if (geometry === null) {
            return;
        }

        var xScale =
            geometry.xScale;

        var yScale =
            geometry.yScale;

        var svgSelection =
            d3.select(
                svg.get(0)
            );

        var grid =
            svgSelection
                .append("g")
                .attr(
                    "class",
                    "dotnav-pacing-grid"
                );

        /*
         * 4-step along-field split lines.
         */

        var splitSteps = [];
        var x;

        for (
            x = 4;
            x < FIELD_STEPS_HORIZONTAL;
            x += 4
        ) {
            if (x % 8 !== 0) {
                splitSteps.push(
                    x
                );
            }
        }

        grid
            .selectAll(
                "line.dotnav-pacing-split"
            )
            .data(
                splitSteps
            )
            .enter()
            .append(
                "line"
            )
            .attr(
                "class",
                "dotnav-pacing-split"
            )
            .attr(
                "x1",
                function(step) {
                    return xScale(
                        step
                    );
                }
            )
            .attr(
                "x2",
                function(step) {
                    return xScale(
                        step
                    );
                }
            )
            .attr(
                "y1",
                yScale(
                    0
                )
            )
            .attr(
                "y2",
                yScale(
                    FIELD_STEPS_VERTICAL
                )
            );

        /*
         * 2-step cross-field lines.
         */

        var crossFieldSteps = [];
        var y;

        for (
            y = 2;
            y < FIELD_STEPS_VERTICAL;
            y += 2
        ) {
            crossFieldSteps.push(
                y
            );
        }

        grid
            .selectAll(
                "line.dotnav-pacing-crossfield"
            )
            .data(
                crossFieldSteps
            )
            .enter()
            .append(
                "line"
            )
            .attr(
                "class",
                function(step) {
                    if (
                        step === 32 ||
                        step === 52
                    ) {
                        return (
                            "dotnav-pacing-crossfield " +
                            "dotnav-pacing-hash"
                        );
                    }

                    return (
                        "dotnav-pacing-crossfield"
                    );
                }
            )
            .attr(
                "x1",
                xScale(
                    0
                )
            )
            .attr(
                "x2",
                xScale(
                    FIELD_STEPS_HORIZONTAL
                )
            )
            .attr(
                "y1",
                function(step) {
                    return yScale(
                        step
                    );
                }
            )
            .attr(
                "y2",
                function(step) {
                    return yScale(
                        step
                    );
                }
            );

        /*
         * Repeated pacing labels so zoomed heading-up view
         * still has useful references.
         */

        var pacingColumnSteps =
            [
                40,
                80,
                120
            ];

        var pacingLabels = [];
        var columnIndex;
        var labelStep;

        for (
            columnIndex = 0;
            columnIndex <
                pacingColumnSteps.length;
            columnIndex++
        ) {
            for (
                labelStep = 0;
                labelStep <=
                    FIELD_STEPS_VERTICAL;
                labelStep += 2
            ) {
                pacingLabels.push({
                    x:
                        pacingColumnSteps[
                            columnIndex
                        ],

                    step:
                        labelStep
                });
            }
        }

        grid
            .selectAll(
                "text.dotnav-pacing-label"
            )
            .data(
                pacingLabels
            )
            .enter()
            .append(
                "text"
            )
            .attr(
                "class",
                function(label) {
                    if (
                        label.step === 32 ||
                        label.step === 52
                    ) {
                        return (
                            "dotnav-pacing-label " +
                            "dotnav-pacing-hash-label"
                        );
                    }

                    return (
                        "dotnav-pacing-label"
                    );
                }
            )
            .attr(
                "x",
                function(label) {
                    return (
                        xScale(
                            label.x
                        ) +
                        3
                    );
                }
            )
            .attr(
                "y",
                function(label) {
                    return (
                        yScale(
                            label.step
                        ) +
                        1.5
                    );
                }
            )
            .text(
                function(label) {
                    return getPacingLabel(
                        label.step
                    );
                }
            );

        /*
         * Keep pacing grid underneath marcher dots.
         */

        var dotsGroup =
            svg.find(
                ".dots-wrap"
            ).get(0);

        if (dotsGroup) {
            svg.get(0)
                .insertBefore(
                    grid.node(),
                    dotsGroup
                );
        }
    }

    /* ------------------------------------------------------------
     * Current movement route
     * ------------------------------------------------------------ */

    function getCurrentMovementRoute() {
        var context =
            getCurrentMovementContext();

        if (context === null) {
            return null;
        }

        var movement =
            context.movement;

        /*
         * Arc route drawing remains separate.
         *
         * The compass does support Arc local travel heading,
         * but the visual path is not yet reconstructed here.
         */

        if (isArcMovement(movement)) {
            return null;
        }

        if (
            typeof movement.getAnimationState !==
                "function" ||
            typeof movement.getEndPosition !==
                "function"
        ) {
            return null;
        }

        var currentState =
            movement.getAnimationState(
                context.movementInfo.localBeat
            );

        var targetPosition =
            movement.getEndPosition();

        if (
            !currentState ||
            !targetPosition
        ) {
            return null;
        }

        var deltaX =
            targetPosition.x -
            currentState.x;

        var deltaY =
            targetPosition.y -
            currentState.y;

        var epsilon =
            0.001;

        var movesNorthSouth =
            Math.abs(
                deltaX
            ) >
            epsilon;

        var movesEastWest =
            Math.abs(
                deltaY
            ) >
            epsilon;

        if (
            !movesNorthSouth &&
            !movesEastWest
        ) {
            return null;
        }

        /*
         * Even explicitly interpolates directly between
         * arbitrary endpoints, so a diagonal straight
         * route is valid for Even.
         *
         * For other multi-axis movements, do not invent
         * traversal order yet.
         */

        if (
            movesNorthSouth &&
            movesEastWest &&
            !isEvenMovement(
                movement
            )
        ) {
            return null;
        }

        return {
            current: {
                x:
                    currentState.x,

                y:
                    currentState.y
            },

            target: {
                x:
                    targetPosition.x,

                y:
                    targetPosition.y
            }
        };
    }

    function drawMovementRoute() {
        var svg =
            $(".js-grapher-draw-target svg");

        if (
            svg.length === 0 ||
            svg.find(
                ".dotnav-route"
            ).length !== 0
        ) {
            return;
        }

        var route =
            getCurrentMovementRoute();

        if (route === null) {
            return;
        }

        var geometry =
            getFieldGeometry(
                svg
            );

        if (geometry === null) {
            return;
        }

        var startX =
            geometry.xScale(
                route.current.x
            );

        var startY =
            geometry.yScale(
                route.current.y
            );

        var targetX =
            geometry.xScale(
                route.target.x
            );

        var targetY =
            geometry.yScale(
                route.target.y
            );

        var svgSelection =
            d3.select(
                svg.get(0)
            );

        var routeGroup =
            svgSelection
                .append(
                    "g"
                )
                .attr(
                    "class",
                    "dotnav-route"
                );

        routeGroup
            .append(
                "line"
            )
            .attr(
                "class",
                "dotnav-route-line"
            )
            .attr(
                "x1",
                startX
            )
            .attr(
                "y1",
                startY
            )
            .attr(
                "x2",
                targetX
            )
            .attr(
                "y2",
                targetY
            );

        var markerRadius =
            3 /
            navigationScale;

        routeGroup
            .append(
                "circle"
            )
            .attr(
                "class",
                "dotnav-route-start"
            )
            .attr(
                "cx",
                startX
            )
            .attr(
                "cy",
                startY
            )
            .attr(
                "r",
                markerRadius
            );

        var crossSize =
            3 /
            navigationScale;

        routeGroup
            .append(
                "line"
            )
            .attr(
                "class",
                "dotnav-route-target"
            )
            .attr(
                "x1",
                targetX -
                crossSize
            )
            .attr(
                "y1",
                targetY -
                crossSize
            )
            .attr(
                "x2",
                targetX +
                crossSize
            )
            .attr(
                "y2",
                targetY +
                crossSize
            );

        routeGroup
            .append(
                "line"
            )
            .attr(
                "class",
                "dotnav-route-target"
            )
            .attr(
                "x1",
                targetX +
                crossSize
            )
            .attr(
                "y1",
                targetY -
                crossSize
            )
            .attr(
                "x2",
                targetX -
                crossSize
            )
            .attr(
                "y2",
                targetY +
                crossSize
            );

        var dotsGroup =
            svg.find(
                ".dots-wrap"
            ).get(0);

        if (dotsGroup) {
            svg.get(0)
                .insertBefore(
                    routeGroup.node(),
                    dotsGroup
                );
        }
    }

    /* ------------------------------------------------------------
     * Movement semantics
     * ------------------------------------------------------------ */

    function getMovementText(
        movement
    ) {
        if (
            movement === null ||
            movement === undefined ||
            typeof movement.getContinuityText !==
                "function"
        ) {
            return "";
        }

        var movementText =
            movement.getContinuityText();

        if (
            movementText === null ||
            movementText === undefined
        ) {
            return "";
        }

        return String(
            movementText
        );
    }

    /*
     * Human-readable CalChart sheet continuity.
     *
     * This is where terms such as:
     *
     * FMHS
     * FMMM
     * FMSH
     * GVFW
     * MTHS
     * MTMM
     * Hup Vamp
     *
     * may still exist even when the machine MovementCommand
     * only says move / mark / stand.
     */

    function getSheetContinuityText(
        sheet,
        selectedDot
    ) {
        if (
            !sheet ||
            selectedDot === null ||
            selectedDot === undefined
        ) {
            return "";
        }

        var dotType =
            sheet.getDotType(
                selectedDot
            );

        var continuities =
            sheet.getContinuityTexts(
                dotType
            );

        if (!continuities) {
            return "";
        }

        return continuities
            .join(
                " | "
            )
            .toUpperCase();
    }

    function getUniqueSemanticMatch(
        continuityText,
        candidates
    ) {
        var matches = [];

        candidates.forEach(
            function(candidate) {
                if (
                    candidate.pattern.test(
                        continuityText
                    )
                ) {
                    matches.push(
                        candidate.label
                    );
                }
            }
        );

        /*
         * Do not guess if more than one candidate
         * exists in the sheet continuity.
         */

        if (matches.length === 1) {
            return matches[0];
        }

        return null;
    }

    function getMovementSemantic(
        movement,
        sheet,
        selectedDot
    ) {
        var movementText =
            getMovementText(
                movement
            );

        var upperMovementText =
            movementText.toUpperCase();

        var continuityText =
            getSheetContinuityText(
                sheet,
                selectedDot
            );

        var start =
            movement.getStartPosition();

        var end =
            movement.getEndPosition();

        var isMoving =
            (
                Math.abs(
                    end.x -
                    start.x
                ) >
                0.001 ||
                Math.abs(
                    end.y -
                    start.y
                ) >
                0.001
            );

        /*
         * Path geometry is separate from marching technique.
         */

        var pathType =
            "";

        if (
            isArcMovement(
                movement
            )
        ) {
            pathType =
                "ARC";

        } else if (
            isEvenMovement(
                movement
            )
        ) {
            pathType =
                "EVEN";
        }

        /*
         * CLOSE
         */

        if (
            upperMovementText.indexOf(
                "CLOSE"
            ) === 0
        ) {
            return {
                stepType:
                    "CLOSE",

                mode:
                    "STOP",

                colorClass:
                    "is-stop",

                pathType:
                    pathType
            };
        }

        /*
         * HUP VAMP
         *
         * Hup Vamp is a stationary posture/action.
         *
         * If the marcher is stationary and the individual
         * continuity clearly says Hup Vamp, prefer it over a
         * generic machine Mark Time command.
         *
         * If the same continuity context also explicitly contains
         * MTHS or MTMM, we do not guess which one applies to this
         * exact MovementCommand yet.
         */

        if (
            !isMoving &&
            /\bHUP\s+VAMP\b/.test(
                continuityText
            )
        ) {
            var conflictingMarkTechnique =
                (
                    /\bMTHS\b/.test(
                        continuityText
                    ) ||
                    /\bMTMM\b/.test(
                        continuityText
                    )
                );

            if (
                !conflictingMarkTechnique
            ) {
                return {
                    stepType:
                        "HUP VAMP",

                    mode:
                        "HOLD",

                    colorClass:
                        "is-stop",

                    pathType:
                        pathType
                };
            }
        }

        /*
         * STAND & PLAY
         */

        if (
            upperMovementText.indexOf(
                "STAND & PLAY"
            ) === 0
        ) {
            return {
                stepType:
                    "STAND & PLAY",

                mode:
                    "HOLD",

                colorClass:
                    "is-stop",

                pathType:
                    pathType
            };
        }

        /*
         * MARK TIME
         *
         * Generic MovementCommandMarkTime may correspond to:
         *
         * MTHS
         * MTMM
         * Hup Vamp
         */

        if (
            upperMovementText.indexOf(
                "MT "
            ) === 0
        ) {
            var markTechnique =
                getUniqueSemanticMatch(
                    continuityText,
                    [
                        {
                            label:
                                "MTHS",

                            pattern:
                                /\bMTHS\b/
                        },

                        {
                            label:
                                "MTMM",

                            pattern:
                                /\bMTMM\b/
                        },

                        {
                            label:
                                "HUP VAMP",

                            pattern:
                                /\bHUP\s+VAMP\b/
                        }
                    ]
                );

            if (
                markTechnique ===
                "HUP VAMP"
            ) {
                return {
                    stepType:
                        "HUP VAMP",

                    mode:
                        "HOLD",

                    colorClass:
                        "is-stop",

                    pathType:
                        pathType
                };
            }

            return {
                stepType:
                    markTechnique ||
                    "MARK TIME",

                mode:
                    "MARK TIME",

                colorClass:
                    "is-mark-time",

                pathType:
                    pathType
            };
        }

        /*
         * TRANSLATING MOVEMENT
         *
         * Try to recover the actual Cal Band step technique
         * from the human-readable continuity.
         */

        if (isMoving) {
            var locomotionTechnique =
                getUniqueSemanticMatch(
                    continuityText,
                    [
                        {
                            label:
                                "FMHS",

                            pattern:
                                /\bFMHS\b/
                        },

                        {
                            label:
                                "FMMM",

                            pattern:
                                /\bFMMM\b/
                        },

                        {
                            label:
                                "FMSH",

                            pattern:
                                /\bFMSH\b/
                        },

                        {
                            label:
                                "GVFW",

                            pattern:
                                /\bGVFW\b/
                        }
                    ]
                );

            /*
             * Even describes how arbitrary displacement is
             * divided evenly across the available steps/counts.
             *
             * It is kept separate as a path/interpolation tag.
             */

            if (
                locomotionTechnique === null &&
                isEvenMovement(
                    movement
                )
            ) {
                locomotionTechnique =
                    "EVEN MOVE";
            }

            /*
             * Arc is path geometry, not a step technique.
             */

            if (
                locomotionTechnique === null &&
                isArcMovement(
                    movement
                )
            ) {
                locomotionTechnique =
                    "MOVE";
            }

            return {
                stepType:
                    locomotionTechnique ||
                    "MOVE",

                mode:
                    "MOVING",

                colorClass:
                    "is-moving",

                pathType:
                    pathType
            };
        }

        /*
         * Blue/navy now explicitly means:
         * DotNav has not classified this movement yet.
         */

        return {
            stepType:
                "UNCLASSIFIED",

            mode:
                "CURRENT",

            colorClass:
                "is-neutral",

            pathType:
                pathType
        };
    }

    /* ------------------------------------------------------------
     * NEXT movement preview
     * ------------------------------------------------------------ */

    function clearNextGuidance() {
        $(".js-dotnav-next-mode")
            .text(
                "—"
            );

        $(".js-dotnav-next-primary")
            .text(
                "—"
            );

        $(".js-dotnav-next-secondary")
            .text(
                ""
            );

        $(".js-dotnav-next-timing")
            .text(
                ""
            );
    }

    function getMovementPreview(
        movement,
        sheet,
        selectedDot
    ) {
        if (
            movement === null ||
            movement === undefined
        ) {
            return null;
        }

        var semantic =
            getMovementSemantic(
                movement,
                sheet,
                selectedDot
            );

        var movementText =
            getMovementText(
                movement
            );

        var travelHeading =
            getMovementTravelHeading(
                movement,
                0
            );

        var orientationHeading =
            getMovementOrientationHeading(
                movement,
                0
            );

        var targetHeading =
            getMovementTargetHeading(
                movement,
                0
            );

        var secondary =
            movementText;

        /*
         * MOVE != ORIENT
         *
         * Example:
         * MOVE N
         * FACE W
         */

        if (
            travelHeading !== null &&
            orientationHeading !== null &&
            Math.round(
                travelHeading
            ) !==
            Math.round(
                orientationHeading
            )
        ) {
            secondary =
                "FACE " +
                formatHeading(
                    orientationHeading
                );
        }

        /*
         * Stationary actions should retain their
         * own continuity text instead of FACE.
         */

        if (
            semantic.mode === "HOLD" ||
            semantic.mode === "STOP" ||
            semantic.mode === "MARK TIME"
        ) {
            secondary =
                movementText;
        }

        return {
            mode:
                (
                    semantic.stepType +
                    (
                        semantic.pathType ?
                            " · " +
                            semantic.pathType :
                            ""
                    )
                ),

            primary:
                formatHeading(
                    targetHeading
                ),

            secondary:
                secondary,

            targetHeading:
                targetHeading
        };
    }

    function updateNextGuidance(
        context
    ) {
        clearNextGuidance();

        if (context === null) {
            return;
        }

        var movements =
            context.dot.getMovementCommands();

        var nextIndex =
            context.movementInfo.movementIndex +
            1;

        var beatsRemaining =
            context.movement
                .getBeatDuration() -
            context.movementInfo.localBeat;

        /*
         * End of current stuntsheet.
         */

        if (
            !movements ||
            nextIndex >= movements.length
        ) {
            $(".js-dotnav-next-mode")
                .text(
                    "NEXT SHEET"
                );

            $(".js-dotnav-next-primary")
                .text(
                    "—"
                );

            $(".js-dotnav-next-timing")
                .text(
                    "IN " +
                    beatsRemaining +
                    (
                        beatsRemaining === 1 ?
                            " BEAT" :
                            " BEATS"
                    )
                );

            return;
        }

        var nextMovement =
            movements[
                nextIndex
            ];

        var preview =
            getMovementPreview(
                nextMovement,
                context.sheet,
                context.selectedDot
            );

        if (preview === null) {
            return;
        }

        $(".js-dotnav-next-mode")
            .text(
                preview.mode
            );

        $(".js-dotnav-next-primary")
            .text(
                preview.primary
            );

        $(".js-dotnav-next-secondary")
            .text(
                preview.secondary
            );

        $(".js-dotnav-next-timing")
            .text(
                "IN " +
                beatsRemaining +
                (
                    beatsRemaining === 1 ?
                        " BEAT" :
                        " BEATS"
                )
            );
    }

    /* ------------------------------------------------------------
     * Current guidance
     * ------------------------------------------------------------ */

    function updateMovementGuidance() {
        var context =
            getCurrentMovementContext();

        var guidanceCard =
            $(".dotnav-guidance-primary");

        var stepTypeLabel =
            $(".js-dotnav-step-type");

        var modeLabel =
            $(".js-dotnav-mode");

        var pathTypeLabel =
            $(".js-dotnav-path-type");

        var countdown =
            $(".js-dotnav-countdown");

        guidanceCard.removeClass(
            "is-moving " +
            "is-mark-time " +
            "is-stop " +
            "is-neutral"
        );

        countdown
            .text("")
            .removeClass(
                "is-active"
            );

        stepTypeLabel.text(
            "—"
        );

        modeLabel.text(
            "CURRENT"
        );

        pathTypeLabel.text(
            ""
        );

        if (context === null) {
            guidanceCard.addClass(
                "is-neutral"
            );

            clearNextGuidance();

            return;
        }

        var movement =
            context.movement;

        var movementInfo =
            context.movementInfo;

        var semantic =
            getMovementSemantic(
                movement,
                context.sheet,
                context.selectedDot
            );

        updateNextGuidance(
            context
        );

        /*
         * Apply semantic category.
         */

        guidanceCard.addClass(
            semantic.colorClass
        );

        stepTypeLabel.text(
            semantic.stepType
        );

        modeLabel.text(
            semantic.mode
        );

        pathTypeLabel.text(
            semantic.pathType
        );

        /*
         * Temporary countdown.
         *
         * Future:
         *
         * 4
         * 3
         * 2
         * AND
         * GO / MT / HV / CLOSE
         */

        var duration =
            movement.getBeatDuration();

        var remaining =
            duration -
            movementInfo.localBeat;

        if (
            remaining >= 1 &&
            remaining <= 4
        ) {
            countdown.text(
                remaining === 1 ?
                    "1!" :
                    remaining
            );

            countdown.addClass(
                "is-active"
            );
        }

        /*
         * Recompute MOVE / ORIENT / TARGET here.
         *
         * This lets:
         *
         * - Arc use a local travel vector
         * - arbitrary facing angles work
         * - current target remain consistent with compass
         */

        var travelHeading =
            getMovementTravelHeading(
                movement,
                movementInfo.localBeat
            );

        var orientationHeading =
            getMovementOrientationHeading(
                movement,
                movementInfo.localBeat
            );

        var targetHeading =
            getMovementTargetHeading(
                movement,
                movementInfo.localBeat
            );

        $(".js-dotnav-travel")
            .text(
                formatHeading(
                    travelHeading
                )
            );

        $(".js-dotnav-orient")
            .text(
                formatHeading(
                    orientationHeading
                )
            );

        $(".js-dotnav-target")
            .text(
                formatHeading(
                    targetHeading
                )
            );

        /*
         * Keep ApplicationController's shared DotNav target
         * synchronized with the improved calculation.
         */

        context.state.controller
            ._dotNavTargetHeading =
            targetHeading;
    }

    /* ------------------------------------------------------------
     * Heading-up field
     * ------------------------------------------------------------ */

    function applyHeadingUpView(
        fieldHeading
    ) {
        var svg =
            $(".js-grapher-draw-target svg");

        if (svg.length === 0) {
            return;
        }

        var selectedDot =
            svg.find(
                ".selected-dot-highlight"
            ).get(0);

        if (!selectedDot) {
            resetHeadingUpView();
            return;
        }

        var svgWidth =
            parseFloat(
                svg.attr(
                    "width"
                )
            );

        var svgHeight =
            parseFloat(
                svg.attr(
                    "height"
                )
            );

        var dotX =
            parseFloat(
                selectedDot.getAttribute(
                    "cx"
                )
            );

        var dotY =
            parseFloat(
                selectedDot.getAttribute(
                    "cy"
                )
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
         * Selected marcher sits near lower-middle.
         */

        var screenX =
            svgWidth /
            2;

        var screenY =
            svgHeight *
            0.66;

        /*
         * Phone-forward = screen-up.
         */

        var rotationDegrees =
            -(
                fieldHeading +
                90
            );

        var rotationRadians =
            rotationDegrees *
            Math.PI /
            180;

        var cosValue =
            Math.cos(
                rotationRadians
            );

        var sinValue =
            Math.sin(
                rotationRadians
            );

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
            (
                "matrix(" +
                a + " " +
                b + " " +
                c + " " +
                d + " " +
                e + " " +
                f +
                ")"
            );

        svg.children(
            "g"
        ).attr(
            "transform",
            matrix
        );
    }

    function resetHeadingUpView() {
        $(".js-grapher-draw-target svg")
            .children(
                "g"
            )
            .attr(
                "transform",
                null
            );
    }

    /* ------------------------------------------------------------
     * Grapher redraw handling
     * ------------------------------------------------------------ */

    function refreshDotNavField() {
        drawPacingGrid();

        drawMovementRoute();

        updateMovementGuidance();

        updateVisualCompass(
            lastFieldHeading
        );

        if (
            lastFieldHeading !== null
        ) {
            applyHeadingUpView(
                lastFieldHeading
            );
        }
    }

    var graphElement =
        $(".js-grapher-draw-target")
            .get(0);

    if (
        graphElement &&
        typeof window.MutationObserver !==
            "undefined"
    ) {
        var graphObserver =
            new window.MutationObserver(
                function() {
                    refreshDotNavField();
                }
            );

        graphObserver.observe(
            graphElement,
            {
                childList:
                    true,

                subtree:
                    true
            }
        );
    }

    /* ------------------------------------------------------------
     * Device orientation
     * ------------------------------------------------------------ */

    function handleDeviceOrientation(
        event
    ) {
        if (
            selectedVenue === null
        ) {
            return;
        }

        var rawHeading =
            null;

        /*
         * iOS Safari/Chrome.
         */

        if (
            typeof event.webkitCompassHeading ===
            "number"
        ) {
            rawHeading =
                event.webkitCompassHeading;

        /*
         * Other absolute orientation implementations.
         */

        } else if (
            event.absolute &&
            typeof event.alpha ===
                "number"
        ) {
            rawHeading =
                FieldOrientation.normalizeDegrees(
                    360 -
                    event.alpha
                );
        }

        if (
            rawHeading === null
        ) {
            $(".js-dotnav-phone-heading")
                .text(
                    "No absolute heading"
                );

            updateVisualCompass(
                null
            );

            return;
        }

        /*
         * Physical compass frame
         * →
         * Cal Band field frame
         */

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

        $(".js-dotnav-phone-heading")
            .text(
                direction +
                " " +
                Math.round(
                    fieldHeading
                ) +
                "°" +
                " (raw " +
                Math.round(
                    rawHeading
                ) +
                "°)" +
                " | " +
                turnInstruction
            );

        drawPacingGrid();

        drawMovementRoute();

        updateMovementGuidance();

        updateVisualCompass(
            fieldHeading
        );

        applyHeadingUpView(
            fieldHeading
        );
    }

    /* ------------------------------------------------------------
     * Initial UI
     * ------------------------------------------------------------ */

    clearNextGuidance();

    updateVisualCompass(
        null
    );
});