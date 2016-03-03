/*

    A parser that resolves `$ref` references in JSON Schema definitions.  See the documentation for details:

    https://github.com/the-t-in-rtf/gpii-json-schema/blob/GPII-1336/docs/parser.md

*/

"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var fs   = require("fs");
var path = require("path");

var $RefParser = require("json-schema-ref-parser");

fluid.registerNamespace("gpii.schema.parser");

/**
 *
 * @param that - The parser component itself
 *
 * Starts the process of dereferencing all schemas found in `options.schemaDirs`.  Wraps them in a sequence to ensure
 * that `onSchemasDereferenced` is fired once all of the schemas are dereferenced.
 */
gpii.schema.parser.loadSchemas = function (that) {
    var promises = [];
    fluid.each(fluid.makeArray(that.options.schemaDirs), function (schemaDir) {
        var resolvePathToDir = fluid.module.resolvePath(schemaDir);
        fluid.each(fs.readdirSync(resolvePathToDir), function (filename) {
            if (filename.match(/.json$/i)) {
                var fullPathToFile = path.resolve(resolvePathToDir, filename);
                promises.push(gpii.schema.parser.dereferenceSchema(that, fullPathToFile, filename));
            }
        });
    });

    if (promises.length) {
        fluid.promise.sequence(promises).then(
            function () { that.events.onSchemasDereferenced.fire(that); },
            function (error) { fluid.fail(error.message || error); }
        );
    }
};


/**
 * Dereference all `$ref` links for a single schema. See the documentation for details.
 *
 * https://github.com/the-t-in-rtf/gpii-json-schema/blob/GPII-1336/docs/parser.md#gpiischemaparserdereferenceschemathat-schemapath-schemakey
 *
 * @param that - The parser component itself.
 * @param schemaPath {String} - The full path to the schema we are derferencing.
 * @param schemaKey {String} - The filename/id of the schema we are dereferencing.
 * @returns A `fluid.promise` that will be resolved once the parser has finished dereferencing the schema.
 *
 */
gpii.schema.parser.dereferenceSchema = function (that, schemaPath, schemaKey) {
    var promise = fluid.promise();
    var parser = new $RefParser(); // jshint ignore:line

    parser.dereference(schemaPath, that.options.parserOptions, gpii.schema.parser.getParserCallback(that, schemaKey, promise));
    return promise;
};

/**
 *
 * Wrap the normal callback used by the parser in a `fluid.promise`.
 *
 * @param that - The parser component itself.
 * @param schemaKey - The filename/id of the schema we are dereferencing.
 * @param promise - The promise the parser will either resolve or reject once it completes its work.
 * @returns A {Function} that can be passed directly to the parser as a callback.
 *
 */
gpii.schema.parser.getParserCallback = function (that, schemaKey, promise) {
    return function (error, schema) {
        if (error) {
            promise.reject(error);
        }
        else {
            // Our keys have periods in them, which the change applier will interpret as a deeper part of the path
            // unless we do something like this.
            var schemas = fluid.copy(that.model.dereferencedSchemas);
            schemas[schemaKey] = schema;
            that.applier.change("dereferencedSchemas", schemas);
            promise.resolve(schema);
        }
    };
};

fluid.defaults("gpii.schema.parser", {
    gradeNames: ["fluid.modelComponent", "gpii.hasRequiredOptions"],
    requiredFields: {
        "schemaDirs": true
    },
    parserOptions: {},
    events: {
        onSchemasDereferenced: null
    },
    model: {
        dereferencedSchemas: {}
    },
    listeners: {
        "onCreate.loadSchemas": {
            funcName: "gpii.schema.parser.loadSchemas",
            args:     ["{that}"]
        }
    }
});