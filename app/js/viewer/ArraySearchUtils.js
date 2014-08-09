/**
 * @fileOverview Defines various utility functions that can be used
 *   to search arrays.
 */

/**
 * A collection of all of the array search functions.
 * @type {object}
 */
var ArraySearchUtils = {};

/**
 * A function that explores a sorted array using a binary search.
 * This function DOES NOT RETURN ANYTHING. However, the
 * guidFunc function (@see guideFunc) is called througout
 * the search, and can potentially collect results from the
 * search so that they can be accessed later.
 *
 * @param {array} array The array to search. The array MUST
 *   be sorted for the function to work. The ordering of the array
 *   is assumed to be 'smallest' to 'largest'.
 * @param {function} guideFunc A function that takes two parameters:
 *   first, an element from the array being searched; second, the
 *   index associated with that element. The function must return
 *   a number that indicates how to procede with the search: a negative
 *   value if the search should procede by looking at values that are
 *   'smaller' (earlier in the array) than the one passed in the first parameter;
 *   a positive value if the search should procede by looking at values that
 *   are 'larger' (later in the array) than the one passed in the first
 *   parameter; zero if the search should end. This function
 *   could be used to collect information about the findings of a
 *   search.
 */
ArraySearchUtils.binarySearchBase = function(array, guideFunc) {
    var currentBlockSize = array.length;
    var firstHalfBlockSize;
    var currentIndexOffset = 0;
    var guideVal;
    while (currentBlockSize > 0) {
        firstHalfBlockSize = Math.floor(currentBlockSize / 2);
        var targetIndex = currentIndexOffset + firstHalfBlockSize;
        guideVal = guideFunc(array[targetIndex], targetIndex);
        if (guideVal == 0) {
            break;
        } 
        if (guideVal > 0) {
            var frontShave = firstHalfBlockSize + 1;
            currentIndexOffset += frontShave;
            currentBlockSize -= frontShave;
        } else {
            currentBlockSize = firstHalfBlockSize;
        }
    }
}

/**
 * Searches a sorted array for a particular value. If
 * the value is found, its index in the array will be returned.
 * If the value is not found, then the index of the closest value
 * that is 'larger' (later in the array than the place where the
 * value would have been found) will be returned. This function
 * uses a binary search.
 *
 * @param {array} array The array to search. The array must be
 *   sorted. It is assumed that the array is sorted from 'smallest'
 *   to 'largest'.
 * @param value The value to search for in the array.
 * @param {function} comparatorFunc A function that describes the order
 *   in which the array is sorted. This function takes two
 *   parameters (of any type), and returns: a negative value
 *   if the first of the two values is 'smaller' (comes before the other
 *   in the sorted array); a positive value if the first of the two values
 *   is 'larger' (comes after the other value in the sorted array); zero
 *   if the two values are IDENTICAL and would ideally occupy the same position
 *   in the sorted array.
 * @return {int} The index of the specified value in the array, if it is found.
 *   If the value is not found, then the index of the closest value that
 *   is 'larger'.
 */
ArraySearchUtils.binarySearchForClosestLarger = function(array, value, comparatorFunc) {
    guideFunc = function(checkValue, index) {
        var compResult = comparatorFunc(value, checkValue);
        if (compResult <= 0) {
            guideFunc.searchResult = index;
        }
        return compResult;
    }
    ArraySearchUtils.binarySearchBase(array, guideFunc);
    return guideFunc.searchResult;
}

/**
 * Searches a sorted array for a particular value. If
 * the value is found, its index in the array will be returned.
 * If the value is not found, then the index of the closest value
 * that is 'smaller' (earlier in the array than the place where the
 * value would have been found) will be returned. This function uses
 * a binary search.
 *
 * @param {array} array The array to search. The array must be
 *   sorted. It is assumed that the array is sorted from 'smallest'
 *   to 'largest'.
 * @param value The value to search for in the array.
 * @param {function} comparatorFunc A function that describes the order
 *   in which the array is sorted. This function takes two
 *   parameters (of any type), and returns: a negative value
 *   if the first of the two values is 'smaller' (comes before the other
 *   in the sorted array); a positive value if the first of the two values
 *   is 'larger' (comes after the other value in the sorted array); zero
 *   if the two values are IDENTICAL and would ideally occupy the same position
 *   in the sorted array.
 * @return {int} The index of the specified value in the array, if it is found.
 *   If the value is not found, then the index of the closest value that
 *   is 'smaller'.
 */
ArraySearchUtils.binarySearchForClosestSmaller = function(array, value, comparatorFunc) {
    guideFunc = function(checkValue, index) {
        var compResult = comparatorFunc(value, checkValue);
        if (compResult >= 0) {
            guideFunc.searchResult = index;
        }
        return compResult;
    }
    ArraySearchUtils.binarySearchBase(array, guideFunc);
    return guideFunc.searchResult; 
}

/**
 * Searches a sorted array for a particular value. If
 * the value is found, its index in the array will be returned.
 * This function uses a binary search.
 *
 * @param {array} array The array to search. The array must be
 *   sorted. It is assumed that the array is sorted from 'smallest'
 *   to 'largest'.
 * @param value The value to search for in the array.
 * @param {function} comparatorFunc A function that describes the order
 *   in which the array is sorted. This function takes two
 *   parameters (of any type), and returns: a negative value
 *   if the first of the two values is 'smaller' (comes before the other
 *   in the sorted array); a positive value if the first of the two values
 *   is 'larger' (comes after the other value in the sorted array); zero
 *   if the two values are IDENTICAL and would ideally occupy the same position
 *   in the sorted array.
 * @return {int} The index of the specified value in the array, if it is found;
 *   undefined otherwise.
 */
ArraySearchUtils.binarySearch = function(array, value, comparatorFunc) {
    guideFunc = function(checkValue, index) {
        var compResult = comparatorFunc(value, checkValue);
        if (compResult == 0) {
            guideFunc.searchResult = index;
        }
        return compResult;
    }
    ArraySearchUtils.binarySearchBase(array, guideFunc);
    return guideFunc.searchResult;
}

module.exports = ArraySearchUtils;