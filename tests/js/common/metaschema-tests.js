/*

    Independently of the validator, confirm that our FSS metaschema is itself valid, and that it can be used with Ajv
    to validate FSS schemas.

*/
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
        Ajv = require("ajv");
        jqUnit = require("node-jqunit");
        require("../../../src/js/common/fss-metaschema");
    }

    jqUnit.module("Test the FSS metaschema.");

    jqUnit.test("The metaschema itself should be valid.", function () {
        var ajv = new Ajv();
        var metaSchemaIsValid = ajv.validateSchema(fluid.schema.metaSchema);
        jqUnit.assertTrue("The metaschema should be valid.", metaSchemaIsValid);
        jqUnit.assertDeepEq("There should be no validation errors.", null, ajv.errors);
    });

    jqUnit.test("We should be able to validate FSS Schemas using the metaschema.", function () {
        var ajv = new Ajv();
        ajv.addMetaSchema(fluid.schema.metaSchema);

        var invalidFssSchema = {
            "$schema": "fss-v7-full#",
            "properties": {
                "foo": {
                    "type": "string",
                    "required": []
                }
            }
        };
        var invalidSchemaIsValid = ajv.validateSchema(invalidFssSchema);
        jqUnit.assertFalse("The schema should be reported as invalid.", invalidSchemaIsValid);

        var validFssSchema = {
            "$schema": "fss-v7-full#",
            "properties": {
                "foo": {
                    "type": "string",
                    "required": true
                },
                "bar": {
                    "type": "string",
                    "required": false
                },
                "baz": {
                    "type": "string"
                }
            }
        };
        var validSchemaIsValid = ajv.validateSchema(validFssSchema);
        jqUnit.assertTrue("The schema should be reported as valid.", validSchemaIsValid);

        var minIsAllowed = ajv.validateSchema({
            "$schema": "fss-v7-full#",
            "type": "integer",
            "min": 0
        });

        jqUnit.assertFalse("The deprecated 'min' keyword should be disallowed.", minIsAllowed);

        var maxIsAllowed = ajv.validateSchema({
            "$schema": "fss-v7-full#",
            "type": "integer",
            "max": 5
        });

        jqUnit.assertFalse("The deprecated 'max' keyword should be disallowed.", maxIsAllowed);

        var divisibleByIsAllowed = ajv.validateSchema({
            "$schema": "fss-v7-full#",
            "type": "integer",
            "divisibleBy": 2
        });

        jqUnit.assertFalse("The deprecated 'divisibleBy' keyword should be disallowed.", divisibleByIsAllowed);

        var additionalPropertiesAllowed = ajv.validateSchema({
            "$schema": "fss-v7-full#",
            "extra": "bonus material"
        });

        jqUnit.assertFalse("Additional properties not found in the FSS metaschema should be disallowed.", additionalPropertiesAllowed);

        var nestedSchemasAllowed = ajv.validateSchema({
            "$schema": "fss-v7-full#",
            properties: {
                named: {
                    "anyOf": [
                        { $schema: "fss-v7-full#", type: "string" }
                    ],
                    "allOf": [
                        { $schema: "fss-v7-full#", maxLength: 3},
                        { $schema: "fss-v7-full#", minLength: 1}
                    ],
                    "oneOf": [
                        { $schema: "fss-v7-full#", format: "email" },
                        { $schema: "fss-v7-full#", format: "uri" }
                    ]
                }
            },
            additionalProperties: {
                type: "object",
                properties: {
                    settings: {
                        $schema: "fss-v7-full#",
                        type: "string"
                    }
                }
            }
        });

        jqUnit.assertTrue("Nested $schema elements should be handled correctly.", nestedSchemasAllowed);
    });
})(fluid, Ajv, jqUnit);
