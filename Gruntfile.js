module.exports = function (grunt) {
    var fs = require("fs");
    var execSync = require("child_process").execSync;

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
                    pdf: "./js/pdf.js",
                    mobile: "./js/mobile.js",
                },
                output: {
                    path: __dirname + "/build/js/",
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

    grunt.registerTask("build-info", function() {
        var buildInfo = {
            commit: "unknown",
            branch: "unknown",
            builtAt: new Date().toISOString(),
        };

        try {
            buildInfo.commit = execSync("git rev-parse --short HEAD").toString().trim();
            buildInfo.branch = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
        } catch (err) {
            grunt.log.writeln("Could not resolve git build info. Using defaults.");
        }

        fs.mkdirSync("build", { recursive: true });
        fs.writeFileSync("build/build-info.json", JSON.stringify(buildInfo, null, 2) + "\n");
        grunt.log.writeln("Wrote build/build-info.json");
    });

    grunt.registerTask("build", ["build-info", "less", "webpack:build"]);
    grunt.registerTask("default", ["build", "watch"]);
};