/* eslint-env browser */
/* globals require */
/* eslint-disable-next-line no-redeclare */
var fluid  = fluid  || require("infusion");
(function (fluid) {
    "use strict";

    fluid.registerNamespace("fluid.schema");
    fluid.schema.metaSchema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "$id": "fss-v7-full#",
        "title": "Fluid Schema Syntax.",
        "definitions": {
            "schemaArray": {
                "type": "array",
                "minItems": 1,
                "items": { "$ref": "#" }
            },
            "messageKey": {
                "type": "string",
                "pattern": "^[a-zA-Z0-9-_\.]+"
            },
            "messageKeyMap": {
                "type": "object",
                additionalProperties: {
                    "$ref": "#/definitions/messageKey"
                }
            },
            "enumLabels": {
                "type": "array",
                "items": { "$ref": "#/definitions/messageKey" }
            }
        },
        "properties": {
            "$id": { "$ref": "http://json-schema.org/draft-07/schema#/properties/$id" },
            "$schema": { enum: ["fss-v7-full#"], enumLabels: ["FSS Schema Version 7"]},
            // We allow the use of $ref, but tightly constrain it to only allow reuse of the metaschema itself, for example, for the modelSchema option.
            "$ref": { enum: ["fss-v7-full#"], enumLabels: ["FSS Schema Version 7"]},
            "$comment": { "$ref": "http://json-schema.org/draft-07/schema#/properties/$comment" },
            "title": { "$ref": "http://json-schema.org/draft-07/schema#/properties/title" },
            "description": { "$ref": "http://json-schema.org/draft-07/schema#/properties/description" },
            "default": true,
            "errors": { oneOf: [ { type: "string" }, {"$ref": "#/definitions/messageKeyMap" }] },
            "hint": { "$ref": "#/definitions/messageKey" },
            "readOnly": { "$ref": "http://json-schema.org/draft-07/schema#/properties/readOnly" },
            "examples": { "$ref": "http://json-schema.org/draft-07/schema#/properties/examples" },
            "multipleOf": { "$ref": "http://json-schema.org/draft-07/schema#/properties/multipleOf" },
            "maximum": { "$ref": "http://json-schema.org/draft-07/schema#/properties/maximum" },
            "exclusiveMaximum": { "$ref": "http://json-schema.org/draft-07/schema#/properties/exclusiveMaximum" },
            "minimum": { "$ref": "http://json-schema.org/draft-07/schema#/properties/minimum" },
            "exclusiveMinimum": { "$ref": "http://json-schema.org/draft-07/schema#/properties/exclusiveMinimum" },
            "maxLength": { "$ref": "http://json-schema.org/draft-07/schema#/definitions/nonNegativeInteger" },
            "minLength": { "$ref": "http://json-schema.org/draft-07/schema#/definitions/nonNegativeIntegerDefault0" },
            "pattern": { "$ref": "http://json-schema.org/draft-07/schema#/properties/pattern" },
            "additionalItems": { "$ref": "#" },
            "items": {
                "anyOf": [
                    { "$ref": "#" },
                    { "$ref": "#/definitions/schemaArray" }
                ],
                "default": true
            },
            "maxItems": { "$ref": "http://json-schema.org/draft-07/schema#/definitions/nonNegativeInteger" },
            "minItems": { "$ref": "http://json-schema.org/draft-07/schema#/definitions/nonNegativeIntegerDefault0" },
            "uniqueItems": { "$ref": "http://json-schema.org/draft-07/schema#/properties/uniqueItems" },
            "contains": { "$ref": "#" },
            "maxProperties": { "$ref": "http://json-schema.org/draft-07/schema#/definitions/nonNegativeInteger" },
            "minProperties": { "$ref": "http://json-schema.org/draft-07/schema#/definitions/nonNegativeIntegerDefault0" },
            "required": { "type": "boolean"},
            "additionalProperties": { "$ref": "#" },
            "definitions": {
                "type": "object",
                "additionalProperties": { "$ref": "#" },
                "default": {}
            },
            "properties": {
                "type": "object",
                "additionalProperties": { "$ref": "#" },
                "default": {}
            },
            "patternProperties": {
                "type": "object",
                "additionalProperties": { "$ref": "#" },
                "propertyNames": { "format": "regex" },
                "default": {}
            },
            "dependencies": {
                "type": "object",
                "additionalProperties": {
                    "anyOf": [
                        { "$ref": "#" },
                        { "$ref": "http://json-schema.org/draft-07/schema#/definitions/stringArray" }
                    ]
                }
            },
            "propertyNames": { "$ref": "#" },
            "const": true,
            "enum": { "$ref": "http://json-schema.org/draft-07/schema#/properties/enum" },
            "enumLabels": { "$ref": "#/definitions/enumLabels"},
            "type": { "$ref": "http://json-schema.org/draft-07/schema#/properties/type" },
            "format": { "$ref": "http://json-schema.org/draft-07/schema#/properties/format" },
            "contentMediaType": { "$ref": "http://json-schema.org/draft-07/schema#/properties/contentMediaType" },
            "contentEncoding": { "$ref": "http://json-schema.org/draft-07/schema#/properties/contentEncoding" },
            "if": {"$ref": "#"},
            "then": {"$ref": "#"},
            "else": {"$ref": "#"},
            "allOf": { "$ref": "#/definitions/schemaArray" },
            "anyOf": { "$ref": "#/definitions/schemaArray" },
            "oneOf": { "$ref": "#/definitions/schemaArray" },
            "not": { "$ref": "#" }
        },
        "default": true,
        "dependencies": { enum: ["enumLabels"], enumLabels: ["enum"] },
        "additionalProperties": false
    };
})(fluid);
