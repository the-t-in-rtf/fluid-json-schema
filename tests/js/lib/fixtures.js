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

fluid.defaults("gpii.test.schema.caseHolder", {
    gradeNames: ["gpii.test.express.caseHolder.base"],
    sequenceStart: [
        { // This sequence point is required because of a QUnit bug - it defers the start of sequence by 13ms "to avoid any current callbacks" in its words
            func: "{testEnvironment}.events.constructServer.fire"
        },
        {
            listener: "fluid.identity",
            event: "{testEnvironment}.events.onAllReady"
        }
    ]
});

// A testEnvironment with the standard harness wired in.
fluid.defaults("gpii.test.schema.testEnvironment", {
    gradeNames: ["fluid.test.testEnvironment"],
    events: {
        constructServer: null,
        onAllReady: null
    },
    components: {
        harness: {
            createOnEvent: "constructServer",
            type: "gpii.test.schema.harness",
            options: {
                "port" : "{testEnvironment}.options.port",
                listeners: {
                    "onAllReady.notifyEnvironment": {
                        func: "{testEnvironment}.events.onAllReady.fire"
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
