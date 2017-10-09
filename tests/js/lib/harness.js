/*
    Test harness common to all tests that use `gpii-express`.  Loads all required server-side components.
 */
/* eslint-env node */
"use strict";
var fluid = require("infusion");

fluid.require("%gpii-json-schema");
fluid.require("%gpii-express");
fluid.require("%gpii-handlebars");

require("./middleware-fixtures.js");
fluid.require("%gpii-json-schema/src/js/server/lib/schemaUrlAssembler.js");

fluid.defaults("gpii.test.schema.harness", {
    gradeNames: ["gpii.express"],
    port: 6194,
    events: {
        onInlineRouterReady: null,
        onGatedContentAwareRouterReady: null,
        onGatedRequestAwareRouterReady: null,
        onAllReady: {
            events: {
                "onStarted":                      "onStarted",
                "onInlineRouterReady":            "onInlineRouterReady",
                "onGatedContentAwareRouterReady": "onGatedContentAwareRouterReady",
                "onGatedRequestAwareRouterReady": "onGatedRequestAwareRouterReady"
            }
        }
    },
    baseUrl: {
        expander: {
            funcName: "fluid.stringTemplate",
            args:     ["http://localhost:%port/", { port: "{that}.options.port" }]
        }
    },
    schemaBaseUrl: {
        expander: {
            funcName: "gpii.schema.urlAssembler",
            args:     ["{that}.options.baseUrl", "/schemas"]
        }
    },
    schemaDirs: ["%gpii-json-schema/src/schemas", "%gpii-json-schema/tests/schemas"],
    config:  {
        express: {
            "port" : "{that}.options.port",
            baseUrl: "{that}.options.url"
        }
    },
    distributeOptions: {
        source: "{that}.options.schemaBaseUrl",
        target: "{that gpii.schema.schemaLink.schemaUrlHolder}.options.schemaBaseUrl"
    },
    components: {
        json: {
            type: "gpii.express.middleware.bodyparser.json",
            options: {
                priority: "first"
            }
        },
        urlencoded: {
            type: "gpii.express.middleware.bodyparser.urlencoded",
            options: {
                priority: "after:json"
            }
        },
        handlebars: {
            type: "gpii.express.hb",
            options: {
                priority:     "after:urlencoded",
                templateDirs: ["%gpii-json-schema/tests/templates", "%gpii-json-schema/src/templates"]
            }
        },
        gated: {
            type: "gpii.test.schema.middleware.router",
            options: {
                priority: "after:handlebars",
                listeners: {
                    "onSchemasDereferenced.notifyEnvironment": {
                        func: "{gpii.test.schema.harness}.events.onGatedRequestAwareRouterReady.fire"
                    }
                }
            }
        },
        schemaContent: {
            type: "gpii.express.router.static",
            options: {
                path:    "/schemas",
                content: "{gpii.test.schema.harness}.options.schemaDirs"
            }
        },
        gatedContentAware: {
            type: "gpii.test.schema.contentAware",
            options: {
                namespace: "gatedContentAware",
                priority:  "after:gated",
                listeners: {
                    "onSchemasDereferenced.notifyEnvironment": {
                        func: "{gpii.test.schema.harness}.events.onGatedContentAwareRouterReady.fire"
                    }
                }
            }
        },
        build: {
            type: "gpii.express.router.static",
            options: {
                namespace: "build",
                path:    "/build",
                content: "%gpii-json-schema/build"
            }
        },
        js: {
            type: "gpii.express.router.static",
            options: {
                path:    "/src",
                content: "%gpii-json-schema/src"
            }
        },
        modules: {
            type: "gpii.express.router.static",
            options: {
                path:    "/modules",
                content: "%gpii-json-schema/node_modules"
            }
        },
        content: {
            type: "gpii.express.router.static",
            options: {
                path:    "/content",
                content: "%gpii-json-schema/tests/static"
            }
        },
        inline: {
            type: "gpii.handlebars.inlineTemplateBundlingMiddleware",
            options: {
                path:         "/hbs",
                templateDirs: ["%gpii-json-schema/src/templates", "%gpii-json-schema/tests/templates"]
            }
        },
        inlineSchemas: {
            type: "gpii.schema.inlineMiddleware",
            options: {
                schemaDirs: "{gpii.test.schema.harness}.options.schemaDirs",
                listeners: {
                    "onSchemasDereferenced.notifyEnvironment": {
                        func: "{gpii.test.schema.harness}.events.onInlineRouterReady.fire"
                    }
                }
            }
        },
        htmlErrorHandler: {
            type: "gpii.handlebars.errorRenderingMiddleware",
            options: {
                priority:  "after:htmlHeaderMiddleware",
                namespace: "htmlErrorHandler",
                statusCode:  400,
                templateKey: "partials/validation-error-summary"
            }
        },
        validationErrorHeaderMiddleware: {
            type: "gpii.schema.schemaLink.middleware.error",
            options: {
                schemaPaths: {
                    error: "validation-error-message.json"
                },
                priority:  "after:jsonHeaderMiddleware"
            }
        },
        // This should never be reached
        defaultErrorMiddleware: {
            type: "gpii.express.middleware.error",
            options: {
                priority:  "after:validationErrorHeaderMiddleware",
                defaultStatusCode: 400
            }
        }
    }
});
