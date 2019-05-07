/*

    Independently of the validator, confirm that our GSS metaschema is itself valid, and that it can be used with Ajv
    to validate GSS schemas.

*/
/* globals Ajv, jqUnit, require */
/* eslint-env browser */
var fluid  = fluid  || {};
var Ajv    = Ajv    || {};
var jqUnit = jqUnit || {};

(function (fluid, Ajv, jqUnit) {
    "use strict";

    if (!fluid.identity) {
        fluid = require("infusion");
        Ajv = require("ajv");
        jqUnit = require("node-jqunit");
        require("../../../src/js/common/gss-metaschema");
    }

    var gpii  = fluid.registerNamespace("gpii");

    jqUnit.module("Test the GSS metaschema.");

    jqUnit.test("The metaschema itself should be valid.", function () {
        var ajv = new Ajv();
        var metaSchemaIsValid = ajv.validateSchema(gpii.schema.metaSchema);
        jqUnit.assertTrue("The metaschema should be valid.", metaSchemaIsValid);
        jqUnit.assertDeepEq("There should be no validation errors.", null, ajv.errors);
    });

    jqUnit.test("We should be able to validate GSS Schemas using the metaschema.", function () {
        var ajv = new Ajv();
        ajv.addMetaSchema(gpii.schema.metaSchema);

        var invalidGssSchema = {
            "$schema": "gss-v7-full#",
            "properties": {
                "foo": {
                    "type": "string",
                    "required": []
                }
            }
        };
        var invalidSchemaIsValid = ajv.validateSchema(invalidGssSchema);
        jqUnit.assertFalse("The schema should be reported as invalid.", invalidSchemaIsValid);

        var validGssSchema = {
            "$schema": "gss-v7-full#",
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
        var validSchemaIsValid = ajv.validateSchema(validGssSchema);
        jqUnit.assertTrue("The schema should be reported as valid.", validSchemaIsValid);

        var minIsAllowed = ajv.validateSchema({
            "$schema": "gss-v7-full#",
            "type": "integer",
            "min": 0
        });

        jqUnit.assertFalse("The deprecated 'min' keyword should be disallowed.", minIsAllowed);

        var maxIsAllowed = ajv.validateSchema({
            "$schema": "gss-v7-full#",
            "type": "integer",
            "max": 5
        });

        jqUnit.assertFalse("The deprecated 'max' keyword should be disallowed.", maxIsAllowed);

        var divisibleByIsAllowed = ajv.validateSchema({
            "$schema": "gss-v7-full#",
            "type": "integer",
            "divisibleBy": 2
        });

        jqUnit.assertFalse("The deprecated 'divisibleBy' keyword should be disallowed.", divisibleByIsAllowed);

        var additionalPropertiesAllowed = ajv.validateSchema({
            "$schema": "gss-v7-full#",
            "extra": "bonus material"
        });

        jqUnit.assertFalse("Additional properties not found in the GSS schema should be disallowed.", additionalPropertiesAllowed);
    });
})(fluid, Ajv, jqUnit);
