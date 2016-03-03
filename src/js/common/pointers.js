/**
 *
 * Static functions used to work with JSON pointers.
 *
 */
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var jsonpointer = jsonpointer || require("jsonpointer.js");

fluid.registerNamespace("gpii.schema.pointers");

/**
 *
 * @param schemaContent {Object} - The full dereferenced content of the schema we are working with.
 * @param rawJsonPointer {String} - The JSON pointer to resolve.
 * @returns The piece of the JSON Schema referred to by rawJonPointer, or undefined if that cannot be found.
 *
 */
gpii.schema.pointers.resolveJsonPointer = function (schemaContent, jsonPointer) {
    return jsonpointer.get(schemaContent, jsonPointer);
};

/**
 *
 * Static function to strip the last part of a JSON pointer. If we are already at the top (i.e. `#/`), we will stay at the top.
 *
 * @param jsonPointer {String} - The original JSON pointer.
 * @returns A {string} representing the immediate parent of the original pointer.
 */
gpii.schema.pointers.getParentJsonPointer = function (jsonPointer) {
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
gpii.schema.pointers.getChildJsonPointer = function (jsonPointer, childPath) {
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
gpii.schema.pointers.getFieldErrorsFromFailure = function (failurePointer) {
    var parentJsonPointer = gpii.schema.pointers.getParentJsonPointer(failurePointer);
    return gpii.schema.pointers.getChildJsonPointer(parentJsonPointer, "errors");
};


/**
 *
 * Static function to determine the JSON pointer that points to a missing required field.  Since required fields are
 * defined in arrays within the enclosing object, these will be references like `#/required/1`.
 *
 * @param schemaContent {Object} - The full dereferenced content of the schema we are working with.
 * @param failurePointer {String} - A JSON pointer representing the validation rule that was broken.
 * @param propertyToMatch {String} - The missing property as reported by AJV.
 * @returns A JSON pointer {String} that can be used to look up the relevant error data from the schema.
 *
 */
gpii.schema.pointers.getRequiredFieldPointer = function (schemaContent, failurePointer, propertyToMatch) {
    var requireDefinitions = gpii.schema.pointers.resolveJsonPointer(schemaContent, failurePointer);

    var requirementIndex = fluid.find(requireDefinitions, function (value, index) {
        if (value === propertyToMatch) { return index; }
    });

    // The path to the message is relative to the parent
    if (requirementIndex !== undefined && requirementIndex !== null) {
        var parentPointer = gpii.schema.pointers.getParentJsonPointer(failurePointer);
        var errorsPointer = gpii.schema.pointers.getChildJsonPointer(parentPointer, "required");
        return gpii.schema.pointers.getChildJsonPointer(errorsPointer, requirementIndex);
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
gpii.schema.pointers.getLastJsonPointerSegment = function (jsonPointer) {
    var segments = jsonPointer.split("/");
    return segments[segments.length - 1];
};
