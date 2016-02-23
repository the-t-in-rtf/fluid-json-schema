// "gated" test middleware (and an underlying test handler that lies beyond the gate).
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("gpii-express");
require("../../");

// A handler which delivers a "success" or "failure" message depending on a single user-supplied flag.
fluid.registerNamespace("gpii.schema.tests.middleware.underlyingHandler");

gpii.schema.tests.middleware.underlyingHandler.handleRequest = function (that) {
    // Reuse the validation rules to get a consistent payload across all methods.
    var data = fluid.model.transformWithRules(that.request, that.options.rules.requestContentToValidate);
    // TODO:  Simplify this once the binder properly supports checkboxes: https://issues.gpii.net/browse/GPII-1577
    if (data.succeed || data["succeed[]"]) {
        that.sendResponse(200, { ok: true, message: that.options.messages.success});
    }
    else {
        that.sendResponse(400, { ok: false, message: that.options.messages.failure});
    }
};

fluid.defaults("gpii.schema.tests.middleware.underlyingHandler", {
    gradeNames: ["gpii.express.handler"],
    invokers: {
        handleRequest: {
            funcName: "gpii.schema.tests.middleware.underlyingHandler.handleRequest",
            args:     ["{that}"]
        }
    }
});

// A base grade for all the "method" variations on our router.
fluid.defaults("gpii.schema.tests.middleware.router.base", {
    gradeNames: ["gpii.schema.middleware.requestAware.router"],
    schemaPath: "%gpii-json-schema/tests/schemas",
    schemaKey:  "gated.json",
    handlerGrades: ["gpii.schema.tests.middleware.underlyingHandler"],
    messages: {
        success: {
            expander: {
                funcName: "fluid.stringTemplate",
                args: ["You were able to '%method' content.", { method: "{that}.options.method"}]
            }
        },
        failure: {
            expander: {
                funcName: "fluid.stringTemplate",
                args: ["You failed to '%method' content.", { method: "{that}.options.method"}]
            }
        }
    },
    distributeOptions: [
        {
            source: "{that}.options.messages",
            target: "{that gpii.express.handler}.options.messages"
        },
        {
            source: "{that}.options.rules",
            target: "{that gpii.express.handler}.options.rules"
        }
    ]
});

// POST
fluid.defaults("gpii.schema.tests.middleware.router.post", {
    gradeNames: ["gpii.schema.tests.middleware.router.base"],
    method: "post",
    path:   "/POST"
});

// PUT
fluid.defaults("gpii.schema.tests.middleware.router.put", {
    gradeNames: ["gpii.schema.tests.middleware.router.base", "gpii.schema.middleware.handlesPutMethod"],
    path:   "/PUT"
});

// GET
fluid.defaults("gpii.schema.tests.middleware.router.get", {
    gradeNames: ["gpii.schema.tests.middleware.router.base", "gpii.schema.middleware.handlesGetMethod"],
    path:   "/GET"
});

// A common container for all of the different "method" variations
fluid.defaults("gpii.schema.tests.middleware.router", {
    gradeNames: ["gpii.express.router.passthrough"],
    path: "/gated",
    method: "use",
    components: {
        get: {
            type: "gpii.schema.tests.middleware.router.get"
        },
        post: {
            type: "gpii.schema.tests.middleware.router.post"
        },
        put: {
            type: "gpii.schema.tests.middleware.router.put"
        }
    }
});
