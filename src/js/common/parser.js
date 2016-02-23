/*

    A parser that resolves `$ref` references in JSON Schema definitions and provides the ability to look up the
    dereferenced definition content based on a "dot notation" path within a deep object.  See the documentation for
    details:

    https://github.com/the-t-in-rtf/gpii-json-schema/blob/GPII-1336/docs/parser.md

*/
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var $RefParser = $RefParser || require("json-schema-ref-parser");
var jsonpointer = jsonpointer || require("jsonpointer.js");

fluid.registerNamespace("gpii.schema.parser");

/**
 * Dereference all `$ref` links for a single schema. See the documentation for details.
 *
 * https://github.com/the-t-in-rtf/gpii-json-schema/blob/GPII-1336/docs/parser.md#gpiischemaparserdereferenceschemathat-schemapath-schemakey
 *
 * @param that - The parser component itself.
 * @param schemaPath {String} - The filesystem path or URI where we can find the schema referenced by `schemaKey`.
 * @param schemaKey {String} - The filename/id of the schema we are dereferencing.
 * @returns A `fluid.promise` that will be resolved once the parser has finished dereferencing the schema.
 *
 */
gpii.schema.parser.dereferenceSchema = function (that, schemaPath, schemaKey) {
    var parser = new $RefParser(); // jshint ignore:line
    var pathOrUri = fluid.stringTemplate(that.options.uriTemplate, { schemaPath: schemaPath, schemaKey: schemaKey});
    var promise = fluid.promise();
    parser.dereference(pathOrUri, that.options.parserOptions, gpii.schema.parser.getParserCallback(that, schemaKey, promise));
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
            that.dereferencedSchemas[schemaKey] = schema;
            promise.resolve(schema);
        }
    };
};

/**
 *
 * Look up the full dereferenced definition for a single field.  See the documentation for details:
 *
 * https://github.com/the-t-in-rtf/gpii-json-schema/blob/GPII-1336/docs/parser.md#gpiischemaparserresolvejsonpointerthat-schemakey-schemafieldpath
 *
 * @param that - The parser component itself.
 * @param defaultSchemaKey {String} - The schema key to use when referring to pointers like `#/`
 * @param rawJsonPointer {String} - The JSON pointer to resolve.
 * @returns The piece of the JSON Schema referred to by rawJonPointer, or undefined if that cannot be found.
 */
gpii.schema.parser.resolveJsonPointer = function (that, defaultSchemaKey, rawJsonPointer) {
    // If we are dealing with a remote reference like `filename.json#/definition/foo`, use the remote schema key.
    // Otherwise, for references like '#/definition/bar` use `defaultSchemaKey`.
    var segments = rawJsonPointer.split("#");
    var schemaKey = segments[0] !== "" ? segments[0] : defaultSchemaKey;
    var jsonPointer = segments[0] !== "" ? "#" + segments[1] : rawJsonPointer;

    var dereferencedSchema = that.dereferencedSchemas[schemaKey];
    if (dereferencedSchema) {
        return jsonpointer.get(dereferencedSchema, jsonPointer);
    }
    else {
        fluid.fail("Cannot find schema '" + schemaKey + "', which is required to resolve the given JSON pointer...");
    }
};

/**
 *
 * Look up the error metadata for a single field and use that to "evolve" the raw validator output. See the
 * documentation for details:
 *
 * https://github.com/the-t-in-rtf/gpii-json-schema/blob/GPII-1336/docs/parser.md#gpiischemaparserevolveerrormessagethat-schemakey-error
 *
 * @param that - The parser component itself.
 * @param schemaKey {String} - The filename/id of the JSON Schema we are working with.
 * @param error {Object} - The validator error to be evolved.
 * @returns An "evolved" copy of the original error.
 */
gpii.schema.parser.evolveError = function (that, schemaKey, error) {
    var evolvedError = fluid.copy(error);

    // We start with `error.schemaPath`, which will be something like `#/properties/password/allOf/1/pattern`.
    if (error.schemaPath) {
        var isRequiredError = error.schemaPath.match("/required$");
        var failurePointer = isRequiredError ? gpii.schema.parser.getRequiredFieldPointer(that, schemaKey, error.schemaPath, error.params.missingProperty) : error.schemaPath;

        // Check the document level for definitions first.
        var documentErrorDefinitions = that.resolveJsonPointer(schemaKey, "#/errors");
        if (documentErrorDefinitions && documentErrorDefinitions[failurePointer]) {
            evolvedError.message = documentErrorDefinitions[failurePointer];
        }
        // If we have not found anything at the document level, inspect the field itself.
        else {
            var fieldErrorsPointer = gpii.schema.parser.getFieldErrorsFromFailure(error.schemaPath);
            var fieldErrorsDefinition = that.resolveJsonPointer(schemaKey, fieldErrorsPointer);
            var failureKey = gpii.schema.parser.getLastJsonPointerSegment(failurePointer);

            if (fieldErrorsDefinition && fieldErrorsDefinition[failureKey]) {
                evolvedError.message = fieldErrorsDefinition[failureKey];
            }
        }
    }

    return evolvedError;
};

