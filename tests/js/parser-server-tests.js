/*

  Test the parser by itself with as little interaction with the validator as possible (only static validator functions used).

  Client-side tests and integration are covered by the validator tests, which make use of the parser internally.

 */
"use strict";
var fluid  =  require("infusion");
var gpii   = fluid.registerNamespace("gpii");
var jqUnit = require("node-jqunit");
var path   = require("path");
var schemaDir = path.resolve(__dirname, "../schemas");

require("../../src/js/common/parser");
require("../../src/js/common/validate");
require("../../src/js/server/validate");

require("gpii-express");
gpii.express.loadTestingSupport();

fluid.registerNamespace("gpii.schema.parser.tests.server");

gpii.schema.parser.tests.server.testSchemaCaching = function (that) {
    jqUnit.assertTrue("There should be a dereferenced schema after startup...", Boolean(that.dereferencedSchemas && that.dereferencedSchemas["base.json"]));

    jqUnit.assertTrue("A derived schema should have been correctly dereferenced as well...", Boolean(that.dereferencedSchemas && that.dereferencedSchemas["derived.json"]));
};

gpii.schema.parser.tests.server.testFieldLookup = function (that, schemaKey, path, expected) {
    var output = that.lookupField(schemaKey, path);
    jqUnit.assertDeepEq("The field lookup output should be as expected...", expected, output);
};

gpii.schema.parser.tests.server.validateAndTest = function (validator, schemaKey, content, expected) {
    var output = validator.validate(schemaKey, content);
    jqUnit.assertDeepEq("The output should be as expected...", expected, output);
};


fluid.defaults("gpii.schema.parser.tests.server.caseHolder", {
    gradeNames: ["gpii.express.tests.caseHolder"],
    rawModules: [
        {
            tests: [
                {
                    name: "Testing the initial dereferencing of schema content...",
                    type: "test",
                    sequence: [
                        {
                            funcName: "gpii.schema.parser.tests.server.testSchemaCaching",
                            args:     ["{testEnvironment}.validator.parser"]
                        }
                    ]
                },
                {
                    name: "Testing simple field lookup...",
                    type: "test",
                    sequence: [
                        {
                            funcName: "gpii.schema.parser.tests.server.testFieldLookup",
                            args:     ["{testEnvironment}.validator.parser", "base.json", ".regex.description", "The string should be five characters long, begin with 'v' and end with 'd'."] // path, expected
                        }
                    ]
                },
                {
                    name: "Testing field lookup with square brackets...",
                    type: "test",
                    sequence: [
                        {
                            funcName: "gpii.schema.parser.tests.server.testFieldLookup",
                            args:     ["{testEnvironment}.validator.parser", "escaped.json", ".['[x][x]'].description", "How do textual cross marks make you feel?"] // path, expected
                        }
                    ]
                },
                {
                    name: "Testing deep lookup with dots and single quotes...",
                    type: "test",
                    sequence: [
                        {
                            funcName: "gpii.schema.parser.tests.server.testFieldLookup",
                            args:     ["{testEnvironment}.validator.parser", "escaped.json", ".['this.that']['th\'other'].description", "How do increasingly sloppy variable names make you feel?"] // path, expected
                        }
                    ]
                },
                {
                    name: "Testing evolution and collapse of multiple failures within a single field...",
                    type: "test",
                    sequence: [
                        {
                            funcName: "gpii.schema.parser.tests.server.validateAndTest",
                            args:     ["{testEnvironment}.validator", "base.json", { required: true, password: "pass" }, { fieldErrors: { password: ["Password must be 8 or more characters, and have at least one uppercase letter, at least one lowercase letter, and at least one number or special character."]}}] // validator, schemaKey, content, expected
                        }
                    ]
                }
            ]
        }
    ]
});

fluid.defaults("gpii.schema.parser.tests.server.environment", {
    gradeNames: ["fluid.test.testEnvironment"],
    events: {
        constructServer: null,
        onSchemasUpdated:    null,
        onStarted: {
            events: {
                onSchemasUpdated: "onSchemasUpdated"
            }
        }
    },
    listeners: {
        onSchemasUpdated: {
            funcName: "fluid.log",
            args:     ["The test environment was indeed notified..."]
        }
    },
    distributeOptions: {
        target: "{that > gpii.schema.validator.ajv.server}.options.components.parser.options.listeners.onSchemasUpdated",
        record: {
            func: "{testEnvironment}.events.onSchemasUpdated.fire"
        }
    },
    components: {
        validator: {
            type: "gpii.schema.validator.ajv.server",
            createOnEvent: "constructServer",
            options: {
                schemaDir: schemaDir
            }
        },
        caseHolder: {
            type: "gpii.schema.parser.tests.server.caseHolder"
        }
    }
});

gpii.schema.parser.tests.server.environment();

