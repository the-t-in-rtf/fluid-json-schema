/* Test the validation middleware with a "simple" piece of middleware that does not extend the "request aware" grades.
/* eslint-env node */
"use strict";
var fluid = require("infusion");

fluid.require("%fluid-express");

require("../../../../");
require("./middleware-fss-schema");

fluid.registerNamespace("fluid.tests.schema.middleware.gatedMiddleware");

fluid.tests.schema.middleware.gatedMiddleware.respond = function (response) {
    response.send("Nothing can be ill.");
};

fluid.defaults("fluid.tests.schema.middleware.gatedMiddleware", {
    gradeNames: ["fluid.express.middleware"],
    method: "use",
    invokers: {
        middleware: {
            funcName: "fluid.tests.schema.middleware.gatedMiddleware.respond",
            args:     ["{arguments}.1"] // response
        }
    }
});

// A base grade for all the "method" variations on our router.
fluid.defaults("fluid.tests.schema.middleware.router.base", {
    gradeNames: ["fluid.express.router"],
    components: {
        validationMiddleware: {
            type: "fluid.schema.validationMiddleware",
            options: {
                namespace: "validationMiddleware",
                inputSchema: fluid.tests.schemas.middleware.gatedSchema
            }
        },
        gatedMiddleware: {
            type: "fluid.tests.schema.middleware.gatedMiddleware",
            options: {
                priority: "after:validationMiddleware"
            }
        }
    }
});

// POST
fluid.defaults("fluid.tests.schema.middleware.router.post", {
    gradeNames: ["fluid.tests.schema.middleware.router.base"],
    method:     "post",
    path:       "/POST"
});

// PUT
fluid.defaults("fluid.tests.schema.middleware.router.put", {
    gradeNames: ["fluid.tests.schema.middleware.router.base"],
    method:     "put",
    path:       "/PUT"
});

// GET
fluid.defaults("fluid.tests.schema.middleware.router.get", {
    gradeNames: ["fluid.tests.schema.middleware.router.base"],
    method:     "get",
    path:       "/GET",
    components: {
        validationMiddleware: {
            options: {
                gradeNames: ["fluid.schema.validationMiddleware.handlesQueryData"]
            }
        }
    }
});

// A common container for all of the different "method" variations
fluid.defaults("fluid.tests.schema.middleware.router", {
    gradeNames: ["fluid.express.router"],
    path: "/gated",
    method: "use",
    components: {
        get: {
            type: "fluid.tests.schema.middleware.router.get"
        },
        post: {
            type: "fluid.tests.schema.middleware.router.post"
        },
        put: {
            type: "fluid.tests.schema.middleware.router.put"
        }
    }
});
