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
 * The core of both the gpii-express and kettle validation middleware.  Transforms an incoming request and validates the
 * transformed output (this allows for focusing on particular aspects of the request without validating complex,
 * potentially circular nested objects).
 *
 * As is the convention with Express middleware, if there are no validation errors, the `next` callback is called with
 * no arguments.  If there are errors, the `next` callback is called with a localised/internationalised copy of the
 * validation errors.
 *
 * @param {Object} validatorComponent - The middleware component itself.
 * @param {Object} schemaMiddlewareComponent - The middleware component itself.
 * @param {Object|Promise} schema - The GSS schema to validate against, or a promise that will resolve to same.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The function to be executed next in the middleware chain.
 *
 */
gpii.schema.validationMiddleware.rejectOrForward  = function (validatorComponent, schemaMiddlewareComponent, schema, req, res, next) {
    var toValidate = fluid.model.transformWithRules(req, schemaMiddlewareComponent.options.rules.requestContentToValidate);

    var schemaAsPromise = fluid.isPromise(schema) ? schema : fluid.toPromise(schema);
    schemaAsPromise.then(
        function (schema) {
            var validationResults = validatorComponent.validate(schema, toValidate, schemaMiddlewareComponent.options.schemaHash);

            if (validationResults.isError) {
                next(validationResults);
            }
            else if (validationResults.isValid) {
                next();
            }
            else {
                var localisedErrors = gpii.schema.validator.localiseErrors(validationResults.errors, toValidate, schemaMiddlewareComponent.model.messages, schemaMiddlewareComponent.options.localisationTransform);
                var localisedPayload = fluid.copy(validationResults);
                localisedPayload.errors = localisedErrors;
                next(localisedPayload);
            }
        },
        next
    );
};


/*

    The base middleware used with both gpii-express and kettle.  Cannot be used on its own.

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
    schemaHash: "@expand:gpii.schema.hashSchema({that}.options.inputSchema})",
    localisationTransform: {
        "": ""
    },
    model: {
        messages: gpii.schema.messages.validationErrors
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

    The `gpii.express.middleware` that fields invalid responses itself and passes valid ones through to the `next`
    Express router or middleware function.  Must be combined with either the `requestAware` or `contentAware` grades
    to function properly.  See the grades below for an example.

 */
fluid.defaults("gpii.schema.validationMiddleware", {
    gradeNames: ["gpii.express.middleware", "gpii.schema.validationMiddleware.base"]
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

fluid.registerNamespace("gpii.schema.kettle.middleware");

/**
 *
 * Call the base validation function and handle its output in the way that is expected for `kettle.middleware` grades.
 *
 * @param {Object} validatorComponent - The global "validator" component.
 * @param {Object} kettleMiddlewareComponent - The `kettle.middleware` component (see below).
 * @param {Object} schema - The GSS schema to validate against.
 * @param {Object} req  - The Express request object.
 * @return {Promise}    - A `fluid.promise` that is resolved if the request is validated and rejected if the request is
 *                        invalid.
 */
gpii.schema.kettle.middleware.handle = function (validatorComponent, kettleMiddlewareComponent, schema, req) {
    var validationPromise = fluid.promise();

    gpii.schema.validationMiddleware.rejectOrForward(validatorComponent, kettleMiddlewareComponent, schema, req.req, undefined, function (error) {
        if (error) {
            validationPromise.reject(fluid.extend({}, error, kettleMiddlewareComponent.options.errorTemplate));
        }
        else {
            validationPromise.resolve();
        }
    });

    return validationPromise;
};

fluid.defaults("gpii.schema.kettle.middleware", {
    gradeNames: ["kettle.middleware", "fluid.modelComponent"],
    errorTemplate: {
        // "Bad Request": https://developer.mozilla.org/nl/docs/Web/HTTP/Status/400
        statusCode: 400,
        message: "Your request was invalid.  See the errors for details."
    },
    invokers: {
        handle: {
            funcName: "gpii.schema.kettle.middleware.handle",
            args: ["{gpii.schema.validator}", "{that}", "{that}.options.inputSchema", "{arguments}.0"] // schema, request
        }
    }
});

fluid.defaults("gpii.schema.kettle.request.http", {
    gradeNames: ["kettle.request.http", "gpii.schema.validationMiddleware.base"],
    inputSchema: {
        "$schema": "gss-v7-full#"
    },
    rules: {
        requestContentToValidate: {
            "": "body"
        }
    },
    components: {
        validationMiddleware: {
            type: "gpii.schema.kettle.middleware",
            options: {
                inputSchema: "{gpii.schema.kettle.request.http}.options.inputSchema",
                rules: "{gpii.schema.kettle.request.http}.options.rules",
                localisationTransform: "{gpii.schema.kettle.request.http}.options.localisationTransform",
                model: {
                    messages: "{gpii.schema.kettle.request.http}.model.messages"
                }
            }
        }
    },
    requestMiddleware: {
        schemaValidation: {
            middleware: "{that}.validationMiddleware",
            priority:   "first"
        }
    }
});
