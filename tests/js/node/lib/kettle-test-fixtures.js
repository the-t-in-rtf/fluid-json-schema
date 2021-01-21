/* eslint-env node */
/*

    Fixtures for testing middleware with Kettle.

 */
"use strict";
var fluid = require("infusion");

fluid.registerNamespace("fluid.test.schema.kettle.handlers.base");

require("../../../../src/js/server/schemaValidationMiddleware");

fluid.test.schema.kettle.handlers.base.reportSuccess = function (request) {
    request.events.onSuccess.fire({ message: "Payload accepted." });
};

// The base grade, which just wires up a success response if the request content is valid.
fluid.defaults("fluid.test.schema.kettle.handlers.base", {
    gradeNames: ["kettle.request.http"],
    invokers: {
        handleRequest: {
            funcName: "fluid.test.schema.kettle.handlers.base.reportSuccess"
        }
    }
});

fluid.defaults("fluid.test.schema.kettle.bodyValidator", {
    gradeNames: ["fluid.schema.kettle.validator.body"],
    requestSchema: {
        "$schema": "fss-v7-full#",
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
fluid.defaults("fluid.test.schema.kettle.handlers.gatedBody", {
    gradeNames: ["fluid.test.schema.kettle.handlers.base"],
    requestMiddleware: {
        validate: {
            middleware: "{fluid.test.schema.kettle.bodyValidator}"
        }
    }
});

fluid.defaults("fluid.test.schema.kettle.paramsValidator", {
    gradeNames: ["fluid.schema.kettle.validator.params"],
    requestSchema: {
        "$schema": "fss-v7-full#",
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

fluid.defaults("fluid.test.schema.kettle.handlers.gatedParams", {
    gradeNames: ["fluid.test.schema.kettle.handlers.base"],
    requestMiddleware: {
        validate: {
            middleware: "{fluid.test.schema.kettle.paramsValidator}"
        }
    }
});

fluid.defaults("fluid.test.schema.kettle.queryValidator", {
    gradeNames: ["fluid.schema.kettle.validator.query"],
    requestSchema: {
        "$schema": "fss-v7-full#",
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
fluid.defaults("fluid.test.schema.kettle.handlers.gatedQuery", {
    gradeNames: ["fluid.test.schema.kettle.handlers.base"],
    requestMiddleware: {
        validate: {
            middleware: "{fluid.test.schema.kettle.queryValidator}"
        }
    }
});

fluid.defaults("fluid.test.schema.kettle.combinedValidator", {
    gradeNames: ["fluid.schema.kettle.validator"],
    requestSchema: {
        "$schema": "fss-v7-full#",
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
fluid.defaults("fluid.test.schema.kettle.handlers.gatedCombined", {
    gradeNames: ["fluid.test.schema.kettle.handlers.base"],
    requestMiddleware: {
        validate: {
            middleware: "{fluid.test.schema.kettle.combinedValidator}"
        }
    }
});

fluid.defaults("fluid.test.schema.kettle.app", {
    gradeNames: ["kettle.app"],
    components: {
        bodyValidator: {
            type: "fluid.test.schema.kettle.bodyValidator"
        },
        paramsValidator: {
            type: "fluid.test.schema.kettle.paramsValidator"
        },
        queryValidator: {
            type: "fluid.test.schema.kettle.queryValidator"
        },
        combinedValidator: {
            type: "fluid.test.schema.kettle.combinedValidator"
        }
    },
    requestHandlers: {
        gatedBody: {
            type: "fluid.test.schema.kettle.handlers.gatedBody",
            route: "/gated/body",
            method: "post"
        },
        gatedParams: {
            type: "fluid.test.schema.kettle.handlers.gatedParams",
            route: "/gated/params/:hasParamContent"
        },
        gatedQuery: {
            type: "fluid.test.schema.kettle.handlers.gatedQuery",
            route: "/gated/query"
        },
        gatedCombined: {
            type: "fluid.test.schema.kettle.handlers.gatedCombined",
            route: "/gated/combined/:hasParamContent",
            method: "post"
        }
    }
});
