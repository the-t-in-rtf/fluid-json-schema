/*

    A server-side wrapper for the validation component.  See the documentation for details:

    https://github.com/the-t-in-rtf/gpii-json-schema/blob/GPII-1336/docs/validator.md

 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var path    = require("path");
var fs      = require("fs");

require("../../../index");

fluid.registerNamespace("gpii.schema.validator.ajv.server");

// Load any schema files on startup.
gpii.schema.validator.ajv.server.init = function (that) {
    var resolvedPath = fluid.module.resolvePath(that.options.schemaPath);
    var schemas = {};
    fluid.each(fs.readdirSync(resolvedPath), function (filename) {
        if (filename.match(/.json$/i)) {
            var schemaPath = path.resolve(resolvedPath, filename);
            var content    = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

            schemas[filename] = content;
        }
    });

    that.applier.change("schemas", schemas);
};

fluid.defaults("gpii.schema.validator.ajv.server", {
    gradeNames: ["gpii.schema.validator.ajv", "gpii.hasRequiredOptions"],
    requiredFields: {
        "schemaPath": true
    },
    events: {
        onSchemasUpdated: null
    },
    listeners: {
        "onCreate.loadSchemas": {
            funcName: "gpii.schema.validator.ajv.server.init",
            args:     ["{that}"]
        }
    },
    components: {
        parser: {
            type: "gpii.schema.parser.server",
            options: {
                schemaPath: "{gpii.schema.validator.ajv}.options.schemaPath",
                model: {
                    schemas: "{gpii.schema.validator.ajv}.model.schemas"
                },
                listeners: {
                    "onSchemasUpdated.notifyValidator": {
                        func: "{gpii.schema.validator.ajv.server}.events.onSchemasUpdated.fire"
                    }
                }
            }
        }
    }
});