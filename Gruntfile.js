module.exports = function (grunt) {
    grunt.loadNpmTasks("grunt-contrib-less");
    grunt.loadNpmTasks("grunt-webpack");
    grunt.loadNpmTasks("grunt-contrib-watch");

    grunt.initConfig({
        less: {
            src: {
                expand: true,
                cwd: "app/css",
                src: ["**/*.less"],
                dest: "build/css",
                ext: ".css"
            }
        },
        webpack: {
            build: {
                entry: "./app/js/application.js",
                output: {
                    path: "app/build/js/",
                    filename: "application.js"
                }
            }
        },
        watch: {
            less: {
                files: ["app/css/**/*.less"],
                tasks: ["less"]
            },
            js: {
                files: ["app/js/**/*.js"],
                tasks: ["webpack:build"]
            }
        }
    });
};