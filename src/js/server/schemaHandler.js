/*

    An extension of `gpii.express.handler` that adds JSON Schema headers to the outgoing response.

    See this component's documentation for more details:

    https://github.com/the-t-in-rtf/gpii-json-schema/blob/GPII-1336/docs/handler.md

 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("gpii-express");

fluid.registerNamespace("gpii.schema.handler");

// Send the appropriate headers and then let the underlying grade's `sendResponse` function take over.
gpii.schema.handler.sendResponse = function (that, response, statusCode, body) {
    if (!that.options.schemaKey || !that.options.schemaUrl) {
        fluid.log("Your gpii.schema.handler is not configured correctly and cannot set the appropriate headers.");
    }
    else if (response.headersSent) {
        fluid.log("Can't set headers, they have already been sent.");
    }
    else {
        response.type("application/" + that.options.schemaKey + "+json; profile=\"" + that.options.schemaUrl + "\"");
        response.set("Link", that.options.schemaUrl + "; rel=\"describedBy\"");
    }

    gpii.express.handler.sendResponse(that, response, statusCode, body);
};

// A companion grade designed for use with `gpii.express.base`.  Intended for static rather than dynamic use.
fluid.defaults("gpii.schema.handler.base", {
    gradeNames: ["gpii.express.handler.base"],
    invokers: {
        sendResponse: {
            funcName: "gpii.schema.handler.sendResponse",
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"] // response, statusCode, body
        }
    }
});

fluid.defaults("gpii.schema.handler", {
    gradeNames: ["gpii.express.handler"],
    invokers: {
        sendResponse: {
            funcName: "gpii.schema.handler.sendResponse",
            args:     ["{that}", "{that}.response", "{arguments}.0", "{arguments}.1"] // statusCode, body
        }
    }
});