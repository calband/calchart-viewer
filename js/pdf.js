var PDFGenerator = require("./pdf/PDFGenerator");
var ShowUtils = require("./viewer/utils/ShowUtils");
var JSUtils = require("./viewer/utils/JSUtils");

var options = JSUtils.getAllURLParams();
options.dots = options.dots ? options.dots.split(",") : [];
var keys = ["md-orientation", "bev-orientation", "sd-orientation", "layout-order"];

/**
 * Shows an error text
 */
function showError(message) {
    $(".js-pdf-loading h1").addClass("error").text(message);
    $(".js-pdf-loading .progress-bar").remove();
};

/**
 * Refresh page with the current options
 */
function refreshPage() {
    window.location.search = $.map(options, function(val, key) {
        if (key === "dots") {
            val = val.join(",");
        }
        return key + "=" + val;
    }).join("&");
};

/**
 * If it takes too long, remove the IFrame and prompt user to download
 */
function removeIFrame() {
    $(".js-pdf-preview").remove();
    $(".js-pdf-loading h1").remove();
    $(".js-pdf-loading .progress-bar").remove();
    var link = $("<h1 class=\"download-link\">")
        .text("Download here")
        .attr("href", "#")
        .click(function() {
            window.generator.pdf.save();
            return false;
        });
    $("<h1>")
        .append(link)
        .appendTo(".js-pdf-loading");
        
};

/**
 * This function will be executed by jQuery when the HTML DOM is loaded. Here,
 * we automatically load the show and generate a live preview of the PDF generated
 * by the PDFGenerator
 */
$(document).ready(function() {
    if (!options.show) {
        showError("No show selected.");
        return;
    }

    keys.forEach(function(key) {
        var allOptions = $(".pdf-option input[name=" + key + "]");
        var selected = allOptions.filter("[value=" + options[key] + "]");
        if (options[key] === undefined || selected.length === 0) {
            // choose first option by default
            allOptions.filter(":first").prop("checked", true);
        } else {
            selected.prop("checked", true);
        }
    });

    // changing options
    $("input").change(function() {
        options[$(this).attr("name")] = $(this).val();
        refreshPage();
    });

    // choose dots
    $(".js-choose-dots").click(function() {
        var dots = $(".dot-labels").val();
        if (dots.length === 0) {
            return;
        }
        dots = dots.split("\n");

        // validate dots
        var labels = $(".dot-labels").data("labels");
        for (var i = 0; i < dots.length; i++) {
            var dot = dots[i];
            if (labels.indexOf(dot) === -1) {
                alert("Dot " + dot + " does not exist!");
                return;
            }
        }

        options.dots = dots;
        refreshPage();
    });

    // add link for back-link
    var backDot = options.dots[0] || "";
    var url = "index.html?show=" + options.show + "&dot=" + backDot;
    $(".back-link").attr("href", url);

    $.ajax({
        url: "https://calchart-server.herokuapp.com/viewer/" + options.show + "/",
        dataType: "text",
        xhr: function() {
            var xhr = $.ajaxSettings.xhr();
            // update progress bar
            xhr.onprogress = function(evt) {
                if (evt.lengthComputable) {
                    var percentComplete = evt.loaded / evt.total;
                    $(".js-pdf-loading .progress-bar").css({
                        width: percentComplete * 50 + "%",
                    });
                }
            };
            return xhr;
        },
        success: function(data) {
            $(".js-pdf-loading .progress-bar").css("width", "50%");
            var show = ShowUtils.fromJSONString(data);

            $(".dot-labels").data("labels", show.getDotLabels());
            $(".js-choose-dots").prop("disabled", false);

            if (options.dots.length === 0) {
                showError("No dot selected.");
                return;
            }

            // // generate pdf
            window.generator = new PDFGenerator(show, options.dots)
            try {
                window.generator.generate(options);
            } catch(err) {
                showError("An error occurred.");
                throw err;
            }
            // window.removeIFrame = setTimeout(removeIFrame, 10);
            removeIFrame();

        },
        error: function() {
            showError("Could not reach server.");
        },
    });
});
