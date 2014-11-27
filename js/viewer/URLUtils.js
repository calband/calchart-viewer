/**
 * @fileOverview This file defines functions that allows useful information to be
 * extracted from the URL
 */

/**
 * A collection of URL-related utility functions.
 */
var URLUtils = {};

/**
 * Returns the value of the given name in the URL query string
 *
 * getQueryValue("hello") on http://foo.bar?hello=world should return "world"
 *
 * @param {String} name
 * @returns {String|null} the value of the name or null if name not in URL query string
 */
URLUtils.getQueryValue = function(name) {
    var query = window.location.search.substr(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (decodeURIComponent(pair[0]) === name) {
            return decodeURIComponent(pair[1]);
        }
    }
    return null;
};

module.exports = URLUtils;