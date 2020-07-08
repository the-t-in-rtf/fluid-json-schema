/*

    "Gatekeeper" middleware that rejects any request whose JSON payloads are not valid. See this component's
    documentation for more details:

    https://github.com/the-t-in-rtf/fluid-json-schema/blob/master/docs/schemaValidationMiddleware.md

 */
/* eslint-env node */
"use strict";
var fluid = require("infusion");

fluid.registerNamespace("fluid.schema.validationMiddleware");

require("../common/validator");
require("../common/schemaValidatedComponent");

fluid.require("%fluid-handlebars");

/**
 *
 * The core of both the fluid-express and kettle validation middleware.  Transforms an incoming request and validates the
 * transformed output (this allows for focusing on particular aspects of the request without validating complex,
 * potentially circular nested objects).
 *
 * As is the convention with Express middleware, if there are no validation errors, the `next` callback is called with
 * no arguments.  If there are errors, the `next` callback is called with a localised/internationalised copy of the
 * validation errors.
 *
 * @param {fluid.schema.validator} validatorComponent - The global validator component.
 * @param {fluid.schema.validationMiddleware} schemaMiddlewareComponent - The middleware component.
 * @param {Object} schema - The FSS schema to validate against.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The function to be executed next in the middleware chain.
 *
 */
fluid.schema.validationMiddleware.rejectOrForward  = function (validatorComponent, schemaMiddlewareComponent, schema, req, res, next) {
    var toValidate = fluid.model.transformWithRules(req, schemaMiddlewareComponent.options.rules.requestContentToValidate);

    var validationResults = validatorComponent.validate(schema, toValidate, schemaMiddlewareComponent.options.schemaHash);

    if (validationResults.isError) {
        next(validationResults);
    }
    else if (validationResults.isValid) {
        next();
    }
    else {
        var messageBundle = fluid.handlebars.i18n.deriveMessageBundleFromRequest(req, schemaMiddlewareComponent.model.messageBundles, schemaMiddlewareComponent.options.defaultLocale);
        var localisedErrors = fluid.schema.validator.localiseErrors(validationResults.errors, toValidate, messageBundle, schemaMiddlewareComponent.options.localisationTransform);
        var localisedPayload = fluid.copy(validationResults);
        localisedPayload.errors = localisedErrors;
        localisedPayload.statusCode = schemaMiddlewareComponent.options.invalidStatusCode;
        next(localisedPayload);
    }
};

/*

    The `fluid.express.middleware` that fields invalid responses itself and passes valid ones through to the `next`
    Express router or middleware function.  Must be combined with either the `requestAware` or `contentAware` grades
    to function properly.  See the grades below for an example.

 */
fluid.defaults("fluid.schema.validationMiddleware", {
    gradeNames: ["fluid.modelComponent", "fluid.schema.component", "fluid.express.middleware"],
    namespace:  "validationMiddleware", // A namespace that can be used to order other middleware relative to this component.
    defaultLocale: "en_US",
    invalidStatusCode: 400,
    inputSchema: {
        "$schema": "fss-v7-full#"
    },
    schemaHash: "@expand:fluid.schema.hashSchema({that}.options.inputSchema})",
    localisationTransform: {
        "": ""
    },
    messageDirs: {
        validation: "%fluid-json-schema/src/messages"
    },
    model: {
        messageBundles: "@expand:fluid.handlebars.i18n.loadMessageBundles({that}.options.messageDirs)"
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
                $ref: "fss-v7-full#"
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
            funcName: "fluid.schema.validationMiddleware.rejectOrForward",
            args:     ["{fluid.schema.validator}", "{that}", "{that}.options.inputSchema", "{arguments}.0", "{arguments}.1", "{arguments}.2"] // schema, request, response, next
        }
    },
    listeners: {
        "onCreate.cacheSchema": {
            func: "{fluid.schema.validator}.cacheSchema",
            args: ["{that}.options.inputSchema"]
        }
    }
});

/*

    A mix-in grade to configure an instance of `fluid.schema.validationMiddleware.base` (kettle or fluid-express) to work
    with query data.

 */
fluid.defaults("fluid.schema.validationMiddleware.handlesQueryData", {
    rules: {
        requestContentToValidate: {
            "": "query"
        }
    }
});
