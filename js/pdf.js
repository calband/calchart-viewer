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

    /**
     * Returns the HTML code for the loading/error screens
     */
    function getHTML(message, isError) {
        var color = isError ? "#ff0000" : "#fdb515";
        return "<center><img src='img/calchart-viewer-highstepper.png'><h1 style= \
            'color:" + color + ";font-family:\"Open Sans\";font-weight:normal;'>" +
            message + "</h1></center>";
    };

    // Loading screen
    $(".js-pdf-preview").attr("srcdoc", getHTML("Loading..."));

    var url = "https://calchart-server.herokuapp.com/chart/" + options["show"];
    $.getJSON(url, function(data) {
        var show = ShowUtils.fromJSON(JSON.stringify(data));
        try {
            new PDFGenerator(show, options["dot"]).generate(options);
        } catch(err) {
            $(".js-pdf-preview").attr("srcdoc", getHTML("An error occurred.", true));
            throw err;
        }
    }).fail(function() {
        $(".js-pdf-preview").attr("srcdoc", getHTML("An error occurred.", true));
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