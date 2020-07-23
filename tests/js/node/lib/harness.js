/*

    Test harness common to all tests that use `fluid-json-schema` in combination with `fluid-express`.  Loads all
    required server-side components.

 */
/* eslint-env node */
"use strict";
var fluid = require("infusion");

fluid.require("%fluid-express");
fluid.require("%fluid-handlebars");

require("../../../../");
require("./middleware-express-fixtures.js");

fluid.defaults("fluid.test.schema.harness.base", {
    gradeNames: ["fluid.component"],
    templateDirs: {
        validation: "%fluid-json-schema/src/templates",
        validationTests: "%fluid-json-schema/tests/templates",
        handlebarsTests: "%fluid-handlebars/tests/templates/primary"
    },
    components: {
        json: {
            type: "fluid.express.middleware.bodyparser.json",
            options: {
                priority: "first"
            }
        },
        urlencoded: {
            type: "fluid.express.middleware.bodyparser.urlencoded",
            options: {
                priority: "after:json"
            }
        },
        handlebars: {
            type: "fluid.express.hb",
            options: {
                priority:     "after:urlencoded",
                templateDirs: "{fluid.test.schema.harness.base}.options.templateDirs"
            }
        },
        gated: {
            type: "fluid.tests.schema.middleware.router",
            options: {
                priority: "after:urlencoded"
            }
        },
        build: {
            type: "fluid.express.router.static",
            options: {
                namespace: "build",
                path:    "/build",
                content: "%fluid-json-schema/build"
            }
        },
        inline: {
            type: "fluid.handlebars.inlineTemplateBundlingMiddleware",
            options: {
                path:         "/templates",
                templateDirs: "{fluid.test.schema.harness.base}.options.templateDirs"
            }
        },
        messageBundleLoader: {
            type: "fluid.handlebars.i18n.messageBundleLoader",
            options: {
                messageDirs: { validation: "%fluid-json-schema/src/messages" }
            }
        },
        messages: {
            type: "fluid.handlebars.inlineMessageBundlingMiddleware",
            options: {
                model: {
                    messageBundles: "{messageBundleLoader}.model.messageBundles"
                }
            }
        },
        htmlErrorHandler: {
            type: "fluid.handlebars.errorRenderingMiddleware",
            options: {
                priority:  "after:gated",
                statusCode:  400,
                templateKey: "partials/validation-error-summary"
            }
        },
        // This is hit by validation errors that are not otherwise handled (for example, by rendering the error).
        defaultErrorMiddleware: {
            type: "fluid.express.middleware.error",
            options: {
                priority:  "last",
                defaultStatusCode: 500
            }
        }
    }
});

fluid.defaults("fluid.test.schema.harness", {
    gradeNames: ["fluid.express", "fluid.test.schema.harness.base"],
    port: 6194,
    baseUrl: {
        expander: {
            funcName: "fluid.stringTemplate",
            args:     ["http://localhost:%port/", { port: "{that}.options.port" }]
        }
    },
    components: {
        js: {
            type: "fluid.express.router.static",
            options: {
                path:    "/src",
                content: "%fluid-json-schema/src"
            }
        },
        modules: {
            type: "fluid.express.router.static",
            options: {
                path:    "/node_modules",
                content: "%fluid-json-schema/node_modules"
            }
        },
        content: {
            type: "fluid.express.router.static",
            options: {
                path:    "/content",
                content: "%fluid-json-schema/tests/browser-fixtures"
            }
        }
    }});
