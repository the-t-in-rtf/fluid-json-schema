/*

    "Gatekeeper" middleware that rejects any request whose JSON payloads are not valid. See this component's
    documentation for more details:

    https://github.com/the-t-in-rtf/gpii-json-schema/blob/master/docs/schemaValidationMiddleware.md

 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("../common/hasRequiredOptions");
fluid.registerNamespace("gpii.schema.validationMiddleware");

/**
 *
 * @param that {Object} The middleware component itself.
 * @param req {Object} The Express request object.
 * @param res {Object} The Express response object.
 * @param next {Function} The function to be executed next in the middleware chain.
 */
gpii.schema.validationMiddleware.rejectOrForward  = function (that, req, res, next) {
    var toValidate = fluid.model.transformWithRules(req, that.options.rules.requestContentToValidate);
    var results = that.validator.validate(that.options.schemaKey, toValidate);
    if (results) {
        var transformedValidationErrors = fluid.model.transformWithRules(results, that.options.rules.validationErrorsToResponse);
        next(transformedValidationErrors);
    }
    else {
        next();
    }
};

/*

    The `gpii.express.middleware` that fields invalid responses itself and passes valid ones through to the `next`
    Express router or middleware function.  Must be combined with either the `requestAware` or `contentAware` grades
    to function properly.  See the grades below for an example.

 */
fluid.defaults("gpii.schema.validationMiddleware", {
    gradeNames: ["gpii.express.middleware", "gpii.hasRequiredOptions"],
    namespace:  "validationMiddleware", // A namespace that can be used to order other middleware relative to this component.
    requiredFields: {
        "rules.requestContentToValidate":   true,
        "rules.validationErrorsToResponse": true,
        schemaDirs:                         true,
        schemaKey:                          true
    },
    responseSchemaKey: "message.json",
    responseSchemaUrl: "http://terms.raisingthefloor.org/schema/message.json",
    messages: {
        error: "The JSON you have provided is not valid."
    },
    // We prevent merging of individual options, but allow them to be individually replaced.
    mergeOptions: {
        "rules.validationErrorsToResponse": "nomerge",
        "rules.requestContentToValidate":   "nomerge"
    },
    rules: {
        requestContentToValidate: {
            "": "body"
        },
        validationErrorsToResponse: {
            isError: { literalValue: true},
            message: {
                literalValue: "{that}.options.messages.error"
            },
            fieldErrors: ""
        }
    },
    events: {
        onSchemasDereferenced: null
    },
    components: {
        validator: {
            type: "gpii.schema.validator.ajv.server",
            options: {
                schemaDirs: "{gpii.schema.validationMiddleware}.options.schemaDirs",
                listeners: {
                    "onSchemasDereferenced.notifyMiddleware": {
                        func: "{gpii.schema.validationMiddleware}.events.onSchemasDereferenced.fire"
                    }
                }
            }
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

    A mix-in grade to configure an instance of `gpii.schema.validationMiddleware` to work with query data.

 */
fluid.defaults("gpii.schema.validationMiddleware.handlesQueryData", {
    rules: {
        requestContentToValidate: {
            "": "query"
        }
    }
});