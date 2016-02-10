/*

    "Gatekeeper" middleware that rejects any request whose JSON payloads are not valid. See this component's
    documentation for more details:

    https://github.com/the-t-in-rtf/gpii-json-schema/blob/GPII-1336/docs/middleware.md

 */
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
    if (that.options.schemaPath && that.options.schemaKey) {
        var toValidate = fluid.model.transformWithRules(req, that.options.rules.requestContentToValidate);
        var results = that.validator.validate(that.options.schemaKey, toValidate);
        if (results) {
            var transformedResults = fluid.model.transformWithRules(results, that.options.rules.validationErrorsToResponse);
            that.handler.sendResponse(res, 400, transformedResults);
        }
        else {
            next();
        }
    }
    else {
        // We choose to fail if we can't validate the body.  That way anything downstream is guaranteed to
        // only receive valid content.
        var message = "Your gpii.schema.middleware instance isn't correctly configured, so it can't validate anything.";
        that.handler.sendResponse(res, 500, { ok: false, error: message });
    }
};

fluid.defaults("gpii.schema.middleware", {
    gradeNames: ["gpii.express.middleware", "gpii.schema.handler.base"],
    responseSchemaKey: "message.json",
    responseSchemaUrl: "http://terms.raisingthefloor.org/schema/message.json",
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
        handler: {
            type: "gpii.schema.handler.base",
            options: {
                schemaKey: "{gpii.schema.middleware}.options.responseSchemaKey",
                schemaUrl: "{gpii.schema.middleware}.options.responseSchemaUrl"
            }
        },
        validator: {
            type: "gpii.schema.validator.ajv.server",
            options: {
                schemaPath: "{gpii.schema.middleware}.options.schemaPath"
            }
        }
    },
    invokers: {
        middleware: {
            funcName: "gpii.schema.middleware.rejectOrForward",
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        }
    }
});