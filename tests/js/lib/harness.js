/*
    Test harness common to all tests that use `gpii-express`.  Loads all required server-side components.
 */
"use strict";
var fluid = require("infusion");

require("../../../");
require("gpii-express");

require("gpii-handlebars");

require("./middleware-fixtures.js");

fluid.defaults("gpii.schema.tests.harness", {
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
    config:  {
        express: {
            "port" : "{that}.options.port",
            baseUrl: "{that}.options.url"
        }
    },
    components: {
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
            type: "gpii.express.hb.inline",
            options: {
                path:         "/hbs",
                templateDirs: ["%gpii-json-schema/src/templates", "%gpii-json-schema/tests/templates"]
            }
        },
        inlineSchemas: {
            type: "gpii.schema.inline.router",
            options: {
                schemaDirs: "%gpii-json-schema/tests/schemas",
                listeners: {
                    "onSchemasDereferenced.notifyEnvironment": {
                        func: "{gpii.schema.tests.harness}.events.onInlineRouterReady.fire"
                    }
                }
            }
        },
        gated: {
            type: "gpii.schema.tests.middleware.router",
            options: {
                namespace: "gated",
                listeners: {
                    "onSchemasDereferenced.notifyEnvironment": {
                        func: "{gpii.schema.tests.harness}.events.onGatedRequestAwareRouterReady.fire"
                    }
                }
            }
        },
        gatedContentAware: {
            type: "gpii.schema.tests.middleware.router.contentAware",
            options: {
                namespace: "gatedContentAware",
                priority:  "after:gated",
                listeners: {
                    "onSchemasDereferenced.notifyEnvironment": {
                        func: "{gpii.schema.tests.harness}.events.onGatedContentAwareRouterReady.fire"
                    }
                }
            }
        },
        handlebars: {
            type: "gpii.express.hb",
            options: {
                priority:     "after:gatedContentAware",
                templateDirs: ["%gpii-json-schema/tests/templates", "%gpii-json-schema/src/templates"]
            }
        },
        htmlErrorHandler: {
            type: "gpii.handlebars.errorRenderingMiddleware",
            options: {
                statusCode:  400,
                templateKey: "partials/validation-error-summary",
                priority:    "after:handlebars"
            }
        },
        
        defaultErrorHandler: {
            type: "gpii.express.middleware.error",
            options: {
                priority:   "after:errorRenderingMiddleware",
                statusCode: 400
            }
        }
    }
});
