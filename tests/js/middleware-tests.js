/* Tests for the "express" and "router" module */
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.setLogging(true);

require("./test-harness");
require("./middleware-caseholder");

fluid.defaults("gpii.schema.tests.middleware.naiveHandler", {
    gradeNames: ["gpii.express.handler"],
    invokers: {
        handleRequest: {
            func: "{that}.sendResponse",
            args: [200, { ok: true, message: "So nice to hear from you."}]
        }
    }
});

fluid.defaults("gpii.schema.tests.middleware.testEnvironment", {
    gradeNames: ["fluid.test.testEnvironment"],
    port:       7533,
    baseUrl:    "http://localhost:7533/",
    events: {
        constructServer: null,
        onStarted: null
    },
    components: {
        harness: {
            createOnEvent: "constructServer",
            type: "gpii.schema.tests.harness",
            options: {
                "expressPort" : "{testEnvironment}.options.port",
                "baseUrl":      "{testEnvironment}.options.baseUrl",
                events: {
                    onStarted: "{testEnvironment}.events.onStarted"
                },
                components: {
                    // required middleware that provides `req.body`
                    json: {
                        type: "gpii.express.middleware.bodyparser.json"
                    },
                    urlencoded: {
                        type: "gpii.express.middleware.bodyparser.urlencoded"
                    },
                    // Test middleware, will reject any input that a) is not JSON and b) does not contain a `required` boolean.
                    gateKeeper: {
                        type: "gpii.schema.middleware",
                        options: {
                            schemaContent: { "type": "object", "properties": { "required": { "type": "boolean" } }, "required": ["required"]}
                        }
                    },
                    router: {
                        type: "gpii.express.requestAware.router",
                        options: {
                            path: "/gated",
                            // Overly trusting handler that will always say hello if you let it.
                            handlerGrades: ["gpii.schema.tests.middleware.naiveHandler"]
                        }
                    }
                }
            }
        },
        testCaseHolder: {
            type: "gpii.schema.tests.middleware.caseHolder"
        }
    }
});

gpii.schema.tests.middleware.testEnvironment();
