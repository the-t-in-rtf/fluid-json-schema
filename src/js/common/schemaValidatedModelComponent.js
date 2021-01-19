/* globals require */
/* eslint-disable-next-line no-redeclare */
var fluid  = fluid  || require("infusion");
(function (fluid) {
    "use strict";

    if (fluid.require) {
        require("./schemaValidatedComponent");
    }

    fluid.registerNamespace("fluid.schema.modelComponent");

    /**
     *
     * Validate the model against the associated schema (options.modelSchema).
     *
     * @param {fluid.schema.validator} globalValidator - The global validation component.
     * @param {fluid.schema.modelComponent} modelValidationComponent - The component itself.
     *
     */
    fluid.schema.modelComponent.validateModel = function (globalValidator, modelValidationComponent) {
        var validationResults = globalValidator.validate(modelValidationComponent.options.modelSchema, modelValidationComponent.model);
        // Flag this change as a result of validation so that we can avoid multiple validation passes per model change.
        modelValidationComponent.applier.change("validationResults", validationResults, "ADD", "validation");
    };

    fluid.defaults("fluid.schema.modelComponent", {
        gradeNames: ["fluid.schema.component", "fluid.modelComponent"],
        schema: {
            properties: {
                "model": { "type": "object"},
                options: {
                    properties: {
                        modelSchema: { $ref: "fss-v7-full#"},
                        // This format is what the options look like once they've been merged, and not necessarily what they look like when entered.
                        "modelListeners": {
                            "additionalProperties": {
                                "type": "array",
                                items: {
                                    "oneOf": [
                                        {
                                            "properties": {
                                                "func": { "required": true }
                                            }
                                        },
                                        {
                                            "properties": {
                                                "funcName": { "type": "string", "required": true }
                                            }
                                        }
                                    ],
                                    "properties": {
                                        "args": { "type": "array"},
                                        "excludeSource": { "oneOf": [{ "type": "string"}, { "type": "array", "items": { "type": "string"}}] },
                                        "namespace": { "type": "string"},
                                        "priority": { "type": "string"}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        modelSchema: {
            "$schema": "fss-v7-full#",
            properties: {
                validationResults: { required: true }
            }
        },
        model: {
            validationResults: {}
        },
        modelListeners: {
            "*": {
                namespace: "validateModel",
                excludeSource: ["init", "validation"],
                funcName: "fluid.schema.modelComponent.validateModel",
                args: ["{fluid.schema.validator}", "{that}"] // globalValidator, validatedModelComponent
            }
        },
        listeners: {
            "onCreate.validateModel": {
                funcName: "fluid.schema.modelComponent.validateModel",
                args: ["{fluid.schema.validator}", "{that}"] // globalValidator, validatedModelComponent
            }
        }
    });
})(fluid);
