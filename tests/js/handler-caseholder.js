// Test `gpii.schema.middleware` and its subcomponents.
//
"use strict";
var fluid        = fluid || require("infusion");
var gpii         = fluid.registerNamespace("gpii");
var jqUnit       = require("jqUnit");

require("../../node_modules/gpii-express/tests/js/lib/test-helpers");

// We use just the request-handling bits of the kettle stack in our tests, but we include the whole thing to pick up the base grades
require("../../node_modules/kettle");
require("../../node_modules/kettle/lib/test/KettleTestUtils");

// The server-side libraries we are testing
require("../../");


fluid.registerNamespace("gpii.schema.tests.handler.caseHolder");
gpii.schema.tests.handler.caseHolder.examineResponse = function (response, body) {
    var contentType = response.headers["content-type"];
    jqUnit.assertTrue("The content type header should contain our key...", contentType && contentType.indexOf("sample") !== -1);

    var link = response.headers.link;
    jqUnit.assertTrue("The link header should contain our key...", link && link.indexOf("sample") !== -1);

    jqUnit.assertNotUndefined("There should be body content", body);
};

fluid.defaults("gpii.schema.tests.handler.caseHolder", {
    gradeNames: ["gpii.express.tests.caseHolder"],
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
                            listener: "gpii.schema.tests.handler.caseHolder.examineResponse",
                            event:    "{request}.events.onComplete",
                            args:     ["{request}.nativeResponse", "{arguments}.0"]
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
