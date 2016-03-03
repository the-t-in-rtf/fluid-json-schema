/*

    A server-side wrapper for the validation component.  The server-side parser loads the schema content used here. See
    the documentation for details:

    https://github.com/the-t-in-rtf/gpii-json-schema/blob/GPII-1336/docs/validator.md

 */
"use strict";
var fluid = require("infusion");

require("../../../index");

fluid.registerNamespace("gpii.schema.validator.ajv.server");

fluid.defaults("gpii.schema.validator.ajv.server", {
    gradeNames: ["gpii.schema.validator.ajv", "gpii.hasRequiredOptions"],
    requiredFields: {
        schemaDirs: true
    },
    events: {
        onSchemasDereferenced: null,
        // Map the common `onSchemasLoaded` event to `onSchemasReferenced`, as the parser loaded them for us.
        onSchemasLoaded: {
            events: {
                onSchemasDereferenced: "onSchemasDereferenced"
            }
        }
    },
    model: {
        schemas: {}
    },
    components: {
        parser: {
            type: "gpii.schema.parser",
            options: {
                schemaDirs: "{gpii.schema.validator.ajv}.options.schemaDirs",
                model: {
                    dereferencedSchemas: "{gpii.schema.validator.ajv.server}.model.schemas"
                },
                listeners: {
                    "onSchemasDereferenced.notifyValidator": {
                        func: "{gpii.schema.validator.ajv.server}.events.onSchemasDereferenced.fire"
                    }
                }
            }
        }
    }
});