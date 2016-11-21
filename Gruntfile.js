module.exports = function (grunt) {
    grunt.loadNpmTasks("grunt-contrib-less");
    grunt.loadNpmTasks("grunt-webpack");
    grunt.loadNpmTasks("grunt-contrib-watch");

    grunt.initConfig({
        less: {
            src: {
                expand: true,
                cwd: "css",
                src: ["**/*.less"],
                dest: "build/css",
                ext: ".css"
            }
        },
        webpack: {
            build: {
                entry: {
                    application: "./js/application.js",
                    viewpsheet: "./js/viewpsheet.js",
                    mobile: "./js/mobile.js",
                },
                output: {
                    path: "build/js/",
                    filename: "[name].js"
                }
            }
        },
        watch: {
            less: {
                files: ["css/**/*.less"],
                tasks: ["less"]
            },
            js: {
                files: ["js/**/*.js"],
                tasks: ["webpack:build"]
            }
        }
    });

    grunt.registerTask("build", ["less", "webpack:build"]);
    grunt.registerTask("default", ["build", "watch"]);
};