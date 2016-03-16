/*

    "Gatekeeper" middleware that rejects any request whose JSON payloads are not valid. See this component's
    documentation for more details:

    https://github.com/the-t-in-rtf/gpii-json-schema/blob/GPII-1336/docs/middleware.md

 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("./schemaHandler");
require("../common/hasRequiredOptions");

fluid.defaults("gpii.schema.middleware.handler", {
    gradeNames: ["gpii.schema.handler"],
    invokers: {
        handleRequest: {
            func: "{that}.sendResponse",
            args: [400, "{that}.options.validationErrors"]
        }
    }
});

fluid.registerNamespace("gpii.schema.middleware");

/**
 *
 * @param that {Object} The middleware component itself.
 * @param req {Object} The Express request object.
 * @param res {Object} The Express response object.
 * @param next {Function} The function to be executed next in the middleware chain.
 */
gpii.schema.middleware.rejectOrForward  = function (that, req, res, next) {
    var toValidate = fluid.model.transformWithRules(req, that.options.rules.requestContentToValidate);
    var results = that.validator.validate(that.options.schemaKey, toValidate);
    if (results) {
        var transformedResults = fluid.model.transformWithRules(results, that.options.rules.validationErrorsToResponse);

        // For `contentAware` grades, there will be custom handlerGrades based on the accepted content type.
        // For everything else this will be `null`.
        var handlerGrades = gpii.express.contentAware.router.getHandlerGradesByContentType(that, req) || that.options.handlerGrades;

        that.events.onInvalidRequest.fire(req, res, transformedResults, handlerGrades);
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
fluid.defaults("gpii.schema.middleware", {
    gradeNames: ["gpii.express.middleware", "gpii.hasRequiredOptions"],
    requiredFields: {
        schemaDirs: true,
        schemaKey: true
    },
    responseSchemaKey: "message.json",
    responseSchemaUrl: "http://terms.raisingthefloor.org/schema/message.json",
    messages: {
        error: "The JSON you have provided is not valid."
    },
    rules: {
        validationErrorsToResponse: {
            ok: {
                literalValue: false
            },
            message: {
                literalValue: "{that}.options.messages.error"
            },
            fieldErrors: ""
        }
    },
    events: {
        onInvalidRequest: null,
        onSchemasDereferenced: null
    },
    handlerGrades: ["gpii.schema.middleware.handler"],
    dynamicComponents: {
        requestHandler: {
            type: "gpii.express.handler",
            createOnEvent: "onInvalidRequest",
            options: {
                request:          "{arguments}.0",
                response:         "{arguments}.1",
                validationErrors: "{arguments}.2",
                gradeNames:       "{arguments}.3",
                schemaKey:        "{gpii.schema.middleware}.options.responseSchemaKey",
                schemaUrl:        "{gpii.schema.middleware}.options.responseSchemaUrl"
            }
        }
    },
    components: {
        validator: {
            type: "gpii.schema.validator.ajv.server",
            options: {
                schemaDirs: "{gpii.schema.middleware}.options.schemaDirs",
                listeners: {
                    "onSchemasDereferenced.notifyMiddleware": {
                        func: "{gpii.schema.middleware}.events.onSchemasDereferenced.fire"
                    }
                }
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

fluid.defaults("gpii.schema.middleware.requestAware", {
    gradeNames: ["gpii.schema.middleware", "gpii.express.requestAware.base"]
});

fluid.defaults("gpii.schema.middleware.contentAware", {
    gradeNames: ["gpii.schema.middleware", "gpii.express.contentAware.base"]
});


/*

    A base router that will be used to wrap `requestAware` and `contentAware` router grades.

 */
fluid.defaults("gpii.schema.middleware.router.base", {
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
            type: "gpii.schema.middleware",
            options: {
                method:     "{gpii.schema.middleware.router.base}.options.method",
                rules:      "{gpii.schema.middleware.router.base}.options.rules",
                schemaKey:  "{gpii.schema.middleware.router.base}.options.schemaKey",
                schemaDirs: "{gpii.schema.middleware.router.base}.options.schemaDirs",
                listeners: {
                    "onSchemasDereferenced.notifyRouter": {
                        func: "{gpii.schema.middleware.router.base}.events.onSchemasDereferenced.fire"
                    }
                }
            }
        },
        innerRouter: {
            type: "{gpii.schema.middleware.router.base}.options.routerGrade",
            options: {
                method: "{gpii.schema.middleware.router.base}.options.method",
                path:   "/"
            }
        }
    }
});

// The above configured for use with a `requestAware` router.
fluid.defaults("gpii.schema.middleware.requestAware.router", {
    gradeNames:  ["gpii.schema.middleware.router.base"],
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
fluid.defaults("gpii.schema.middleware.contentAware.router", {
    gradeNames: ["gpii.schema.middleware.router.base"],
    routerGrade: "gpii.express.contentAware.router",
    distributeOptions: [
        {
            source: "{that}.options.successHandlers",
            target: "{that >gpii.express.contentAware.router}.options.handlers"
        },
        {
            source: "{that}.options.errorHandlers",
            target: "{that >gpii.schema.middleware}.options.handlers"
        }
    ]
});

/*

    A mix-in grade to configure one of the above routers (or a derived grade) to validate GET query data.

 */
fluid.defaults("gpii.schema.middleware.handlesGetMethod", {
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
fluid.defaults("gpii.schema.middleware.handlesPutMethod", {
    method:     "put"
});
