// "Gatekeeper" middleware that rejects any incoming payloads that are not valid according to the schema set in
// `options.schemaKey`.  You are required to set `options.schemaDir` to a directory that contains a file matching that
// key.
//
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
    if (that.options.schemaDir && that.options.schemaKey) {
        var results = that.validator.validate(that.options.schemaKey, req.body);
        if (results) {
            // Instantiate a handler that will take care of the rest of the request.
            that.events.onInvalidRequest.fire(req, res, 400, results);
        }
        else {
            next();
        }
    }
    else {
        // We choose to fail if we can't validate the body.  That way anything downstream is guaranteed to
        // only receive valid content.
        var message = "Your gpii.schema.middleware instance isn't correctly configured, so it can't validate anything.";
        that.events.onInvalidRequest.fire(req, res, 500, { ok: false, error: message });
    }
};

fluid.defaults("gpii.schema.middleware", {
    gradeNames: ["gpii.express.middleware"],
    components: {
        validator: {
            type: "gpii.schema.validator.server",
            options: {
                schemaDir: "{gpii.schema.middleware}.options.schemaDir"
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