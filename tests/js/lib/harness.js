/*
    Test harness common to all tests that use `gpii-express`.  Loads all required server-side components.
 */
/* eslint-env node */
"use strict";
var fluid = require("infusion");

require("../../../");
require("gpii-express");

require("gpii-handlebars");

require("./middleware-fixtures.js");

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
    config:  {
        express: {
            "port" : "{that}.options.port",
            baseUrl: "{that}.options.url"
        }
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
                schemaDirs: "%gpii-json-schema/tests/schemas",
                listeners: {
                    "onSchemasDereferenced.notifyEnvironment": {
                        func: "{gpii.test.schema.harness}.events.onInlineRouterReady.fire"
                    }
                }
            }
        },
        htmlHeaderMiddleware: {
            type: "gpii.express.middleware.headerSetter.error",
            options: {
                priority:  "after:gatedContentAware",
                namespace: "htmlHeaderMiddleware",
                headers: {
                    contentType: {
                        fieldName: "Content-Type",
                        template:  "text/html",
                        dataRules: {}
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
        jsonHeaderMiddleware: {
            type: "gpii.express.middleware.headerSetter.error",
            options: {
                priority:  "after:htmlErrorHandler",
                namespace: "jsonHeaderMiddleware",
                headers: {
                    contentType: {
                        fieldName: "Content-Type",
                        template:  "application/json",
                        dataRules: {}
                    }
                }
            }
        },
        validationErrorHeaderMiddleware: {
            type: "gpii.schema.schemaLinkMiddleware.error",
            options: {
                schemaKey: "message.json",
                schemaUrl: "http://some.fake.site/schemas/message.json",
                priority:  "after:jsonHeaderMiddleware"
            }
        },
        defaultErrorHandler: {
            type: "gpii.express.middleware.error",
            options: {
                priority:  "after:validationErrorHeaderMiddleware",
                defaultStatusCode: 400
            }
        }
    }
});
