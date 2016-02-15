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

/*

    The `gpii.express.middleware` that rejects invalid responses.

 */
fluid.defaults("gpii.schema.middleware", {
    gradeNames: ["gpii.express.middleware", "gpii.schema.handler.base"],
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
    TODO: Move this to the documentation.

    A wrapper for the `gpii.express.requestAware.router` grade that seamlessly wires in JSON Schema validation.

    The underlying router is an "inner" router component that can only be reached if valid JSON data is passed.  Unlike
    the raw grade, only the following options are distributed automatically:

    * `options.handlerGrades`: See above.
    * `options.schemaKey`: See above.
    * `options.schemaPath`: See above.
    * `options.method`: Controls what method(s) the inner router will respond to.
    * `options.rules`: Controls what part of the request is validated.

    Anything else you want to make the "inner" router aware of will need to be distributed or otherwise passed to
    this grade's `innerRouter` component.

    This grade and derived grades handle `POST` requests by default.  See below for mix-in grades that handle `GET` or
    `PUT` requests.

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
