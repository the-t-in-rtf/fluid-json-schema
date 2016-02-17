/*

    The server-side version of the parser.  The only difference is that on the server side, we can resolve relative
    paths using `fluid.module.resolvePath`.

  */

"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.schema.parser.server");

gpii.schema.parser.server.dereferenceSchema = function (that, schemaKey) {
    var resolvedPath = fluid.module.resolvePath(that.options.schemaPath);
    return gpii.schema.parser.dereferenceSchema(that, resolvedPath, schemaKey);
};

fluid.defaults("gpii.schema.parser.server", {
    gradeNames:    ["gpii.schema.parser"],
    invokers: {
        dereferenceSchema: {
            funcName: "gpii.schema.parser.server.dereferenceSchema",
            args:     ["{that}", "{arguments}.0"]
        }
    }
});