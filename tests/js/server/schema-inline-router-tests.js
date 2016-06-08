/*

  Test the router that dereferences and delivers all schemas "inline" as a single JSON object.
 */
/* eslint-env node */
"use strict";
var fluid  =  require("infusion");
var gpii   = fluid.registerNamespace("gpii");
var jqUnit = require("node-jqunit");

require("../../../");

require("../lib/fixtures");

require("gpii-express");
gpii.express.loadTestingSupport();

fluid.registerNamespace("gpii.schema.inline.tests");

gpii.schema.inline.tests.checkInlineSchemaPayload = function (response, body) {
    jqUnit.assertEquals("The status code should be correct...", 200, response.statusCode);

    var payload = JSON.parse(body);

    jqUnit.assertTrue("There should be schema content in the payload...", payload && (Object.keys(payload).length > 0));

    fluid.each(payload, function (schemaContent, schemaKey) {
        jqUnit.assertTrue("The schema '" + schemaKey + "' should have at least one top-level key...", schemaContent && Object.keys(schemaContent).length > 0);

        // There should no longer be any $ref values in any of our schemas.  We check the `properties` structure, which in
        // our original schemas contains $ref values.
        //
        fluid.each(schemaContent.properties, function (property) {
            jqUnit.assertUndefined("The schema '" + schemaKey + "' should not contain $ref properties after dereferencing...", property.$ref);
        });
    });
};

fluid.defaults("gpii.schema.inline.tests.caseHolder", {
    gradeNames: ["gpii.test.express.caseHolder"],
    rawModules: [
        {
            name: "Testing the router that bundles and delivers all schemas at once...",
            tests: [
                {
                    name: "Testing the initial dereferencing of schema content...",
                    type: "test",
                    sequence: [
                        {
                            func: "{schemaContentRequest}.send",
                            args: []
                        },
                        {
                            event:    "{schemaContentRequest}.events.onComplete",
                            listener: "gpii.schema.inline.tests.checkInlineSchemaPayload",
                            args:     ["{schemaContentRequest}.nativeResponse", "{arguments}.0"] // response, body
                        }
                    ]
                }
            ]
        }
    ],
    components: {
        schemaContentRequest: {
            type: "gpii.test.schema.request",
            options: {
                endpoint: "allSchemas"
            }
        }
    }
});

fluid.defaults("gpii.schema.inline.tests.environment", {
    gradeNames: ["gpii.test.schema.testEnvironment"],
    port: 7654,
    components: {
        caseHolder: {
            type: "gpii.schema.inline.tests.caseHolder"
        }
    }
});

fluid.test.runTests("gpii.schema.inline.tests.environment");
