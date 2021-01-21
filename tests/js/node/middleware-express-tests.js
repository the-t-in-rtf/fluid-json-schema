/*

    Tests for the "schema validation (express) middleware" that rejects requests with invalid JSON payloads.

*/
/* eslint-env node */
"use strict";
var fluid =  require("infusion");

var jqUnit = require("node-jqunit");

require("fluid-express");
fluid.express.loadTestingSupport();

require("./lib/fixtures");

var kettle = require("kettle");
kettle.loadTestingSupport();

require("../../../");

require("./lib/fixtures");

fluid.registerNamespace("fluid.tests.schema.middleware.express.caseHolder");
fluid.tests.schema.middleware.express.caseHolder.examineResponse = function (response, body, shouldBeValid) {
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
            fluid.fail("There should be no parsing errors:\n" + e);
        }
    }
};

fluid.defaults("fluid.tests.schema.middleware.request", {
    gradeNames: ["fluid.test.schema.request"],
    endpoint: {
        expander: {
            funcName: "fluid.stringTemplate",
            args: ["gated/%method", { method: "{that}.options.method"}]
        }
    },
    headers: {
        accept: "application/json"
    }
});

fluid.defaults("fluid.tests.schema.middleware.request.post", {
    gradeNames: ["fluid.tests.schema.middleware.request"],
    method:     "POST"
});

fluid.defaults("fluid.tests.schema.middleware.request.get", {
    gradeNames: ["fluid.tests.schema.middleware.request"],
    method:     "GET"
});

fluid.defaults("fluid.tests.schema.middleware.request.put", {
    gradeNames: ["fluid.tests.schema.middleware.request"],
    method:     "PUT"
});

