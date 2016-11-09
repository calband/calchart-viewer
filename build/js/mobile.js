/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

	window.isMobile = true;

	$(document).ready(function() {
	    // rescale grapher to correct aspect ratio
	    var width = $(".graph-container").outerWidth();
	    $(".graph-container .graph").css("height", width / 1.5);

	    // choosing a dot now goes directly to the individual continuity page
	    $(".js-dot-labels").change(function() {
	        var show = $(".js-select-show").val();
	        var dot = $(this).val();
	        var defaults = "&md-orientation=east&bev-orientation=east&sd-orientation=east&layout-order=ltr&endsheet-widget=md";
	        window.location.href = "pdf.html?show=" + show + "&dots=" + dot + defaults;
	    });
	});


/***/ }
/******/ ]);