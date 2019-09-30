/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

fluid.require("%gpii-testem");
fluid.require("%gpii-json-schema");
fluid.require("%gpii-handlebars");

require("./js/node/lib/middleware-express-fixtures");
require("./js/node/lib/harness");

fluid.defaults("gpii.test.schema.coverageServer", {
    gradeNames: ["gpii.testem.coverage.express", "gpii.test.schema.harness.base"]
});

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
    templateDirs: ["%gpii-json-schema/src/templates", "%gpii-json-schema/tests/templates", "%gpii-handlebars/tests/templates/primary"],
    additionalProxies: {
        templates: "/templates",
        messages: "/messages",
        gated: "/gated"
    },
    testemOptions: {
        // Disable Headless Chrome we can figure out a solution to this issue: https://issues.gpii.net/browse/GPII-4064
        // Running Testem with the HEADLESS environment variable still works, and still runs headless.
        skip: "PhantomJS,Safari,IE,Headless Chrome"
    },
    components: {
        express: {
            type: "gpii.test.schema.coverageServer"
        //    options: {
        //        components: {
        //            json: {
        //                type: "gpii.express.middleware.bodyparser.json",
        //                options: {
        //                    priority: "first",
        //                    middlewareOptions: {
        //                        limit: 12500000 // Allow coverage payloads of up to 100Mb instead of the default 100Kb
        //                    }
        //                }
        //            },
        //            urlencoded: {
        //                type: "gpii.express.middleware.bodyparser.urlencoded",
        //                options: {
        //                    priority: "after:json",
        //                    middlewareOptions: {
        //                        limit: 12500000 // Allow coverage payloads of up to 100Mb instead of the default 100Kb
        //                    }
        //                }
        //            },
        //            inline: {
        //                type: "gpii.handlebars.inlineTemplateBundlingMiddleware",
        //                options: {
        //                    path:         "/templates",
        //                    priority:     "after:urlencoded",
        //                    templateDirs: "{gpii.testem.instrumentation}.options.templateDirs"
        //                }
        //            },
        //            messageLoader: {
        //                type: "gpii.handlebars.i18n.messageLoader",
        //                options: {
        //                    messageDirs: { validation: "%gpii-json-schema/src/messages" }
        //                }
        //            },
        //            messages: {
        //                type: "gpii.handlebars.inlineMessageBundlingMiddleware",
        //                options: {
        //                    model: {
        //                        messageBundles: "{messageLoader}.model.messageBundles"
        //                    }
        //                }
        //            },
        //            handlebars: {
        //                type: "gpii.express.hb",
        //                options: {
        //                    priority:     "after:urlencoded",
        //                    templateDirs: "{gpii.testem.instrumentation}.options.templateDirs"
        //                }
        //            },
        //            gated: {
        //                type: "gpii.tests.schema.middleware.router",
        //                options: {
        //                    priority: "after:urlencoded"
        //                }
        //            },
        //            htmlErrorHandler: {
        //                type: "gpii.handlebars.errorRenderingMiddleware",
        //                options: {
        //                    priority:  "after:gated",
        //                    statusCode:  400,
        //                    templateKey: "validation-error-summary"
        //                }
        //            },
        //            defaultErrorMiddleware: {
        //                type: "gpii.express.middleware.error",
        //                options: {
        //                    priority: "after:htmlErrorHandler",
        //                    defaultStatusCode: 400
        //                }
        //            }
        //        }
        //    }
        }
    }
});

module.exports = testemComponent.getTestemOptions();
