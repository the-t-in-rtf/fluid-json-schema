var clientValidator = gpii.schema.validator.ajv({ // jshint ignore:line
    model: {
        schemas: {
            "base.json": {
                "$schema": "http://json-schema.org/draft-04/schema#",
                "id": "base.json#",
                "title": "Example Schema",
                "type": "object",
                "definitions": {
                    "required": {
                        "type": "boolean"
                    },
                    "boolean": {
                        "type": "boolean"
                    },
                    "date": {
                        "type": "string",
                        "format": "date"
                    },
                    "number": {
                        "type": "number",
                        "minValue": 1,
                        "maxValue": 10
                    },
                    "array": {
                        "type": "array",
                        "items": {"type": "boolean"}
                    },
                    "regex": {
                        "type": "string",
                        "pattern": "^v.l.d$"
                    },
                    "password": {
                        "description": "Password must be 8 or more characters, and have at least one uppercase letter, at least one lowercase letter, and at least one number or special character.",
                        "allOf": [
                            {"type": "string", "minLength": 8},
                            {"type": "string", "pattern": "[A-Z]+"},
                            {"type": "string", "pattern": "[a-z]+"},
                            {"type": "string", "pattern": "[^a-zA-Z]"}
                        ]
                    },
                    "rawMultiple": {
                        "allOf": [
                            {"type": "string", "minLength": 8},
                            {"type": "string", "pattern": "[A-Z]+"},
                            {"type": "string", "pattern": "[a-z]+"},
                            {"type": "string", "pattern": "[^a-zA-Z]"}
                        ]
                    }
                },
                "properties": {
                    "required": {"$ref": "#/definitions/required"},
                    "boolean": {"$ref": "#/definitions/boolean"},
                    "date": {"$ref": "#/definitions/date"},
                    "number": {"$ref": "#/definitions/number"},
                    "array": {"$ref": "#/definitions/array"},
                    "password": {"$ref": "#/definitions/password"},
                    "rawMultiple": {"$ref": "#/definitions/rawMultiple"},
                    "regex": {"$ref": "#/definitions/regex"}
                },
                "required": ["required"]
            },
            "derived.json": {
                "$schema": "http://json-schema.org/draft-04/schema#",
                "title": "Schema derived from base schema",
                "description": "inheritance in JSON Schema v4 is still weird.  This example is the one we test against, and it works with JSON Schema.",
                "type": "object",
                "properties": {
                    "required": {"$ref": "base.json#/definitions/required"},
                    "boolean": {"$ref": "base.json#/definitions/boolean"},
                    "date": {"$ref": "base.json#/definitions/date"},
                    "number": {"$ref": "base.json#/definitions/number"},
                    "array": {"$ref": "base.json#/definitions/array"},
                    "regex": {"$ref": "base.json#/definitions/array"},

                    "additionalOptional": {
                        "type": "string"
                    },
                    "additionalRequired": {
                        "type": "boolean"
                    }
                },
                "required": ["additionalRequired", "required"]
            },
            "deep.json": {
                "$schema": "http://json-schema.org/draft-04/schema#",
                "title": "Deep schema to test variable nesting and paths.",
                "type": "object",
                "properties": {
                    "deep": {
                        "type": "object",
                        "properties": {
                            "required": {
                                "type": "boolean"
                            }
                        },
                        "required": ["required"]
                    }
                }
            },
            "escaped.json": {
                "$schema": "http://json-schema.org/draft-04/schema#",
                "title": "Schema to test names that would otherwise conflict with the path handling",
                "type": "object",
                "properties": {
                    "this.that": {
                        "type": "object",
                        "properties": {
                            "th'other": {
                                "type": "object",
                                "description": "How do increasingly sloppy variable names make you feel?",
                                "properties": {
                                    "required": {
                                        "type": "boolean"
                                    }
                                },
                                "required": ["required"]
                            }
                        },
                        "required": ["th'other"]
                    },
                    "[x][x]": {
                        "type": "string",
                        "description": "How do textual cross marks make you feel?"
                    }
                },
                "required": ["[x][x]"]
            }
        }
    }
});
