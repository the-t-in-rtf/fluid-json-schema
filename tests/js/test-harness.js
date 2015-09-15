/*
    Test harness common to all Zombie tests.  Loads all required server-side components.
 */
"use strict";
var fluid = fluid || require("infusion");
var path  = require("path");

require("gpii-express");

// Test content (HTML, JS, templates)
var testDir    = path.resolve(__dirname, "..");
var contentDir = path.join(testDir, "static");
var viewDir    = path.join(testDir, "views");

// Dependencies
var bcDir      = path.resolve(__dirname, "../../bower_components");
var modulesDir = path.resolve(__dirname, "../../node_modules");

// Main source to be tested
var srcDir     = path.resolve(__dirname, "../../src");


fluid.registerNamespace("gpii.schema.tests.harness");
fluid.defaults("gpii.schema.tests.harness", {
    gradeNames: ["gpii.express", "autoInit"],
    expressPort: 6194,
    baseUrl: "http://localhost:6194/",
    config:  {
        express: {
            "port" : "{that}.options.expressPort",
            baseUrl: "{that}.options.baseUrl",
            views:   viewDir
        }
    },
    components: {
        bc: {
            type: "gpii.express.router.static",
            options: {
                path:    "/bc",
                content: bcDir
            }
        },
        js: {
            type: "gpii.express.router.static",
            options: {
                path:    "/src",
                content: srcDir
            }
        },
        modules: {
            type: "gpii.express.router.static",
            options: {
                path:    "/modules",
                content: modulesDir
            }
        },
        content: {
            type: "gpii.express.router.static",
            options: {
                path:    "/content",
                content: contentDir
            }
        }
    }
});