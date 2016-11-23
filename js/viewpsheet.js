var ApplicationController = require("./viewer/ApplicationController");
var ShowUtils = require("./viewer/utils/ShowUtils");
var JSUtils = require("./viewer/utils/JSUtils");
var BirdsEyeGrapher = require("./viewpsheet/BirdsEyeGrapher");
var MovementGrapher = require("./viewpsheet/MovementGrapher");

var options = JSUtils.getAllURLParams();
var applicationController = ApplicationController.getInstance();

var emptyStuntsheet, totalSheets;

/**
 * This function will be executed by jQuery when the HTML DOM is loaded. Here,
 * we automatically load the show and generate the individual continuity for the
 * selected dot.
 */
$(document).ready(function() {
    $(".back-link").attr("href", "index.html?show=" + options.show + "&dot=" + options.dot);

    emptyStuntsheet = $(".stuntsheet").remove();

    $(".js-select-show")
        .chosen({
            width: "150px",
            disable_search_threshold: 4, // if there are less than 4 shows, hide search
        })
        .change(function() {
            window.location.search = $.param({
                show: $(this).val(),
            });
        });

    $(".js-dot-labels")
        .chosen({
            width: "90px",
        })
        .change(function(){
            window.location.search = $.param({
                show: options.show,
                dot: $(this).val(),
            });
        });

    applicationController.getShows().done(loadShow);
});

var loadShow = function() {
    $(".js-select-show").val(options.show).trigger("chosen:updated");

    $.ajax({
        url: "https://calchart-server.herokuapp.com/viewer/" + options.show + "/",
        dataType: "text",
        xhr: function() {
            var xhr = $.ajaxSettings.xhr();
            // update progress bar
            xhr.onprogress = function(evt) {
                if (evt.lengthComputable) {
                    var percentComplete = evt.loaded / evt.total;
                    $(".loading .progress-bar").css({
                        width: (35 + percentComplete * 65) + "%",
                    });
                }
            };
            return xhr;
        },
        success: function(data) {
            var show = ShowUtils.fromJSONString(data);

            // load dot labels
            show.getDotLabels().forEach(function(dot) {
                $("<option>")
                    .attr("value", dot)
                    .attr("data-dot-label", dot)
                    .text(dot)
                    .appendTo(".js-dot-labels");
            });
            $(".js-dot-labels").val(options.dot).trigger("chosen:updated");

            var sheets = show.getSheets();
            totalSheets = sheets.length;
            sheets.forEach(initSheet);

            $(".viewpsheet").removeClass("hide");
            $(".loading").remove();
        },
        error: function() {
            showError("Could not reach server.");
        },
    });
};

var initSheet = function(sheet) {
    var stuntsheet = emptyStuntsheet.clone().appendTo(".viewpsheet .stuntsheets");
    var dot = sheet.getDotByLabel(options.dot);

    var label = sheet.getSheetLabel();
    var sheetNum = parseInt(label);
    if (sheetNum !== NaN) {
        label = sheetNum + "/" + totalSheets;
    }
    stuntsheet.find(".stuntsheet-label").text(label);

    // dot continuities
    var dotType = sheet.getDotType(options.dot);
    stuntsheet.find("img.dot-type").attr("src", "img/" + dotType + ".jpg");
    var dotContinuities = stuntsheet.find(".dot-continuity ul");
    sheet.getContinuityTexts(dotType).forEach(function(continuity) {
        $("<li>").text(continuity).appendTo(dotContinuities);
    });

    // individual continuities
    stuntsheet.find("p.total-beats span").text(sheet.getDuration());
    var dotMovements = stuntsheet.find(".individual-continuity ul");
    dot.getMovementTexts().forEach(function(movement) {
        $("<li>").text(movement).appendTo(dotMovements);
    });

    // movement diagram
    // TODO: direction labels
    new MovementGrapher(stuntsheet).draw(sheet, options.dot);

    // birds eye view
    // TODO: direction labels
    new BirdsEyeGrapher(stuntsheet).draw(sheet, options.dot);

    // TODO: fill in rest of stuntsheet
    // TODO: populate frontsheet/endsheet
};
