/** Original CalChart server plus independent recovery server. */
var SERVERS = [
    "https://calchart-server.herokuapp.com",
    "https://calchart-temp-h.dooly-vader.workers.dev"
];
var TIMEOUT = 5000;

function remember(slug, server) {
    try { window.sessionStorage.setItem("calchart-source:" + slug, server); } catch (e) {}
}
function candidates(slug, useRemembered) {
    var result = SERVERS.slice();
    if (useRemembered) {
        try {
            var previous = window.sessionStorage.getItem("calchart-source:" + slug);
            if (result.indexOf(previous) !== -1) {
                result = [previous].concat(result.filter(function(s) { return s !== previous; }));
            }
        } catch (e) {}
    }
    return result;
}
function request(slug, kind, options, useRemembered) {
    options = options || {};
    var deferred = $.Deferred();
    var sources = candidates(slug, useRemembered);
    var index = 0;
    function attempt() {
        var server = sources[index++];
        $.ajax({
            url: server + "/" + kind + "/" + encodeURIComponent(slug) + "/",
            dataType: "json",
            timeout: TIMEOUT,
            xhr: options.xhr || $.ajaxSettings.xhr
        }).done(function(data) {
            try {
                if (options.validate) { options.validate(data); }
            } catch (error) {
                retry(null, "invalid-data", error);
                return;
            }
            remember(slug, server);
            console.info("[CalChart] Loaded " + slug + " from " + server);
            deferred.resolve(data);
        }).fail(retry);
    }
    function retry(xhr, status, error) {
        if (index < sources.length) {
            console.warn("[CalChart] Trying recovery source for " + slug + ": " + status);
            attempt();
        } else {
            deferred.reject(xhr, status, error);
        }
    }
    if (options.success) { deferred.done(options.success); }
    if (options.error) { deferred.fail(options.error); }
    attempt();
    var promise = deferred.promise();
    promise.complete = promise.always;
    promise.error = promise.fail;
    promise.success = promise.done;
    return promise;
}

exports.list = function() {
    var deferred = $.Deferred();
    var results = new Array(SERVERS.length);
    var pending = SERVERS.length;
    var successes = 0;
    function finish(index, data) {
        if (data && Array.isArray(data.shows) && data.shows.every(function(show) {
            return show && typeof show.slug === "string" && typeof show.name === "string";
        })) {
            results[index] = data.shows;
            successes++;
        } else { results[index] = []; }
        if (--pending !== 0) { return; }
        if (!successes) {
            deferred.reject(null, "unavailable", new Error("Neither show server responded."));
            return;
        }
        var seen = Object.create(null);
        var shows = [];
        results.forEach(function(list) {
            list.forEach(function(show) {
                if (!seen[show.slug]) { seen[show.slug] = true; shows.push(show); }
            });
        });
        deferred.resolve({ shows: shows });
    }
    SERVERS.forEach(function(server, index) {
        $.ajax({ url: server + "/list/", dataType: "json", timeout: TIMEOUT })
            .done(function(data) { finish(index, data); })
            .fail(function() { finish(index, null); });
    });
    var promise = deferred.promise();
    promise.complete = promise.always;
    promise.error = promise.fail;
    promise.success = promise.done;
    return promise;
};
exports.loadShow = function(slug, options) { return request(slug, "get", options, false); };
exports.loadViewer = function(slug, options) { return request(slug, "viewer", options, true); };
