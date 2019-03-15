/* Test the validation middleware with a "simple" piece of middleware that does not extend the "request aware" grades.
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.require("%gpii-express");
// We must pass the current `require` to `fluid.require`, as nyc's instrumentation is hooked into it.
fluid.require("%gpii-json-schema", require);
require("./middleware-gss-schema");

fluid.registerNamespace("gpii.tests.schema.middleware.gatedMiddleware");

gpii.tests.schema.middleware.gatedMiddleware.respond = function (response) {
    response.send("Nothing can be ill.");
};

fluid.defaults("gpii.tests.schema.middleware.gatedMiddleware", {
    gradeNames: ["gpii.express.middleware"],
    method: "use",
    invokers: {
        middleware: {
            funcName: "gpii.tests.schema.middleware.gatedMiddleware.respond",
            args:     ["{arguments}.1"] // response
        }
    }
});

// A base grade for all the "method" variations on our router.
fluid.defaults("gpii.tests.schema.middleware.router.base", {
    gradeNames: ["gpii.express.router"],
    components: {
        validationMiddleware: {
            type: "gpii.schema.validationMiddleware",
            options: {
                namespace: "validationMiddleware",
                inputSchema: gpii.tests.schemas.middleware.gatedSchema
            }
        },
        gatedMiddleware: {
            type: "gpii.tests.schema.middleware.gatedMiddleware",
            options: {
                priority: "after:validationMiddleware"
            }
        }
    }
});

// POST
fluid.defaults("gpii.tests.schema.middleware.router.post", {
    gradeNames: ["gpii.tests.schema.middleware.router.base"],
    method:     "post",
    path:       "/POST"
});

// PUT
fluid.defaults("gpii.tests.schema.middleware.router.put", {
    gradeNames: ["gpii.tests.schema.middleware.router.base"],
    method:     "put",
    path:       "/PUT"
});

// GET
fluid.defaults("gpii.tests.schema.middleware.router.get", {
    gradeNames: ["gpii.tests.schema.middleware.router.base"],
    method:     "get",
    path:       "/GET",
    components: {
        validationMiddleware: {
            options: {
                gradeNames: ["gpii.schema.validationMiddleware.handlesQueryData"]
            }
        }
    }
});

// A common container for all of the different "method" variations
fluid.defaults("gpii.tests.schema.middleware.router", {
    gradeNames: ["gpii.express.router"],
    path: "/gated",
    method: "use",
    components: {
        get: {
            type: "gpii.tests.schema.middleware.router.get"
        },
        post: {
            type: "gpii.tests.schema.middleware.router.post"
        },
        put: {
            type: "gpii.tests.schema.middleware.router.put"
        }
    }
});
