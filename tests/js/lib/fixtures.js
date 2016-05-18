/*
    Test fixtures for use in a range of tests.
 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var jqUnit = require("node-jqunit");

require("../../../");
require("gpii-express");
gpii.express.loadTestingSupport();

require("gpii-handlebars");
var kettle = require("kettle");
kettle.loadTestingSupport();

require("./harness");

fluid.registerNamespace("gpii.test.schema");
gpii.test.schema.checkHtmlResponse = function (message, expected, body) {
    jqUnit.assertTrue(message, body.indexOf(expected) !== -1);
};

// A testEnvironment with the standard harness wired in.
fluid.defaults("gpii.test.schema.testEnvironment", {
    gradeNames: ["gpii.test.express.testEnvironment"],
    events: {
        onHarnessReady: null,
        onFixturesConstructed: {
            events: {
                onHarnessReady: "onHarnessReady"
            }
        }
    },
    components: {
        express: {
            type: "gpii.test.schema.harness",
            options: {
                listeners: {
                    "onAllReady.notifyEnvironment": {
                        func: "{testEnvironment}.events.onHarnessReady.fire"
                    }
                }
            }
        }
    }
});

// A wrapper for `kettle.request.http` designed for use with the above `testEnvironment`.
fluid.defaults("gpii.test.schema.request", {
    gradeNames: ["kettle.test.request.http"],
    port: "{testEnvironment}.options.port",
    path: {
        expander: {
            funcName: "fluid.stringTemplate",
            args:     ["http://localhost:%port/%endpoint", { port: "{testEnvironment}.options.port", endpoint: "{that}.options.endpoint"}]
        }
    }
});
