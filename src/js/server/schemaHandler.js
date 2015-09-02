// An extension of `gpii.express.handler` that adds JSON Schema headers to the outgoing response.  This is intended to
// be used with a `gpii.express.requestAware.router`.
//
// You are expected to provide two key options:
//
// 1. `options.schemaKey`: A short key for the schema that will represent it in the `Content-Type` header.
// 2. `options.schemaUrl`:  A URL for the schema, which will be included in both the `Link` and `Content-Type` headers.
//
// Note that this will not actually implement the required `handleRequest` invoker.  You are expected to do that in your
// own component, but you can use `that.sendResponse` as you would normally with any `gpii.express.handler` grade.
//
// See the tests in this package for working examples.
//
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("gpii-express");

fluid.registerNamespace("gpii.schema.handler");

// Send the appropriate headers and then let the underlying grade's `sendResponse` function take over.
gpii.schema.handler.sendResponse = function (that, statusCode, body) {
    if (!that.options.schemaKey || !that.options.schemaUrl) {
        fluid.log("Your gpii.schema.handler is not configured correctly and cannot set the appropriate headers.");
    }
    else if (that.response.headersSent) {
        fluid.log("Can't set headers, they have already been sent.");
    }
    else {
        that.response.type("application/" + that.options.schemaKey + "+json; profile=\"" + that.options.schemaUrl + "\"");
        that.response.set("Link", that.options.schemaUrl + "; rel=\"describedBy\"");
    }

    gpii.express.handler.sendResponse(that, statusCode, body);
};

fluid.defaults("gpii.schema.handler", {
    gradeNames: ["gpii.express.handler"],
    invokers: {
        sendResponse: {
            funcName: "gpii.schema.handler.sendResponse",
            args:     ["{that}", "{arguments}.0", "{arguments}.1"]
        }
    }
});