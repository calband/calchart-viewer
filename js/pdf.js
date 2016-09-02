var PDFGenerator = require("./pdf/PDFGenerator");
var ShowUtils = require("./viewer/utils/ShowUtils");
var JSUtils = require("./viewer/utils/JSUtils");

var options = JSUtils.getAllURLParams();
options.dots = options.dots ? options.dots.split(",") : [];
var keys = ["md-orientation", "bev-orientation", "sd-orientation", "layout-order", "endsheet-widget"];

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
 * Add a dot label to the dot label select box
 */
function addDotLabel(i, dot) {
    $("<option>")
        .text(dot)
        .attr("value", dot)
        .appendTo(".js-dot-labels");
};

/**
 * If it takes too long, remove the IFrame and prompt user to download
 */
function removeIFrame() {
    $(".js-pdf-preview").remove();
    showError("Displaying preview timed out");
    var link = $("<a>")
        .text("Download here")
        .attr("href", "#")
        .click(function() {
            window.generator.pdf.save();
            return false;
        });
    $("<p>")
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
    $.each(options.dots, addDotLabel)
    $(".js-dot-labels")
        .val(options.dots)
        .chosen({
            placeholder_text_multiple: "Type in a dot",
        })
        .change(function() {
            options.dots = $(this).val() || [];
            refreshPage();
        });
    // add link to select all dots; adding here because dots not all populated
    // until this point
    $("<a>")
        .addClass("choose-all-dots")
        .text("Select all")
        .attr("href", "#")
        .click(function() {
            options.dots = $(".js-dot-labels option")
                .map(function() {
                    return $(this).attr("value");
                })
                .get();
            refreshPage();
        })
        .appendTo(".choose-dots h3");

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
            var show = ShowUtils.fromJSON(data);

            // update dot labels
            $(".js-dot-labels").empty();
            $.each(show.getDotLabels(), addDotLabel);
            $(".js-dot-labels")
                .val(options.dots)
                .trigger("chosen:updated");

            if (options.dots.length === 0) {
                showError("No dot selected.");
                return;
            }

            // generate pdf
            window.generator = new PDFGenerator(show, options.dots)
            try {
                window.generator.generate(options);
            } catch(err) {
                showError("An error occurred.");
                throw err;
            }
            $("<iframe>")
                .addClass("js-pdf-preview")
                .attr("src", window.generator.data)
                .appendTo("body")
                .hide()
                .load(function() {
                    $(".js-pdf-loading").remove();
                    $(this).show();
                    // cancel remove
                    clearTimeout(window.removeIFrame);
                });
            // after 5 seconds, timeout PDF generation
            window.removeIFrame = setTimeout(removeIFrame, 5000);
        },
        error: function() {
            showError("Could not reach server.");
        },
    });
});
