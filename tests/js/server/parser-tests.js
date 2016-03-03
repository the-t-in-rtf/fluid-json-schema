/*

  Test the parser by itself to confirm that it loads schemas and dereferences them as expected.

 */
"use strict";
var fluid  =  require("infusion");
var gpii   = fluid.registerNamespace("gpii");
var jqUnit = require("node-jqunit");

require("../../../");

require("gpii-express");
gpii.express.loadTestingSupport();

fluid.registerNamespace("gpii.schema.parser.tests");

gpii.schema.parser.tests.testSchemaCaching = function (that) {
    jqUnit.assertTrue("There should be dereferenced schemas...", that.dereferencedSchemas && Object.keys(that.dereferencedSchemas).length > 0);

    // There should no longer be any $ref values in any of our schemas.  We check the `properties` structure, which in
    // our original schemas contains $ref values.
    //
    fluid.each(that.dereferencedSchemas, function (schemaContent) {
        fluid.each(schemaContent.properties, function (property) {
            jqUnit.assertUndefined("There should not be a $ref property after dereferencing...", property.$ref);
        });
    });
};

fluid.defaults("gpii.schema.parser.tests.caseHolder", {
    gradeNames: ["gpii.express.tests.caseHolder"],
    rawModules: [
        {
            tests: [
                {
                    name: "Testing the initial dereferencing of schema content...",
                    type: "test",
                    sequence: [
                        {
                            funcName: "gpii.schema.parser.tests.testSchemaCaching",
                            args:     ["{testEnvironment}.parser"]
                        }
                    ]
                }
            ]
        }
    ]
});

fluid.defaults("gpii.schema.parser.tests.environment", {
    gradeNames: ["fluid.test.testEnvironment"],
    events: {
        constructServer:  null,
        onSchemasDereferenced: null,
        onStarted: {
            events: {
                onSchemasDereferenced: "onSchemasDereferenced"
            }
        }
    },
    distributeOptions: {
        target: "{that > gpii.schema.parser}.options.listeners.onSchemasDereferenced",
        record: {
            func: "{testEnvironment}.events.onSchemasDereferenced.fire"
        }
    },
    components: {
        parser: {
            type: "gpii.schema.parser",
            createOnEvent: "constructServer",
            options: {
                schemaDirs: "%gpii-json-schema/tests/schemas"
            }
        },
        caseHolder: {
            type: "gpii.schema.parser.tests.caseHolder"
        }
    }
});

gpii.schema.parser.tests.environment();

