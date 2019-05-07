/* globals require */
var fluid  = fluid  || {};
(function (fluid) {
    "use strict";
    if (!fluid.identity) {
        fluid = require("infusion");
    }

    var gpii = fluid.registerNamespace("gpii");
    fluid.registerNamespace("gpii.schema.messages");

    gpii.schema.messages.validationErrors = {
        "gpii.schema.messages.validationErrors.additionalProperties": "The property must match the requirements for additional properties.",
        "gpii.schema.messages.validationErrors.anyOf": "The value must match at least one valid format.",
        "gpii.schema.messages.validationErrors.contains": "The array is missing one or more required values.",
        "gpii.schema.messages.validationErrors.dependencies": "A dependency between two fields is not satisfied.",
        "gpii.schema.messages.validationErrors.else": "An 'else' block in the schema does not match the supplied data.",
        "gpii.schema.messages.validationErrors.enum": "The supplied value is not one of the allowed values (%error.rule.enum).",
        "gpii.schema.messages.validationErrors.exclusiveMaximum": "The value must be less than %error.rule.exclusiveMaximum characters long.",
        "gpii.schema.messages.validationErrors.exclusiveMinimum": "The value must be more than %error.rule.exclusiveMinimum characters long.",
        "gpii.schema.messages.validationErrors.format": "The supplied string does not match the specified format (%error.rule.format).",
        "gpii.schema.messages.validationErrors.generalFailure": "The data you have supplied is invalid.",
        "gpii.schema.messages.validationErrors.if": "An 'if' block in the schema does not match the supplied data.",
        "gpii.schema.messages.validationErrors.maxItems": "The supplied array must contain less than %error.rule.maxItems items.",
        "gpii.schema.messages.validationErrors.maxLength": "The value must be %error.rule.maxLength characters or less long.",
        "gpii.schema.messages.validationErrors.maxProperties": "The object can only contain %error.rule.maxProperties properties.",
        "gpii.schema.messages.validationErrors.maximum": "The value must be less than %error.rule.maximum.",
        "gpii.schema.messages.validationErrors.minItems": "The value must contain at least %error.rule.minItems.",
        "gpii.schema.messages.validationErrors.minLength": "The value must be %error.rule.minLength characters or more long.",
        "gpii.schema.messages.validationErrors.minProperties": "The object supplied must contain at least %error.rule.minProperties properties.",
        "gpii.schema.messages.validationErrors.minimum": "The value must be at least %error.rule.minimum.",
        "gpii.schema.messages.validationErrors.multipleOf": "The supplied value must be a multiple of %error.rule.multipleOf.",
        "gpii.schema.messages.validationErrors.not": "The supplied data is disallowed by a 'not' block in the schema.",
        "gpii.schema.messages.validationErrors.oneOf": "The value must match exactly one valid format.",
        "gpii.schema.messages.validationErrors.pattern": "The supplied string does not match the expected pattern.",
        "gpii.schema.messages.validationErrors.propertyNames": "The supplied property name does not match the allowed names.",
        "gpii.schema.messages.validationErrors.required": "This value is required.",
        "gpii.schema.messages.validationErrors.then": "A 'then' block in the schema does not match the supplied data.",
        "gpii.schema.messages.validationErrors.type": "The value supplied should be a(n) %error.rule.type.",
        "gpii.schema.messages.validationErrors.uniqueItems": "All items in the array must be unique."
    };
})(fluid);