/**
 *
 * Static function to strip the last part of a JSON pointer. If we are already at the top (i.e. `#/`), we will stay at the top.
 *
 * @param jsonPointer {String} - The original JSON pointer.
 * @returns A {string} representing the immediate parent of the original pointer.
 */
gpii.schema.parser.getParentJsonPointer = function (jsonPointer) {
    if (jsonPointer) {
        var allButLastSegment = jsonPointer.split("/").slice(0, -1).join("/");
        // We have to append a trailing slash if we are already at the top of the chain
        return allButLastSegment === "#" ?  "#/" : allButLastSegment;
    }
};

/**
 *
 * Static function to add a `childPath` to an existing JSON pointer.  If keys in the path contain literal slashes
 * or tildes, you are expected to escape them yourself, ~0 in place of literal tildes, and ~1 in place of literal
 * slashes in a key name.
 *
 * @param jsonPointer {String} - The original JSON pointer.
 * @param childPath {String} - The child segment(s) to add to the original pointer.
 * @returns A {string} representing the child JSON pointer.
 *
 */
gpii.schema.parser.getChildJsonPointer = function (jsonPointer, childPath) {
    var pointerSegments = (jsonPointer === "#/") ? ["#"] : jsonPointer.split("/");
    return pointerSegments.concat(childPath).join("/");
};

/**
 *
 * Static function to determine the JSON pointer to an error definition given the JSON pointer to the failure returned
 * by AJV. We will begin with something like `#/field1/type` and return something like `#/field1/errors`.
 *
 * @param failurePointer {String} - A JSON pointer representing the failing rule as reporting by AJV.
 * @returns An {Object} representing the `errors` block for the given field.
 *
 */
gpii.schema.parser.getFieldErrorsFromFailure = function (failurePointer) {
    var parentJsonPointer = gpii.schema.parser.getParentJsonPointer(failurePointer);
    return gpii.schema.parser.getChildJsonPointer(parentJsonPointer, "errors");
};


/**
 *
 * Static function to determine the JSON pointer that points to a missing required field.  Since required fields are
 * defined in arrays within the enclosing object, these will be references like `#/required/1`.
 *
 * @param that - The parser component itself.
 * @param schemaKey {String} - The filename/id of the schema we are working with.
 * @param failurePointer {String} - A JSON pointer representing the validation rule that was broken.
 * @param propertyToMatch {String} - The missing property as reported by AJV.
 * @returns A JSON pointer {String} that can be used to look up the relevant error data from the schema.
 *
 */
gpii.schema.parser.getRequiredFieldPointer = function (that, schemaKey, failurePointer, propertyToMatch) {
    var requireDefinitions = that.resolveJsonPointer(schemaKey, failurePointer);
    var requirementIndex = fluid.find(requireDefinitions, function (value, index) {
        if (value === propertyToMatch) { return index; }
    });

    // The path to the message is relative to the parent
    if (requirementIndex !== undefined && requirementIndex !== null) {
        var parentPointer = gpii.schema.parser.getParentJsonPointer(failurePointer);
        var errorsPointer = gpii.schema.parser.getChildJsonPointer(parentPointer, "required");
        return gpii.schema.parser.getChildJsonPointer(errorsPointer, requirementIndex);
    }
    else {
        return undefined;
    }
};

/**
 *
 * A static function to return the last segment of a given JSON pointer.
 *
 * @param jsonPointer {String} - The original JSON pointer.
 * @returns A {String} representing the last segment of the original pointer.
 */
gpii.schema.parser.getLastJsonPointerSegment = function (jsonPointer) {
    var segments = jsonPointer.split("/");
    return segments[segments.length - 1];
};

/**
 *
 * A model listener to dereference and cache a dereferenced version of schemas as they are added to `model.schemas`.
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
        dereferencedSchemas: {},
        isReady: false
    },
    invokers: {
        dereferenceSchema: {
            funcName: "gpii.schema.parser.dereferenceSchema",
            args: ["{that}", "{that}.options.schemaPath", "{arguments}.0"] // schemaPath, callback
        },
        resolveJsonPointer: {
            funcName: "gpii.schema.parser.resolveJsonPointer",
            args:     ["{that}", "{arguments}.0", "{arguments}.1"] // schemaKey, jsonPointer
        },
        evolveError: {
            funcName: "gpii.schema.parser.evolveError",
            args:     ["{that}", "{arguments}.0", "{arguments}.1"] // schemaKey, jsonPointer
        }
    },
    listeners: {
        "onSchemasUpdated.indicateReadiness": {
            funcName: "fluid.set",
            args:     ["{that}", "isReady", true]

        }
    },
    modelListeners: {
        schemas: {
            funcName:      "gpii.schema.parser.updateSchemas",
            args:          ["{that}", "{arguments}.0"]
        }
    }
});