/*

    A Fluid component to handle JSON Schema validation.  See the documentation for details:

    https://github.com/the-t-in-rtf/gpii-json-schema/blob/GPII-1336/docs/validator.md

 */

"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var Ajv = Ajv || require("ajv");

fluid.registerNamespace("gpii.schema.validator.ajv");

gpii.schema.validator.ajv.init = function (that) {
    // We persist a single AJV instance so that we can take advantage of its automatic compiling and caching.
    that.ajv = Ajv(that.options.validatorOptions); // jshint ignore:line

    gpii.schema.validator.ajv.refreshSchemas(that);
};

/*

 Validate JSON content against a known Schema.  See the documentation for details:

 https://github.com/the-t-in-rtf/gpii-json-schema/blob/GPII-1336/docs/validator.md#gpiischemavalidatorajvvalidatethat-key-content

 */
gpii.schema.validator.ajv.validate = function (that, key, content) {
    var contentValid = that.ajv.validate(key, content);
    if (!contentValid) {
        return (gpii.schema.validator.ajv.sanitizeValidationErrors(that, key, that.ajv.errors));
    }

    return undefined;
};


/*

    Transform raw validator output and add human-readable errors.

    See the documentation for details:

    https://github.com/the-t-in-rtf/gpii-json-schema/blob/GPII-1336/docs/validator.md#gpiischemavalidatorajvsanitizevalidationerrorsthat-schemakey-errors

 */
gpii.schema.validator.ajv.sanitizeValidationErrors = function (that, schemaKey, rawErrors) {
    var evolvedErrors = fluid.transform(rawErrors, function (error) {
        return that.parser.evolveError(schemaKey, error);
    });

    return evolvedErrors;
};

/*

If we receive new schemas, make the validator aware of them so that we can simply validate using their key.

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

    that.events.schemasLoaded.fire(that);
};

fluid.defaults("gpii.schema.validator.ajv", {
    gradeNames: ["fluid.modelComponent"],
    validatorOptions: {
        v5:      true,   // enable "v5" support for $data references
        verbose: false,  // Prevent invalid data (such as passwords) from being displayed in error messages
        messages: true,  // Display human-readable error messages
        allErrors: true  // Generate a complete list of errors and not just the first failure.
    },
    events: {
        schemasLoaded: null
    },
    model: {
        schemas: {}
    },
    invokers: {
        validate: {
            funcName: "gpii.schema.validator.ajv.validate",
            args:     ["{that}", "{arguments}.0", "{arguments}.1"]
        }
    },
    listeners: {
        "onCreate.init": {
            funcName: "gpii.schema.validator.ajv.init",
            args:     ["{that}"]
        }
    },
    modelListeners: {
        "schemas": {
            funcName:      "gpii.schema.validator.ajv.refreshSchemas",
            excludeSource: "init",
            args:          ["{that}"]
        }
    },
    components: {
        parser: {
            type: "gpii.schema.parser",
            options: {
                schemaPath: "{gpii.schema.validator.ajv}.options.schemaPath",
                model: {
                    schemas: "{gpii.schema.validator.ajv}.model.schemas"
                }
            }
        }
    }
});

