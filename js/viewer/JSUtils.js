/**
 * @fileOverview Defines miscellaneous utility functions.
 */

/**
 * A collection of javascript utility functions.
 */
var JSUtils = {};
 
/**
 * Causes a child class to inherit from a parent class.
 *
 * @param {function} ChildClass The class that will inherit
 *   from another.
 * @param {function} ParentClass The class to inherit from.
 */
JSUtils.extends = function (ChildClass, ParentClass) {
    var Inheritor = function () {}; // dummy constructor
    Inheritor.prototype = ParentClass.prototype;
    ChildClass.prototype = new Inheritor();
};

/**
 * Returns the value of the given name in the URL query string
 *
 * getQueryValue("hello") on http://foo.bar?hello=world should return "world"
 *
 * @param {String} name
 * @returns {String|null} the value of the name or null if name not in URL query string
 */
JSUtils.getQueryValue = function(name) {
    var vals = this.getAllQueries();
    if (vals[name] !== undefined) {
        return vals[name];
    } else {
        return null;
    }
};

/**
 * Returns all name-value pairs in the URL query string
 *
 * @returns {object} a dictionary mapping name to value
 */
JSUtils.getAllQueries = function() {
    var vals = {};
    var query = window.location.search.substr(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        var name = decodeURIComponent(pair[0]);
        var value = decodeURIComponent(pair[1]);
        vals[name] = value;
    }
    return vals;
}

module.exports = JSUtils;