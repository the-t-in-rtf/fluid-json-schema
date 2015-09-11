// Test `gpii.schema.middleware` and its subcomponents.
//
"use strict";
var fluid        = fluid || require("infusion");
var gpii         = fluid.registerNamespace("gpii");
var jqUnit       = require("jqUnit");

require("../../node_modules/gpii-express/tests/js/lib/test-helpers");
require("./lib/errors");

// We use just the request-handling bits of the kettle stack in our tests, but we include the whole thing to pick up the base grades
require("../../node_modules/kettle");
require("../../node_modules/kettle/lib/test/KettleTestUtils");

// The server-side libraries we are testing
require("../../");

fluid.defaults("gpii.schema.tests.middleware.request", {
    gradeNames: ["kettle.test.request.http"],
    path:       "/gated",
    port:       "{testEnvironment}.options.port",
    method:     "POST"
});

fluid.registerNamespace("gpii.schema.tests.middleware.caseHolder");
gpii.schema.tests.middleware.caseHolder.examineResponse = function (response, body, shouldBeValid) {
    var expectedStatus = shouldBeValid ? 200 : 400;
    jqUnit.assertDeepEq("The status code should be as expected...", expectedStatus, response.statusCode);

    if (!shouldBeValid) {
        try {
            var jsonData = typeof body === "string" ? JSON.parse(body) : body;
            gpii.schema.tests.hasErrors(jsonData);
        }
        catch (e) {
            fluid.fail("There should be no parsing errors:\n" + e);
        }
    }
};

// Wire in an instance of kettle.requests.request.http for each test and wire the check to its onError or onSuccess event
fluid.defaults("gpii.schema.tests.middleware.caseHolder", {
    gradeNames: ["gpii.express.tests.caseHolder"],
    rawModules: [
        {
            tests: [
                {
                    name: "Testing a request with no body...",
                    type: "test",
                    sequence: [
                        {
                            func: "{emptyRequest}.send"
                        },
                        {
                            listener: "gpii.schema.tests.middleware.caseHolder.examineResponse",
                            event:    "{emptyRequest}.events.onComplete",
                            args:     ["{emptyRequest}.nativeResponse", "{arguments}.0", true]
                        }
                    ]
                },
                {
                    name: "Testing a request with bad JSON data...",
                    type: "test",
                    sequence: [
                        {
                            func: "{badJsonRequest}.send",
                            args: [{}]
                        },
                        {
                            listener: "gpii.schema.tests.middleware.caseHolder.examineResponse",
                            event:    "{badJsonRequest}.events.onComplete",
                            args:     ["{badJsonRequest}.nativeResponse", "{arguments}.0", false]
                        }
                    ]
                },
                {
                    name: "Testing a request with valid JSON data...",
                    type: "test",
                    sequence: [
                        {
                            func: "{goodJsonRequest}.send",
                            args: [{required: true}]
                        },
                        {
                            listener: "gpii.schema.tests.middleware.caseHolder.examineResponse",
                            event:    "{goodJsonRequest}.events.onComplete",
                            args:     ["{goodJsonRequest}.nativeResponse", "{arguments}.0", true]
                        }
                    ]
                }
            ]
        }
    ],
    components: {
        emptyRequest: {
            type: "gpii.schema.tests.middleware.request"
        },
        nonJsonRequest: {
            type: "gpii.schema.tests.middleware.request"
        },
        badJsonRequest: {
            type: "gpii.schema.tests.middleware.request"
        },
        goodJsonRequest: {
            type: "gpii.schema.tests.middleware.request"
        }
    }
});
