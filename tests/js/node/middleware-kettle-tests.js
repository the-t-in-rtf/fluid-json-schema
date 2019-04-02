/* Tests covering schema validation within a kettle.app instance */
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("./lib/fixtures");
require("./lib/middleware-kettle-fixtures");

var jqUnit = require("node-jqunit");

fluid.registerNamespace("gpii.tests.schema.middleware.kettle.caseHolder");
gpii.tests.schema.middleware.kettle.caseHolder.examineResponse = function (response, body, shouldBeValid) {
    if (shouldBeValid) {
        jqUnit.assertEquals("The response status code should indicate that the request was successful.", 200, response.statusCode);
        jqUnit.assertEquals("The response body should be correct.", "Payload accepted.", body.message);
    }
    else {
        jqUnit.assertEquals("The response status code should indicate that the request was bad.", 400, response.statusCode);
        jqUnit.assertEquals("The data should be flagged as invalid.", body.isValid, false);
        jqUnit.assertTrue("There should be at least one validation error", body.errors.length > 0);
    }
};

// Wire in an instance of kettle.requests.request.http for each test and wire the check to its onError or onSuccess event
fluid.defaults("gpii.tests.schema.middleware.kettle.caseHolder", {
    gradeNames: ["gpii.test.schema.caseHolder"],
    inputs: {
        validBody: {
            hasBodyContent: "good"
        },
        invalidBody: {
            hasBodyContent: "bad"
        }
    },
    rawModules: [
        {
            name: "Kettle schema middleware tests.",
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
                            args:     ["{validBodyRequest}.nativeResponse", "@expand:JSON.parse({arguments}.0)", true]
                        }
                    ]
                },
                {
                    name: "Testing an invalid JSON body sent via POST.",
                    type: "test",
                    sequence: [
                        {
                            func: "{invalidBodyRequest}.send",
                            args: ["{that}.options.inputs.invalidBody"]
                        },
                        {
                            listener: "gpii.tests.schema.middleware.kettle.caseHolder.examineResponse",
                            event:    "{invalidBodyRequest}.events.onComplete",
                            args:     ["{invalidBodyRequest}.nativeResponse", "@expand:JSON.parse({arguments}.0)", false]
                        }
                    ]
                },
                {
                    name: "Testing a valid URL parameter.",
                    type: "test",
                    sequence: [
                        {
                            func: "{validParamsRequest}.send",
                            args: []
                        },
                        {
                            listener: "gpii.tests.schema.middleware.kettle.caseHolder.examineResponse",
                            event:    "{validParamsRequest}.events.onComplete",
                            args:     ["{validParamsRequest}.nativeResponse", "@expand:JSON.parse({arguments}.0)", true]
                        }
                    ]
                },
                {
                    name: "Testing an invalid URL parameter.",
                    type: "test",
                    sequence: [
                        {
                            func: "{invalidParamsRequest}.send",
                            args: []
                        },
                        {
                            listener: "gpii.tests.schema.middleware.kettle.caseHolder.examineResponse",
                            event:    "{invalidParamsRequest}.events.onComplete",
                            args:     ["{invalidParamsRequest}.nativeResponse", "@expand:JSON.parse({arguments}.0)", false]
                        }
                    ]
                },
                {
                    name: "Testing valid query data.",
                    type: "test",
                    sequence: [
                        {
                            func: "{validQueryRequest}.send",
                            args: []
                        },
                        {
                            listener: "gpii.tests.schema.middleware.kettle.caseHolder.examineResponse",
                            event:    "{validQueryRequest}.events.onComplete",
                            args:     ["{validQueryRequest}.nativeResponse", "@expand:JSON.parse({arguments}.0)", true]
                        }
                    ]
                },
                {
                    name: "Testing invalid query data.",
                    type: "test",
                    sequence: [
                        {
                            func: "{invalidQueryRequest}.send",
                            args: []
                        },
                        {
                            listener: "gpii.tests.schema.middleware.kettle.caseHolder.examineResponse",
                            event:    "{invalidQueryRequest}.events.onComplete",
                            args:     ["{invalidQueryRequest}.nativeResponse", "@expand:JSON.parse({arguments}.0)", false]
                        }
                    ]
                },
                {
                    name: "Testing a request with valid POST, query, and URL parameter data.",
                    type: "test",
                    sequence: [
                        {
                            func: "{validCombinedRequest}.send",
                            args: ["{that}.options.inputs.validBody"]
                        },
                        {
                            listener: "gpii.tests.schema.middleware.kettle.caseHolder.examineResponse",
                            event:    "{validCombinedRequest}.events.onComplete",
                            args:     ["{validCombinedRequest}.nativeResponse", "@expand:JSON.parse({arguments}.0)", true]
                        }
                    ]
                },
                {
                    name: "Testing a post with invalid POST, param, and query data.",
                    type: "test",
                    sequence: [
                        {
                            func: "{invalidCombinedRequest}.send",
                            args: ["{that}.options.inputs.invalidBody"]
                        },
                        {
                            listener: "gpii.tests.schema.middleware.kettle.caseHolder.examineResponse",
                            event:    "{invalidCombinedRequest}.events.onComplete",
                            args:     ["{invalidCombinedRequest}.nativeResponse", "@expand:JSON.parse({arguments}.0)", false]
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
        },
        validParamsRequest: {
            type: "gpii.test.schema.middleware.kettle.request",
            options: {
                method: "GET",
                path: "/gated/params/good"
            }
        },
        invalidParamsRequest: {
            type: "gpii.test.schema.middleware.kettle.request",
            options: {
                method: "GET",
                path: "/gated/params/bad"
            }
        },
        validQueryRequest: {
            type: "gpii.test.schema.middleware.kettle.request",
            options: {
                method: "GET",
                path: "/gated/query?hasQueryContent=good"
            }
        },
        invalidQueryRequest: {
            type: "gpii.test.schema.middleware.kettle.request",
            options: {
                method: "GET",
                path: "/gated/query?hasQueryContent=bad"
            }
        },
        validCombinedRequest: {
            type: "gpii.test.schema.middleware.kettle.request",
            options: {
                method: "POST",
                path: "/gated/combined/good?hasQueryContent=good"
            }
        },
        invalidCombinedRequest: {
            type: "gpii.test.schema.middleware.kettle.request",
            options: {
                method: "POST",
                path: "/gated/combined/bad?hasQueryContent=bad"
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
