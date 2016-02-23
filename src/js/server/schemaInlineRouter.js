/*

    "Inline Schema" router that packages up all schemas and returns them in a single JSON bundle, keyed by filename.

    See the documentation for details:

    https://github.com/the-t-in-rtf/gpii-json-schema/blob/GPII-1336/docs/middleware.md

 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("../common/hasRequiredOptions");

fluid.registerNamespace("gpii.schema.inline.router");

var fs   = require("fs");
var path = require("path");

/**
 *
 * Loads all .json files in each `options.schemaDirs` into a map, keyed by filename.  Does not recurse. Only the first
 * entry with a given filename is imported, so entries from the first `schemaDirs` take precedence.
 *
 * @param that - The router component itself.
 *
 */
gpii.schema.inline.router.loadSchemas = function (that) {
    var schemaDirArray = fluid.makeArray(that.options.schemaDirs);
    fluid.each(schemaDirArray, function (schemaDirs) {
        var resolvedschemaDirs = fluid.module.resolvePath(schemaDirs);
        var dirContents = fs.readdirSync(resolvedschemaDirs);
        fluid.each(dirContents, function (directoryEntry) {
            if (directoryEntry.match(/.json$/i)) {
                if (!that.schemas[directoryEntry]) {
                    var filePath = path.resolve(resolvedschemaDirs, directoryEntry);
                    var schemaStringContent = fs.readFileSync(filePath, { encoding: "utf8"});
                    var schemaContent = JSON.parse(schemaStringContent);
                    that.schemas[directoryEntry] = schemaContent;
                }
            }
        });
    });

    that.events.onSchemasLoaded.fire(that);
};

/**
 *
 * Send our map of JSON Schemas to the client.
 *
 * @param that - The router component.
 * @param req {Object} - The Express `request` object: http://expressjs.com/en/api.html#req
 * @param res {Object} - The Express `response` object: http://expressjs.com/en/api.html#res
 *
 */
gpii.schema.inline.router.sendSchemaData  = function (that, req, res) {
    res.status(200).send(that.schemas);
};

/*

    The `gpii.express.router` that delivers schema data to client side components.

 */
fluid.defaults("gpii.schema.inline.router", {
    gradeNames: ["gpii.express.router", "gpii.hasRequiredOptions"],
    path: "/allSchemas",
    events: {
        onSchemasLoaded: null
    },
    requiredFields: {
        "schemaDirs": true
    },
    members: {
        schemas: {}
    },
    invokers: {
        route: {
            funcName: "gpii.schema.inline.router.sendSchemaData",
            args:     ["{that}", "{arguments}.0", "{arguments}.1"] // `request`, `response`
        }
    },
    listeners: {
        "onCreate.loadSchemas": {
            funcName: "gpii.schema.inline.router.loadSchemas",
            args:     ["{that}"]
        }
    }
});