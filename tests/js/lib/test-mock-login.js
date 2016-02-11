/*

    A test component to provide JSON schema validation feedback as well as "normal" errors from the underlying router.

    POST invalid JSON data to /login, and you will get back validation errors.

    POST valid JSON data to /login using the username "NSA" and any password, and you will get a simulated "success" message.

    POST valid JSON data with any other username and you will get a simulated "error" message.

    Used in testing the `errorBinder` component in depth.

 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("gpii-express");
require("../../../");

fluid.registerNamespace("gpii.schema.tests.mockLogin.handler");

gpii.schema.tests.mockLogin.handler.handleRequest = function (that) {
    if (that.request.body.username === "NSA") {
        that.sendResponse(200, { ok: true, message: "Welcome, Mr. Smith."});
    }
    else {
        that.sendResponse(401, { ok: false, message: "Not nobody, not nohow."});
    }
};

fluid.defaults("gpii.schema.tests.mockLogin.handler", {
    gradeNames: ["gpii.express.handler"],
    invokers: {
        handleRequest: {
            funcName: "gpii.schema.tests.mockLogin.handler.handleRequest",
            args: ["{that}"]
        }
    }
});

// The grade that will actually respond if we send valid JSON data.
fluid.defaults("gpii.schema.tests.mockLogin.innerRouter", {
    gradeNames: ["gpii.express.requestAware.router"],
    handlerGrades: ["gpii.schema.tests.mockLogin.handler"],
    path: "/",
    method: "post"
});

// The outer router that wires in the validator middleware and its required upstream middleware.
fluid.defaults("gpii.schema.tests.mockLogin.router", {
    gradeNames: ["gpii.express.router.passthrough"],
    path: "/login",
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
                schemaKey: "user.json",
                schemaPath: "%gpii-json-schema/tests/schemas"
            }
        },
        innerRouter: {
            type: "gpii.schema.tests.mockLogin.innerRouter"
        }
    }
});