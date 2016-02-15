/*

    A parser that resolves `$ref` references in JSON Schema definitions and provides the ability to look up the
    dereferenced definition content based on a "dot notation" path within a deep object.  See the documentation for
    details:

    https://github.com/the-t-in-rtf/gpii-json-schema/blob/GPII-1336/docs/parser.md

*/
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var $RefParser = $RefParser ? $RefParser : require("json-schema-ref-parser");
var jsonpointer = jsonpointer ? jsonpointer : require("jsonpointer.js");

fluid.registerNamespace("gpii.schema.parser");

// Dereference all `$ref` links for a single schema.  See the documentation for details:
//
// https://github.com/the-t-in-rtf/gpii-json-schema/blob/GPII-1336/docs/parser.md#gpiischemaparserdereferenceschemathat-schemapath-schemakey
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

// Look up the full dereferenced definition for a single field.  See the documentation for details:
//
// https://github.com/the-t-in-rtf/gpii-json-schema/blob/GPII-1336/docs/parser.md#gpiischemaparserlookupfieldthat-schemakey-schemafieldpath
//
gpii.schema.parser.resolveJsonPointer = function (that, schemaKey, jsonPointer) {
    var dereferencedSchema = that.dereferencedSchemas[schemaKey];
    return jsonpointer.get(dereferencedSchema, jsonPointer);
};


// Look up the description metadata for a single field. See the documentation for details:
//
// https://github.com/the-t-in-rtf/gpii-json-schema/blob/GPII-1336/docs/parser.md#gpiischemaparserlookupdescriptionthat-schemakey-schemafieldpath
//
gpii.schema.parser.lookupDescription = function (that, schemaKey, baseJsonPointer) {
    // The `required` keyword comes from the object that contains the field, and not the field itself.  For required
    // fields, we pass along the standard message from `options.messages.required`.
    //
    if (baseJsonPointer.match(that.options.requiredRegexp)) {
        return that.options.messages.required;
    }
    // Look up and return the "description" metadata for the field (if possible).
    else {
        // We want a very slightly larger context than the pointer returned by AJV provides, as otherwise we would
        // be getting less useful information.  As an example, if the failure pointer is `#/field1/minLength`,
        // `baseJsonPointer` would resolve to the actual numeric value. `parentJsonPointer` resolves to the schema
        // definition for `field1` instead.
        var parentJsonPointer = gpii.schema.parser.getParentJsonPointer(baseJsonPointer);
        var parentElement = that.resolveJsonPointer(schemaKey, parentJsonPointer);
        return (parentElement && parentElement.description) ? parentElement.description : undefined;
    }
};

// Static function to strip the last part of a JSON pointer. If we are already at the top (i.e. `#/`), we will stay at the top.
gpii.schema.parser.getParentJsonPointer = function (jsonPointer) {
    if (jsonPointer) {
        var allButLastSegment = jsonPointer.split("/").slice(0, -1).join("/");
        // We have to append a trailing slash if we are already at the top of the chain
        return allButLastSegment === "#" ?  "#/" : allButLastSegment;
    }
};


// Static function to add a `childPath` to an existing JSON pointer.  If keys in the path contain literal slashes
// or tildes, you are expected to escape them yourself, ~0 in place of literal tildes, and ~1 in place of literal
// slashes in a key name.
gpii.schema.parser.getChildJsonPointer = function (jsonPointer, childPath) {
    return jsonPointer ? jsonPointer.split("/").concat(childPath).join("/") : jsonPointer;
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
    requiredRegexp: "/required$",
    parserOptions: {},
    uriTemplate:   "%schemaPath/%schemaKey",
    messages: {
        required: "You must provide a value for this field."
    },
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
        resolveJsonPointer: {
            funcName: "gpii.schema.parser.resolveJsonPointer",
            args:     ["{that}", "{arguments}.0", "{arguments}.1"] // schemaKey, jsonPointer
        },
        lookupDescription: {
            funcName: "gpii.schema.parser.lookupDescription",
            args:     ["{that}", "{arguments}.0", "{arguments}.1"] // schemaKey, jsonPointer
        }
    },
    modelListeners: {
        schemas: {
            funcName:      "gpii.schema.parser.updateSchemas",
            args:          ["{that}", "{arguments}.0"]
        }
    }
});