// Wire in an instance of kettle.requests.request.http for each test and wire the check to its onError or onSuccess event
fluid.defaults("fluid.tests.schema.middleware.express.caseHolder", {
    gradeNames: ["fluid.test.schema.caseHolder"],
    rawModules: [
        {
            name: "Testing the schema validation middleware in combination with the 'request aware' middleware...",
            tests: [
                {
                    name: "Testing a GET request with no body...",
                    type: "test",
                    sequence: [
                        {
                            func: "{emptyGetRequest}.send"
                        },
                        {
                            listener: "fluid.tests.schema.middleware.express.caseHolder.examineResponse",
                            event:    "{emptyGetRequest}.events.onComplete",
                            args:     ["{emptyGetRequest}.nativeResponse", "{arguments}.0", false]
                        }
                    ]
                },
                {
                    name: "Testing a GET request with bad JSON data...",
                    type: "test",
                    sequence: [
                        {
                            func: "{badJsonGetRequest}.send",
                            args: [{}]
                        },
                        {
                            listener: "fluid.tests.schema.middleware.express.caseHolder.examineResponse",
                            event:    "{badJsonGetRequest}.events.onComplete",
                            args:     ["{badJsonGetRequest}.nativeResponse", "{arguments}.0", false]
                        }
                    ]
                },
                {
                    name: "Testing a GET request with valid JSON data...",
                    type: "test",
                    sequence: [
                        {
                            func: "{goodJsonGetRequest}.send",
                            args: [{shallowlyRequired: true}]
                        },
                        {
                            listener: "fluid.tests.schema.middleware.express.caseHolder.examineResponse",
                            event:    "{goodJsonGetRequest}.events.onComplete",
                            args:     ["{goodJsonGetRequest}.nativeResponse", "{arguments}.0", true]
                        }
                    ]
                },
                {
                    name: "Testing a POST request with no body...",
                    type: "test",
                    sequence: [
                        {
                            func: "{emptyPostRequest}.send"
                        },
                        {
                            listener: "fluid.tests.schema.middleware.express.caseHolder.examineResponse",
                            event:    "{emptyPostRequest}.events.onComplete",
                            args:     ["{emptyPostRequest}.nativeResponse", "{arguments}.0", false]
                        }
                    ]
                },
                {
                    name: "Testing a POST request with bad JSON data...",
                    type: "test",
                    sequence: [
                        {
                            func: "{badJsonPostRequest}.send",
                            args: [{}]
                        },
                        {
                            listener: "fluid.tests.schema.middleware.express.caseHolder.examineResponse",
                            event:    "{badJsonPostRequest}.events.onComplete",
                            args:     ["{badJsonPostRequest}.nativeResponse", "{arguments}.0", false]
                        }
                    ]
                },
                {
                    name: "Testing a POST request with valid JSON data...",
                    type: "test",
                    sequence: [
                        {
                            func: "{goodJsonPostRequest}.send",
                            args: [{shallowlyRequired: true}]
                        },
                        {
                            listener: "fluid.tests.schema.middleware.express.caseHolder.examineResponse",
                            event:    "{goodJsonPostRequest}.events.onComplete",
                            args:     ["{goodJsonPostRequest}.nativeResponse", "{arguments}.0", true]
                        }
                    ]
                },
                {
                    name: "Testing a PUT request with no body...",
                    type: "test",
                    sequence: [
                        {
                            func: "{emptyPutRequest}.send"
                        },
                        {
                            listener: "fluid.tests.schema.middleware.express.caseHolder.examineResponse",
                            event:    "{emptyPutRequest}.events.onComplete",
                            args:     ["{emptyPutRequest}.nativeResponse", "{arguments}.0", false]
                        }
                    ]
                },
                {
                    name: "Testing a PUT request with bad JSON data...",
                    type: "test",
                    sequence: [
                        {
                            func: "{badJsonPutRequest}.send",
                            args: [{}]
                        },
                        {
                            listener: "fluid.tests.schema.middleware.express.caseHolder.examineResponse",
                            event:    "{badJsonPutRequest}.events.onComplete",
                            args:     ["{badJsonPutRequest}.nativeResponse", "{arguments}.0", false]
                        }
                    ]
                },
                {
                    name: "Testing a PUT request with valid JSON data...",
                    type: "test",
                    sequence: [
                        {
                            func: "{goodJsonPutRequest}.send",
                            args: [{shallowlyRequired: true}]
                        },
                        {
                            listener: "fluid.tests.schema.middleware.express.caseHolder.examineResponse",
                            event:    "{goodJsonPutRequest}.events.onComplete",
                            args:     ["{goodJsonPutRequest}.nativeResponse", "{arguments}.0", true]
                        }
                    ]
                }
            ]
        }
    ],
    components: {
        emptyGetRequest: {
            type: "fluid.tests.schema.middleware.request.get"
        },
        nonJsonGetRequest: {
            type: "fluid.tests.schema.middleware.request.get"
        },
        badJsonGetRequest: {
            type: "fluid.tests.schema.middleware.request.get"
        },
        goodJsonGetRequest: {
            type: "fluid.tests.schema.middleware.request.get",
            options: {
                endpoint: "gated/get?shallowlyRequired=true"
            }
        },
        emptyPostRequest: {
            type: "fluid.tests.schema.middleware.request.post"
        },
        nonJsonPostRequest: {
            type: "fluid.tests.schema.middleware.request.post"
        },
        badJsonPostRequest: {
            type: "fluid.tests.schema.middleware.request.post"
        },
        goodJsonPostRequest: {
            type: "fluid.tests.schema.middleware.request.post"
        },
        emptyPutRequest: {
            type: "fluid.tests.schema.middleware.request.put"
        },
        nonJsonPutRequest: {
            type: "fluid.tests.schema.middleware.request.put"
        },
        badJsonPutRequest: {
            type: "fluid.tests.schema.middleware.request.put"
        },
        goodJsonPutRequest: {
            type: "fluid.tests.schema.middleware.request.put"
        }
    }
});

fluid.defaults("fluid.tests.schema.middleware.testEnvironment", {
    gradeNames: ["fluid.test.schema.testEnvironment.express"],
    port:       7533,
    components: {
        caseHolder: {
            type: "fluid.tests.schema.middleware.express.caseHolder"
        }
    }
});

fluid.test.runTests("fluid.tests.schema.middleware.testEnvironment");
