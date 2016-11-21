var ApplicationController = require("./viewer/ApplicationController");
var ShowUtils = require("./viewer/utils/ShowUtils");
var JSUtils = require("./viewer/utils/JSUtils");

var options = JSUtils.getAllURLParams();
var applicationController = ApplicationController.getInstance();

/**
 * This function will be executed by jQuery when the HTML DOM is loaded. Here,
 * we automatically load the show and generate the individual continuity for the
 * selected dot.
 */
$(document).ready(function() {
    $(".back-link").attr("href", "index.html?show=" + options.show + "&dot=" + options.dot);

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
            $(".loading").remove();
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

            console.log(show);
        },
        error: function() {
            showError("Could not reach server.");
        },
    });
};
