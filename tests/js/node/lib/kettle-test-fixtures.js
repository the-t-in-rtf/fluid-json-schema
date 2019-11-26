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
    gradeNames: ["kettle.request.http"],
    invokers: {
        handleRequest: {
            funcName: "gpii.test.schema.kettle.handlers.base.reportSuccess"
        }
    }
});

fluid.defaults("gpii.test.schema.kettle.bodyValidator", {
    gradeNames: ["gpii.schema.kettle.validator.body"],
    requestSchema: {
        "$schema": "gss-v7-full#",
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

// Looking for body content and validate that against our schema.
fluid.defaults("gpii.test.schema.kettle.handlers.gatedBody", {
    gradeNames: ["gpii.test.schema.kettle.handlers.base"],
    requestMiddleware: {
        validate: {
            middleware: "{gpii.test.schema.kettle.bodyValidator}"
        }
    }
});

fluid.defaults("gpii.test.schema.kettle.paramsValidator", {
    gradeNames: ["gpii.schema.kettle.validator.params"],
    requestSchema: {
        "$schema": "gss-v7-full#",
        type: "object",
        properties: {
            hasParamContent: {
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
    requestMiddleware: {
        validate: {
            middleware: "{gpii.test.schema.kettle.paramsValidator}"
        }
    }
});

fluid.defaults("gpii.test.schema.kettle.queryValidator", {
    gradeNames: ["gpii.schema.kettle.validator.query"],
    requestSchema: {
        "$schema": "gss-v7-full#",
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

// We use the `handlesQueryData` mix-in, which should also work with Kettle.
fluid.defaults("gpii.test.schema.kettle.handlers.gatedQuery", {
    gradeNames: ["gpii.test.schema.kettle.handlers.base"],
    requestMiddleware: {
        validate: {
            middleware: "{gpii.test.schema.kettle.queryValidator}"
        }
    }
});

fluid.defaults("gpii.test.schema.kettle.combinedValidator", {
    gradeNames: ["gpii.schema.kettle.validator"],
    requestSchema: {
        "$schema": "gss-v7-full#",
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
    }
});

// Test all three in combination.
fluid.defaults("gpii.test.schema.kettle.handlers.gatedCombined", {
    gradeNames: ["gpii.test.schema.kettle.handlers.base"],
    requestMiddleware: {
        validate: {
            middleware: "{gpii.test.schema.kettle.combinedValidator}"
        }
    }
});

fluid.defaults("gpii.test.schema.kettle.app", {
    gradeNames: ["kettle.app"],
    components: {
        bodyValidator: {
            type: "gpii.test.schema.kettle.bodyValidator"
        },
        paramsValidator: {
            type: "gpii.test.schema.kettle.paramsValidator"
        },
        queryValidator: {
            type: "gpii.test.schema.kettle.queryValidator"
        },
        combinedValidator: {
            type: "gpii.test.schema.kettle.combinedValidator"
        }
    },
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

fluid.defaults("gpii.test.schema.kettle.request", {
    gradeNames: ["kettle.test.request.http"],
    headers: {
        accept: "application/json"
    },
    port:  "{testEnvironment}.options.port"
});
