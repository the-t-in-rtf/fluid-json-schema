/* globals require */
/* eslint-env browser */
var fluid = fluid || {};

(function (fluid) {
    "use strict";
    if (!fluid.identity) {
        fluid = require("infusion");
    }
    var gpii  = fluid.registerNamespace("gpii");

    fluid.registerNamespace("gpii.tests.validator");

    // Sample AJV errors, can be regenerated for newer versions of AJV using ./lib/generate-sample-ajv-errors.js
    gpii.tests.validator.ajvErrors = {
        "contains": {
            "input": [
                {
                    "keyword": "contains",
                    "dataPath": "",
                    "schemaPath": "#/contains",
                    "params": {},
                    "message": "should contain a valid item"
                }
            ],
            "schema": {
                "type": "array",
                "contains": {
                    "type": "string"
                }
            },
            "message": "We should be able to evolve a `contains` error.",
            "expected": {
                "isValid": false,
                "errors": [{
                    "dataPath": [],
                    "schemaPath": [
                        "contains"
                    ],
                    "rule": {
                        "type": "array",
                        "contains": {
                            "type": "string"
                        }
                    },
                    "message": "gpii.schema.messages.validationErrors.contains"
                }]
            }
        },
        "dependencies": {
            "input": [
                {
                    "keyword": "dependencies",
                    "dataPath": "",
                    "schemaPath": "#/dependencies",
                    "params": {
                        "property": "foo",
                        "missingProperty": "bar",
                        "depsCount": 1,
                        "deps": "bar"
                    },
                    "message": "gpii.schema.messages.validationErrors.dependencies"
                }
            ],
            "schema": {
                "properties": {
                    "foo": {},
                    "bar": {}
                },
                "dependencies": {
                    "foo": [
                        "bar"
                    ],
                    "bar": [
                        "foo"
                    ]
                }
            },
            "message": "We should be able to evolve a `dependencies` error.",
            "expected": {
                "isValid": false,
                "errors": [
                    {
                        "dataPath": [],
                        "schemaPath": [
                            "dependencies"
                        ],
                        "rule": {
                            "properties": {
                                "foo": {

                                },
                                "bar": {

                                }
                            },
                            "dependencies": {
                                "foo": [
                                    "bar"
                                ],
                                "bar": [
                                    "foo"
                                ]
                            }
                        },
                        "message": "gpii.schema.messages.validationErrors.dependencies"
                    }
                ]
            }
        },
        "else": {
            "input": [
                {
                    "keyword": "type",
                    "dataPath": "",
                    "schemaPath": "#/else/type",
                    "params": {
                        "type": "boolean"
                    },
                    "message": "should be boolean"
                },
                {
                    "keyword": "if",
                    "dataPath": "",
                    "schemaPath": "#/if",
                    "params": {
                        "failingKeyword": "else"
                    },
                    "message": "should match \"else\" schema"
                }
            ],
            "schema": {
                "if": {
                    "type": "string"
                },
                "then": {
                    "maxLength": 1
                },
                "else": {
                    "type": "boolean"
                }
            },
            "message": "We should be able to evolve an `else` error.",
            "expected": {
                "isValid": false,
                "errors": [
                    {
                        "dataPath": [],
                        "schemaPath": [
                            "else",
                            "type"
                        ],
                        "rule": {
                            "type": "boolean"
                        },
                        "message": "gpii.schema.messages.validationErrors.type"
                    },
                    {
                        "dataPath": [],
                        "schemaPath": [
                            "else"
                        ],
                        "rule": {
                            "if": {
                                "type": "string"
                            },
                            "then": {
                                "maxLength": 1
                            },
                            "else": {
                                "type": "boolean"
                            }
                        },
                        "message": "gpii.schema.messages.validationErrors.else"
                    }
                ]
            }
        },
        "enum": {
            "input": [
                {
                    "keyword": "enum",
                    "dataPath": "",
                    "schemaPath": "#/enum",
                    "params": {
                        "allowedValues": [
                            "yes"
                        ]
                    },
                    "message": "should be equal to one of the allowed values"
                }
            ],
            "schema": {
                "enum": [
                    "yes"
                ]
            },
            "message": "We should be able to evolve an `enum` error.",
            "expected": {
                "isValid": false,
                "errors": [
                    {
                        "dataPath": [],
                        "schemaPath": [
                            "enum"
                        ],
                        "rule": {
                            "enum": [
                                "yes"
                            ]
                        },
                        "message": "gpii.schema.messages.validationErrors.enum"
                    }
                ]
            }
        },
        "exclusiveMaximum": {
            "input": [
                {
                    "keyword": "exclusiveMaximum",
                    "dataPath": "",
                    "schemaPath": "#/exclusiveMaximum",
                    "params": {
                        "comparison": "<",
                        "limit": 10,
                        "exclusive": true
                    },
                    "message": "should be < 10"
                }
            ],
            "schema": {
                "exclusiveMaximum": 10
            },
            "message": "We should be able to evolve an `exclusiveMaximum` error.",
            "expected": {
                "isValid": false,
                "errors": [
                    {
                        "dataPath": [],
                        "schemaPath": [
                            "exclusiveMaximum"
                        ],
                        "rule": {
                            "exclusiveMaximum": 10
                        },
                        "message": "gpii.schema.messages.validationErrors.exclusiveMaximum"
                    }
                ]
            }
        },
        "exclusiveMinimum": {
            "input": [
                {
                    "keyword": "exclusiveMinimum",
                    "dataPath": "",
                    "schemaPath": "#/exclusiveMinimum",
                    "params": {
                        "comparison": ">",
                        "limit": 2,
                        "exclusive": true
                    },
                    "message": "should be > 2"
                }
            ],
            "schema": {
                "exclusiveMinimum": 2
            },
            "message": "We should be able to evolve a `exclusiveMinimum` error.",
            "expected": {
                "isValid": false,
                "errors": [
                    {
                        "dataPath": [],
                        "schemaPath": [
                            "exclusiveMinimum"
                        ],
                        "rule": {
                            "exclusiveMinimum": 2
                        },
                        "message": "gpii.schema.messages.validationErrors.exclusiveMinimum"
                    }
                ]
            }
        },
        "format": {
            "input": [
                {
                    "keyword": "format",
                    "dataPath": "",
                    "schemaPath": "#/format",
                    "params": {
                        "format": "email"
                    },
                    "message": "should match format \"email\""
                }
            ],
            "schema": {
                "type": "string",
                "format": "email"
            },
            "message": "We should be able to evolve a `format` error.",
            "expected": {
                "isValid": false,
                "errors": [
                    {
                        "dataPath": [],
                        "schemaPath": [
                            "format"
                        ],
                        "rule": {
                            "type": "string",
                            "format": "email"
                        },
                        "message": "gpii.schema.messages.validationErrors.format"
                    }
                ]
            }
        },
        "maxItems": {
            "input": [
                {
                    "keyword": "maxItems",
                    "dataPath": "",
                    "schemaPath": "#/maxItems",
                    "params": {
                        "limit": 1
                    },
                    "message": "should NOT have more than 1 items"
                }
            ],
            "schema": {
                "type": "array",
                "maxItems": 1
            },
            "message": "We should be able to evolve a `maxItems` error.",
            "expected": {
                "isValid": false,
                "errors": [
                    {
                        "dataPath": [],
                        "schemaPath": [
                            "maxItems"
                        ],
                        "rule": {
                            "type": "array",
                            "maxItems": 1
                        },
                        "message": "gpii.schema.messages.validationErrors.maxItems"
                    }
                ]
            }
        },
        "maxLength": {
            "input": [
                {
                    "keyword": "maxLength",
                    "dataPath": "",
                    "schemaPath": "#/maxLength",
                    "params": {
                        "limit": 2
                    },
                    "message": "should NOT be longer than 2 characters"
                }
            ],
            "schema": {
                "type": "string",
                "maxLength": 2
            },
            "message": "We should be able to evolve a `maxLength` error.",
            "expected": {
                "isValid": false,
                "errors": [
                    {
                        "dataPath": [],
                        "schemaPath": [
                            "maxLength"
                        ],
                        "rule": {
                            "type": "string",
                            "maxLength": 2
                        },
                        "message": "gpii.schema.messages.validationErrors.maxLength"
                    }
                ]
            }
        },
        "maxProperties": {
            "input": [
                {
                    "keyword": "maxProperties",
                    "dataPath": "",
                    "schemaPath": "#/maxProperties",
                    "params": {
                        "limit": 1
                    },
                    "message": "should NOT have more than 1 properties"
                }
            ],
            "schema": {
                "maxProperties": 1
            },
            "message": "We should be able to evolve a `maxProperties` error.",
            "expected": {
                "isValid": false,
                "errors": [
                    {
                        "dataPath": [],
                        "schemaPath": [
                            "maxProperties"
                        ],
                        "rule": {
                            "maxProperties": 1
                        },
                        "message": "gpii.schema.messages.validationErrors.maxProperties"
                    }
                ]
            }
        },
        "maximum": {
            "input": [
                {
                    "keyword": "maximum",
                    "dataPath": "",
                    "schemaPath": "#/maximum",
                    "params": {
                        "comparison": "<=",
                        "limit": 3,
                        "exclusive": false
                    },
                    "message": "should be <= 3"
                }
            ],
            "schema": {
                "type": "number",
                "maximum": 3
            },
            "message": "We should be able to evolve a `maximum` error.",
            "expected": {
                "isValid": false,
                "errors": [
                    {
                        "dataPath": [],
                        "schemaPath": [
                            "maximum"
                        ],
                        "rule": {
                            "type": "number",
                            "maximum": 3
                        },
                        "message": "gpii.schema.messages.validationErrors.maximum"
                    }
                ]
            }
        },
        "minItems": {
            "input": [
                {
                    "keyword": "minItems",
                    "dataPath": "",
                    "schemaPath": "#/minItems",
                    "params": {
                        "limit": 1
                    },
                    "message": "should NOT have less than 1 items"
                }
            ],
            "schema": {
                "type": "array",
                "minItems": 1
            },
            "message": "We should be able to evolve a `minItems` error.",
            "expected": {
                "isValid": false,
                "errors": [
                    {
                        "dataPath": [],
                        "schemaPath": [
                            "minItems"
                        ],
                        "rule": {
                            "type": "array",
                            "minItems": 1
                        },
                        "message": "gpii.schema.messages.validationErrors.minItems"
                    }
                ]
            }
        },
        "minLength": {
            "input": [
                {
                    "keyword": "minLength",
                    "dataPath": "",
                    "schemaPath": "#/minLength",
                    "params": {
                        "limit": 2
                    },
                    "message": "should NOT be shorter than 2 characters"
                }
            ],
            "schema": {
                "minLength": 2
            },
            "message": "We should be able to evolve a `minLength` error.",
            "expected": {
                "isValid": false,
                "errors": [
                    {
                        "dataPath": [],
                        "schemaPath": [
                            "minLength"
                        ],
                        "rule": {
                            "minLength": 2
                        },
                        "message": "gpii.schema.messages.validationErrors.minLength"
                    }
                ]
            }
        },
        "minProperties": {
            "input": [
                {
                    "keyword": "minProperties",
                    "dataPath": "",
                    "schemaPath": "#/minProperties",
                    "params": {
                        "limit": 1
                    },
                    "message": "should NOT have less than 1 properties"
                }
            ],
            "schema": {
                "minProperties": 1
            },
            "message": "We should be able to evolve a `minProperties` error.",
            "expected": {
                "isValid": false,
                "errors": [
                    {
                        "dataPath": [],
                        "schemaPath": [
                            "minProperties"
                        ],
                        "rule": {
                            "minProperties": 1
                        },
                        "message": "gpii.schema.messages.validationErrors.minProperties"
                    }
                ]
            }
        },
        "minimum": {
            "input": [
                {
                    "keyword": "minimum",
                    "dataPath": "",
                    "schemaPath": "#/minimum",
                    "params": {
                        "comparison": ">=",
                        "limit": 5,
                        "exclusive": false
                    },
                    "message": "should be >= 5"
                }
            ],
            "schema": {
                "minimum": 5
            },
            "message": "We should be able to evolve a `minimum` error.",
            "expected": {
                "isValid": false,
                "errors": [
                    {
                        "dataPath": [],
                        "schemaPath": [
                            "minimum"
                        ],
                        "rule": {
                            "minimum": 5
                        },
                        "message": "gpii.schema.messages.validationErrors.minimum"
                    }
                ]
            }
        },
        "multipleOf": {
            "input": [
                {
                    "keyword": "multipleOf",
                    "dataPath": "",
                    "schemaPath": "#/multipleOf",
                    "params": {
                        "multipleOf": 2
                    },
                    "message": "should be multiple of 2"
                }
            ],
            "schema": {
                "multipleOf": 2
            },
            "message": "We should be able to evolve a `multipleOf` error.",
            "expected": {
                "isValid": false,
                "errors": [
                    {
                        "dataPath": [],
                        "schemaPath": [
                            "multipleOf"
                        ],
                        "rule": {
                            "multipleOf": 2
                        },
                        "message": "gpii.schema.messages.validationErrors.multipleOf"
                    }
                ]
            }
        },
        "not": {
            "input": [
                {
                    "keyword": "not",
                    "dataPath": "",
                    "schemaPath": "#/not",
                    "params": {},
                    "message": "should NOT be valid"
                }
            ],
            "schema": {
                "not": {
                    "type": "number"
                }
            },
            "message": "We should be able to evolve a `not` error.",
            "expected": {
                "isValid": false,
                "errors": [
                    {
                        "dataPath": [],
                        "schemaPath": [
                            "not"
                        ],
                        "rule": {
                            "not": {
                                "type": "number"
                            }
                        },
                        "message": "gpii.schema.messages.validationErrors.not"
                    }
                ]
            }
        },
        "oneOf": {
            "input": [
                {
                    "keyword": "type",
                    "dataPath": "",
                    "schemaPath": "#/oneOf/0/type",
                    "params": {
                        "type": "string"
                    },
                    "message": "should be string"
                },
                {
                    "keyword": "oneOf",
                    "dataPath": "",
                    "schemaPath": "#/oneOf",
                    "params": {
                        "passingSchemas": null
                    },
                    "message": "should match exactly one schema in oneOf"
                }
            ],
            "schema": {
                "oneOf": [
                    {
                        "type": "string"
                    }
                ]
            },
            "message": "We should be able to evolve a `oneOf` error.",
            "expected": {
                "isValid": false,
                "errors": [
                    {
                        "dataPath": [],
                        "schemaPath": [
                            "oneOf",
                            "0",
                            "type"
                        ],
                        "rule": {
                            "type": "string"
                        },
                        "message": "gpii.schema.messages.validationErrors.type"
                    },
                    {
                        "dataPath": [],
                        "schemaPath": [
                            "oneOf"
                        ],
                        "rule": {
                            "oneOf": [
                                {
                                    "type": "string"
                                }
                            ]
                        },
                        "message": "gpii.schema.messages.validationErrors.oneOf"
                    }
                ]
            }
        },
        "pattern": {
            "input": [
                {
                    "keyword": "pattern",
                    "dataPath": "",
                    "schemaPath": "#/pattern",
                    "params": {
                        "pattern": "a+"
                    },
                    "message": "should match pattern \"a+\""
                }
            ],
            "schema": {
                "type": "string",
                "pattern": "a+"
            },
            "message": "We should be able to evolve a `pattern` error.",
            "expected": {
                "isValid": false,
                "errors": [
                    {
                        "dataPath": [],
                        "schemaPath": [
                            "pattern"
                        ],
                        "rule": {
                            "type": "string",
                            "pattern": "a+"
                        },
                        "message": "gpii.schema.messages.validationErrors.pattern"
                    }
                ]
            }
        },
        "propertyNames": {
            "input": [
                {
                    "keyword": "pattern",
                    "dataPath": "",
                    "schemaPath": "#/propertyNames/pattern",
                    "params": {
                        "pattern": "z.+"
                    },
                    "message": "should match pattern \"z.+\"",
                    "propertyName": "foo"
                },
                {
                    "keyword": "propertyNames",
                    "dataPath": "",
                    "schemaPath": "#/propertyNames",
                    "params": {
                        "propertyName": "foo"
                    },
                    "message": "property name 'foo' is invalid"
                }
            ],
            "schema": {
                "type": "object",
                "propertyNames": {
                    "pattern": "z.+"
                }
            },
            "message": "We should be able to evolve a `propertyNames` error.",
            "expected": {
                "isValid": false,
                "errors": [
                    {
                        "dataPath": [],
                        "schemaPath": [
                            "propertyNames",
                            "pattern"
                        ],
                        "rule": {
                            "pattern": "z.+"
                        },
                        "message": "gpii.schema.messages.validationErrors.pattern"
                    },
                    {
                        "dataPath": [],
                        "schemaPath": [
                            "propertyNames"
                        ],
                        "rule": {
                            "type": "object",
                            "propertyNames": {
                                "pattern": "z.+"
                            }
                        },
                        "message": "gpii.schema.messages.validationErrors.propertyNames"
                    }
                ]
            }
        },
        "required": {
            "input": [
                {
                    "keyword": "required",
                    "dataPath": "",
                    "schemaPath": "#/required",
                    "params": {
                        "missingProperty": "foo"
                    },
                    "message": "should have required property 'foo'"
                }
            ],
            "schema": {
                "properties": {
                    "foo": { required: true }
                }
            },
            "message": "We should be able to evolve a `required` error.",
            "expected": {
                "isValid": false,
                "errors": [
                    {
                        "dataPath": [
                            "foo"
                        ],
                        "schemaPath": [
                            "properties",
                            "foo",

                            "required"
                        ],
                        "rule": {
                            "required": true
                        },
                        "message": "gpii.schema.messages.validationErrors.required"
                    }
                ]
            }
        },
        "then": {
            "input": [
                {
                    "keyword": "maxLength",
                    "dataPath": "",
                    "schemaPath": "#/then/maxLength",
                    "params": {
                        "limit": 1
                    },
                    "message": "should NOT be longer than 1 characters"
                },
                {
                    "keyword": "if",
                    "dataPath": "",
                    "schemaPath": "#/if",
                    "params": {
                        "failingKeyword": "then"
                    },
                    "message": "should match \"then\" schema"
                }
            ],
            "schema": {
                "if": {
                    "type": "string"
                },
                "then": {
                    "maxLength": 1
                },
                "else": {
                    "type": "boolean"
                }
            },
            "message": "We should be able to evolve a `then` error.",
            "expected": {
                "isValid": false,
                "errors": [
                    {
                        "dataPath": [],
                        "schemaPath": [
                            "then",
                            "maxLength"
                        ],
                        "rule": {
                            "maxLength": 1
                        },
                        "message": "gpii.schema.messages.validationErrors.maxLength"
                    },
                    {
                        "dataPath": [],
                        "schemaPath": [
                            "then"
                        ],
                        "rule": {
                            "if": {
                                "type": "string"
                            },
                            "then": {
                                "maxLength": 1
                            },
                            "else": {
                                "type": "boolean"
                            }
                        },
                        "message": "gpii.schema.messages.validationErrors.then"
                    }
                ]
            }
        },
        "type": {
            "input": [
                {
                    "keyword": "type",
                    "dataPath": "",
                    "schemaPath": "#/type",
                    "params": {
                        "type": "string"
                    },
                    "message": "should be string"
                }
            ],
            "schema": {
                "type": "string"
            },
            "message": "We should be able to evolve a `type` error.",
            "expected": {
                "isValid": false,
                "errors": [
                    {
                        "dataPath": [],
                        "schemaPath": [
                            "type"
                        ],
                        "rule": {
                            "type": "string"
                        },
                        "message": "gpii.schema.messages.validationErrors.type"
                    }
                ]
            }
        },
        "uniqueItems": {
            "input": [
                {
                    "keyword": "uniqueItems",
                    "dataPath": "",
                    "schemaPath": "#/uniqueItems",
                    "params": {
                        "i": 2,
                        "j": 0
                    },
                    "message": "should NOT have duplicate items (items ## 0 and 2 are identical)"
                }
            ],
            "schema": {
                "uniqueItems": true
            },
            "message": "We should be able to evolve a `uniqueItems` error.",
            "expected": {
                "isValid": false,
                "errors": [
                    {
                        "dataPath": [],
                        "schemaPath": [
                            "uniqueItems"
                        ],
                        "rule": {
                            "uniqueItems": true
                        },
                        "message": "gpii.schema.messages.validationErrors.uniqueItems"
                    }
                ]
            }
        }
    };
})(fluid);
