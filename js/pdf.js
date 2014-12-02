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

    var url = "https://calchart-server.herokuapp.com/chart/" + options["show"];
    $.getJSON(url, function(data) {
        var show = ShowUtils.fromJSON(JSON.stringify(data));
        new PDFGenerator(show, options["dot"], options).generate();
    }).fail(function() {
        $(".js-pdf-preview").attr("srcdoc", "An error occurred. Please return to the viewer.");
    });

    var keys = ["md-orientation", "bev-orientation", "sd-orientation", "layout-order", "endsheet-widget"];

    keys.forEach(function(key) {
        $(".options input[name=" + key + "][value=" + options[key] + "]").prop("checked", true);
    })

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