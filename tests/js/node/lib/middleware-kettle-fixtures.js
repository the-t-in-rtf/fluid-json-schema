/* eslint-env node */
/*

    Fixtures for testing middleware with Kettle.

 */
"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.test.schema.kettle.handlers.base");

require("../../../../src/js/server/schemaValidationMiddleware");

gpii.test.schema.kettle.handlers.base.reportSuccess = function (request) {
    request.events.onSuccess.fire({ message: "Payload accepted." });
};

// The base grade, which just wires up a success response if the request content is valid.
fluid.defaults("gpii.test.schema.kettle.handlers.base", {
    gradeNames: ["gpii.schema.kettle.request.http"],
    inputSchema: {},
    invokers: {
        handleRequest: {
            funcName: "gpii.test.schema.kettle.handlers.base.reportSuccess"
        }
    }
});

// Looking for body content and validate that against our schema.
fluid.defaults("gpii.test.schema.kettle.handlers.gatedBody", {
    gradeNames: ["gpii.test.schema.kettle.handlers.base"],
    inputSchema: {
        type: "object",
        properties: {
            hasBodyContent: {
                type: "string",
                required: true,
                enum: ["good"],
                enumLabels: ["Good Choice"]
            }
        }
    }
});

fluid.defaults("gpii.test.schema.kettle.handlers.gatedParams", {
    gradeNames: ["gpii.test.schema.kettle.handlers.base"],
    inputSchema: {
        type: "object",
        properties: {
            hasParamContent: {
                type: "string",
                required: true,
                enum: ["good"],
                enumLabels: ["Good Choice"]
            }
        }
    },
    rules: {
        requestContentToValidate: {
            "": "params"
        }
    }
});

// We use the `handlesQueryData` mix-in, which should also work with Kettle.
fluid.defaults("gpii.test.schema.kettle.handlers.gatedQuery", {
    gradeNames: ["gpii.test.schema.kettle.handlers.base", "gpii.schema.validationMiddleware.handlesQueryData"],
    inputSchema: {
        type: "object",
        properties: {
            hasQueryContent: {
                type: "string",
                required: true,
                enum: ["good"],
                enumLabels: ["Good Choice"]
            }
        }
    }
});

// Test all three in combination.
fluid.defaults("gpii.test.schema.kettle.handlers.gatedCombined", {
    gradeNames: ["gpii.test.schema.kettle.handlers.base"],
    inputSchema: {
        type: "object",
        properties: {
            params: {
                type: "object",
                properties: {
                    hasParamContent: {
                        type: "string",
                        required: true,
                        enum: ["good"],
                        enumLabels: ["Good Choice"]
                    }
                }
            },
            body: {
                type: "object",
                properties: {
                    hasBodyContent: {
                        type: "string",
                        required: true,
                        enum: ["good"],
                        enumLabels: ["Good Choice"]
                    }
                }
            },
            query: {
                type: "object",
                properties: {
                    hasQueryContent: {
                        type: "string",
                        required: true,
                        enum: ["good"],
                        enumLabels: ["Good Choice"]
                    }
                }
            }
        }
    },
    rules: {
        requestContentToValidate: {
            "": ""
        }
    }
});

fluid.defaults("gpii.test.schema.kettle.app", {
    gradeNames: ["kettle.app"],
    requestHandlers: {
        gatedBody: {
            type: "gpii.test.schema.kettle.handlers.gatedBody",
            route: "/gated/body",
            method: "post"
        },
        gatedParams: {
            type: "gpii.test.schema.kettle.handlers.gatedParams",
            route: "/gated/params/:hasParamContent"
        },
        gatedQuery: {
            type: "gpii.test.schema.kettle.handlers.gatedQuery",
            route: "/gated/query"
        },
        gatedCombined: {
            type: "gpii.test.schema.kettle.handlers.gatedCombined",
            route: "/gated/combined/:hasParamContent",
            method: "post"
        }
    }
});

fluid.defaults("gpii.test.schema.middleware.kettle.request", {
    gradeNames: ["kettle.test.request.http"],
    headers: {
        accept: "application/json"
    },
    port:  "{testEnvironment}.options.port"
});
