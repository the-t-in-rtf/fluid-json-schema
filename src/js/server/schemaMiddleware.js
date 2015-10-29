// "Gatekeeper" middleware that rejects any incoming payloads that are not valid according to the schema set in
// `options.schemaKey`.  You are required to set `options.schemaDir` to a directory that contains a file matching that
// key.
//
// Any validation errors are transformed using `options.rules.validationErrorsToResponse` before they are sent to the
// user.  The default format looks roughly like:
//
// {
//   ok: false,
//   message: "The JSON you have provided is not valid.",
//   errors: {
//     field1: ["This field is required."]
//   }
// }
//
// The output of this middleware is itself expected to be valid according to a JSON schema, and to be delivered
// using a `schemaHandler`.  You are expected to supply `options.responseSchemaKey` and `options.responseSchemaUrl`,
// which will be distributed to the `schemaHandler` instance.
//
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("./schemaHandler");

fluid.defaults("gpii.schema.middleware.handler", {
    gradeNames: ["gpii.schema.handler"],
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
            var transformedResults = fluid.model.transformWithRules(results, that.options.rules.validationErrorsToResponse);

            // Instantiate a handler that will take care of the rest of the request.
            that.events.onInvalidRequest.fire(req, res, 400, transformedResults);
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
    responseSchemaKey: "message.json",
    responseSchemaUrl: "http://terms.raisingthefloor.org/schema/message.json",
    distributeOptions: [
        {
            source: "{that}.options.responseSchemaKey",
            target: "{that gpii.schema.middleware.handler}.options.schemaKey"
        },
        {
            source: "{that}.options.responseSchemaUrl",
            target: "{that gpii.schema.middleware.handler}.options.schemaUrl"
        }
    ],
    messages: {
        error: "The JSON you have provided is not valid."
    },
    rules: {
        validationErrorsToResponse: {
            "": "",
            "ok": {
                literalValue: false
            },
            "message": {
                literalValue: "{that}.options.messages.error"
            }
        }
    },
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

fluid.defaults("gpii.schema.middleware.hasParser", {
    gradeNames: ["gpii.schema.middleware"],
    components: {
        validator: {
            type: "gpii.schema.validator.server.hasParser"
        }
    }
});
