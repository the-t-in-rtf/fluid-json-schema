/*

 A server-side wrapper for the validation component.  See `../common/validate.js` for full details.

 The server-side component will populate `options.schemaContents` for you on startup based on the contents of
 `options.schemaFiles`.

 */
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var ZSchema   = require("z-schema");

require("../common/validate");

fluid.registerNamespace("gpii.schema.validator.server");

// Load any schema files on startup.
gpii.schema.validator.server.init = function (that) {
    fluid.each(that.options.schemaFiles, function (schemaPath, schemaName) {
        var schemaContent = require(schemaPath);
        that.schemaContents[schemaName] = schemaContent;
    });
};

gpii.schema.validator.server.getValidator = function (that) {
    return new ZSchema(that.options.zSchemaOptions);
};

fluid.defaults("gpii.schema.validator.server", {
    gradeNames: ["gpii.schema.validator"],
    listeners: {
        "onCreate.loadSchemas": {
            funcName: "gpii.schema.validator.server.init",
            args:     ["{that}"]
        }
    },
    invokers: {
        "getValidator": {
            funcName: "gpii.schema.validator.server.getValidator",
            args:     ["{that}"]
        }
    }
});
