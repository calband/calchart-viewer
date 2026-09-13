var FieldOrientation = require("./viewer/FieldOrientation");

window.isMobile = true;

$(document).ready(function() {
    /*
     * DotNav mobile field view
     *
     * Adds:
     *
     *  - heading-up navigation
     *  - local zoom
     *  - rehearsal pacing references
     *  - current movement route
     *  - movement-state guidance
     *  - next movement preview
     *  - final 4-beat countdown
     *  - heading-up visual compass
     */

    var graphContainer = $(".graph-container");
    var graph = $(".graph-container .graph");

    var width = graphContainer.outerWidth();

    graph.css(
        "height",
        Math.round(width * 0.82)
    );

    var selectedVenue = null;
    var compassEnabled = false;

    /*
     * Last known heading in Cal Band field coordinates.
     *
     * N =   0
     * E =  90
     * S = 180
     * W = 270
     */
    var lastFieldHeading = null;

    /*
     * Local navigation zoom.
     */
    var navigationScale = 2.3;

    /*
     * CalChart field geometry.
     */
    var FIELD_STEPS_HORIZONTAL = 160;
    var FIELD_STEPS_VERTICAL = 84;
    var FIELD_PADDING = 10;
    var FIELD_ASPECT_RATIO = 0.5333;


    /*
     * Field selection
     */

    $(".js-dotnav-field").change(function() {
        var venueId = $(this).val();

        selectedVenue =
            FieldOrientation.VENUES[venueId] || null;

        if (selectedVenue === null) {
            console.log(
                "[DotNav] No field selected"
            );

            $(".js-dotnav-phone-heading").text(
                "Select field"
            );

            lastFieldHeading = null;

            resetHeadingUpView();

            updateVisualCompass(
                null
            );

            return;
        }

        console.log(
            "[DotNav] Field:",
            selectedVenue.name,
            "East heading:",
            selectedVenue.eastHeading
        );

        updateVisualCompass(
            lastFieldHeading
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
                    if (
                        permissionState ===
                        "granted"
                    ) {
                        enableCompass();

                    } else {
                        $(".js-dotnav-phone-heading")
                            .text(
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

        updateVisualCompass(
            null
        );
    }


    /*
     * Application state
     */

    function getApplicationState() {
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

        if (delegate === null) {
            return null;
        }

        return {
            controller:
                applicationController,

            delegate:
                delegate
        };
    }


    /*
     * DotNav target heading
     */

    function getTargetHeading() {
        var state =
            getApplicationState();

        if (state === null) {
            return null;
        }

        if (
            state.delegate.getSelectedDot() === null
        ) {
            return null;
        }

        return state.controller
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
            Math.round(turnError);

        var absoluteTurn =
            Math.abs(
                roundedTurn
            );

        if (
            absoluteTurn === 0
        ) {
            return "STRAIGHT";
        }

        if (
            absoluteTurn === 180
        ) {
            return "TURN 180°";
        }

        if (
            roundedTurn > 0
        ) {
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
     * Heading formatting
     */

    function formatHeading(
        heading
    ) {
        if (
            heading === null ||
            heading === undefined
        ) {
            return "—";
        }

        return (
            FieldOrientation
                .getDirectionLabel(
                    heading
                ) +
            " " +
            Math.round(
                heading
            ) +
            "°"
        );
    }


    /*
     * Heading-up visual compass
     *
     * Phone direction is always screen-up.
     *
     * The compass rose moves underneath the phone.
     */

    function formatCompassHeading(
        heading
    ) {
        return formatHeading(
            heading
        );
    }


    function updateVisualCompass(
        currentHeading
    ) {
        var targetHeading =
            getTargetHeading();

        var rose =
            $(".js-dotnav-compass-rose");

        var headingMarker =
            $(".js-dotnav-compass-heading-marker");

        var targetMarker =
            $(".js-dotnav-compass-target-marker");


        $(".js-dotnav-compass-current")
            .text(
                formatCompassHeading(
                    currentHeading
                )
            );


        $(".js-dotnav-compass-target")
            .text(
                formatCompassHeading(
                    targetHeading
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
         * Rotate compass card underneath phone.
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
         * Target marker represents absolute
         * field heading on the rotating card.
         */

        if (
            targetHeading === null ||
            targetHeading === undefined
        ) {
            targetMarker.hide();

        } else {
            targetMarker
                .show()
                .css(
                    "transform",
                    "rotate(" +
                    targetHeading +
                    "deg)"
                );
        }
    }


    /*
     * SVG field geometry
     */

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
            svgWidth:
                svgWidth,

            svgHeight:
                svgHeight,

            xScale:
                function(step) {
                    return (
                        FIELD_PADDING +
                        step /
                            FIELD_STEPS_HORIZONTAL *
                            fieldWidth
                    );
                },

            yScale:
                function(step) {
                    return (
                        verticalPadding +
                        step /
                            FIELD_STEPS_VERTICAL *
                            fieldHeight
                    );
                }
        };
    }


    /*
     * Cal Band pacing labels
     */

    function getPacingLabel(step) {
        if (
            step === 32
        ) {
            return "WH";
        }

        if (
            step === 52
        ) {
            return "EH";
        }

        if (
            step < 32
        ) {
            return String(
                Math.min(
                    step,
                    32 - step
                )
            );
        }

        if (
            step < 52
        ) {
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


    /*
     * Draw pacing grid
     */

    function drawPacingGrid() {
        var svg =
            $(".js-grapher-draw-target svg");

        if (
            svg.length === 0
        ) {
            return;
        }

        if (
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

        if (
            geometry === null
        ) {
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
         * Four-step split lines
         */

        var splitSteps =
            [];

        for (
            var x = 4;
            x < FIELD_STEPS_HORIZONTAL;
            x += 4
        ) {
            if (
                x % 8 !== 0
            ) {
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
         * Two-step cross-field lines
         */

        var crossFieldSteps =
            [];

        for (
            var y = 2;
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
         * Pacing number columns.
         */

        var pacingColumnSteps =
            [
                40,
                80,
                120
            ];

        var pacingLabels =
            [];

        for (
            var columnIndex = 0;
            columnIndex <
                pacingColumnSteps.length;
            columnIndex++
        ) {
            for (
                var labelStep = 0;
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
         * Grid underneath dots
         */

        var dotsGroup =
            svg.find(
                ".dots-wrap"
            ).get(0);

        if (
            dotsGroup
        ) {
            svg.get(0)
                .insertBefore(
                    grid.node(),
                    dotsGroup
                );
        }
    }


    /*
     * Current movement route
     */

    function getCurrentMovementRoute() {
        var state =
            getApplicationState();

        if (
            state === null
        ) {
            return null;
        }

        var delegate =
            state.delegate;

        var selectedDot =
            delegate.getSelectedDot();

        if (
            selectedDot === null
        ) {
            return null;
        }

        var sheet =
            delegate.getCurrentSheet();

        var beat =
            delegate.getCurrentBeatNum();

        var dot =
            sheet.getDotByLabel(
                selectedDot
            );

        if (
            dot === null
        ) {
            return null;
        }

        var movementInfo =
            dot.getMovementAtBeat(
                beat
            );

        if (
            movementInfo === null
        ) {
            return null;
        }

        var movement =
            movementInfo.movement;


        /*
         * Arc not supported yet.
         */

        if (
            typeof movement
                .getMiddlePoints ===
            "function"
        ) {
            return null;
        }


        if (
            typeof movement
                .getAnimationState !==
                "function" ||
            typeof movement
                .getEndPosition !==
                "function"
        ) {
            return null;
        }


        var currentState =
            movement.getAnimationState(
                movementInfo.localBeat
            );

        var targetPosition =
            movement.getEndPosition();

        if (
            currentState === undefined ||
            currentState === null ||
            targetPosition === undefined ||
            targetPosition === null
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


        if (
            movesNorthSouth &&
            movesEastWest
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


    /*
     * Draw movement route
     */

    function drawMovementRoute() {
        var svg =
            $(".js-grapher-draw-target svg");

        if (
            svg.length === 0
        ) {
            return;
        }

        if (
            svg.find(
                ".dotnav-route"
            ).length !== 0
        ) {
            return;
        }

        var route =
            getCurrentMovementRoute();

        if (
            route === null
        ) {
            return;
        }

        var geometry =
            getFieldGeometry(
                svg
            );

        if (
            geometry === null
        ) {
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

        if (
            dotsGroup
        ) {
            svg.get(0)
                .insertBefore(
                    routeGroup.node(),
                    dotsGroup
                );
        }
    }


    /*
     * NEXT movement preview
     */

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


    function getMovementText(
        movement
    ) {
        if (
            movement === null ||
            movement === undefined ||
            typeof movement
                .getContinuityText !==
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


    function getMovementPreview(
        movement
    ) {
        if (
            movement === null ||
            movement === undefined
        ) {
            return null;
        }


        var movementText =
            getMovementText(
                movement
            );

        var upperMovementText =
            movementText.toUpperCase();


        var orientationHeading =
            null;

        if (
            typeof movement
                .getOrientation ===
            "function"
        ) {
            var orientation =
                movement.getOrientation();

            orientationHeading =
                FieldOrientation
                    .getHeadingForDirection(
                        orientation
                    );
        }


        /*
         * Arc
         */

        if (
            typeof movement
                .getMiddlePoints ===
            "function"
        ) {
            return {
                mode:
                    "ARC",

                primary:
                    "ARC",

                secondary:
                    movementText
            };
        }


        var startPosition =
            null;

        var endPosition =
            null;


        if (
            typeof movement
                .getStartPosition ===
                "function"
        ) {
            startPosition =
                movement
                    .getStartPosition();
        }


        if (
            typeof movement
                .getEndPosition ===
                "function"
        ) {
            endPosition =
                movement
                    .getEndPosition();
        }


        var travelHeading =
            null;


        if (
            startPosition !== null &&
            endPosition !== null
        ) {
            var deltaX =
                endPosition.x -
                startPosition.x;

            var deltaY =
                endPosition.y -
                startPosition.y;

            travelHeading =
                FieldOrientation
                    .getTravelHeading(
                        deltaX,
                        deltaY
                    );
        }


        /*
         * Stand & Play
         */

        if (
            upperMovementText.indexOf(
                "STAND & PLAY"
            ) === 0
        ) {
            return {
                mode:
                    "STAND & PLAY",

                primary:
                    (
                        orientationHeading ===
                        null
                    ) ?
                        "HOLD" :
                        formatHeading(
                            orientationHeading
                        ),

                secondary:
                    movementText
            };
        }


        /*
         * Mark Time
         */

        if (
            upperMovementText.indexOf(
                "MT "
            ) === 0
        ) {
            return {
                mode:
                    "MARK TIME",

                primary:
                    formatHeading(
                        orientationHeading
                    ),

                secondary:
                    movementText
            };
        }


        /*
         * Translating movement
         */

        if (
            travelHeading !== null
        ) {
            var secondaryText =
                movementText;

            /*
             * If travel and facing are different,
             * make that explicit.
             */

            if (
                orientationHeading !== null &&
                Math.round(
                    orientationHeading
                ) !==
                Math.round(
                    travelHeading
                )
            ) {
                secondaryText =
                    "FACE " +
                    formatHeading(
                        orientationHeading
                    );
            }

            return {
                mode:
                    "MOVE",

                primary:
                    formatHeading(
                        travelHeading
                    ),

                secondary:
                    secondaryText
            };
        }


        /*
         * Other stationary movement.
         *
         * Do not invent Cal Band semantics.
         */

        return {
            mode:
                "NEXT",

            primary:
                (
                    orientationHeading ===
                    null
                ) ?
                    "—" :
                    formatHeading(
                        orientationHeading
                    ),

            secondary:
                movementText
        };
    }


    function updateNextGuidance(
        dot,
        movementInfo
    ) {
        clearNextGuidance();


        if (
            dot === null ||
            movementInfo === null
        ) {
            return;
        }


        var movements =
            dot.getMovementCommands();

        if (
            movements === null ||
            movements === undefined
        ) {
            return;
        }


        var nextIndex =
            movementInfo.movementIndex +
            1;


        /*
         * No more movements in this stuntsheet.
         *
         * For now, do not guess the first movement
         * of the next stuntsheet.
         */

        if (
            nextIndex >=
            movements.length
        ) {
            $(".js-dotnav-next-mode")
                .text(
                    "NEXT SHEET"
                );

            $(".js-dotnav-next-primary")
                .text(
                    "—"
                );

            $(".js-dotnav-next-secondary")
                .text(
                    ""
                );

            var beatsUntilSheet =
                movementInfo.movement
                    .getBeatDuration() -
                movementInfo.localBeat;

            $(".js-dotnav-next-timing")
                .text(
                    "IN " +
                    beatsUntilSheet +
                    (
                        beatsUntilSheet === 1 ?
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
                nextMovement
            );


        if (
            preview === null
        ) {
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


        /*
         * Remaining beats in CURRENT movement,
         * not duration of next movement.
         */

        var beatsRemaining =
            movementInfo.movement
                .getBeatDuration() -
            movementInfo.localBeat;


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


    /*
     * Main movement guidance
     */

    function updateMovementGuidance() {
        var state =
            getApplicationState();

        var guidanceCard =
            $(".dotnav-guidance-primary");

        var modeLabel =
            $(".js-dotnav-mode");

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


        if (
            state === null
        ) {
            guidanceCard.addClass(
                "is-neutral"
            );

            modeLabel.text(
                "CURRENT"
            );

            clearNextGuidance();

            return;
        }


        var delegate =
            state.delegate;

        var selectedDot =
            delegate.getSelectedDot();

        if (
            selectedDot === null
        ) {
            guidanceCard.addClass(
                "is-neutral"
            );

            modeLabel.text(
                "CURRENT"
            );

            clearNextGuidance();

            return;
        }


        var sheet =
            delegate.getCurrentSheet();

        var beat =
            delegate.getCurrentBeatNum();

        var dot =
            sheet.getDotByLabel(
                selectedDot
            );

        if (
            dot === null
        ) {
            guidanceCard.addClass(
                "is-neutral"
            );

            modeLabel.text(
                "CURRENT"
            );

            clearNextGuidance();

            return;
        }


        var movementInfo =
            dot.getMovementAtBeat(
                beat
            );

        if (
            movementInfo === null
        ) {
            guidanceCard.addClass(
                "is-neutral"
            );

            modeLabel.text(
                "CURRENT"
            );

            clearNextGuidance();

            return;
        }


        var movement =
            movementInfo.movement;


        /*
         * Update NEXT preview before classifying
         * the current movement.
         */

        updateNextGuidance(
            dot,
            movementInfo
        );


        /*
         * Temporary countdown.
         *
         * Later:
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
            if (
                remaining === 1
            ) {
                countdown.text(
                    "1!"
                );

            } else {
                countdown.text(
                    remaining
                );
            }

            countdown.addClass(
                "is-active"
            );
        }


        var startPosition =
            movement.getStartPosition();

        var endPosition =
            movement.getEndPosition();

        var deltaX =
            endPosition.x -
            startPosition.x;

        var deltaY =
            endPosition.y -
            startPosition.y;

        var isMoving =
            Math.abs(
                deltaX
            ) >
            0.001 ||
            Math.abs(
                deltaY
            ) >
            0.001;


        var movementText =
            "";

        if (
            typeof movement
                .getContinuityText ===
            "function"
        ) {
            movementText =
                movement
                    .getContinuityText()
                    .toUpperCase();
        }


        /*
         * Stand & Play
         */

        if (
            movementText.indexOf(
                "STAND & PLAY"
            ) === 0
        ) {
            guidanceCard.addClass(
                "is-stop"
            );

            modeLabel.text(
                "STAND & PLAY"
            );

            return;
        }


        /*
         * Mark Time
         */

        if (
            movementText.indexOf(
                "MT "
            ) === 0
        ) {
            guidanceCard.addClass(
                "is-mark-time"
            );

            modeLabel.text(
                "MARK TIME"
            );

            return;
        }


        /*
         * Real positional translation
         */

        if (
            isMoving
        ) {
            guidanceCard.addClass(
                "is-moving"
            );

            modeLabel.text(
                "MOVING"
            );

            return;
        }


        guidanceCard.addClass(
            "is-neutral"
        );

        modeLabel.text(
            "CURRENT"
        );
    }


    /*
     * Heading-up field
     */

    function applyHeadingUpView(
        fieldHeading
    ) {
        var svg =
            $(".js-grapher-draw-target svg");

        if (
            svg.length === 0
        ) {
            return;
        }

        var selectedDot =
            svg.find(
                ".selected-dot-highlight"
            ).get(0);

        if (
            !selectedDot
        ) {
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
                selectedDot
                    .getAttribute(
                        "cx"
                    )
            );

        var dotY =
            parseFloat(
                selectedDot
                    .getAttribute(
                        "cy"
                    )
            );

        if (
            isNaN(
                svgWidth
            ) ||
            isNaN(
                svgHeight
            ) ||
            isNaN(
                dotX
            ) ||
            isNaN(
                dotY
            )
        ) {
            return;
        }


        var screenX =
            svgWidth /
            2;

        var screenY =
            svgHeight *
            0.66;


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
            "matrix(" +
            a + " " +
            b + " " +
            c + " " +
            d + " " +
            e + " " +
            f +
            ")";


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


    /*
     * Grapher redraw handling
     */

    function refreshDotNavField() {
        drawPacingGrid();

        drawMovementRoute();

        updateMovementGuidance();

        updateVisualCompass(
            lastFieldHeading
        );

        if (
            lastFieldHeading === null
        ) {
            return;
        }

        applyHeadingUpView(
            lastFieldHeading
        );
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


    /*
     * Device orientation
     */

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


        if (
            typeof event
                .webkitCompassHeading ===
            "number"
        ) {
            rawHeading =
                event
                    .webkitCompassHeading;

        } else if (
            event.absolute &&
            typeof event.alpha ===
                "number"
        ) {
            rawHeading =
                FieldOrientation
                    .normalizeDegrees(
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


        var fieldHeading =
            FieldOrientation
                .toFieldHeading(
                    rawHeading,
                    selectedVenue
                        .eastHeading
                );

        lastFieldHeading =
            fieldHeading;


        var direction =
            FieldOrientation
                .getDirectionLabel(
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


    /*
     * Initial UI
     */

    clearNextGuidance();

    updateVisualCompass(
        null
    );
});