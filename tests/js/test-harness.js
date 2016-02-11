/*
    Test harness common to all Zombie tests.  Loads all required server-side components.
 */
"use strict";
var fluid = require("infusion");

require("../../");
require("gpii-express");
require("gpii-handlebars");

require("./lib/test-mock-login");

fluid.defaults("gpii.schema.tests.harness", {
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
        build: {
            type: "gpii.express.router.static",
            options: {
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
        schemas: {
            type: "gpii.express.router.static",
            options: {
                path:    "/schemas",
                content: "%gpii-json-schema/tests/schemas"
            }
        },
        inline: {
            type: "gpii.express.hb.inline",
            options: {
                path: "/hbs",
                templateDirs: "%gpii-json-schema/tests/templates"
            }
        },
        mockLogin: {
            type: "gpii.schema.tests.mockLogin.router"
        }
    }
});