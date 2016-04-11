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
    requiredFields: {
        schemaDirs: true,
        schemaKey: true,
        "rules.requestContentToValidate": true
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
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        }
    }
});

fluid.defaults("gpii.schema.validationMiddleware.requestAware", {
    gradeNames: ["gpii.schema.validationMiddleware", "gpii.express.requestAware.base"]
});

fluid.defaults("gpii.schema.validationMiddleware.contentAware", {
    gradeNames: ["gpii.schema.validationMiddleware", "gpii.express.contentAware.base"]
});


/*

    A base router that will be used to wrap `requestAware` and `contentAware` router grades.

 */
fluid.defaults("gpii.schema.validationMiddleware.router.base", {
    gradeNames: ["gpii.express.router.passthrough"],
    method:     "post",
    routerGrade: "gpii.express.router",
    events: {
        onSchemasDereferenced: null
    },
    rules: {
        requestContentToValidate: {
            "": "body"
        }
    },
    components: {
        // required middleware that provides `req.body`
        json: {
            type: "gpii.express.middleware.bodyparser.json"
        },
        urlencoded: {
            type: "gpii.express.middleware.bodyparser.urlencoded"
        },
        gateKeeper: {
            type: "gpii.schema.validationMiddleware",
            options: {
                namespace: "gatekeeper",
                method:     "{gpii.schema.validationMiddleware.router.base}.options.method",
                rules:      "{gpii.schema.validationMiddleware.router.base}.options.rules",
                schemaKey:  "{gpii.schema.validationMiddleware.router.base}.options.schemaKey",
                schemaDirs: "{gpii.schema.validationMiddleware.router.base}.options.schemaDirs",
                listeners: {
                    "onSchemasDereferenced.notifyRouter": {
                        func: "{gpii.schema.validationMiddleware.router.base}.events.onSchemasDereferenced.fire"
                    }
                }
            }
        },
        innerRouter: {
            type: "{gpii.schema.validationMiddleware.router.base}.options.routerGrade",
            priority: "after:gateKeeper",
            options: {
                method: "{gpii.schema.validationMiddleware.router.base}.options.method",
                path:   "/"
            }
        }
    }
});

// The above configured for use with a `requestAware` router.
fluid.defaults("gpii.schema.validationMiddleware.requestAware.router", {
    gradeNames:  ["gpii.schema.validationMiddleware.router.base"],
    routerGrade: "gpii.express.requestAware.router",
    distributeOptions: {
        source: "{that}.options.handlerGrades",
        target: "{that > gpii.express.router}.options.handlerGrades"
    }
});

// The above configured for use with a `contentAware` router.
//
// NOTE:
//   Ordinarily a `contentAware` router has a single `handlers` option.  Because we can either handle errors or
//   failures, we have two options.  The setting `options.errorHandlers` is used to handle validation errors by content
//   type. The setting `options.successHandlers` is used by the inner router to handle successful requests, again, by
//   content type.
//
fluid.defaults("gpii.schema.validationMiddleware.contentAware.router", {
    gradeNames: ["gpii.schema.validationMiddleware.router.base"],
    routerGrade: "gpii.express.contentAware.router",
    distributeOptions: [
        {
            source: "{that}.options.successHandlers",
            target: "{that >gpii.express.contentAware.router}.options.handlers"
        },
        {
            source: "{that}.options.errorHandlers",
            target: "{that >gpii.schema.validationMiddleware}.options.handlers"
        }
    ]
});

/*

    A mix-in grade to configure one of the above routers (or a derived grade) to validate GET query data.

 */
fluid.defaults("gpii.schema.validationMiddleware.handlesGetMethod", {
    method: "get",
    rules: {
        requestContentToValidate: {
            "": "query"
        }
    }
});

/*

    A mix-in grade to configure one of the above routers (or a derived grade) to validate PUT body data.

 */
fluid.defaults("gpii.schema.validationMiddleware.handlesPutMethod", {
    method:     "put"
});
