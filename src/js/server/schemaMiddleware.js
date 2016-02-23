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
            args: ["{that}.options.statusCode", "{that}.options.message"]
        }
    }
});

fluid.registerNamespace("gpii.schema.middleware");

gpii.schema.middleware.rejectOrForward  = function (that, req, res, next) {
    var toValidate = fluid.model.transformWithRules(req, that.options.rules.requestContentToValidate);
    var results = that.validator.validate(that.options.schemaKey, toValidate);
    if (results) {
        var transformedResults = fluid.model.transformWithRules(results, that.options.rules.validationErrorsToResponse);
        that.handler.sendResponse(res, 400, transformedResults);
    }
    else {
        next();
    }
};

/*

    The `gpii.express.middleware` that rejects invalid responses.

 */
fluid.defaults("gpii.schema.middleware", {
    gradeNames: ["gpii.express.middleware", "gpii.hasRequiredOptions"],
    requiredFields: {
        "schemaPath": true,
        "schemaKey": true
    },
    responseSchemaKey: "message.json",
    responseSchemaUrl: "http://terms.raisingthefloor.org/schema/message.json",
    messages: {
        error: "The JSON you have provided is not valid."
    },
    rules: {
        validationErrorsToResponse: {
            "ok": {
                literalValue: false
            },
            "message": {
                literalValue: "{that}.options.messages.error"
            },
            "fieldErrors": ""
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

/*
    A wrapper for the `gpii.express.requestAware.router` grade that seamlessly wires in JSON Schema validation.
 */
fluid.defaults("gpii.schema.middleware.requestAware.router", {
    gradeNames: ["gpii.express.router.passthrough"],
    method:     "post",
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
                rules:      "{gpii.schema.middleware.requestAware.router}.options.rules",
                schemaKey:  "{gpii.schema.middleware.requestAware.router}.options.schemaKey",
                schemaPath: "{gpii.schema.middleware.requestAware.router}.options.schemaPath"
            }
        },
        innerRouter: {
            type: "gpii.express.requestAware.router",
            options: {
                handlerGrades: "{gpii.schema.middleware.requestAware.router}.options.handlerGrades",
                method:        "{gpii.schema.middleware.requestAware.router}.options.method",
                path:          "/"
            }
        }
    }
});

/*
    A wrapper for the `gpii.express.contentAware.router` grade.
 */
fluid.defaults("gpii.schema.middleware.contentAware.router", {
    gradeNames: ["gpii.schema.middleware.requestAware.router"],
    components: {
        innerRouter: {
            type: "gpii.express.contentAware.router"
        }
    }
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
    gradeNames: ["gpii.schema.middleware.handlesPostMethod"],
    method:     "put"
});
