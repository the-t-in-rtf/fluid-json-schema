/* globals require */
var fluid  = fluid  || {};
(function (fluid) {
    "use strict";

    if (!fluid.identity) {
        fluid = require("infusion");
        require("./validator");
    }

    var gpii  = fluid.registerNamespace("gpii");

    fluid.registerNamespace("gpii.schema.component");

    gpii.schema.component.validateShadowRecord = function (shadowRecord) {
        return gpii.schema.component.validateComponent(shadowRecord.that);
    };

    /**
     *
     * Validate a component's options based on its schema.  For "potentia ii" (future) versions of Infusion, a "shadow"
     * record is validated as part of the component's workflow.  For "legacy" (pre potentia II) versions, the record
     * itself is validated on component creation.  The distinction is handled by a context-aware core grade that mixes
     * in a grade with the correct strategy to use.
     *
     * @param {Object} componentToValidate - The component to validate.
     */
    gpii.schema.component.validateComponent = function (componentToValidate) {
        if (fluid.componentHasGrade(componentToValidate, "gpii.schema.component")) {
            var validationResults = gpii.schema.validator.validate(componentToValidate, componentToValidate.options.schema);
            if (validationResults.isError) {
                fluid.fail(validationResults.message);
            }
            else if (!validationResults.isValid) {
                var localisedValidationErrors = gpii.schema.validator.localiseErrors(validationResults.errors);
                var errorReport = "";
                fluid.each(localisedValidationErrors, function (localisedError) {
                    var failurePath = localisedError.dataPath.length ? localisedError.dataPath.join(" -> ") : "(root)";
                    errorReport += "\n\t" + failurePath + ":\t" + localisedError.message;
                });
                fluid.fail("Component does not match its own schema, aborting component creation:" + errorReport);
            }
        }
    };

    gpii.schema.component.hasRegisterPotentia = function () {
        return fluid.registerPotentia ? true : false;
    };

    fluid.contextAware.makeChecks({
        "fluid.hasRegisterPotentia": "gpii.schema.component.hasRegisterPotentia"
    });

    // Validate the component as part of its startup "workflow".
    fluid.defaults("gpii.schema.component.potentiaII", {
        gradeNames: ["fluid.component"],
        workflows: {
            local: {
                validateOptions: {
                    priority: "after:concludeComponentObservation",
                    funcName: "gpii.schema.component.validateShadowRecord",
                    args:     ["{that}"]
                }
            }
        }
    });

    // For components that don't have a workflow, validate on the `onCreate` event.
    fluid.defaults("gpii.schema.component.legacy", {
        gradeNames: ["fluid.component"],
        listeners: {
            "onCreate.validate": {
                funcName: "gpii.schema.component.validateComponent",
                args:     ["{that}"]
            }
        }
    });

    fluid.defaults("gpii.schema.component", {
        gradeNames: ["fluid.component", "fluid.contextAware"],
        schema: {
            "$schema": "gss-v7-full#",
            "definitions": {
                "singleListenerDefinition": {
                    "anyOf": [
                        { "type": "string" },
                        {
                            "type": "object",

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
                                },
                                {
                                    "properties": {
                                        "method": { "type": "string", "required": true},
                                        "this": { "type": "string", "required": true }
                                    }
                                }
                            ],
                            "properties": {
                                "args": { "type": "array"},
                                "namespace": { "type": "string"},
                                "priority": {
                                    "oneOf": [ {"type": "string"}, { "type": "number", "multipleOf": 1 }]
                                }
                            }
                        },
                        { type: "object"} // Required to handle functions.  TODO: Discuss this down the road, supporting functions also means supporting nearly any other kind of object.
                    ]
                }
            },
            "properties": {
                "options": {
                    "properties": {
                        "argumentMap": {
                            "type": "object",
                            "additionalProperties": {
                                "type": "number"
                            }
                        },
                        "components": {
                            "type": "object"
                            // We cannot impose any further constraints on `options.components`.  Sub-components are
                            // expected to provide validation rules for their own options.
                        },
                        "container": { "type": "string" },
                        "distributeOptions": {
                            "type": "object",
                            "additionalProperties": {
                                "type": "object",
                                "oneOf": [
                                    {
                                        "properties": {
                                            "source": { "type": "string", "required": true},
                                            "removeSource": { "type": "boolean"},
                                            "exclusions": { "type": "array", "items": { "type": "string" } }
                                        }
                                    },
                                    {
                                        "properties": {
                                            "record": { "required": true }
                                        }
                                    }
                                ],
                                "properties": {
                                    "target": { "required": true },
                                    "priority": { "type": "string" },
                                    "namespace": { "type": "string" }
                                }
                            }
                        },
                        "events": {
                            "additionalProperties": {
                                "anyOf": [
                                    {
                                        "enum":       [ "preventable", null ],
                                        "enumLabels": [ "preventable", "null"]
                                    },
                                    {
                                        "type": "object",
                                        "oneOf": [
                                            {
                                                "properties": {
                                                    "events": {
                                                        "type": "object",
                                                        "required": true,
                                                        "additionalProperties": {
                                                            "type": "string"
                                                        }
                                                    }
                                                }
                                            },
                                            {
                                                "properties": {
                                                    "event": {
                                                        "required": true,
                                                        "type": "string"
                                                    }
                                                }
                                            }
                                        ],
                                        "properties": {
                                            "args": {
                                                "type": "array"
                                            }
                                        }
                                    }
                                ]
                            }
                        },
                        "gradeNames": {
                            "type": "array",
                            "items": { type: "string" }
                        },
                        "invokers": {
                            "additionalProperties": {
                                "anyOf": [
                                    // Shorthand to use a named global function
                                    {type: "string" },
                                    {type: "object" }, // Support for an inline function as invoker.  TODO: Discuss somehow hardening this further.
                                    // Full declaration.
                                    {
                                        "type": "object",
                                        "properties": {
                                            "args": { "type": "array" }
                                        },
                                        "oneOf": [
                                            {
                                                "properties": {
                                                    "func": {"required": true}
                                                }
                                            },
                                            {
                                                "properties": {
                                                    "funcName": {"type": "string", "required": true}
                                                }
                                            },
                                            {
                                                "properties": {
                                                    "method": {"type": "string", "required": true},
                                                    "this": {"type": "string", "required": true}
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        },
                        "listeners": {
                            "additionalProperties": {
                                "oneOf": [
                                    "{gpii.schema.component}.options.schema.definitions.singleListenerDefinition",
                                    {
                                        "type": "array",
                                        "items": "{gpii.schema.component}.options.schema.definitions.singleListenerDefinition"
                                    }
                                ]
                            }
                        },
                        "members": { "type": "object"},
                        "mergePolicy": {
                            "type": "object",
                            "patternProperties": {
                                "^[a-z]+$": {
                                }
                            }
                        },
                        "schema": { "$ref": "gss-v7-full#"},
                        "selectors": {
                            "type": "object",
                            "additionalProperties": { "type": "string" }
                        },
                        /*

                        workflows: {
                            local: {
                                concludeComponentObservation: {
                                    funcName: "fluid.concludeComponentObservation",
                                    priority: "first"
                                },
                                concludeComponentInit: {
                                    funcName: "fluid.concludeComponentInit",
                                    priority: "last"
                                }
                            }
                        }
                         */
                        // TODO: Talk with Antranig about how to model workflows correctly.
                        "workflows": {
                            "type": "object"
                        }
                    }
                }
            }
        },
        contextAwareness: {
            validationStrategy: {
                checks: {
                    hasRegisterPotentia: {
                        contextValue: "{fluid.hasRegisterPotentia}",
                        gradeNames: "gpii.schema.component.potentiaII"
                    },
                    legacy: {
                        contextValue: "{fluid.hasRegisterPotentia}",
                        equals: false,
                        gradeNames: "gpii.schema.component.legacy"
                    }
                }
            }
        }
    });
})(fluid);
