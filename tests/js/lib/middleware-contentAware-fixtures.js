// "gated" test middleware (and an underlying test handler that lies beyond the gate).  Used in testing the
// `contentAware` wrapper with our `schemaMiddleware`.
//
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.require("%gpii-express");
fluid.require("%gpii-json-schema");

fluid.defaults("gpii.test.schema.contentAware.htmlHandler", {
    gradeNames: ["gpii.express.handler"],
    timeout: 1000000,
    invokers: {
        handleRequest: {
            func: "{that}.sendResponse",
            args: [200, "Everything is fine."]
        }
    }
});

fluid.registerNamespace("gpii.test.schema.contentAware.jsonHandler");

gpii.test.schema.contentAware.jsonHandler.handleRequest = function (that) {
    if (that.options.request.body.failAfterValidation) {
        that.sendError(500, { isError: true, message: "Your payload was valid, but still destined for failure."});
    }
    else {
        that.sendResponse(200, { message: "Everything is fine."});
    }
};

fluid.defaults("gpii.test.schema.contentAware.jsonHandler", {
    gradeNames: ["gpii.schema.schemaLink.handler"],
    schemaPaths: {
        error:   "message.json",
        success: "success-message.json"
    },
    invokers: {
        handleRequest: {
            funcName: "gpii.test.schema.contentAware.jsonHandler.handleRequest",
            args:     ["{that}"]
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
                        handlerGrades: ["gpii.test.schema.contentAware.htmlHandler"]
                    },
                    json: {
                        contentType:  "application/json",
                        handlerGrades: ["gpii.test.schema.contentAware.jsonHandler"]
                    }
                }
            }
        }
    }
});
