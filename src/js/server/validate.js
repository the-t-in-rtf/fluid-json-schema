/*

 A server-side wrapper for the validation component.  See `../common/validate.js` for full details.

 The server-side component will populate `schemaContents` for you on startup based on the contents of
 `options.schemaPath`.  Because of limitations in the current `parser`, the schema key must match the filename.

 The server-side component will also resolve dependencies from `schemaContents`.  For example, if you have a
 second schema that has a reference to `#schema-file-name.json`, it will resolve to the contents of
 `schemaContents["schema-file-name.json"]`.

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
    if (that.options.schemaPath) {
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
    }
    else {
        fluid.fail("You have not provided the location of your schema directory.");
    }
};

fluid.defaults("gpii.schema.validator.ajv.server", {
    gradeNames: ["gpii.schema.validator.ajv"],
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
                }
            }
        }
    }
});