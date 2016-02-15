/* Tests for the "express" and "router" module */
"use strict";
var fluid =  require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("./test-harness");
require("./middleware-caseholder");

fluid.defaults("gpii.schema.tests.middleware.gatedRouter", {
    gradeNames:    ["gpii.schema.middleware.requestAware.router"],
    handlerGrades: ["gpii.schema.tests.middleware.underlyingHandler"],
    path:          "/gated",
    schemaKey:     "gated.json",
    schemaPath:    "%gpii-json-schema/tests/schemas"
});

fluid.defaults("gpii.schema.tests.middleware.testEnvironment", {
    gradeNames: ["fluid.test.testEnvironment"],
    port:       7533,
    events: {
        constructServer: null,
        onStarted: null
    },
    components: {
        harness: {
            createOnEvent: "constructServer",
            type: "gpii.schema.tests.harness",
            options: {
                "port" : "{testEnvironment}.options.port",
                events: {
                    onStarted: "{testEnvironment}.events.onStarted"
                }
            }
        },
        testCaseHolder: {
            type: "gpii.schema.tests.middleware.caseHolder"
        },
        getRequest: {
            type: "gpii.schema.tests.middleware.request.get"
        },
        putRequest: {
            type: "gpii.schema.tests.middleware.request.put"
        },
        postRequest: {
            type: "gpii.schema.tests.middleware.request.post"
        }
    }
});

gpii.schema.tests.middleware.testEnvironment();
