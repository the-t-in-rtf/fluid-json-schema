/* Tests for the "express" and "router" module */
"use strict";
var fluid        = fluid || require("infusion");
var gpii         = fluid.registerNamespace("gpii");

fluid.setLogging(true);

require("./test-harness");
require("./handler-caseholder");

fluid.defaults("gpii.schema.tests.handler.schemaHandler", {
    gradeNames: ["gpii.schema.handler"],
    schemaKey: "sample",
    schemaUrl: "http://www.sample.com/schemas/sample.json",
    invokers: {
        handleRequest: {
            func: "{that}.sendResponse",
            args: [200, { ok: true, message: "If you're missing the headers, you're missing the point."}]
        }
    }
});

fluid.defaults("gpii.schema.tests.handler.testEnvironment", {
    gradeNames: ["fluid.test.testEnvironment"],
    port:       7523,
    baseUrl:    "http://localhost:7523/",
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
                    router: {
                        type: "gpii.express.requestAware.router",
                        options: {
                            path: "/",
                            handlerGrades: ["gpii.schema.tests.handler.schemaHandler"]
                        }
                    }
                }
            }
        },
        testCaseHolder: {
            type: "gpii.schema.tests.handler.caseHolder"
        }
    }
});

gpii.schema.tests.handler.testEnvironment();
