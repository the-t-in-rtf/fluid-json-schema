/* eslint-env node */
"use strict";
var fluid = require("infusion");

fluid.require("%fluid-testem");
fluid.require("%fluid-json-schema");
fluid.require("%fluid-handlebars");

require("./js/node/lib/middleware-express-fixtures");
require("./js/node/lib/harness");

fluid.defaults("fluid.test.schema.coverageServer", {
    gradeNames: ["fluid.testem.coverage.express", "fluid.test.schema.harness.base"]
});

var testemComponent = fluid.testem.instrumentation({
    reportsDir: "%fluid-json-schema/reports",
    coverageDir: "%fluid-json-schema/coverage",
    testPages:   [
        "tests/browser-fixtures/all-tests.html"
    ],
    sourceDirs: {
        src: "%fluid-json-schema/src"
    },
    contentDirs: {
        "tests": "%fluid-json-schema/tests",
        "node_modules": "%fluid-json-schema/node_modules"
    },
    templateDirs: {
        validation: "%fluid-json-schema/src/templates",
        validationTests: "%fluid-json-schema/tests/templates",
        handlebarsTests: "%fluid-handlebars/tests/templates/primary"
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
        // Disable Headless Chrome we can figure out a solution to this issue: https://issues.fluid.net/browse/fluid-4064
        // Running Testem with the HEADLESS environment variable still works, and still runs headless.
        skip: "PhantomJS,Safari,IE,Headless Chrome,Chromium"
    },
    components: {
        express: {
            type: "fluid.test.schema.coverageServer"
        }
    }
});

module.exports = testemComponent.getTestemOptions();
