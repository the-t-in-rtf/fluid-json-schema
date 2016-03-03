// Test `gpii.schema.middleware` and its subcomponents.
//
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("gpii-express");
gpii.express.loadTestingSupport();

var kettle = require("kettle");
kettle.loadTestingSupport();

require("../lib/checkResponseHeaders");

// The server-side libraries we are testing
require("../../../");

fluid.defaults("gpii.schema.tests.handler.caseHolder", {
    gradeNames: ["gpii.schema.tests.caseHolder"],
    rawModules: [
        {
            tests: [
                {
                    name: "Confirming that the handler adds the appropriate headers...",
                    type: "test",
                    sequence: [
                        {
                            func: "{request}.send"
                        },
                        {
                            listener: "gpii.schema.tests.checkResponseHeaders",
                            event:    "{request}.events.onComplete",
                            args:     ["{request}.nativeResponse", "{arguments}.0", "sample", "sample"]
                        }
                    ]
                }
            ]
        }
    ],
    components: {
        request: {
            type: "kettle.test.request.http",
            options: {
                path:       "/",
                port:       "{testEnvironment}.options.port",
                method:     "GET"
            }
        }
    }
});
