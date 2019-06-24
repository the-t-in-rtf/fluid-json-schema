/* globals require */
var fluid  = fluid  || require("infusion");
(function (fluid) {
    "use strict";

    if (fluid.require) {
        require("./schemaValidatedComponent");
    }

    var gpii  = fluid.registerNamespace("gpii");

    fluid.registerNamespace("gpii.schema.modelComponent");

    /**
     *
     * Validate the model against the associated schema (options.modelSchema).
     *
     * @param {Object} globalValidator - The global validation component.
     * @param {Object} modelValidationComponent - The component itself.
     *
     */
    gpii.schema.modelComponent.validateModel = function (globalValidator, modelValidationComponent) {
        var validationResults = globalValidator.validate(modelValidationComponent.options.modelSchema, modelValidationComponent.model);
        // Flag this change as a result of validation so that we can avoid multiple validation passes per model change.
        modelValidationComponent.applier.change("validationResults", validationResults, "ADD", "validation");
    };

    fluid.defaults("gpii.schema.modelComponent", {
        gradeNames: ["gpii.schema.component", "fluid.modelComponent"],
        schema: {
            properties: {
                "model": { "type": "object"},
                options: {
                    properties: {
                        modelSchema: { $ref: "gss-v7-full#"},
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
            "$schema": "gss-v7-full#",
            properties: {
                validationResults: { required: true }
            }
        },
        model: {
            validationResults: {}
        },
        modelListeners: {
            "*": {
                excludeSource: "validation",
                funcName: "gpii.schema.modelComponent.validateModel",
                args: ["{gpii.schema.validator}", "{that}"] // globalValidator, validatedModelComponent
            }
        }
    });
})(fluid);
