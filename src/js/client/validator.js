/*

    A client-side wrapper for the validation component.  See the documentation for details:

    https://github.com/the-t-in-rtf/gpii-json-schema/blob/GPII-1336/docs/validator.md

 */
/* globals fluid, $ */
(function () {
    "use strict";
    var gpii  = fluid.registerNamespace("gpii");

    fluid.registerNamespace("gpii.schema.validator.ajv.client");

    gpii.schema.validator.ajv.client.retrieveSchemas = function (that) {
        $.ajax({
            url:     that.options.inlineSchemaUrl,
            success: that.saveSchemas,
            error:   fluid.fail,
            json:    true
        });
    };

    gpii.schema.validator.ajv.client.saveSchemas = function (that, jqXHR) {
        var schemas = jqXHR.responseJSON;
        if (schemas) {
            that.applier.change("schemas", schemas);
        }
    };

    fluid.defaults("gpii.schema.validator.ajv.client", {
        gradeNames: ["gpii.schema.validator.ajv", "gpii.hasRequiredOptions"],
        schemaPath: "/schemas",
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
        },
        components: {
            parser: {
                type: "gpii.schema.parser",
                options: {
                    schemaPath: "{gpii.schema.validator.ajv}.options.schemaPath",
                    model: {
                        schemas: "{gpii.schema.validator.ajv}.model.schemas"
                    },
                    listeners: {
                        "onSchemasUpdated.notifyValidator": {
                            func: "{gpii.schema.validator.ajv.client}.events.onSchemasUpdated.fire"
                        }
                    }
                }
            }
        }
    });
})();
