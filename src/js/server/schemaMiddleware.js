// "Gatekeeper" middleware that rejects any incoming payloads that are not valid according to the schema provided in
// `options.schemaContent`.  You can either pass the full content of the schema directly to `options.schemaContent` or
// indicate the name of a schema file by setting `options.schemaFile` to the full path to your schema file.
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("./schemaHandler");

fluid.defaults("gpii.schema.middleware.handler", {
    gradeNames: ["gpii.express.handler"],
    invokers: {
        handleRequest: {
            func: "{that}.sendResponse",
            args: ["{that}.options.statusCode", "{that}.options.message"]
        }
    }
});

fluid.registerNamespace("gpii.schema.middleware");

gpii.schema.middleware.rejectOrForward  = function (that, req, res, next) {
    if (that.options.schemaContent) {
        var results = that.validator.validate("schema", req.body);
        if (results) {
            // Instantiate a handler that will take care of the rest of the request.
            that.events.onInvalidRequest.fire(req, res, 500, results);
        }
        else {
            next();
        }
    }
    else {
        // We choose to fail if we can't validate the body.  That way anything downstream is guaranteed to
        // only receive valid content.
        var message = "Your gpii.schema.middleware instance doesn't have a schema to work with, so it can't validate anything.";
        that.events.onInvalidRequest.fire(req, res, 500, { ok: false, error: message });
    }
};

// TODO:  Extract key pieces from `gpii.express.requestAware.router` to handle the request with the common infrastructure

fluid.defaults("gpii.schema.middleware", {
    gradeNames: ["gpii.express.middleware"],
    components: {
        validator: {
            type: "gpii.schema.validator.server",
            options: {
                members: {
                    schemaContents: {
                        schema: "{gpii.schema.middleware}.options.schemaContent"
                    }
                },
                schemaFiles: {
                    schema: "{gpii.schema.middleware}.options.schemaFile"
                }
            }
        }
    },
    invokers: {
        middleware: {
            funcName: "gpii.schema.middleware.rejectOrForward",
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        }
    },
    // Approach adapted from `gpii.express.requestAware.router`.
    events: {
        "onInvalidRequest": null
    },
    dynamicComponents: {
        requestHandler: {
            createOnEvent: "onInvalidRequest",
            type:          "gpii.schema.middleware.handler",
            options: {
                request:    "{arguments}.0",
                response:   "{arguments}.1",
                statusCode: "{arguments}.2",
                message:    "{arguments}.3"
            }
        }

    }
});