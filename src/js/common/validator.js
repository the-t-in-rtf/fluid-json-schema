/*

    A Fluid component to handle JSON Schema validation.  See the documentation for details:

    https://github.com/the-t-in-rtf/gpii-json-schema/blob/master/docs/validator.md

 */
/* eslint-env node */
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var Ajv = Ajv || require("ajv");

fluid.registerNamespace("gpii.schema.validator.ajv");

gpii.schema.validator.ajv.init = function (that) {
    // We persist a single AJV instance so that we can take advantage of its automatic compiling and caching.
    that.ajv = Ajv(that.options.validatorOptions); /* eslint new-cap: "off" */

    gpii.schema.validator.ajv.refreshSchemas(that);
};

/**
 *
 * @param that {Object} the validator component itself.
 * @param key {String} The key of the JSON Schema we are validating against.
 * @param content {Object} The JSON data to be validated.
 * @returns `{Object}` sanitized validation errors, if there are any, or `undefined` if there are no validation errors.
 *
 */
gpii.schema.validator.ajv.validate = function (that, key, content) {
    var contentValid = that.ajv.validate(key, content);

    if (!contentValid) {
        return (gpii.schema.validator.ajv.sanitizeValidationErrors(that, key, that.ajv.errors));
    }

    return undefined;
};


/**
 *
 * Iterate through the raw validation errors and evolve them if possible.  This is gated and will abort if the parser is
 * not yet ready.  This function is called once the parser is ready.
 *
 * @param that - The validator component itself.
 * @param schemaKey {String} - The filename/id of the schema we are working with.
 * @param rawErrors {Object} - The raw error data returned by AJV.
 * @returns An {Object} representing the original error data combined with any "evolved" error messages we were able to find.
 */
gpii.schema.validator.ajv.sanitizeValidationErrors = function (that, schemaKey, rawErrors) {
    var schemaContent = that.model.schemas[schemaKey];
    var evolvedErrors = fluid.transform(rawErrors, function (error) {
        return gpii.schema.errors.evolveError(schemaContent, error);
    });

    return evolvedErrors;
};

/**
 *
 * If we receive new schemas, make the validator aware of them so that we can simply validate using their key.
 *
 * @param that - The validator component itself.
 *
 */
gpii.schema.validator.ajv.refreshSchemas = function (that) {
    // Update the list of schemas using the supplied content
    fluid.each(that.model.schemas, function (schemaContent, schemaKey) {
        // AJV will not let us overwrite an existing schema , so we have to remove the current content first.
        if (that.ajv.getSchema(schemaKey)) {
            that.ajv.removeSchema(schemaKey);
        }

        try {
            that.ajv.addSchema(schemaContent, schemaKey);
        }
        catch (e) {
            fluid.fail("There was an error loading one of your JSON Schemas:", e);
        }
    });

    that.events.onSchemasRefreshed.fire(that);
};

fluid.defaults("gpii.schema.validator.ajv", {
    gradeNames: ["fluid.modelComponent"],
    validatorOptions: {
        v5:      true,   // enable "v5" support for $data references
        verbose: false,  // Prevent invalid data (such as passwords) from being displayed in error messages
        messages: true,  // Display human-readable error messages
        allErrors: true  // Generate a complete list of errors and not just the first failure.
    },
    model: {
        schemas: {}
    },
    events: {
        onSchemasLoaded:    null,
        onSchemasRefreshed: null
    },
    invokers: {
        validate: {
            funcName: "gpii.schema.validator.ajv.validate",
            args:     ["{that}", "{arguments}.0", "{arguments}.1"] // schemaKey, schemaContent
        }
    },
    listeners: {
        "onCreate.init": {
            funcName: "gpii.schema.validator.ajv.init",
            args:     ["{that}"]
        },
        "onSchemasLoaded.refreshSchemas": {
            funcName:      "gpii.schema.validator.ajv.refreshSchemas",
            args:          ["{that}"]
        }
    }
});
