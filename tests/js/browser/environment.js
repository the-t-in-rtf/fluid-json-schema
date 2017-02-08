// A test environment for browser + express tests
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("../lib/harness");

require("gpii-webdriver");
gpii.webdriver.loadTestingSupport();

fluid.defaults("gpii.tests.schema.browser.environment", {
    gradeNames: ["gpii.test.webdriver.testEnvironment.withExpress"],
    port:   6984,
    url: {
        expander: {
            funcName: "fluid.stringTemplate",
            args:     ["http://localhost:%port%endpoint", { port: "{that}.options.port", endpoint: "{that}.options.endpoint" }]
        }
    },
    events: {
        onHarnessReady: null,
        onFixturesConstructed: {
            events: {
                onDriverReady:  "onDriverReady",
                onExpressReady: "onHarnessReady"
            }
        }
    },
    components: {
        express: {
            type: "gpii.test.schema.harness",
            options: {
                port: "{testEnvironment}.options.port",
                listeners: {
                    "onAllReady.notifyEnvironment": {
                        func: "{testEnvironment}.events.onHarnessReady.fire"
                    }
                }
            }
        }
    }
});
