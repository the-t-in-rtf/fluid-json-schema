/* eslint-env browser */
/* globals require, Ajv */
(function (fluid, AJV) {
    "use strict";

    if (typeof require !== "undefined") {
        fluid = require("infusion");
        AJV = require("ajv");
        require("./gss-metaschema");
        require("./validation-errors");
    }

    var gpii  = fluid.registerNamespace("gpii");

    fluid.registerNamespace("gpii.schema.validator");

    gpii.schema.validator.defaultI18nKeysByRule = {
        "": "schema-validator-general-failure",
        "additionalItems": "schema-validator-additionalItems",
        "additionalProperties": "schema-validator-additionalProperties",
        "anyOf": "schema-validator-anyOf",
        "contains": "schema-validator-contains",
        "else": "schema-validator-else",
        "enum": "schema-validator-enum",
        "exclusiveMaximum": "schema-validator-exclusiveMaximum",
        "exclusiveMinimum": "schema-validator-exclusiveMinimum",
        "format": "schema-validator-format",
        "if": "schema-validator-if",
        "maxItems": "schema-validator-maxItems",
        "maxLength": "schema-validator-maxLength",
        "maxProperties": "schema-validator-maxProperties",
        "maximum": "schema-validator-maximum",
        "minItems": "schema-validator-minItems",
        "minLength": "schema-validator-minLength",
        "minProperties": "schema-validator-minProperties",
        "minimum": "schema-validator-minimum",
        "multipleOf": "schema-validator-multipleOf",
        "not": "schema-validator-not",
        "oneOf": "schema-validator-oneOf",
        "pattern": "schema-validator-pattern",
        "patternProperties": "schema-validator-patternProperties",
        "propertyNames": "schema-validator-propertyNames",
        "required": "schema-validator-required",
        "then": "schema-validator-then",
        "type": "schema-validator-type",
        "uniqueItems": "schema-validator-uniqueItems"
    };

    /**
     *
     * Validate material against a "GPII Schema System" schema.
     *
     * @param {Any} toValidate - The material to be validated.
     * @param {Object} gssSchema - A GSS schema definition.
     * @param {Object} ajvOptions - Optional arguments to pass to the underlying AJV validator.
     * @return {Object} - An object that describes the results of validation.  The `isValid` property will be `true` if the data is valid, or `false` otherwise.  The `isError` property will be set to `true` if there are validation errors.
     *
     */
    gpii.schema.validator.validate = function (toValidate, gssSchema, ajvOptions) {
        ajvOptions = ajvOptions || {
            verbose: false,  // Prevent invalid data (such as passwords) from being displayed in error messages
            messages: false, // Ignore AJV's error messages.
            allErrors: true  // Generate a complete list of errors rather than stopping on the first failure.
        };
        var ajv = new AJV(ajvOptions);
        ajv.addMetaSchema(gpii.schema.metaSchema);

        // Validate the GSS schema against the metaschema before proceeding.
        var gssSchemaValid = ajv.validateSchema(gssSchema);
        if (gssSchemaValid) {
            // We have to validate against a transformed copy of the original rawSchema so that AJV can enforce our
            // required fields, which it would otherwise ignore.
            var rawSchema = gpii.schema.gssToJsonSchema(gssSchema);
            var validator = ajv.compile(rawSchema);
            validator(toValidate);

            return gpii.schema.validator.standardiseAjvErrors(gssSchema, validator.errors);
        }
        else {
            return { isError: true, message: "Invalid GSS Schema:\n" + JSON.stringify(ajv.errors, null, 2) };
        }
    };

    /**
     *
     * Strip empty elements from an array.  Used to handle leading delimiters, such as `.path.to.something`, where we
     * aren't interested in the implicit leading empty string before the first dot.  Only strings and integers are allowed.
     *
     * NOTE: This function is a non-API function, i.e. one that assists public functions in performing their work, but
     * which is not guaranteed to remain available.
     *
     * @param {String} item - An item to be evaluated.
     * @return {Boolean} - True if the item is of non-zero length, false otherwise.
     */
    gpii.schema.removeEmptyItems = function (item) { return (typeof item === "string" && item.length) || Number.isInteger(item); };

    /**
     *
     * Extract a standardised set of EL path segments that point to a piece of data that breaks a validation rule.  The
     * handling of "required" fields is standardised to the JSON Schema v3 convention, i.e. the path returned is to
     * the missing element rather than the parent element that should contain the missing element.
     *
     * NOTE: This function is a non-API function, i.e. one that assists public functions in performing their work, but
     * which is not guaranteed to remain available.
     *
     * @param {Object} rawError - A single validation error as returned by AJV.
     * @return {Array.<String>} - An array of EL path segments representing the path to the invalid or missing material.
     *
     */
    gpii.schema.validator.extractElDataPathSegmentsFromError = function (rawError) {
        // We have to use this approach so that we can correctly break up dataPath values that contain escaped dots and apostrophes, i.e. `normal.['dotted.field'].alsoNormal`.
        var rawPathSegments = rawError.dataPath.match(/(([^\[\.]+)|\['(.+)'\])/g) || [];
        var ajvPathSegments = fluid.transform(rawPathSegments, function (pathSegment) {
            // Extract the inner value from enclosing brackets and quotes and remove backslashes.
            return pathSegment.replace(/\['(.+)'\]/, "$1").replace(/\\/g, "");
        });

        if (rawError.keyword === "required") {
            ajvPathSegments.push(gpii.schema.validator.trimLeadingDot(rawError.params.missingProperty));
        }

        return ajvPathSegments;
    };


    /**
     *
     * Standardise the path to the failing rule within a GSS schema based on a raw AJV validation error.
     *
     * NOTE: This function is a non-API function, i.e. one that assists public functions in performing their work, but
     * which is not guaranteed to remain available.
     *
     * @param {Object} ajvError - A single raw validation error as returned by AJV.
     * @return {Array.<String>} - An array of EL path segments that point to the failing rule in the schema.
     */
    gpii.schema.validator.extractElSchemaPathSegmentsFromError = function (ajvError) {
        var rawSegments = gpii.schema.validator.jsonPointerToElPath(ajvError.schemaPath);
        if (ajvError.keyword === "required") {
            var segmentsToContainingElement = rawSegments.slice(0,-1);
            var segmentsToRequiredRule = segmentsToContainingElement.concat(["properties", gpii.schema.validator.trimLeadingDot(ajvError.params.missingProperty), "required"]);
            return segmentsToRequiredRule;
        }
        else {
            return rawSegments;
        }
    };

    /**
     *
     * Trim a leading dot if found.  Required because the `missingProperty` field used by AJV is sometimes (but not always) preceded by a leading dot.
     *
     * NOTE: This function is a non-API function, i.e. one that assists public functions in performing their work, but
     * which is not guaranteed to remain available.
     *
     * @param {String} rawSegment - The string to be sanitised.
     * @return {String} - The string, with a leading dot removed.
     */
    gpii.schema.validator.trimLeadingDot = function (rawSegment) {
        return typeof rawSegment === "string" && rawSegment.indexOf(".") === 0 ? rawSegment.substring(1) : rawSegment;
    };

    /**
     *
     * Convert a JSON Pointer (https://tools.ietf.org/html/rfc6901) to a set of EL Path segments that can be used with
     * `fluid.get`.
     *
     * @param {String} jsonPointer - A JSON pointer.
     * @return {Array<String>} - An array of strings representing the path to the same location as EL path segments.
     *
     */
    gpii.schema.validator.jsonPointerToElPath = function (jsonPointer) {
        // Discard the leading portion of the URL content if it's found.
        var rawSegments = jsonPointer.substring(jsonPointer.indexOf("#") + 1).split("/").filter(gpii.schema.removeEmptyItems);
        // Handle slash escaping, 'this~1that` => `this/that` and tilde escaping, `topsy~0turvy` => `topsy~turvy`
        var unescapedSegments = fluid.transform(rawSegments, function (segment) {
            return segment.replace("~1", "/").replace("~0", "~");
        });
        return unescapedSegments;
    };

    /**
     *
     * Examine an EL path to a failing rule within a GSS schema, looking for help in presenting a cleaner error
     * message.  Error definitions look like:
     *
     * {
     *  "short": {
     *      "type": "string",
     *      "errors": "short-invalid-generic-message-key"
     *  },
     *  "long": {
     *      "format": "long-invalid-format-invalid-key",
     *      "required": "long-required-key",
     *      "": "long-invalid-key"
     *  }
     * }
     *
     * When using the "long" notation, you can still fail over to a generic message using the key `""`, as shown above.
     *
     * NOTE: This function is a non-API function, i.e. one that assists public functions in performing their work, but
     * which is not guaranteed to remain available.
     *
     * @param {Array<String>} rulePath - An array of EL path segments.
     * @param {Object} gssSchema - A GSS schema.
     * @param {String} defaultMessage - The default message to use if no information is found in the schema.
     * @return {String} - A message key for the given error, or the unaltered default message if no message key is found.
     *
     */
    gpii.schema.validator.errorHintForRule = function (rulePath, gssSchema, defaultMessage) {
        defaultMessage = defaultMessage || gpii.schema.validator.defaultI18nKeysByRule["schema-validator-general-failure"];
        var enclosingDefinitionSegments = rulePath.slice(0, -1);
        var finalRuleSegment = rulePath[rulePath.length - 1];

        var errorsDef = fluid.get(gssSchema, enclosingDefinitionSegments.concat("errors"));
        // "short" notation.
        if (typeof errorsDef === "string") {
            return errorsDef;
        }
        // "long" notation.
        else {
            var ruleErrorKey = fluid.get(errorsDef, finalRuleSegment);
            if (ruleErrorKey) {
                return ruleErrorKey;
            }
            else {
                var fieldErrorKey = fluid.get(errorsDef, [""]);
                if (fieldErrorKey) { return fieldErrorKey; }
            }
        }

        // If we haven't found any information to help provide an error message key, look for a global default for the
        // rule type.  If none is found, return the underlying message from AJV.
        return gpii.schema.validator.defaultI18nKeysByRule[finalRuleSegment] || defaultMessage;
    };

    /**
     *
     * Standardise any AJV errors received so that they return our standard format.  If there are no validation errors,
     * the return value should look like:
     *
     * { isValid: true }
     *
     * If there are validation errors, the return value should look like:
     *
     * {
     *  isValid: false,
     *  errors: [
     *      {
     *          dataPath: ["requiredField"],
     *          schemaPath: ["properties", "requiredField", "required"],
     *          rule: { required: true },
     *          message: "validation-required-field-missing"
     *      },
     *      {
     *          dataPath: ["deep", "booleanField"],
     *          schemaPath: ["properties", "deep", "properties", "booleanField", "type"],
     *          rule: { type: "boolean" },
     *          message: "validation-invalid-field-type"
     *      }
     *  ]
     * }
     *
     * Note that as in the examples above, the FSL metaschema defines "error hints" that result in message keys
     * being returned.
     *
     * NOTE: This function is a non-API function, i.e. one that assists public functions in performing their work, but
     * which is not guaranteed to remain available.
     *
     * @param {Object} gssSchema - A GSS schema.
     * @param {Object|Boolean} ajvErrors - The raw errors returned by AJV, if there are any, or `false` if there are no validation Errors.
     * @return {Object} - An object detailing the validation results (see above).
     *
     */
    gpii.schema.validator.standardiseAjvErrors = function (gssSchema, ajvErrors) {
        if (ajvErrors) {
            var transformedErrors = fluid.transform(ajvErrors, function (ajvError) {
                var error         = {};

                error.dataPath = gpii.schema.validator.extractElDataPathSegmentsFromError(ajvError);

                var schemaPath = gpii.schema.validator.extractElSchemaPathSegmentsFromError(ajvError);
                error.schemaPath = schemaPath;

                // Backtrack from the full path one step so that we get a bit more context, i.e. `{ "type": "string" }` instead of `string`.
                var fullRulePath = schemaPath.slice(0, -1);
                error.rule = fluid.get(gssSchema, fullRulePath);

                // Use any error hints found for the failing path in the schema, failing over to the AJV message.
                error.message = gpii.schema.validator.errorHintForRule(schemaPath, gssSchema, ajvError.message);

                return error;
            });
            return {
                isValid: false,
                errors: transformedErrors
            };
        }
        else {
            return { isValid: true, errors: [] };
        }
    };

    fluid.registerNamespace("gpii.schema.validator");
    gpii.schema.validator.defaultLocalisationTransformRules = {
        "data": "data",
        "error": "error"
    };

    /**
     *
     * A function to translate/localise validation errors.
     *
     * If you want to pass a custom message bundle to this function, it should only contain top-level elements, see
     * ./src/js/validation-errors.js in this package for an example.
     *
     * @param {Array<Object>} validationErrors - An array of validation errors, see `gpii.schema.validator.standardiseAjvErrors` for details.
     * @param {Any} validatedData - The (optional) data that was validated.
     * @param {Object} messages - An (optional) map of message templates (see above).  Defaults to the message bundle provided by this package.
     * @param {Object} localisationTransform - An optional set of rules that control what information is available when localising validation errors (see above).
     * @return {Array<Object>} - The validation errors, with all message keys replaced with localised strings.
     *
     */
    gpii.schema.validator.localiseErrors = function (validationErrors, validatedData, messages, localisationTransform) {
        messages = messages || gpii.schema.messages.validationErrors;
        localisationTransform = localisationTransform || gpii.schema.validator.defaultLocalisationTransformRules;
        var localisedErrors = fluid.transform(validationErrors, function (validationError) {
            var messageTemplate = fluid.get(messages, validationError.message);
            var data = validatedData && fluid.get(validatedData, validationError.dataPath);
            var localisationContext = fluid.model.transformWithRules({ data: data, error: validationError}, localisationTransform);
            var localisedMessage = fluid.stringTemplate(messageTemplate, localisationContext);
            return fluid.merge({}, validationError, { message: localisedMessage});
        });
        return localisedErrors;
    };

    /**
     *
     * Convert a GSS schema to a standard JSON Schema.
     *
     * NOTE: This function is a non-API function, i.e. one that assists public functions in performing their work, but
     * which is not guaranteed to remain available.
     *
     * @param {Object} originalFsl - The FSL schema.
     * @return {Object} - The equivalent JSON Schema rules.
     *
     */
    gpii.schema.gssToJsonSchema = function (originalFsl) {
        var transformedSchema = gpii.schema.gssSegmentToJsonSchemaSegment(originalFsl);
        // Obviously this needs to be more flexibly defined.
        transformedSchema.$schema = "http://json-schema.org/draft-07/schema#";
        return transformedSchema;
    };

    /**
     *
     * Convert part of a GSS schema to its JSON Schema equivalent.  See `gpii.schema.gssToJsonSchema`.
     *
     * NOTE: This function is a non-API function, i.e. one that assists public functions in performing their work, but
     * which is not guaranteed to remain available.
     *
     * @param {Object} gssSegment - A sub-segment of a GSS schema.
     * @return {Object} - The same rules represented as a JSON Schema segment
     *
     */
    gpii.schema.gssSegmentToJsonSchemaSegment = function (gssSegment) {
        if (typeof gssSegment === "object" && gssSegment !== null) {
            var schemaSegment = Array.isArray(gssSegment) ? [] : {};

            var childProperties = fluid.get(gssSegment, "properties");
            if (childProperties) {
                var requiredFields = gpii.schema.deriveRequiredProperties(childProperties);
                if (requiredFields && requiredFields.length) {
                    schemaSegment.required = requiredFields;
                }
            }

            // If the GSS segment is an object, filter out our distinct keys such as `required` and `errors`.
            var filteredSegment = Array.isArray(gssSegment) ? gssSegment : fluid.filterKeys(gssSegment, ["required", "hint", "errors", "enumLabels"], true);
            fluid.each(filteredSegment, function (value, key) {
                // Preserve the value, making sure to give each nested object a chance to pull up its own list of required fields.
                if (typeof value === "object") {
                    // Handle "properties" objects separately to avoid stripping out the above reserved words from non-definitions.
                    if (key === "properties") {
                        schemaSegment[key] = fluid.transform(value, gpii.schema.gssSegmentToJsonSchemaSegment);
                    }
                    else {
                        schemaSegment[key] = gpii.schema.gssSegmentToJsonSchemaSegment(value);
                    }
                }
                else {
                    schemaSegment[key] = value;
                }
            });
            return schemaSegment;
        }
        else {
            return gssSegment;
        }
    };

    /**
     *
     * As of JSON Schema draft v4, the `required` property is now a property of the enclosing element.  FSL uses the v3
     * syntax, where `required` is a property of the object itself.  This function converts FSL-style properties to an
     * array of required "child" elements that can be used to represent the same list of required fields in modern JSON
     * Schema syntax.
     *
     * NOTE: This function is a non-API function, i.e. one that assists public functions in performing their work, but
     * which is not guaranteed to remain available.
     *
     * @param {Object} propertiesObject - The `properties` portion of a JSON Schema object definition.
     * @return {Array<String>} - An array of the property keys that are flagged as required.
     *
     */
    gpii.schema.deriveRequiredProperties = function (propertiesObject) {
        var requiredChildren = [];
        fluid.each(propertiesObject, function (value, key) {
            // "pull up" the "required:true" values from our properties.
            var childRequired = fluid.get(value, "required");
            if (childRequired) {
                requiredChildren.push(key);
            }
        });
        return requiredChildren;
    };
})(fluid, typeof Ajv !== "undefined" ? Ajv : false);

