var PDFGenerator = require("./pdf/PDFGenerator");
var ShowUtils = require("./viewer/utils/ShowUtils");
var JSUtils = require("./viewer/utils/JSUtils");

var options = JSUtils.getAllURLParams();
options.dots = options.dots === "" ? [] : options.dots.split(",");
var keys = ["md-orientation", "bev-orientation", "sd-orientation", "layout-order", "endsheet-widget"];

/**
 * Updates the iframe
 */
function setIFrame(message, isError) {
    var htmlClass = isError ? "error" : "";
    var html = "<link rel='stylesheet' type='text/css' href='build/css/js-pdf-preview.css'>\
        <link href='http://fonts.googleapis.com/css?family=Open+Sans' rel='stylesheet' type='text/css'>\
        <img class='highstepper-icon' src='img/calchart-viewer-highstepper.png'>\
        <h1 class='" + htmlClass + "'>" + message + "</h1>";
    $(".js-pdf-preview").attr("srcdoc", html);
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
 * This function will be executed by jQuery when the HTML DOM is loaded. Here,
 * we automatically load the show and generate a live preview of the PDF generated
 * by the PDFGenerator
 */
$(document).ready(function() {
    if (!options.show) {
        setIFrame("No show selected.", true);
        return;
    }

    // Loading screen
    setIFrame("Loading...");

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

    $.getJSON("https://calchart-server.herokuapp.com/chart/" + options.show, function(data) {
        var show = ShowUtils.fromJSON(JSON.stringify(data));

        // update dot labels
        $(".js-dot-labels").empty();
        $.each(show.getDotLabels(), addDotLabel);
        $(".js-dot-labels")
            .val(options.dots)
            .trigger("chosen:updated");

        if (options.dots.length === 0) {
            setIFrame("No dot selected.");
            return;
        }

        // generate pdf
        try {
            var pdfData = new PDFGenerator(show, options.dots).generate(options);
            $(".js-pdf-preview")
                .removeAttr("srcdoc")
                .attr("src", pdfData);
        } catch(err) {
            setIFrame("An error occurred.", true);
            throw err;
        }
    }).fail(function() {
        setIFrame("Could not reach server.", true);
    });
});
