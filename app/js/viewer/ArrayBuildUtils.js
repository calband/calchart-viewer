/**
 * @fileOverview Defines various functions used for building/modifying
 *   array contents.
 */

/**
 * A collection of functions used for building/modifying array contents.
 */
var ArrayBuildUtils = {};

/**
 * Merges two arrays into one large sorted array, given that the original
 * two arrays are sorted according to the same ordering scheme that the
 * final array will use.
 *
 * @param {Array<*>} first The first array to merge.
 * @param {Array<*>} second The second array to merge.
 * @param {function(*, *):int} comparator A function which will define
 *   the order in which the final array will be sorted. The original
 *   two arrays should also be sorted in a way that satisfies this function.
 *   It will be passed two objects that will be placed into the final array,
 *   and must return an integer indicating how they should be ordered in
 *   the final array: a negative value if the first of the two objects
 *   should come before the other in the final array; a positive value if
 *   the first of the two objects should come after the other in the final
 *   array; zero if the order in which the two objects appear in the final
 *   array, relative to each other, does not matter.
 * @return {Array<*>} A new array which contains all elements of the
 *   original two arrays, in sorted order.
 */
ArrayBuildUtils.mergeSortedArrays = function(first, second, comparator) {
    var indexInFirst = 0;
    var indexInSecond = 0;
    var mergedArray = [];
    while (indexInFirst < first.length && indexInSecond < second.length) {
        if (comparator(first[indexInFirst], second[indexInSecond]) < 0) {
            mergedArray.push(first[indexInFirst]);
            indexInFirst++;
        } else {
            mergedArray.push(second[indexInSecond]);
            indexInSecond++;
        }
    }
    for (; indexInFirst < first.length; indexInFirst++) {
        mergedArray.push(first[indexInFirst]);
    }
    for (; indexInSecond < second.length; indexInSecond++) {
        mergedArray.push(second[indexInSecond]);
    }
    return mergedArray;
};

module.exports = ArrayBuildUtils;