/*

    Test harness common to all tests that use `gpii-json-schema` in combination with `gpii-express`.  Loads all
    required server-side components.

 */
/* eslint-env node */
"use strict";
var fluid = require("infusion");

// We must pass the current `require` to `fluid.require`, as nyc's instrumentation is hooked into it.
fluid.require("%gpii-json-schema", require);
fluid.require("%gpii-express");
fluid.require("%gpii-handlebars");

require("./middleware-express-fixtures.js");

fluid.defaults("gpii.test.schema.harness", {
    gradeNames: ["gpii.express"],
    port: 6194,
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
            type: "gpii.tests.schema.middleware.router",
            options: {
                priority: "after:urlencoded"
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
                content: "%gpii-json-schema/tests/browser-fixtures"
            }
        },
        inline: {
            type: "gpii.handlebars.inlineTemplateBundlingMiddleware",
            options: {
                path:         "/hbs",
                templateDirs: ["%gpii-json-schema/src/templates", "%gpii-json-schema/tests/templates"]
            }
        },
        htmlErrorHandler: {
            type: "gpii.handlebars.errorRenderingMiddleware",
            options: {
                priority:  "after:gated",
                statusCode:  400,
                templateKey: "partials/validation-error-summary"
            }
        },
        // This should never be reached
        defaultErrorMiddleware: {
            type: "gpii.express.middleware.error",
            options: {
                priority:  "last",
                defaultStatusCode: 400
            }
        }
    }
});
