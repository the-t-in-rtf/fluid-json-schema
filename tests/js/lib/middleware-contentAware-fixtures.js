// "gated" test middleware (and an underlying test handler that lies beyond the gate).  Used in testing the
// `contentAware` wrapper with our `schemaMiddleware`.
//
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("gpii-express");
require("../../../");

fluid.registerNamespace("gpii.test.schema.contentAware.error.defaultHandler");
gpii.test.schema.contentAware.error.defaultHandler.sendSummary = function (that) {
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
fluid.defaults("gpii.test.schema.contentAware.error.defaultHandler", {
    gradeNames: ["gpii.express.handler"],
    invokers: {
        handleRequest: {
            funcName: "gpii.test.schema.contentAware.error.defaultHandler.sendSummary",
            args:     ["{that}"]
        }
    }
});

fluid.defaults("gpii.test.schema.contentAware.success.defaultHandler", {
    gradeNames: ["gpii.express.handler"],
    timeout: 1000000,
    invokers: {
        handleRequest: {
            func: "{that}.sendResponse",
            args: [200, "I am happy to hear from you."]
        }
    }
});

fluid.defaults("gpii.test.schema.contentAware.success.jsonHandler", {
    gradeNames: ["gpii.express.handler"],
    invokers: {
        handleRequest: {
            func: "{that}.sendResponse",
            args: [ 200, { ok: true, message: "I am happy to hear from you."} ]
        }
    }
});

fluid.defaults("gpii.test.schema.contentAware", {
    gradeNames: ["gpii.express.router"],
    path: "/gatedContentAware",
    events: {
        onSchemasDereferenced: null
    },
    components: {
        validationMiddleware: {
            type: "gpii.schema.validationMiddleware",
            options: {
                schemaDirs: "%gpii-json-schema/tests/schemas",
                schemaKey:  "gated.json",
                listeners: {
                    "onSchemasDereferenced.notifyParent": {
                        func: "{gpii.test.schema.contentAware}.events.onSchemasDereferenced.fire"
                    }
                }
            }
        },
        contentAwareMiddleware: {
            type: "gpii.express.middleware.contentAware",
            options: {
                priority: "after:validationMiddleware",
                handlers: {
                    "html": {
                        contentType:   "text/html",
                        handlerGrades: ["gpii.test.schema.contentAware.success.defaultHandler"]
                    },
                    json: {
                        contentType:  "application/json",
                        handlerGrades: ["gpii.test.schema.contentAware.success.jsonHandler"]
                    }
                }
            }
        }
    }
});
