// "gated" test middleware (and an underlying test handler that lies beyond the gate).  Used in testing the
// `contentAware` wrapper with our `schemaMiddleware`.
//
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("gpii-express");
require("../../../");

fluid.registerNamespace("gpii.schema.tests.middleware.router.contentAware.error.defaultHandler");
gpii.schema.tests.middleware.router.contentAware.error.defaultHandler.sendSummary = function (that) {
    var output = [];
    output.push(that.options.validationErrors.message);
    fluid.each(that.options.validationErrors.fieldErrors, function (error) {
        var label = error.dataPath.length ? error.dataPath.substring(1) : error.params.missingProperty;
        output.push("  * " + label + ": " + error.message);
    });

    that.sendResponse(400, output.join("\n"));
};

// Convert the JSON output to a string before sending it onward
//
fluid.defaults("gpii.schema.tests.middleware.router.contentAware.error.defaultHandler", {
    gradeNames: ["gpii.express.handler"],
    invokers: {
        handleRequest: {
            funcName: "gpii.schema.tests.middleware.router.contentAware.error.defaultHandler.sendSummary",
            args:     ["{that}"]
        }
    }
});

fluid.defaults("gpii.schema.tests.middleware.router.contentAware.success.defaultHandler", {
    gradeNames: ["gpii.express.handler"],
    invokers: {
        handleRequest: {
            func: "{that}.sendResponse",
            args: [200, "I am happy to hear from you."]
        }
    }
});

fluid.defaults("gpii.schema.tests.middleware.router.contentAware.success.jsonHandler", {
    gradeNames: ["gpii.express.handler"],
    invokers: {
        handleRequest: {
            func: "{that}.sendResponse",
            args: [ 200, { ok: true, message: "I am happy to hear from you."} ]
        }
    }
});

fluid.defaults("gpii.schema.tests.middleware.router.contentAware", {
    gradeNames: ["gpii.schema.middleware.contentAware.router"],
    path: "/gatedContentAware",
    schemaDirs: "%gpii-json-schema/tests/schemas",
    schemaKey:  "gated.json",
    successHandlers: {
        "html": {
            contentType:   "text/html",
            handlerGrades: ["gpii.schema.tests.middleware.router.contentAware.success.defaultHandler"]
        },
        json: {
            contentType:  "application/json",
            handlerGrades: ["gpii.schema.tests.middleware.router.contentAware.success.jsonHandler"]
        }
    },
    errorHandlers: {
        "html": {
            contentType:   "text/html",
            handlerGrades: ["gpii.schema.tests.middleware.router.contentAware.error.defaultHandler"]
        },
        json: {
            contentType:  "application/json",
            handlerGrades: ["gpii.schema.middleware.handler"]
        }
    }
});
