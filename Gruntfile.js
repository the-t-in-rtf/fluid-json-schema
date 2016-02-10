"use strict";

module.exports = function (grunt) {
    grunt.initConfig({
        exec: {
            browserify_ajv: {
                cwd: "./node_modules/ajv",
                cmd: "npm run bundle"
            }
        },
        jshint: {
            src: ["src/**/*.js", "tests/js/**/*.js"],
            buildScripts: ["Gruntfile.js"],
            options: {
                jshintrc: true
            }
        },
        jsonlint: {
            src: ["src/**/*.json", "tests/**/*.json"]
        }
    });

    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-exec");
    grunt.loadNpmTasks("grunt-jsonlint");
    grunt.loadNpmTasks("grunt-shell");

    grunt.registerTask("lint", "Apply jshint and jsonlint", ["jshint", "jsonlint"]);
};

