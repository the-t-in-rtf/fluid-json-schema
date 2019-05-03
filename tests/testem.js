/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

fluid.require("%gpii-testem");
fluid.require("%gpii-json-schema");
fluid.require("%gpii-handlebars");

require("./js/node/lib/middleware-express-fixtures");

var testemComponent = gpii.testem.instrumentation({
    reportsDir: "reports",
    coverageDir: "coverage",
    testPages:   [
        "tests/browser-fixtures/all-tests.html"
    ],
    sourceDirs: {
        src: "%gpii-json-schema/src"
    },
    contentDirs: {
        "tests": "%gpii-json-schema/tests",
        "node_modules": "%gpii-json-schema/node_modules"
    },
    additionalProxies: {
        hbs:   "/hbs",
        gated: "/gated"
    },
    testemOptions: {
        skip: "PhantomJS,Safari,IE,Chrome" // Testem now has a "Chrome Headless" launcher built in, so we disable the headed version.
    },
    components: {
        express: {
            options: {
                components: {
                    json: {
                        type: "gpii.express.middleware.bodyparser.json",
                        options: {
                            priority: "first",
                            middlewareOptions: {
                                limit: 12500000 // Allow coverage payloads of up to 100Mb instead of the default 100Kb
                            }
                        }
                    },
                    urlencoded: {
                        type: "gpii.express.middleware.bodyparser.urlencoded",
                        options: {
                            priority: "after:json",
                            middlewareOptions: {
                                limit: 12500000 // Allow coverage payloads of up to 100Mb instead of the default 100Kb
                            }
                        }
                    },
                    inline: {
                        type: "gpii.handlebars.inlineTemplateBundlingMiddleware",
                        options: {
                            path:         "/hbs",
                            priority:     "after:urlencoded",
                            templateDirs: ["%gpii-json-schema/src/templates", "%gpii-json-schema/tests/templates"]
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
                    htmlErrorHandler: {
                        type: "gpii.handlebars.errorRenderingMiddleware",
                        options: {
                            priority:  "after:gated",
                            statusCode:  400,
                            templateKey: "validation-error-summary"
                        }
                    },
                    defaultErrorMiddleware: {
                        type: "gpii.express.middleware.error",
                        options: {
                            priority: "after:htmlErrorHandler",
                            defaultStatusCode: 400
                        }
                    }
                }
            }
        }
    }
});

module.exports = testemComponent.getTestemOptions();
