/*

    Tests for the "schema Middleware" that rejects requests with invalid JSON payloads.

*/
/* eslint-env node */
"use strict";
var fluid =  require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("gpii-express");
gpii.express.loadTestingSupport();

require("../lib/errors");
require("../lib/checkResponseHeaders");
require("../lib/fixtures");

var kettle = require("kettle");
kettle.loadTestingSupport();

require("../../../");

fluid.defaults("gpii.test.schema.middleware.contentAware.request", {
    gradeNames: ["kettle.test.request.http"],
    path:       "/gatedContentAware",
    port:       "{testEnvironment}.options.port",
    method:     "POST"
});

fluid.defaults("gpii.test.schema.middleware.contentAware.request.html", {
    gradeNames: ["gpii.test.schema.middleware.contentAware.request"],
    headers: {
        "accept": "text/html"
    }
});

fluid.defaults("gpii.test.schema.middleware.contentAware.request.json", {
    gradeNames: ["gpii.test.schema.middleware.contentAware.request"],
    headers: {
        "accept": "application/json"
    }
});

// Wire in an instance of kettle.requests.request.http for each test and wire the check to its onError or onSuccess event
fluid.defaults("gpii.test.schema.middleware.contentAware.caseHolder", {
    gradeNames: ["gpii.test.express.caseHolder"],
    validPayload: {
        shallowlyRequired: true,
        testString:        "CATs",
        testAllOf:         "CATs"
    },
    invalidPayload: {
        testString: "CATs",
        testAllOf:  "CATs"
    },
    expected: {
        invalidText: "should have required property",
        invalidJson: {
            "isError": true,
            "message": "The JSON you have provided is not valid.",
            "fieldErrors": [
                {
                    "keyword": "required",
                    "dataPath": "",
                    "schemaPath": "#/required",
                    "params": {
                        "missingProperty": "shallowlyRequired"
                    },
                    "message": "should have required property 'shallowlyRequired'"
                }
            ]
        },
        validText: "I am happy to hear from you.",
        validJson: {
            ok: true,
            "message": "I am happy to hear from you."
        }
    },
    rawModules: [
        {
            name: "Testing validation with 'content aware' middleware...",
            tests: [
                {
                    name: "Testing a valid POST response with no 'Accept' header...",
                    type: "test",
                    sequence: [
                        {
                            func: "{validPostNoHeader}.send",
                            args: ["{that}.options.validPayload"]
                        },
                        {
                            listener: "jqUnit.assertEquals",
                            event:    "{validPostNoHeader}.events.onComplete",
                            args:     ["We should receive a text message indicating 'success'...", "{that}.options.expected.validText", "{arguments}.0"]
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args: ["The status code should indicate that we were successful...", 200, "{validPostNoHeader}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Testing a valid POST response with 'Accept: text/html'...",
                    type: "test",
                    sequence: [
                        {
                            func: "{validPostHtmlHeader}.send",
                            args: ["{that}.options.validPayload"]
                        },
                        {
                            listener: "jqUnit.assertEquals",
                            event:    "{validPostHtmlHeader}.events.onComplete",
                            args:     ["We should receive a text message indicating 'success'...", "{that}.options.expected.validText", "{arguments}.0"]
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args: ["The status code should indicate that we were successful...", 200, "{validPostHtmlHeader}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Testing a valid POST response with 'Accept: application/json'...",
                    type: "test",
                    sequence: [
                        {
                            func: "{validPostJsonHeader}.send",
                            args: ["{that}.options.validPayload"]
                        },
                        {
                            listener: "jqUnit.assertDeepEq",
                            event:    "{validPostJsonHeader}.events.onComplete",
                            args:     ["We should receive a JSON payload indicating 'success'...", "{that}.options.expected.validJson", "@expand:JSON.parse({arguments}.0)"]
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args: ["The status code should indicate that we were successful...", 200, "{validPostJsonHeader}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Testing an invalid POST response with no 'Accept' header...",
                    type: "test",
                    sequence: [
                        {
                            func: "{invalidPostNoHeader}.send",
                            args: ["{that}.options.invalidPayload"]
                        },
                        {
                            listener: "gpii.test.schema.checkHtmlResponse",
                            event:    "{invalidPostNoHeader}.events.onComplete",
                            args:     ["We should receive a text message indicating 'failure'...", "{that}.options.expected.invalidText", "{arguments}.0"]
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args: ["The status code should indicate that we were unsuccessful...", 400, "{invalidPostNoHeader}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Testing an invalid POST response with 'Accept: text/html'...",
                    type: "test",
                    sequence: [
                        {
                            func: "{invalidPostHtmlHeader}.send",
                            args: ["{that}.options.invalidPayload"]
                        },
                        {
                            listener: "gpii.test.schema.checkHtmlResponse",
                            event:    "{invalidPostHtmlHeader}.events.onComplete",
                            args:     ["We should receive a text message indicating 'failure'...", "{that}.options.expected.invalidText", "{arguments}.0"]
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args: ["The status code should indicate that we were unsuccessful...", 400, "{invalidPostHtmlHeader}.nativeResponse.statusCode"]
                        }
                    ]
                },
                {
                    name: "Testing an invalid POST response with 'Accept: application/json'...",
                    type: "test",
                    sequence: [
                        {
                            func: "{invalidPostJsonHeader}.send",
                            args: ["{that}.options.invalidPayload"]
                        },
                        {
                            listener: "jqUnit.assertDeepEq",
                            event:    "{invalidPostJsonHeader}.events.onComplete",
                            args:     ["We should receive a JSON payload indicating 'failure'...", "{that}.options.expected.invalidJson", "@expand:JSON.parse({arguments}.0)"]
                        },
                        {
                            func: "jqUnit.assertEquals",
                            args: ["The status code should indicate that we were unsuccessful...", 400, "{invalidPostJsonHeader}.nativeResponse.statusCode"]
                        }
                    ]
                }
            ]
        }
    ],
    components: {
        validPostNoHeader: {
            type: "gpii.test.schema.middleware.contentAware.request"
        },
        validPostHtmlHeader: {
            type: "gpii.test.schema.middleware.contentAware.request.html"
        },
        validPostJsonHeader: {
            type: "gpii.test.schema.middleware.contentAware.request.json"
        },
        invalidPostNoHeader: {
            type: "gpii.test.schema.middleware.contentAware.request"
        },
        invalidPostHtmlHeader: {
            type: "gpii.test.schema.middleware.contentAware.request.html"
        },
        invalidPostJsonHeader: {
            type: "gpii.test.schema.middleware.contentAware.request.json"
        }
    }
});

fluid.defaults("gpii.test.schema.middleware.contentAware.testEnvironment", {
    gradeNames: ["gpii.test.schema.testEnvironment"],
    port:       7593,
    components: {
        caseHolder: {
            type: "gpii.test.schema.middleware.contentAware.caseHolder"
        }
    }
});

fluid.test.runTests("gpii.test.schema.middleware.contentAware.testEnvironment");
