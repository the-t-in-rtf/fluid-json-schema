/* globals require */
/* eslint-disable-next-line no-redeclare */
var fluid  = fluid  || require("infusion");
(function (fluid) {
    "use strict";

    if (fluid.require) {
        require("./validator");
    }

    fluid.registerNamespace("fluid.schema.component");

    /**
     *
     * @param {Object} shadowRecord - A "shadow record", which is a version of the component available during the potentia-ii workflow.
     *
     */
    fluid.schema.component.validateShadowRecord = function (shadowRecord) {
        fluid.schema.component.validateComponent(shadowRecord.that);
    };

    /**
     *
     * Validate a component's options based on its schema.  For "potentia ii" (future) versions of Infusion, a "shadow"
     * record is validated as part of the component's workflow.  For "legacy" (pre potentia II) versions, the record
     * itself is validated on component creation.  The distinction is handled by a context-aware core grade that mixes
     * in a grade with the correct strategy to use.
     *
     * We have our own validation code here because the global validator is not available in the context of a
     * potentia-ii workflow.
     *
     * @param {fluid.schema.component} componentToValidate - The component to validate.
     *
     */
    fluid.schema.component.validateComponent = function (componentToValidate) {
        if (fluid.componentHasGrade(componentToValidate, "fluid.schema.component")) {
            var validator;
            var isValid = false;
            try {
                validator = fluid.schema.validator.compileSchema(componentToValidate.options.schema);
                isValid = validator(componentToValidate);
            }
            catch (compileErrors) {
                fluid.fail({ isError: true, message: "Invalid FSS Schema.", errors: compileErrors });
            }

            if (!isValid) {
                var standardisedErrors = fluid.schema.validator.standardiseAjvErrors(componentToValidate.options.schema, validator.errors);
                var localisedValidationErrors = fluid.schema.validator.localiseErrors(standardisedErrors.errors);
                var errorReport = "";
                fluid.each(localisedValidationErrors, function (localisedError) {
                    var failurePath = localisedError.dataPath.length ? localisedError.dataPath.join(" -> ") : "(root)";
                    errorReport += "\n\t" + failurePath + ":\t" + localisedError.message;
                });
                fluid.fail("Component does not match its own schema, aborting component creation:" + errorReport);
            }
        }
    };

    fluid.schema.component.hasRegisterPotentia = function () {
        return fluid.registerPotentia ? true : false;
    };

    fluid.contextAware.makeChecks({
        "fluid.hasRegisterPotentia": "fluid.schema.component.hasRegisterPotentia"
    });

    // Validate the component as part of its startup "workflow".
    fluid.defaults("fluid.schema.component.potentiaII", {
        gradeNames: ["fluid.component"],
        workflows: {
            local: {
                validateOptions: {
                    priority: "after:concludeComponentObservation",
                    funcName: "fluid.schema.component.validateShadowRecord"
                }
            }
        }
    });

    // For components that don't have a workflow, validate on the `onCreate` event.
    fluid.defaults("fluid.schema.component.legacy", {
        gradeNames: ["fluid.component"],
        listeners: {
            "onCreate.validate": {
                funcName: "fluid.schema.component.validateComponent",
                args:     ["{that}"]
            }
        }
    });

    fluid.defaults("fluid.schema.component", {
        gradeNames: ["fluid.component", "fluid.contextAware"],
        schema: {
            "$schema": "fss-v7-full#"
        },
        contextAwareness: {
            validationStrategy: {
                checks: {
                    hasRegisterPotentia: {
                        contextValue: "{fluid.hasRegisterPotentia}",
                        gradeNames: "fluid.schema.component.potentiaII"
                    },
                    legacy: {
                        contextValue: "{fluid.hasRegisterPotentia}",
                        equals: false,
                        gradeNames: "fluid.schema.component.legacy"
                    }
                }
            }
        }
    });

    fluid.defaults("fluid.schema.infusionOptionsValidatingComponent", {
        gradeNames: ["fluid.schema.component"],
        schema: {
            "$schema": "fss-v7-full#",
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
                                    },
                                    // Required to allow IoC references, discuss hardening further.
                                    {
                                        type: "string"
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
                                    "{fluid.schema.component}.options.schema.definitions.singleListenerDefinition",
                                    {
                                        "type": "array",
                                        "items": "{fluid.schema.component}.options.schema.definitions.singleListenerDefinition"
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
                        "modelListeners": {
                            "additionalProperties": {
                                "oneOf": [
                                    "{fluid.schema.component}.options.schema.definitions.singleListenerDefinition",
                                    {
                                        "type": "array",
                                        "items": "{fluid.schema.component}.options.schema.definitions.singleListenerDefinition"
                                    }
                                ]
                            }
                        },
                        "schema": { "$ref": "fss-v7-full#"},
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
        }
    });
})(fluid);
