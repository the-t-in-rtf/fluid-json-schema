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

fluid.require("%gpii-handlebars");

/**
 *
 * The core of both the gpii-express and kettle validation middleware.  Transforms an incoming request and validates the
 * transformed output (this allows for focusing on particular aspects of the request without validating complex,
 * potentially circular nested objects).
 *
 * As is the convention with Express middleware, if there are no validation errors, the `next` callback is called with
 * no arguments.  If there are errors, the `next` callback is called with a localised/internationalised copy of the
 * validation errors.
 *
 * @param {gpii.schema.validator} validatorComponent - The global validator component.
 * @param {gpii.schema.validationMiddleware} schemaMiddlewareComponent - The middleware component.
 * @param {Object} schema - The GSS schema to validate against.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The function to be executed next in the middleware chain.
 *
 */
gpii.schema.validationMiddleware.rejectOrForward  = function (validatorComponent, schemaMiddlewareComponent, schema, req, res, next) {
    var toValidate = fluid.model.transformWithRules(req, schemaMiddlewareComponent.options.rules.requestContentToValidate);

    var validationResults = validatorComponent.validate(schema, toValidate, schemaMiddlewareComponent.options.schemaHash);

    if (validationResults.isError) {
        next(validationResults);
    }
    else if (validationResults.isValid) {
        next();
    }
    else {
        var messageBundle = gpii.handlebars.i18n.deriveMessageBundleFromRequest(req, schemaMiddlewareComponent.model.messageBundles, schemaMiddlewareComponent.options.defaultLocale);
        var localisedErrors = gpii.schema.validator.localiseErrors(validationResults.errors, toValidate, messageBundle, schemaMiddlewareComponent.options.localisationTransform);
        var localisedPayload = fluid.copy(validationResults);
        localisedPayload.errors = localisedErrors;
        localisedPayload.statusCode = schemaMiddlewareComponent.options.invalidStatusCode;
        next(localisedPayload);
    }
};

/*

    The `gpii.express.middleware` that fields invalid responses itself and passes valid ones through to the `next`
    Express router or middleware function.  Must be combined with either the `requestAware` or `contentAware` grades
    to function properly.  See the grades below for an example.

 */
fluid.defaults("gpii.schema.validationMiddleware", {
    gradeNames: ["fluid.modelComponent", "gpii.schema.component", "gpii.express.middleware"],
    namespace:  "validationMiddleware", // A namespace that can be used to order other middleware relative to this component.
    defaultLocale: "en_US",
    invalidStatusCode: 400,
    inputSchema: {
        "$schema": "gss-v7-full#"
    },
    schemaHash: "@expand:gpii.schema.hashSchema({that}.options.inputSchema})",
    localisationTransform: {
        "": ""
    },
    messageDirs: {
        validation: "%gpii-json-schema/src/messages"
    },
    model: {
        messageBundles: "@expand:gpii.handlebars.i18n.loadMessageBundles({that}.options.messageDirs)"
    },
    // We prevent merging of individual options, but allow them to be individually replaced.
    mergeOptions: {
        "rules.requestContentToValidate": "nomerge"
    },
    rules: {
        requestContentToValidate: {
            "": "body"
        }
    },
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
    invokers: {
        middleware: {
            funcName: "gpii.schema.validationMiddleware.rejectOrForward",
            args:     ["{gpii.schema.validator}", "{that}", "{that}.options.inputSchema", "{arguments}.0", "{arguments}.1", "{arguments}.2"] // schema, request, response, next
        }
    },
    listeners: {
        "onCreate.cacheSchema": {
            func: "{gpii.schema.validator}.cacheSchema",
            args: ["{that}.options.inputSchema"]
        }
    }
});

/*

    A mix-in grade to configure an instance of `gpii.schema.validationMiddleware.base` (kettle or gpii-express) to work
    with query data.

 */
fluid.defaults("gpii.schema.validationMiddleware.handlesQueryData", {
    rules: {
        requestContentToValidate: {
            "": "query"
        }
    }
});
