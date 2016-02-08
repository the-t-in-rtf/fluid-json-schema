// "Gatekeeper" middleware that rejects any incoming payloads that are not valid according to the schema set in
// `options.schemaKey`.  You are required to set `options.schemaDir` to a directory that contains a file matching that
// key.
//
// Validates information available in the request object, transformed using `options.rules.requestContentToValidate`.
// The default options validate the request body.  To validate a query instead, you would set that option to something like:
//
//  requestContentToValidate: {
//      "": "query"
//  }
//
// The transformed request data is validated against the schema. Any validation errors are then transformed using
// `options.rules.validationErrorsToResponse` before they are sent to the user.  The default format looks roughly like:
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
var fluid = require("infusion");
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
        var toValidate = fluid.model.transformWithRules(req, that.options.rules.requestContentToValidate);
        var results = that.validator.validate(that.options.schemaKey, toValidate);
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
    gradeNames: ["gpii.express.middleware", "gpii.schema.handler.base"],
    schemaKey: "message.json",
    schemaUrl: "http://terms.raisingthefloor.org/schema/message.json",
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
        },
        requestContentToValidate: {
            "": "body"
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
    events: {
        "onInvalidRequest": null
    },
    listeners: {
        "onInvalidRequest.sendRejectionResponse": {
            func: "{that}.sendResponse",
            // Our function expects a `response` (`{arguments}.1`), `statusCode` (`{arguments}.2`), and `message` (`{arguments}.3`).
            // If you are wiring in your own replacement, the original request is also available as `{arguments}.0`.
            args: ["{arguments}.1", "{arguments}.2", "{arguments}.3"] // response, statusCode, body
        }
    }
});