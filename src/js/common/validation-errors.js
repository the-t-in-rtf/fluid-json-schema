/* globals require */
(function (fluid) {
    "use strict";
    if (typeof require !== "undefined") {
        fluid = require("infusion");
    }

    var gpii = fluid.registerNamespace("gpii");
    fluid.registerNamespace("gpii.schema.messages");
    gpii.schema.messages.validationErrors = {
        "schema-validator-anyOf": "The value must match at least one valid format.",
        "schema-validator-contains": "The array is missing one or more required values.",
        "schema-validator-dependencies": "A dependency between two fields is not satisfied.",
        "schema-validator-else": "An 'else' block in the schema does not match the supplied data.",
        "schema-validator-enum": "The supplied value is not one of the allowed values (%error.rule.enum).",
        "schema-validator-exclusiveMaximum": "The value must be less than %error.rule.exclusiveMaximum characters long.",
        "schema-validator-exclusiveMinimum": "The value must be more than %error.rule.exclusiveMinimum characters long.",
        "schema-validator-format": "The supplied string does not match the specified format (%error.rule.format).",
        "schema-validator-general-failure": "The data you have supplied is invalid.",
        "schema-validator-maxItems": "The supplied array must contain less than %error.rule.maxItems items.",
        "schema-validator-maxLength": "The value must be %error.rule.maxLength characters or less long.",
        "schema-validator-maxProperties": "The object can only contain %error.rule.maxProperties properties.",
        "schema-validator-maximum": "The value must be less than %error.rule.maximum.",
        "schema-validator-minItems": "The value must contain at least %error.rule.minItems.",
        "schema-validator-minLength": "The value must be %error.rule.minLength characters or more long.",
        "schema-validator-minProperties": "The object supplied must contain at least %error.rule.minProperties properties.",
        "schema-validator-minimum": "The value must be at least %error.rule.minimum.",
        "schema-validator-multipleOf": "The supplied value must be a multiple of %error.rule.multipleOf.",
        "schema-validator-not": "The supplied data is disallowed by a 'not' block in the schema.",
        "schema-validator-oneOf": "The value must match exactly one valid format.",
        "schema-validator-pattern": "The supplied string does not match the expected pattern.",
        "schema-validator-propertyNames": "The supplied property name does not match the allowed names.",
        "schema-validator-required": "This value is required.",
        "schema-validator-then": "A 'then' block in the schema does not match the supplied data.",
        "schema-validator-type": "The value supplied should be a(n) %error.rule.type.",
        "schema-validator-uniqueItems": "All items in the array must be unique."
    };
})(fluid);
