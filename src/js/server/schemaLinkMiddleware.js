/*

    An extension of `gpii.express.middleware` (and `gpii.express.middleware.error`) that adds JSON Schema headers to
    the outgoing response. See the component's documentation for more details:

    https://github.com/the-t-in-rtf/gpii-json-schema/blob/master/docs/schemaLinkMiddleware.md

 */
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("gpii-express");
require("../common/hasRequiredOptions");

fluid.registerNamespace("gpii.schema.schemaLinkMiddleware");

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
gpii.schema.schemaLinkMiddleware.addHeaders = function (that, error, request, response, next) {
    if (response.headersSent) {
        if (error) {
            next(error);

            fluid.fail("Could not set headers, they have already been sent to the response.  There was already an error, so I couldn't even pass it on!");
        }
        else {
            next(that.options.errors.headersSent);
        }
    }
    else {
        response.type("application/" + quotedPrintable.encode(that.options.schemaKey) + "+json; profile=\"" + that.options.schemaUrl + "\"");
        response.set("Link", that.options.schemaUrl + "; rel=\"describedBy\"");

        if (error) {
            next(error);
        }
        else {
            next();
        }
    }
};

fluid.defaults("gpii.schema.schemaLinkMiddleware.base", {
    gradeNames: ["gpii.hasRequiredOptions"],
    requiredFields: {
        "schemaKey": true,
        "schemaUrl": true
    }
});

fluid.defaults("gpii.schema.schemaLinkMiddleware", {
    gradeNames: ["gpii.schema.schemaLinkMiddleware.base", "gpii.express.middleware"],
    namespace:  "schemaLinkMiddleware",
    invokers: {
        middleware: {
            funcName: "gpii.schema.schemaLinkMiddleware.addHeaders",
            args:     ["{that}", null, "{arguments}.0", "{arguments}.1", "{arguments}.2"] // error, request, response, next
        }
    }
});

fluid.defaults("gpii.schema.schemaLinkMiddleware.error", {
    gradeNames: ["gpii.schema.schemaLinkMiddleware.base", "gpii.express.middleware.error"],
    namespace:  "schemaLinkErrorMiddleware",
    invokers: {
        middleware: {
            funcName: "gpii.schema.schemaLinkMiddleware.addHeaders",
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2", "{arguments}.3"] // error, request, response, next
        }
    }
});
