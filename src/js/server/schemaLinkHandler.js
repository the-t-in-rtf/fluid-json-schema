/*

    An extension of `gpii.express.schemaLink.handler` that sends the appropriate JSON Schema headers on success or failure. See
    the component's documentation for more details:

    https://github.com/the-t-in-rtf/gpii-json-schema/blob/master/docs/schemaLinks.md

 */
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("gpii-express");
require("../common/hasRequiredOptions");
require("./schemaUrlHolder");
require("./lib/schemaLinkHeaders");

fluid.registerNamespace("gpii.schema.schemaLink.handler");

gpii.schema.schemaLink.handler.sendResponse = function (that, response, statusCode, body) {
    gpii.schema.schemaLinks.addHeaders(response, that.options.schemaUrls.success);
    gpii.express.handler.sendResponse(that, response, statusCode, body);
};

gpii.schema.schemaLink.handler.sendError = function (that, response, statusCode, body) {
    gpii.schema.schemaLinks.addHeaders(response, that.options.schemaUrls.error);
    gpii.express.handler.sendResponse(that, response, statusCode, body);
};

fluid.defaults("gpii.schema.schemaLink.handler", {
    gradeNames: ["gpii.express.handler","gpii.schema.schemaLink.schemaUrlHolder",  "gpii.hasRequiredOptions"],
    requiredFields: {
        "schemaUrls.error": true,
        "schemaUrls.success": true
    },
    invokers: {
        sendResponse: {
            funcName: "gpii.schema.schemaLink.handler.sendResponse",
            args:     ["{that}", "{that}.options.response", "{arguments}.0", "{arguments}.1"] // statusCode, body
        },
        sendError: {
            funcName: "gpii.schema.schemaLink.handler.sendError",
            args:     ["{that}", "{that}.options.response", "{arguments}.0", "{arguments}.1"] // statusCode, body
        }
    }
});
