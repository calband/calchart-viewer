/**
 * @fileOverview Defines various utility functions that are related to
 *   defining classes and their properties.
 */

/**
 * A collection of class-related utility functions.
 */
var ClassUtils = {};
 
/**
 * Causes a child class to inherit from a parent class.
 *
 * @param {function} ChildClass The class that will inherit
 *   from another.
 * @param {function} ParentClass The class to inherit from.
 */
ClassUtils.extends = function (ChildClass, ParentClass) {
    var Inheritor = function () {}; // dummy constructor
    Inheritor.prototype = ParentClass.prototype;
    ChildClass.prototype = new Inheritor();
};

module.exports = ClassUtils;