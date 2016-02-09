/**
 * {@link ../../../docs/parser.md The documentation...}
 */
/*

    A parser that resolves `$ref` references in JSON Schema definitions and provides the ability to look up the
    dereferenced definition content based on a "dot notation" path within a deep object.

   See [the documentation](../../../docs/parser.md) for details.

  */
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var $RefParser = $RefParser ? $RefParser : require("json-schema-ref-parser");

fluid.registerNamespace("gpii.schema.parser");

// Dereference all `$ref` links for a single schema.
//
// See [the documentation](../../../docs/parser.md#gpiischemaparserdereferenceschemathat-schemapath-schemakey) for details.
//
gpii.schema.parser.dereferenceSchema = function (that, schemaPath, schemaKey) {
    var parser = new $RefParser(); // jshint ignore:line
    var pathOrUri = fluid.stringTemplate(that.options.uriTemplate, { schemaPath: schemaPath, schemaKey: schemaKey});
    var promise = fluid.promise();
    parser.dereference(pathOrUri, that.options.parserOptions, gpii.schema.parser.getParserCallback(that, schemaKey, promise));
    return promise;
};

// Wrap the normal callback used by the parser in a `fluid.promise`.
gpii.schema.parser.getParserCallback = function (that, schemaKey, promise) {
    return function (error, schema) {
        if (error) {
            promise.reject(error);
        }
        else {
            that.dereferencedSchemas[schemaKey] = schema;
            promise.resolve(schema);
        }
    };
};

// Look up the full dereferenced definition for a single field.
//
// See [the documentation](../../../docs/parser.md#gpiischemaparserlookupfieldthat-schemakey-schemafieldpath) for details.
//
gpii.schema.parser.lookupField = function (that, schemaKey, schemaFieldPath) {
    var pathSegments = Array.isArray(schemaFieldPath) ? schemaFieldPath : gpii.schema.validator.ajv.extractPathSegments(schemaFieldPath);

    var dereferencedSchema = that.dereferencedSchemas[schemaKey];
    if (dereferencedSchema) {
        var currentLevel = dereferencedSchema;
        for (var a = 0; a < pathSegments.length; a++) {
            var segment = pathSegments[a];
            var nextLevel = currentLevel.properties && currentLevel.properties[segment] ? currentLevel.properties[segment] : currentLevel[segment];
            if (a === pathSegments.length - 1) {
                nextLevel = currentLevel[segment] ? currentLevel[segment] : nextLevel;
            }
            if (nextLevel) {
                currentLevel = nextLevel;
            }
            else {
                return false;
            }
        }

        return currentLevel;
    }

    // If we can't evolve the output, return `false`, indicating that no evolved output is available.  Code using this
    // function is expected to test for truthiness and take action as needed.
    return false;
};


// Look up the description metadata for a single field.
//
// See [the documentation](../../../docs/parser.md#gpiischemaparserlookupdescriptionthat-schemakey-schemafieldpath) for details.
//
gpii.schema.parser.lookupDescription = function (that, schemaKey, schemaFieldPath) {
    var pathPlusDescription = Array.isArray(schemaFieldPath) ? schemaFieldPath.concat("description") : schemaFieldPath + ".description";
    return gpii.schema.parser.lookupField(that, schemaKey, pathPlusDescription);
};

/*

  A model listener to dereference and cache a dereferenced version of schemas as they are added to `model.schemas`.

 */
gpii.schema.parser.updateSchemas = function (that) {
    var promises = [];
    fluid.each(
        that.model.schemas, function (schemaContent, schemaKey) {
        if (!that.dereferencedSchemas[schemaKey]) {
            promises.push(that.dereferenceSchema(schemaKey));
        }
    });

    if (promises.length > 0) {
        fluid.promise.sequence(promises).then(
            function () { that.events.onSchemasUpdated.fire(that); },
            function (error) { fluid.fail(error.message || error); }
        );
    }
};

fluid.defaults("gpii.schema.parser", {
    gradeNames:    ["fluid.modelComponent"],
    parserOptions: {},
    uriTemplate:   "%schemaPath/%schemaKey",
    model: {
        schemas: {}
    },
    events: {
        onSchemasUpdated: null
    },
    members: {
        parser: null,
        dereferencedSchemas: {}
    },
    invokers: {
        dereferenceSchema: {
            funcName: "gpii.schema.parser.dereferenceSchema",
            args: ["{that}", "{that}.options.schemaPath", "{arguments}.0"]
        },
        lookupField: {
            funcName: "gpii.schema.parser.lookupField",
            args:     ["{that}", "{arguments}.0", "{arguments}.1"] // schemaKey, schemaFieldPath
        },
        lookupDescription: {
            funcName: "gpii.schema.parser.lookupDescription",
            args:     ["{that}", "{arguments}.0", "{arguments}.1"] // schemaKey, schemaFieldPath
        }
    },
    modelListeners: {
        schemas: {
            funcName:      "gpii.schema.parser.updateSchemas",
            args:          ["{that}", "{arguments}.0"]
        }
    }
});