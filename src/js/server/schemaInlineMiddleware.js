/*

    "Inline Schema" router that packages up all schemas and returns them in a single JSON bundle, keyed by filename.

    See the documentation for details:

    https://github.com/the-t-in-rtf/gpii-json-schema/blob/master/docs/schemaValidationMiddleware.md

 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("../common/hasRequiredOptions");

fluid.registerNamespace("gpii.schema.inlineMiddleware");

/**
 *
 * Send our map of JSON Schemas to the client.
 *
 * @param that - The router component.
 * @param req {Object} - The Express `request` object: http://expressjs.com/en/api.html#req
 * @param res {Object} - The Express `response` object: http://expressjs.com/en/api.html#res
 *
 */
gpii.schema.inlineMiddleware.sendSchemaData  = function (that, req, res) {
    res.status(200).send(that.model.schemas);
};

/*

    The `gpii.express.router` that delivers schema data to client side components.

 */
fluid.defaults("gpii.schema.inlineMiddleware", {
    gradeNames: ["gpii.express.middleware", "gpii.hasRequiredOptions", "fluid.modelComponent"],
    path: "/allSchemas",
    namespace: "allSchemas", // Namespace to allow other routers to put themselves in the chain before or after us.
    events: {
        onSchemasDereferenced: null
    },
    requiredFields: {
        "schemaDirs": true
    },
    model: {
        schemas: "{parser}.model.dereferencedSchemas"
    },
    invokers: {
        middleware: {
            funcName: "gpii.schema.inlineMiddleware.sendSchemaData",
            args:     ["{that}", "{arguments}.0", "{arguments}.1"] // `request`, `response`
        }
    },
    components: {
        parser: {
            type: "gpii.schema.parser",
            options: {
                schemaDirs: "{gpii.schema.inlineMiddleware}.options.schemaDirs",
                listeners: {
                    "onSchemasDereferenced.notifyRouter": {
                        func: "{gpii.schema.inlineMiddleware}.events.onSchemasDereferenced.fire"
                    }
                }
            }
        }
    }
});