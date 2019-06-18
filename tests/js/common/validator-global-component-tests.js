/* globals jqUnit, require */
/* eslint-env browser */
var fluid  = fluid  || {};
var jqUnit = jqUnit || {};

(function (fluid, jqUnit) {
    "use strict";
    if (!fluid.identity) {
        fluid = require("infusion");
        jqUnit = require("node-jqunit");
        require("../../../src/js/common/validator");
    }

    var gpii = fluid.registerNamespace("gpii");
    fluid.registerNamespace("gpii.tests.schema.globalValidator");

    gpii.tests.schema.globalValidator.runTestDefs = function (globalValidator, testDefs) {
        fluid.each(testDefs, function (testDef) {
            gpii.tests.schema.globalValidator.runTestDef(globalValidator, testDef);
        });
    };

    gpii.tests.schema.globalValidator.runTestDef = function (globalValidator, testDef) {
        var validationOutput = globalValidator.validate(testDef.schema, testDef.toValidate);
        jqUnit.assertLeftHand(testDef.message, testDef.expected, validationOutput);
    };

    gpii.tests.schema.globalValidator.checkCache = function (globalValidator) {
        var schema = { type: "string", format: "email" };
        var schemaHash = gpii.schema.stringify(schema);

        jqUnit.assertUndefined("There should not be a cache entry for our schema before the first validation run.", globalValidator.validatorsByHash[schemaHash]);

        var beforeFirstRun = Date.now();
        globalValidator.validate(schema, "invalid AT invalid DOT com");
        var firstRunMs = Date.now() - beforeFirstRun;

        jqUnit.assertNotUndefined("There should be a cache entry for our schema after the first validation run.", globalValidator.validatorsByHash[schemaHash]);

        var beforeSecondRun = Date.now();
        globalValidator.validate(schema, "valid@valid.com");
        var secondRunMs = Date.now() - beforeSecondRun;

        jqUnit.assertTrue("The second run should be faster than the first.", secondRunMs < firstRunMs);

        globalValidator.clearCache();
        var cachedSchemaCount = Object.keys(globalValidator.validatorsByHash).length;

        jqUnit.assertEquals("The cache should be empty after it is cleared.", 0, cachedSchemaCount);
    };

    fluid.defaults("gpii.tests.schema.globalValidator.caseHolder", {
        gradeNames: ["fluid.test.testCaseHolder"],
        testDefs: {
            invalidData: {
                message: "We should be able to handle data that is invalid according to the schema",
                toValidate: "not a number",
                schema: { "$schema": "gss-v7-full#", type: "number" },
                expected: { isValid: false }
            },
            validData: {
                message: "We should be able to handle data that is valid according to the schema",
                toValidate: 1,
                schema: { "$schema": "gss-v7-full#", type: "number" },
                expected: { isValid: true }
            },
            shallowRequired: {
                message: "We should be able to handle a top-level required field.",
                toValidate: {},
                schema: { "$schema": "gss-v7-full#", properties: { top: { required: true }} },
                expected: { isValid: false }
            },
            deepRequired: {
                message: "We should be able to handle a deep required field.",
                toValidate: { foo: {} },
                schema: { "$schema": "gss-v7-full#", properties: { foo: { properties: { bar: { required: true }}}}},
                expected: { isValid: false }
            },
            emptyGss: {
                message: "We should be able to handle an empty GSS schema.",
                toValidate: "foo",
                schema: { "$schema": "gss-v7-full#" },
                expected: { isValid: true}
            },
            emptyJsonSchema: {
                message: "We should be able to handle an empty JSON schema.",
                toValidate: "anything is fine here.",
                schema: {},
                expected: { isValid: true}
            },
            multipleOf: {
                message: "We should be able to sanely handle 'multipleOf' with a fraction value",
                toValidate: 0.6,
                schema: { "$schema": "gss-v7-full#", type: "number", multipleOf: 0.1 },
                expected: { isValid: true }
            },
            invalidSchema: {
                message: "We should be able to handle an invalid GSS Schema.",
                toValidate: 1,
                schema: { "$schema": "gss-v7-full#", type: "nonsense" },
                expected: { isError: true }
            },
            shortError: {
                message: "We should be able to provide an error message key for a field using 'short' notation.",
                toValidate: 1,
                schema: { "$schema": "gss-v7-full#", type: "boolean", errors: "custom-short-error" },
                expected: {
                    isValid: false,
                    errors: [{
                        "dataPath": [],
                        "schemaPath": [
                            "type"
                        ],
                        "rule": {
                            "$schema": "gss-v7-full#",
                            "type": "boolean",
                            "errors": "custom-short-error"
                        },
                        "message": "custom-short-error"
                    }] }
            },
            longErrorRule: {
                message: "We should be able to provide an error message key for a specific rule.",
                toValidate: 1,
                schema: { "$schema": "gss-v7-full#", type: "boolean", errors: { "type": "custom-error"} },
                expected: {
                    isValid: false,
                    errors: [{
                        "dataPath": [],
                        "schemaPath": [
                            "type"
                        ],
                        "rule": {
                            "$schema": "gss-v7-full#",
                            "type": "boolean",
                            "errors": {
                                "type": "custom-error"
                            }
                        },
                        "message": "custom-error"
                    }]
                }
            },
            longErrorFailover: {
                message: "We should be able to provide an error message key for a field using 'long' notation.",
                toValidate: 1,
                schema: {"$schema": "gss-v7-full#", type: "boolean", errors: {"": "custom-generic-error"}},
                expected: {
                    isValid: false, errors: [{
                        "dataPath": [],
                        "schemaPath": [
                            "type"
                        ],
                        "rule": {
                            "$schema": "gss-v7-full#",
                            "type": "boolean",
                            "errors": {
                                "": "custom-generic-error"
                            }
                        },
                        "message": "custom-generic-error"
                    }]
                }
            },
            schemaInData: {
                message: "We should be able to validate schemas nested within a block of data.",
                toValidate: {
                    name: "my custom data structure",
                    schema: {
                        $schema: "gss-v7-full#",
                        type: "object",
                        properties: {
                            colour: {
                                enum: ["#ff0000", "#0000ff", "#00ff00"],
                                enumLabels: ["Red", "Blue", "Green"]
                            }
                        }
                    }
                },
                schema: {
                    $schema: "gss-v7-full#",
                    properties: {
                        name: {
                            type: "string",
                            required: true
                        },
                        schema: {
                            $ref: "gss-v7-full#",
                            required: true
                        }
                    }
                },
                expected: {
                    isValid: true
                }
            },
            nestedDollarSchema: {
                message: "We should be able to handle nested $schema elements.",
                schema: {
                    "$schema": "gss-v7-full#",
                    "type": "object",
                    "additionalProperties": {
                        "$schema": "gss-v7-full#",
                        "type": "string"
                    }
                },
                toValidate: {
                    "foo": "bar"
                },
                expected: {
                    isValid: true
                }
            }
        },
        modules: [{
            name: "Global validator component tests.",
            tests: [
                {
                    name: "Global validator component validation tests.",
                    sequence: [{
                        funcName: "gpii.tests.schema.globalValidator.runTestDefs",
                        args: ["{gpii.schema.validator}", "{that}.options.testDefs"] // globalValidator, testDefs
                    }]
                },
                {
                    name: "Global validator component cache tests.",
                    sequence: [{
                        funcName: "gpii.tests.schema.globalValidator.checkCache",
                        args: ["{gpii.schema.validator}"] // globalValidator
                    }]
                }
            ]
        }]
    });

    fluid.defaults("gpii.tests.schema.globalValidator.testEnvironment", {
        gradeNames: ["fluid.test.testEnvironment"],
        components: {
            caseHolder: {
                type: "gpii.tests.schema.globalValidator.caseHolder"
            }
        }
    });

    fluid.test.runTests("gpii.tests.schema.globalValidator.testEnvironment");
})(fluid, jqUnit);
