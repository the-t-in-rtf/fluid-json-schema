// A static function to "evolve" an error using the proposed v5 "errors" option. See the documentation for details:
//
// https://github.com/the-t-in-rtf/gpii-json-schema/blob/master/docs/errors.md
//
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.schema.errors");

/**
 *
 * Look up the error metadata for a single field and use that to "evolve" the raw validator output.
 *
 * @param schemaContent {Object} - The full dereferenced content of the schema we are working with.
 * @param error {Object} - The validator error to be evolved.
 * @returns An "evolved" copy of the original error.
 */
gpii.schema.errors.evolveError = function (schemaContent, error) {
    var evolvedError = fluid.copy(error);

    // We start with `error.schemaPath`, which will be something like `#/properties/password/allOf/1/pattern`.
    if (error.schemaPath) {
        var isRequiredError = error.schemaPath.match("/required$");
        //gpii.schema.pointers.getRequiredFieldPointer = function (schemaContent, failurePointer, propertyToMatch) {
        var failurePointer = isRequiredError ? gpii.schema.pointers.getRequiredFieldPointer(schemaContent, error.schemaPath, error.params.missingProperty) : error.schemaPath;

        // Check the document level for definitions first.
        var documentErrorDefinitions = gpii.schema.pointers.resolveJsonPointer(schemaContent, "#/errors");
        if (documentErrorDefinitions && documentErrorDefinitions[failurePointer]) {
            evolvedError.message = documentErrorDefinitions[failurePointer];
        }
        // If we have not found anything at the document level, inspect the field itself.
        else {
            //gpii.schema.pointers.getFieldErrorsFromFailure = function (failurePointer) {
            var fieldErrorsPointer = gpii.schema.pointers.getFieldErrorsFromFailure(error.schemaPath);
            // TODO;  Make into a static call
            //gpii.schema.pointers.resolveJsonPointer = function (schemaContent, jsonPointer) {
            var fieldErrorsDefinition = gpii.schema.pointers.resolveJsonPointer(schemaContent, fieldErrorsPointer);
            //gpii.schema.pointers.getLastJsonPointerSegment = function (jsonPointer) {
            var failureKey = gpii.schema.pointers.getLastJsonPointerSegment(failurePointer);

            if (fieldErrorsDefinition && fieldErrorsDefinition[failureKey]) {
                evolvedError.message = fieldErrorsDefinition[failureKey];
            }
        }
    }

    return evolvedError;
};

