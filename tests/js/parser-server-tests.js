/*

  Test the parser by itself with as little interaction with the validator as possible (only static validator functions used).

  Client-side tests and integration are covered by the validator tests, which make use of the parser internally.

 */
"use strict";
var fluid  = fluid || require("infusion");
var gpii   = fluid.registerNamespace("gpii");
var jqUnit = require("jqUnit");
var path   = require("path");
var schemaDir = path.resolve(__dirname, "../schemas");

require("../../src/js/common/parser");
require("../../src/js/common/validate");
require("../../src/js/server/validate");

// Utility function to wire up and initial wait into each test case.
require("../../node_modules/gpii-express/tests/js/lib/test-helpers");

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
    sequenceStart: [
        { // This sequence point is required because of a QUnit bug - it defers the start of sequence by 13ms "to avoid any current callbacks" in its words
            func: "{testEnvironment}.events.constructEverything.fire"
        },
        {
            listener: "fluid.identity",
            event: "{testEnvironment}.events.onSchemasUpdated"
        }
    ],
    rawModules: [
        {
            tests: [
                {
                    name: "Testing the initial dereferencing of schema content...",
                    type: "test",
                    sequence: [
                        {
                            funcName: "gpii.schema.parser.tests.server.testSchemaCaching",
                            args:     ["{testEnvironment}.gateKeeper.validator.parser"]
                        }
                    ]
                },
                {
                    name: "Testing simple field lookup...",
                    type: "test",
                    sequence: [
                        {
                            funcName: "gpii.schema.parser.tests.server.testFieldLookup",
                            args:     ["{testEnvironment}.gateKeeper.validator.parser", "base.json", ".regex.description", "The string should be five characters long, begin with 'v' and end with 'd'."] // path, expected
                        }
                    ]
                },
                {
                    name: "Testing field lookup with square brackets...",
                    type: "test",
                    sequence: [
                        {
                            funcName: "gpii.schema.parser.tests.server.testFieldLookup",
                            args:     ["{testEnvironment}.gateKeeper.validator.parser", "escaped.json", ".['[x][x]'].description", "How do textual cross marks make you feel?"] // path, expected
                        }
                    ]
                },
                {
                    name: "Testing deep lookup with dots and single quotes...",
                    type: "test",
                    sequence: [
                        {
                            funcName: "gpii.schema.parser.tests.server.testFieldLookup",
                            args:     ["{testEnvironment}.gateKeeper.validator.parser", "escaped.json", ".['this.that']['th\'other'].description", "How do increasingly sloppy variable names make you feel?"] // path, expected
                        }
                    ]
                },
                {
                    name: "Testing evolution and collapse of multiple failures within a single field...",
                    type: "test",
                    sequence: [
                        {
                            funcName: "gpii.schema.parser.tests.server.validateAndTest",
                            args:     ["{testEnvironment}.gateKeeper.validator", "base.json", { required: true, password: "pass" }, { fieldErrors: { password: ["Password must be 8 or more characters, and have at least one uppercase letter, at least one lowercase letter, and at least one number or special character."]}}] // validator, schemaKey, content, expected
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
        constructEverything: null,
        onSchemasUpdated:    null
    },
    listeners: {
        onSchemasUpdated: {
            funcName: "fluid.log",
            args:     ["The test environment was indeed notified..."]
        }
    },
    components: {
        gateKeeper: {
            type:         "fluid.component",
            createOnEvent: "constructEverything",
            options: {
                components: {
                    validator: {
                        type: "gpii.schema.validator.server.hasParser",
                        options: {
                            schemaDir: schemaDir,
                            components: {
                                parser: {
                                    options: {
                                        listeners: {
                                            "onSchemasUpdated.notifyEnvironment": {
                                                func: "{testEnvironment}.events.onSchemasUpdated.fire"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        caseHolder: {
            type: "gpii.schema.parser.tests.server.caseHolder"
        }
    }
});

gpii.schema.parser.tests.server.environment();

