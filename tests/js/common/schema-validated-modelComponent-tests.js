/* eslint-env browser */
/* eslint-disable no-redeclare */
/* globals Ajv, jqUnit, require */
var fluid  = fluid  || {};
var Ajv    = Ajv    || {};
var jqUnit = jqUnit || {};
/* eslint-enable no-redeclare */

(function (fluid, Ajv, jqUnit) {
    "use strict";
    if (!fluid.identity) {
        fluid = require("infusion");
        jqUnit = require("node-jqunit");
        require("../../../src/js/common/schemaValidatedModelComponent");
    }

    fluid.defaults("fluid.tests.schema.modelComponent", {
        gradeNames: ["fluid.schema.modelComponent"],
        members: {
            validationPasses: 0
        },
        modelListeners: {
            "*": {
                namespace: "validateModel",
                excludeSource: ["init", "validation"],
                funcName: "fluid.tests.schema.modelComponent.trackedModelValidation",
                args: ["{fluid.schema.validator}", "{that}"] // globalValidator, validatedModelComponent
            }
        },
        listeners: {
            "onCreate.validateModel": {
                funcName: "fluid.tests.schema.modelComponent.trackedModelValidation",
                args: ["{fluid.schema.validator}", "{that}"] // globalValidator, validatedModelComponent
            }
        }
    });

    fluid.tests.schema.modelComponent.trackedModelValidation = function (globalValidator, validatedModelComponent) {
        validatedModelComponent.validationPasses++;
        fluid.schema.modelComponent.validateModel(globalValidator, validatedModelComponent);
    };

    jqUnit.module("Schema validated model component tests.");

    jqUnit.test("Testing the base grade.", function () {
        var component = fluid.tests.schema.modelComponent();
        jqUnit.assert("We should have been able to instantiate an instance of the base fluid.schema.component grade successfully.");

        jqUnit.assertEquals("There should have been a single validation pass on component startup.", 1, component.validationPasses);

        jqUnit.assertLeftHand("The initial model should be valid.", { isValid: true }, component.model.validationResults);
    });

    fluid.defaults("fluid.tests.schemaValidatedModelComponent.basicValidation",{
        gradeNames: ["fluid.tests.schema.modelComponent"],
        modelSchema: {
            properties: {
                validModelVariableIsValid: {
                    enum: [true],
                    enumLabels: ["Must be true."]
                }
            }
        },
        model: {
            validModelVariableIsValid: true
        }
    });

    jqUnit.test("Test model validation (valid -> invalid).", function () {
        var component = fluid.tests.schemaValidatedModelComponent.basicValidation();
        jqUnit.assert("We should have been able to instantiate an instance of our grade successfully.");

        jqUnit.assertEquals("There should have been a single validation pass on component startup.", 1, component.validationPasses);

        component.applier.modelChanged.addListener({ path: "validationResults"}, function (validationResults) {
            jqUnit.start();
            jqUnit.assertLeftHand("The updated model should be invalid.", { isValid: false }, validationResults);
            jqUnit.assertEquals("There should have been a second validation pass on a model change.", 2, component.validationPasses);
        });

        jqUnit.stop();
        component.applier.change("validModelVariableIsValid", false);
    });

    jqUnit.test("Test model validation (invalid -> valid).", function () {
        var component = fluid.tests.schemaValidatedModelComponent.basicValidation({ model: { validModelVariableIsValid: false }});

        jqUnit.assert("We should have been able to instantiate an instance of our grade successfully.");

        component.applier.modelChanged.addListener({ path: "validationResults"}, function (newValidationResults, oldValidationResults) {
            jqUnit.start();
            jqUnit.assertLeftHand("The old model should be invalid.", { isValid: false }, oldValidationResults);
            jqUnit.assertLeftHand("The new model should be valid.",   { isValid: true  }, newValidationResults);
            jqUnit.assertEquals("There should have been a second validation pass on a model change.", 2, component.validationPasses);
        });

        jqUnit.stop();
        component.applier.change("validModelVariableIsValid", true);
    });
})(fluid, Ajv, jqUnit);
