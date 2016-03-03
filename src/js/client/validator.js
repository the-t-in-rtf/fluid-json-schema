/*

    A client-side wrapper for the validation component.  See the documentation for details:

    https://github.com/the-t-in-rtf/gpii-json-schema/blob/GPII-1336/docs/validator.md

 */
/* globals fluid, $ */
(function () {
    "use strict";
    var gpii  = fluid.registerNamespace("gpii");

    fluid.registerNamespace("gpii.schema.validator.ajv.client");

    /**
     *
     * Fire off a jQuery AJAX request to retrieve our schemas from the server-side `inlineSchema` router.
     *
     * @param that - The client-side validator component.
     */
    gpii.schema.validator.ajv.client.retrieveSchemas = function (that) {
        $.ajax({
            url:     that.options.inlineSchemaUrl,
            success: that.saveSchemas,
            error:   fluid.fail,
            json:    true
        });
    };

    /**
     *
     * Save the schemas returned by the server-side `inlineSchema` router to our model.
     *
     * @param that - The client-side validator component.
     * @param jqXHR - The full jQuery jqXHR response, including the JSON payload containing our schemas.
     */
    gpii.schema.validator.ajv.client.saveSchemas = function (that, jqXHR) {
        var schemas = jqXHR.responseJSON;
        if (schemas) {
            that.applier.change("schemas", schemas);
            that.events.onSchemasLoaded.fire();
        }
    };

    fluid.defaults("gpii.schema.validator.ajv.client", {
        gradeNames: ["gpii.schema.validator.ajv", "gpii.hasRequiredOptions"],
        requiredFields: {
            "inlineSchemaUrl": true
        },
        events: {
            onSchemasUpdated: null
        },
        listeners: {
            "onCreate.retrieveSchemas": {
                funcName: "gpii.schema.validator.ajv.client.retrieveSchemas",
                args:     ["{that}"]
            }
        },
        invokers: {
            saveSchemas: {
                funcName: "gpii.schema.validator.ajv.client.saveSchemas",
                args:     ["{that}", "{arguments}.2"]
            }
        }
    });
})();
