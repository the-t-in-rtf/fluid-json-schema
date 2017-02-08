/*

  Test the parser by itself to confirm that it loads schemas and dereferences them as expected.

 */
/* eslint-env node */
"use strict";
var fluid  =  require("infusion");
var gpii   = fluid.registerNamespace("gpii");
var jqUnit = require("node-jqunit");

require("../../../");

require("gpii-express");
gpii.express.loadTestingSupport();

fluid.registerNamespace("gpii.tests.schema.parser");

gpii.tests.schema.parser.testSchemaCaching = function (that) {
    jqUnit.assertTrue("There should be dereferenced schemas...", that.model && that.model.dereferencedSchemas && Object.keys(that.model.dereferencedSchemas).length > 0);

    // There should no longer be any $ref values in any of our schemas.  We check the `properties` structure, which in
    // our original schemas contains $ref values.
    //
    fluid.each(that.model.dereferencedSchemas, function (schemaContent) {
        fluid.each(schemaContent.properties, function (property) {
            jqUnit.assertUndefined("There should not be a $ref property after dereferencing...", property.$ref);
        });
    });
};

fluid.defaults("gpii.tests.schema.parser.caseHolder", {
    gradeNames: ["gpii.test.express.caseHolder"],
    rawModules: [
        {
            name: "Testing the parser in isolation...",
            tests: [
                {
                    name: "Testing the initial dereferencing of schema content...",
                    type: "test",
                    sequence: [
                        {
                            funcName: "gpii.tests.schema.parser.testSchemaCaching",
                            args:     ["{testEnvironment}.parser"]
                        }
                    ]
                }
            ]
        }
    ]
});

fluid.defaults("gpii.tests.schema.parser.environment", {
    gradeNames: ["fluid.test.testEnvironment"],
    events: {
        constructFixtures:  null,
        onSchemasDereferenced: null,
        onFixturesConstructed: {
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
            createOnEvent: "constructFixtures",
            options: {
                schemaDirs: "%gpii-json-schema/tests/schemas"
            }
        },
        caseHolder: {
            type: "gpii.tests.schema.parser.caseHolder"
        }
    }
});

fluid.test.runTests("gpii.tests.schema.parser.environment");
