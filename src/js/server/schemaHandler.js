/*

    An extension of `gpii.express.handler` that adds JSON Schema headers to the outgoing response.

    See this component's documentation for more details:

    https://github.com/the-t-in-rtf/gpii-json-schema/blob/GPII-1336/docs/handler.md

 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("gpii-express");
require("../common/hasRequiredOptions");

fluid.registerNamespace("gpii.schema.handler");

var quotedPrintable = require("quoted-printable");

/**
 *
 * Send the appropriate headers and then let the underlying grade's `sendResponse` function take over.
 *
 * @param that - The handler component itself.
 * @param response {Object} - The Express `response` object: http://expressjs.com/en/api.html#res
 * @param statusCode - The numeric HTTP status code.
 * @param body {Object} - The response payload to send to the browser.
 */
gpii.schema.handler.sendResponse = function (that, response, statusCode, body) {
    if (response.headersSent) {
        fluid.log("Can't set headers, they have already been sent.");
    }
    else {
        response.type("application/" + quotedPrintable.encode(that.options.schemaKey) + "+json; profile=\"" + that.options.schemaUrl + "\"");
        response.set("Link", that.options.schemaUrl + "; rel=\"describedBy\"");
    }

    gpii.express.handler.sendResponse(that, response, statusCode, body);
};

// Common shared definitions used in both final grades below
fluid.defaults("gpii.schema.handler.common", {
    gradeNames: ["gpii.hasRequiredOptions"],
    requiredFields: {
        "schemaKey": true,
        "schemaUrl": true
    }
});

// A companion grade designed for use with `gpii.express.base`.  Intended for static rather than dynamic use.
fluid.defaults("gpii.schema.handler.base", {
    gradeNames: ["gpii.schema.handler.common", "gpii.express.handler.base"],
    invokers: {
        sendResponse: {
            funcName: "gpii.schema.handler.sendResponse",
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"] // response, statusCode, body
        }
    }
});

fluid.defaults("gpii.schema.handler", {
    gradeNames: ["gpii.schema.handler.common", "gpii.express.handler"],
    invokers: {
        sendResponse: {
            funcName: "gpii.schema.handler.sendResponse",
            args:     ["{that}", "{that}.response", "{arguments}.0", "{arguments}.1"] // statusCode, body
        }
    }
});