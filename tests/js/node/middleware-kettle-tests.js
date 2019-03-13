/* Tests covering schema validation within a kettle.app instance */
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("./lib/fixtures");
require("./lib/middleware-kettle-fixtures");

var jqUnit = require("node-jqunit");

// gpii.schema.kettle.request.http

fluid.registerNamespace("gpii.tests.schema.middleware.kettle.caseHolder");
gpii.tests.schema.middleware.kettle.caseHolder.examineResponse = function (body, shouldBeValid) {
    if (shouldBeValid) {
        jqUnit.assertEquals("The response body should be correct.", "Nothing can be ill.", body);
    }
    else {
        try {
            var jsonData = typeof body === "string" ? JSON.parse(body) : body;
            jqUnit.assertEquals("The data should be flagged as invalid.", jsonData.isValid, false);
            jqUnit.assertTrue("There should be at least one validation error", jsonData.errors.length > 0);
        }
        catch (e) {
            jqUnit.fail("There should be no parsing errors:\n" + e);
        }
    }
};

// Wire in an instance of kettle.requests.request.http for each test and wire the check to its onError or onSuccess event
fluid.defaults("gpii.tests.schema.middleware.kettle.caseHolder", {
    gradeNames: ["gpii.test.schema.caseHolder"],
    inputs: {
        validBody: {
            hasBodyContent: "good"
        },
        invalidBody: {}
    },
    rawModules: [
        // TODO: Valid Body
        // TODO: Invalid Body

        // TODO: Valid URL params.
        // TODO: Invalid URL params.

        // TODO: Valid GET query data
        // TODO: Invalid GET query data

        // TODO: Valid Combined
        // TODO: Invalid Combined (body)
        // TODO: Invalid Combined (query)
        // TODO: Invalid Combined (params)
        {
            name: "A valid JSON body should be accepted.",
            tests: [
                {
                    name: "Testing a valid JSON body sent via POST.",
                    type: "test",
                    sequence: [
                        {
                            func: "{validBodyRequest}.send",
                            args: ["{that}.options.inputs.validBody"]
                        },
                        {
                            listener: "gpii.tests.schema.middleware.kettle.caseHolder.examineResponse",
                            event:    "{validBodyRequest}.events.onComplete",
                            args:     ["{validBodyRequest}.nativeResponse", "{arguments}.0", false]
                        }
                    ]
                }
            ]
        }
    ],
    components: {
        validBodyRequest: {
            type: "gpii.test.schema.middleware.kettle.request",
            options: {
                method: "POST",
                path: "/gated/body"
            }
        },
        invalidBodyRequest: {
            type: "gpii.test.schema.middleware.kettle.request",
            options: {
                method: "POST",
                path: "/gated/body"
            }
        }
    }
});

fluid.defaults("gpii.tests.schema.middleware.kettle.testEnvironment", {
    gradeNames: ["gpii.test.schema.testEnvironment.base"],
    port:       7533,
    events: {
        onKettleReady: null,
        onFixturesConstructed: {
            events: {
                onKettleReady: "onKettleReady"
            }
        }
    },
    components: {
        kettle: {
            createOnEvent: "constructFixtures",
            type: "kettle.server",
            options: {
                port: "{testEnvironment}.options.port",
                listeners: {
                    "onListen.notifyEnvironment": {
                        func: "{testEnvironment}.events.onKettleReady.fire"
                    }
                },
                components: {
                    app: {
                        type: "gpii.test.schema.kettle.app"
                    }
                }
            }
        },
        caseHolder: {
            type: "gpii.tests.schema.middleware.kettle.caseHolder"
        }
    }
});

fluid.test.runTests("gpii.tests.schema.middleware.kettle.testEnvironment");
