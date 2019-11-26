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
        require("./validator-tests-ajv-errors-testDefs");
    }

    var gpii  = fluid.registerNamespace("gpii");
    fluid.registerNamespace("gpii.tests.schema.validator");

    gpii.tests.schema.validator.staticFunctionTests = function () {
        jqUnit.module("Testing validator static functions.");

        jqUnit.test("Testing `gpii.schema.deriveRequiredProperties`.", function () {
            jqUnit.assertDeepEq("We should be able to generate a list of required sub-properties.", ["foo", "bar"], gpii.schema.deriveRequiredProperties({
                foo: {required: true},
                bar: {required: true},
                baz: {}
            }));
            jqUnit.assertDeepEq("We should be able to handle an empty object.", [], gpii.schema.deriveRequiredProperties({}));
        });

        jqUnit.test("Testing `gpii.schema.gssToJsonSchema`.", function () {
            var testDefs = {
                allSorts: {
                    message: "We should be able to handle a full range of values.",
                    gssSchema: {properties: {foo: {enum: [[0, 1, 2], true, "a string", undefined]}}},
                    expected: {
                        "$schema": "http://json-schema.org/draft-07/schema#",
                        properties: {foo: {enum: [[0, 1, 2], true, "a string", undefined]}}
                    }
                },
                anyOf: {
                    message: "We should be able to handle array constructs like `anyOf`.",
                    gssSchema: {anyOf: [{properties: {foo: {required: true}}}, {properties: {errors: {required: true}}}]},
                    expected: {
                        "$schema": "http://json-schema.org/draft-07/schema#", anyOf: [
                            {required: ["foo"], properties: {foo: {}}},
                            {required: ["errors"], properties: {errors: {}}}
                        ]
                    }
                },
                emptySchema: {
                    message: "We should be able to handle an empty schema.",
                    gssSchema: {},
                    expected: {"$schema": "http://json-schema.org/draft-07/schema#"}
                },
                enumLabels: {
                    message: "We should be able to handle our custom `enumLabels` element.",
                    gssSchema: {properties: {foo: {enumLabels: ["foo"], enum: ["bar"]}}},
                    expected: {"$schema": "http://json-schema.org/draft-07/schema#", properties: {foo: {enum: ["bar"]}}}
                },
                hint: {
                    message: "We should be able to handle our custom `hint` element.",
                    gssSchema: {properties: {foo: {hint: "baz"}}},
                    expected: {"$schema": "http://json-schema.org/draft-07/schema#", properties: {foo: {}}}
                },
                errors: {
                    message: "We should be able to handle our custom `errors` element.",
                    gssSchema: {properties: {foo: {errors: {"": "baz"}}}},
                    expected: {"$schema": "http://json-schema.org/draft-07/schema#", properties: {foo: {}}}
                },
                specialPropertyNames: {
                    message: "We should not filter out properties that match our GSS keywords.",
                    gssSchema: {properties: {errors: {}, hint: {}}},
                    expected: {"$schema": "http://json-schema.org/draft-07/schema#", properties: {errors: {}, hint: {}}}
                },
                requiredField: {
                    message: "We should be able to handle a single required field.",
                    gssSchema: {properties: {foo: {required: true}}},
                    expected: {"$schema": "http://json-schema.org/draft-07/schema#", required: ["foo"], properties: {foo: {}}}
                },
                requiredFields: {
                    message: "We should be able to handle multiple required fields.",
                    gssSchema: {properties: {foo: {required: true}, bar: {required: true, type: "string"}}},
                    expected: {
                        "$schema": "http://json-schema.org/draft-07/schema#",
                        required: ["foo", "bar"],
                        properties: {foo: {}, bar: {type: "string"}}
                    }
                }
            };

            fluid.each(testDefs, function (testDef) {
                jqUnit.assertDeepEq(testDef.message, testDef.expected, gpii.schema.gssToJsonSchema(testDef.gssSchema));
            });
        });

        jqUnit.test("Testing `gpii.schema.removeEmptyItems`.", function () {
            var testDefs = {
                nonEmpty: {message: "Non-empty items should be preserved.", input: ["a", "string"], expected: ["a", "string"]},
                emptyStrings: {
                    message: "Empty strings should be removed.",
                    input: ["", "not empty", ""],
                    expected: ["not empty"]
                },
                numbers: {message: "Numbers should be allowed.", input: [1, 2, 3], expected: [1, 2, 3]},
                undefined: {
                    message: "Undefined elements should be removed.",
                    input: [1, undefined, 2, undefined, 3],
                    expected: [1, 2, 3]
                },
                null: {message: "Null elements should be removed.", input: [1, null, 2, null, 3], expected: [1, 2, 3]},
                invalidItems: {
                    message: "Elements other than strings or integers should be removed.",
                    input: [true, Math.PI, {}, []],
                    expected: []
                }
            };
            fluid.each(testDefs, function (testDef) {
                jqUnit.assertDeepEq(testDef.message, testDef.expected, testDef.input.filter(gpii.schema.removeEmptyItems));
            });
        });

        jqUnit.test("Testing `gpii.schema.validator.errorHintForRule`.", function () {
            var testDefs = {
                defaultMessage: {
                    message: "We should be able to failover to a default message.",
                    gssSchema: {newRule: "shiny"},
                    rulePath: ["newRule"],
                    defaultMessage: "This is the default message.",
                    expected: "This is the default message."
                },
                ruleMessage: {
                    message: "We should be able to failover to one of the built-in keys for a given rule.",
                    gssSchema: {type: "text"},
                    rulePath: ["type"],
                    defaultMessage: "This is the default message.",
                    expected: "gpii.schema.messages.validationErrors.type"
                },
                shortForm: {
                    message: "We should be able to use a 'short form' error definition.",
                    gssSchema: {type: "text", "errors": "short-form-key"},
                    rulePath: ["type"],
                    defaultMessage: "This is the default message.",
                    expected: "short-form-key"
                },
                longFormByRule: {
                    message: "We should be able to use a 'long form' error definition for a single rule.",
                    gssSchema: {type: "text", "errors": {type: "long-form-by-rule-key"}},
                    rulePath: ["type"],
                    defaultMessage: "This is the default message.",
                    expected: "long-form-by-rule-key"
                },
                longFormFailover: {
                    message: "We should be able to use a 'long form' error definition for multiple rules.",
                    gssSchema: {type: "text", "errors": {"": "long-form-failover-key"}},
                    rulePath: ["type"],
                    defaultMessage: "This is the default message.",
                    expected: "long-form-failover-key"
                }
            };
            fluid.each(testDefs, function (testDef) {
                jqUnit.assertEquals(testDef.message, testDef.expected, gpii.schema.validator.errorHintForRule(testDef.rulePath, testDef.gssSchema, testDef.defaultMessage));
            });
        });

        jqUnit.test("Testing `gpii.schema.validator.extractElDataPathSegmentsFromError`.", function () {
            var testDefs = {
                rootDataPath: {
                    message: "We should be able to handle the root dataPath.",
                    error: {dataPath: ""},
                    expected: []
                },
                deepPath: {
                    message: "We should be able to handle a deep dataPath.",
                    error: {dataPath: ".deep.path.to.material"},
                    expected: ["deep", "path", "to", "material"]
                },
                requiredTopLevelField: {
                    message: "We should be able to handle a missing top-level required field.",
                    error: {dataPath: "", keyword: "required", params: {missingProperty: "requiredField"}},
                    expected: ["requiredField"]
                },
                requiredDeepField: {
                    message: "We should be able to handle a missing deep required field.",
                    error: {dataPath: ".deep", keyword: "required", params: {missingProperty: "requiredField"}},
                    expected: ["deep", "requiredField"]
                },
                dottedField: {
                    message: "We should be able to handle a dotted field in a dataPath.",
                    error: {"dataPath": "['dotted.field']"},
                    expected: ["dotted.field"]
                },
                dottedRequiredField: {
                    message: "We should be able to handle a missing required field with a dot in its key.",
                    error: {
                        "keyword": "required",
                        "dataPath": "",
                        "params": {
                            "missingProperty": "dotted.field"
                        }
                    },
                    expected: ["dotted.field"]
                },
                apostropheField: {
                    message: "We should be able to handle a dataPath with an escaped apostrophe",
                    error: {
                        "dataPath": "['don\\'t']"
                    },
                    expected: ["don't"]
                },
                complexMixture: {
                    message: "We should be able to handle complex interleaved data paths.",
                    error: {
                        "dataPath": ".settingsHandlers['configure'].supportedSettings['MagnificationMode'].schema"
                    },
                    expected: ["settingsHandlers", "configure", "supportedSettings", "MagnificationMode", "schema"]
                }
            };
            fluid.each(testDefs, function (testDef) {
                jqUnit.assertDeepEq(testDef.message, testDef.expected, gpii.schema.validator.extractElDataPathSegmentsFromError(testDef.error));
            });
        });

        jqUnit.test("Testing `gpii.schema.validator.jsonPointerToElPath`.", function () {
            var testDefs = {
                withId: {
                    message: "We should be able to handle a pointer that includes an ID.",
                    input: "schema-id.json#/path/to/material",
                    expected: ["path", "to", "material"]
                },
                relative: {
                    message: "We should be able to handle a relative pointer.",
                    input: "#/path/to/material",
                    expected: ["path", "to", "material"]
                },
                arrayEntry: {
                    message: "We should be able to handle a pointer that contains a reference to an array element.",
                    input: "#/anyOf/1/type",
                    expected: ["anyOf", "1", "type"]
                },
                root: { message: "We should be able to handle a pointer to the root of the object.", input: "#/", expected: [] }
            };
            fluid.each(testDefs, function (testDef) {
                jqUnit.assertDeepEq(testDef.message, testDef.expected, gpii.schema.validator.jsonPointerToElPath(testDef.input));
            });
        });

        jqUnit.test("Testing `gpii.schema.validator.standardiseAjvErrors`.", function () {
            fluid.each(gpii.tests.validator.ajvErrors, function (testDef) {
                var standardisedErrors = gpii.schema.validator.standardiseAjvErrors(testDef.schema, testDef.input);
                jqUnit.assertDeepEq(testDef.message, testDef.expected, standardisedErrors);
            });

            var expected = {isValid: true, errors: []};
            var noErrorOutput = gpii.schema.validator.standardiseAjvErrors({}, false);
            jqUnit.assertDeepEq("We should be able to handle the case in which there are no AJV errors.", expected, noErrorOutput);
        });

        jqUnit.test("Testing `gpii.schema.validator.localiseErrors`.", function () {
            var testDefs = {
                defaultsNoData: {
                    message: "We should be able to resolve error message keys with only the defaults.",
                    errors: [{message: "gpii.schema.messages.validationErrors.required"}],
                    expected: [{message: "This value is required."}]
                },
                defaultData: {
                    message: "We should be able to resolve error message keys with the defaults and the data being validated.",
                    toValidate: true,
                    errors: [{message: "gpii.schema.messages.validationErrors.required", dataPath: [""]}],
                    expected: [{message: "This value is required.", dataPath: [""]}]
                },
                noErrors: {
                    message: "We should be able to handle the case in which there are no errors.",
                    errors: [],
                    expected: []
                },
                ruleInTemplate: {
                    message: "We should be able to reference information from the rule in an error template.",
                    errors: [{
                        "dataPath": [],
                        "schemaPath": [
                            "maxLength"
                        ],
                        "rule": {
                            "type": "string",
                            "maxLength": 2
                        },
                        "message": "gpii.schema.messages.validationErrors.maxLength"
                    }],
                    expected: [{
                        "dataPath": [],
                        "schemaPath": [
                            "maxLength"
                        ],
                        "rule": {
                            "type": "string",
                            "maxLength": 2
                        },
                        "message": "The value must be 2 characters or less long."
                    }]
                },
                customMessageBundle: {
                    message: "We should be able to use a custom message bundle.",
                    messages: {
                        "gpii.schema.messages.validationErrors.maxLength": "The value is too long."
                    },
                    errors: [{
                        "message": "gpii.schema.messages.validationErrors.maxLength"
                    }],
                    expected: [{
                        "message": "The value is too long."
                    }]
                },
                dataInTemplate: {
                    message: "We should be able to use data in a custom error template.",
                    toValidate: {value: "the value itself"},
                    messages: {"custom-template": "We have nothing to evaluate but %data.value."},
                    errors: [{
                        "dataPath": [],
                        "message": "custom-template"
                    }],
                    expected: [{
                        "dataPath": [],
                        "message": "We have nothing to evaluate but the value itself."
                    }]
                },
                rootValue: {
                    message: "We should be able to use a root data value.",
                    toValidate: "root",
                    messages: {"custom-template": "We have discovered the %data of the problem."},
                    errors: [{
                        "dataPath": [],
                        "message": "custom-template"
                    }],
                    expected: [{
                        "dataPath": [],
                        "message": "We have discovered the root of the problem."
                    }]
                },
                customTransform: {
                    message: "We should be able to supply our own localisation rules.",
                    toValidate: {old: "change"},
                    messages: {"custom-template": "The only constant is %data.new."},
                    localisationTransform: {data: {"new": "data.old"}},
                    errors: [{
                        "dataPath": [],
                        "message": "custom-template"
                    }],
                    expected: [{
                        "dataPath": [],
                        "message": "The only constant is change."
                    }]
                }
            };
            fluid.each(testDefs, function (testDef) {
                var messageBundle = fluid.extend({}, gpii.tests.schema.defaultMessageBundle, testDef.messages);
                var output = gpii.schema.validator.localiseErrors(testDef.errors, testDef.toValidate, messageBundle, testDef.localisationTransform);
                jqUnit.assertDeepEq(testDef.message, testDef.expected, output);
            });
        });
    };
})(fluid, jqUnit);
