/*

    "Gatekeeper" middleware that rejects any request whose JSON payloads are not valid. See this component's
    documentation for more details:

    https://github.com/the-t-in-rtf/gpii-json-schema/blob/master/docs/schemaValidationMiddleware.md

 */
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.schema.validationMiddleware");

require("../common/validator");
require("../common/schemaValidatedComponent");

/**
 *
 * @param {Object} that - The middleware component itself.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The function to be executed next in the middleware chain.
 *
 */
gpii.schema.validationMiddleware.rejectOrForward  = function (that, req, res, next) {
    var toValidate = fluid.model.transformWithRules(req, that.options.rules.requestContentToValidate);

    var validationResults = gpii.schema.validator.validate(toValidate, that.options.inputSchema, that.options.ajvOptions);

    if (validationResults.isError) {
        next(validationResults);
    }
    else if (validationResults.isValid) {
        next();
    }
    else {
        var localisedErrors = gpii.schema.validator.localiseErrors(validationResults.errors, toValidate, that.model.messages, that.options.localisationTransform);
        var localisedPayload = fluid.copy(validationResults);
        localisedPayload.errors = localisedErrors;
        next(localisedPayload);
    }
};

/*

    The `gpii.express.middleware` that fields invalid responses itself and passes valid ones through to the `next`
    Express router or middleware function.  Must be combined with either the `requestAware` or `contentAware` grades
    to function properly.  See the grades below for an example.

 */
fluid.defaults("gpii.schema.validationMiddleware.base", {
    gradeNames: ["gpii.schema.component", "fluid.modelComponent"],
    namespace:  "validationMiddleware", // A namespace that can be used to order other middleware relative to this component.
    schema: {
        properties: {
            inputSchema: {
                $ref: "gss-v7-full#"
            },
            localisationTransform: {
                type: "object",
                minProperties: 1
            },
            rules: {
                properties: {
                    requestContentToValidate: {
                        type: "object",
                        required: true
                    }
                }
            }
        }
    },
    inputSchema: {
        "$schema": "gss-v7-full#"
    },
    localisationTransform: {
        "": ""
    },
    model: {
        messages: gpii.schema.messages.validationErrors
    },
    // We prevent merging of individual options, but allow them to be individually replaced.
    mergeOptions: {
        "rules.requestContentToValidate":   "nomerge"
    },
    rules: {
        requestContentToValidate: {
            "": "body"
        }
    },
    invokers: {
        middleware: {
            funcName: "gpii.schema.validationMiddleware.rejectOrForward",
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"] // request, response, next
        }
    }
});

/*

    The `gpii.express.middleware` that fields invalid responses itself and passes valid ones through to the `next`
    Express router or middleware function.  Must be combined with either the `requestAware` or `contentAware` grades
    to function properly.  See the grades below for an example.

 */
fluid.defaults("gpii.schema.validationMiddleware", {
    gradeNames: ["gpii.express.middleware", "gpii.schema.validationMiddleware.base"]
});

/*

    A mix-in grade to configure an instance of `gpii.schema.validationMiddleware.base` to work with query data.

 */
fluid.defaults("gpii.schema.validationMiddleware.handlesQueryData", {
    rules: {
        requestContentToValidate: {
            "": "query"
        }
    }
});

fluid.defaults("gpii.schema.kettle.request.http", {
    gradeNames: ["kettle.request.http", "gpii.schema.validationMiddleware.base"],
    requestMiddleware: {
        schemaValidation: {
            middleware: "{that}.middleware",
            priority:   "first"
        }
    }
});
