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
    reportsDir: "%gpii-json-schema/reports",
    coverageDir: "%gpii-json-schema/coverage",
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
    templateDirs: {
        validation: "%gpii-json-schema/src/templates",
        validationTests: "%gpii-json-schema/tests/templates",
        handlebarsTests: "%gpii-handlebars/tests/templates/primary"
    },
    additionalProxies: {
        templates: "/templates",
        messages: "/messages",
        gated: "/gated"
    },
    // Force Firefox to run headless as a temporary fix for Firefox issues on Windows:
    // https://github.com/testem/testem/issues/1377
    "browserArgs": {
        "Firefox": [
            "--no-remote",
            "--headless"
        ]
    },
    testemOptions: {
        // Disable Headless Chrome we can figure out a solution to this issue: https://issues.gpii.net/browse/GPII-4064
        // Running Testem with the HEADLESS environment variable still works, and still runs headless.
        skip: "PhantomJS,Safari,IE,Headless Chrome"
    },
    components: {
        express: {
            type: "gpii.test.schema.coverageServer"
        }
    }
});

module.exports = testemComponent.getTestemOptions();
