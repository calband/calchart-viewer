var PDFGenerator = require("./pdf/PDFGenerator");
var ShowUtils = require("./viewer/utils/ShowUtils");
var JSUtils = require("./viewer/utils/JSUtils");

/**
 * This function will be executed by jQuery when the HTML DOM is loaded. Here,
 * we automatically load the show and generate a live preview of the PDF generated
 * by the PDFGenerator
 */
$(document).ready(function() {
    var options = JSUtils.getAllURLParams();

    if (options["show"] === undefined || options["dot"] === undefined) {
        $(".js-pdf-preview").attr("srcdoc", "No show or dot selected.");
        return;
    }

    // Loading screen
    $(".js-pdf-preview").attr("srcdoc",
        "<center><img src='img/calchart-viewer-highstepper.png'><h1 style= \
        'color:#fdb515;font-family:\"Open Sans\";font-weight:normal;'>Loading...</h1></center>");

    var url = "https://calchart-server.herokuapp.com/chart/" + options["show"];
    $.getJSON(url, function(data) {
        var show = ShowUtils.fromJSON(JSON.stringify(data));
        new PDFGenerator(show, options["dot"], options).generate();
    }).fail(function() {
        $(".js-pdf-preview").attr("srcdoc", "An error occurred. Please return to the viewer.");
    });

    var keys = ["md-orientation", "bev-orientation", "sd-orientation", "layout-order", "endsheet-widget"];

    keys.forEach(function(key) {
        var allOptions = $(".options input[name=" + key + "]");
        var selected = allOptions.filter("[value=" + options[key] + "]");
        if (options[key] === undefined || selected.length === 0) {
            // choose first option by default
            allOptions.filter(":first").prop("checked", true);
        } else {
            selected.prop("checked", true);
        }
    });

    $("input").change(function(evt) {
        var target = $(evt.target);
        options[target.attr("name")] = target.attr("value");
        var url = "";
        for (var key in options) {
            url += "&" + key + "=" + options[key];
        }
        window.location.search = url.substr(1);
    });
});