/* globals require */
(function (fluid) {
    "use strict";

    if (typeof require !== "undefined") {
        fluid = require("infusion");
        require("./validator");
    }

    var gpii  = fluid.registerNamespace("gpii");

    fluid.registerNamespace("gpii.schema.component");

    /**
     *
     * @param {Object} shadowRecord - A "shadow record" of the component created during its early construction.
     *
     */
    gpii.schema.component.validateComponent = function (shadowRecord) {
        if (fluid.componentHasGrade(shadowRecord.that, "gpii.schema.component")) {
            var validationResults = gpii.schema.validator.validate(shadowRecord.that, shadowRecord.that.options.schema);
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

    fluid.defaults("gpii.schema.component", {
        gradeNames: ["fluid.component"],
        schema: {
            "$schema": "gss-v7-full#",
            "definitions": {
                "singleListenerDefinition": {
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
                            "type": "object",
                            "additionalProperties": {
                                "type": "object",
                                "properties": {
                                    "type": { "type": "string", "required": true },
                                    "createOnEvent": { "type": "string" },
                                    "container": { "type": "string" },
                                    "options": { "type": "object"}
                                }
                            }
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
                                    "args": { "type": "array"}
                                }
                            }
                        },
                        "listeners": {
                            "additionalProperties": {
                                "oneOf": [
                                    { "type": "string" },
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
        workflows: {
            local: {
                validateOptions: {
                    priority: "after:concludeComponentObservation",
                    funcName: "gpii.schema.component.validateComponent",
                    args: ["{that}"]
                }
            }
        }
    });
})(fluid);
