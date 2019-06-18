/* eslint-env browser */
/* globals require, Ajv */
var fluid  = fluid  || {};
(function (fluid, Ajv) {
    "use strict";

    if (!fluid.identity) {
        fluid = require("infusion");
    }

    if (fluid.require) {
        require("./gss-metaschema");
        require("./validation-errors");
        require("./hashString");
        require("./orderedStringify");
    }

    if (!Ajv) {
        Ajv = require("ajv");
    }

    var gpii  = fluid.registerNamespace("gpii");

    fluid.registerNamespace("gpii.schema.validator");

    gpii.schema.validator.defaultI18nKeysByRule = {
        "": "gpii.schema.messages.validationErrors.generalFailure",
        "anyOf": "gpii.schema.messages.validationErrors.anyOf",
        "contains": "gpii.schema.messages.validationErrors.contains",
        "dependencies": "gpii.schema.messages.validationErrors.dependencies",
        "else": "gpii.schema.messages.validationErrors.else",
        "enum": "gpii.schema.messages.validationErrors.enum",
        "exclusiveMaximum": "gpii.schema.messages.validationErrors.exclusiveMaximum",
        "exclusiveMinimum": "gpii.schema.messages.validationErrors.exclusiveMinimum",
        "format": "gpii.schema.messages.validationErrors.format",
        "maxItems": "gpii.schema.messages.validationErrors.maxItems",
        "maxLength": "gpii.schema.messages.validationErrors.maxLength",
        "maxProperties": "gpii.schema.messages.validationErrors.maxProperties",
        "maximum": "gpii.schema.messages.validationErrors.maximum",
        "minItems": "gpii.schema.messages.validationErrors.minItems",
        "minLength": "gpii.schema.messages.validationErrors.minLength",
        "minProperties": "gpii.schema.messages.validationErrors.minProperties",
        "minimum": "gpii.schema.messages.validationErrors.minimum",
        "multipleOf": "gpii.schema.messages.validationErrors.multipleOf",
        "not": "gpii.schema.messages.validationErrors.not",
        "oneOf": "gpii.schema.messages.validationErrors.oneOf",
        "pattern": "gpii.schema.messages.validationErrors.pattern",
        "propertyNames": "gpii.schema.messages.validationErrors.propertyNames",
        "required": "gpii.schema.messages.validationErrors.required",
        "then": "gpii.schema.messages.validationErrors.then",
        "type": "gpii.schema.messages.validationErrors.type",
        "uniqueItems": "gpii.schema.messages.validationErrors.uniqueItems"
    };

    gpii.schema.validator.defaultAjvOptions = {
        // Generate a complete list of errors rather than stopping on the first failure.
        allErrors: true,

        // Ignore AJV's error messages.
        messages: false,

        // Increase the precision of "multipleOf" checks beyond integers.
        // See https://github.com/epoberezkin/ajv#advanced-options
        multipleOfPrecision: 10,

        // Prevent invalid data (such as passwords) from being displayed in error messages
        verbose: false
    };

    // JSDoc complex type definitions for our functions.
    /**
     * @typedef ajvError
     * @property {String} keyword - Validation keyword, which is typically the name of the rule that was violated.
     * @property {String} dataPath - The path to the part of the data that failed validation, by default represented using JSON Pointer notation.
     * @property {String} schemaPath - The path (JSON Pointer) to the part of the schema that was violated.
     * @property {Object} [params] - Additional information about the error, for example, the name of a missing required field.
     * @property {String} [message] - The standard error message provided by AJV (disabled by default).
     * @property {Object} [schema] - The schema of the keyword, i.e. the text of the rule that was broken (disabled by default).
     * @property {Object} [parentSchema] - The "parent schema", i.e. the schema of the element enclosing the keyword whose rule was broken (disabled by default).
     * @property {Any} [data] - The data validated by the keyword (disabled by default to avoid displaying sensitive data such as invalid passwords).
     *
     * @typedef ajvErrors
     * @property {Array<ajvError>} [errors] - The errors returned during the validation run.
     *
     * @typedef GssSchema
     * @property {String} [$id] - The ID for this schema (not typically used in GSS schemas, but allowed).
     * @property {String} [$schema] - The URI where the "metaschema" (version of the GSS language) can be found.
     * @property {String} [$ref] - Replace material at this point with external material at the given URL.  The only allowed value for this in GSS is the GSS schema itself.
     * @property {String} [$comment] - A comment, presumably about this level of the schema.
     * @property {String} [title] - A title for the material represented by this part of the schema.
     * @property {String} [description] - A description of the material represented by this part of the schema.
     * @property {Boolean} [required] - Whether or not a value is required at this point in the schema.
     * @property {Any} [default] - The default value for the material represented by this part of the schema.
     * @property {GssSchema} [if] - A sub-schema that will be used to conditionally check content.  Must be used in combination with `then` or `else`.
     * @property {GssSchema} [then] - If the material is valid according to the `if` sub-schema, it must also follow these rules.
     * @property {GssSchema} [else] - If the material is invalid according to the `if` sub-schema, it must follow these rules.
     * @property {Array<GssSchema>} [allOf] - The material must match all of the supplied sub-schemas.
     * @property {Array<GssSchema>} [anyOf] - The material must match one or more of the supplied sub-schemas.
     * @property {Array<GssSchema>} [oneOf] - The material must match exactly one of the supplied sub-schemas.
     * @property {GssSchema} [not] - The material must not match the supplied sub-schema.
     * @property {String} [hint] - A UI "hint" for a user entering the value.  Typically a  message key rather than a literal value.
     * @property {Object<String,String>} [errors] - Replacements for the default error messages, keyed by the failing "keyword", or "" for all failures.  The value is a string template.
     * @property {Object.<String,GssSchema>} [definitions] - An object containing reusable pieces of schema material.  Not usable outside of the metaschema itself.
     * @property {Boolean} [readOnly] - Whether or not this part of the schema is "read only".
     * @property {Array} [examples] - One or more examples of allowed values.
     * @property {Any} [const] - A literal value that the value must exactly match.
     * @property {Array} [enum] - An array of literal allowed values.
     * @property {Array<String>} [enumLabels] - An array of string labels to describe the `enum` values in a UI.
     * @property {String} [type] - The type of material described by this part of the schema.  Must be one of "number", "integer", "string", "array", or "object".
     * @property {GssSchema|Boolean} [additionalItems] - (For array types), if `items` is defined as an array of schemas, `additionalItems` will cover any additional entries.
     * @property {GssSchema} [contains] - (For array types), at least one item must match the supplied sub-schema.
     * @property {GssSchema|Array<GssSchema>} [items] - (For array types), either a literal schema for all items, or an array of schemas, in the order of the array items that are expected.
     * @property {Number} [maxItems] - (For array types), the maximum number of items allowed.
     * @property {Number} [minItems] - (For array types), the minimum number of items allowed.
     * @property {Boolean} [uniqueItems] - (For array types), whether or not all items must be unique.
     * @property {Number} [exclusiveMaximum] - (For numeric types), the value must be less than this number.
     * @property {Number} [exclusiveMinimum] - (For numeric types), the value must be more than this number.
     * @property {Number} [maximum] - (For numeric types), the maximum allowed value.
     * @property {Number} [minimum] - (For numeric types), the minimum allowed value.
     * @property {Number} [multipleOf] - (For numeric types), a number that the value must be a multiple of.
     * @property {GssSchema|Boolean}  [additionalProperties] - (For object types), a GSS schema describing rules that any properties not explicitly described in `properties` must follow.  If set to `false`, additional properties are disallowed.
     * @property {Object.<String,Array<String>>} [dependencies] - (For object types), an object whose keys are properties.  Each value represents field names that must also be present if the named field is found.
     * @property {Number} [maxProperties] - (For object types), the maximum number of properties allowed.
     * @property {Number} [minProperties] - (For object types), the minimum number of properties required.
     * @property {Object.<RegExp>} [patternProperties] - (For object types), an object keyed by regular expression.  If a property's name matches the regexp, it must match the associated schema.
     * @property {Object.<String,GssSchema>} [properties] - (For object types), the rules governing explicitly named properties.
     * @property {GssSchema} [propertyNames] - (For object types), a sub-schema describing the rules the property names must follow.
     * @property {Number} [maxLength] - (For string types), the maximum allowed length.
     * @property {Number} [minLength] - (For string types), the minimum required length.
     * @property {String} [format] - (For string types), a known format such as "email", "URI", or "date".
     * @property {String} [pattern] - (For string types), a regular expression the value must match.
     * @property {String} [contentEncoding] - (For string types), the RFC 2045 content encoding of the value, i.e. how to decode it as a binary object.
     * @property {String} [contentMediaType] - (For string types), the RFC 2046 media type.
     *
     */

    /**
     *
     * @typedef gssValidationError
     * @property {Array<String>} dataPath - The path to the failure within the validated material.
     * @property {Array<String>} schemaPath - The path to the broken rule within the GSS schema.
     * @property {GssSchema} rule - The specific "rule" that was broken, which is itself a GSS schema.
     * @property {String} message - An error message (or message key to be resolved to a localised/translated error message).
     *
     * @typedef gssValidationResults
     * @property {Boolean} isValid - `true` if the payload was valid according to the schema, `false` otherwise.
     * @property {Array<gssValidationError>} [errors] - If the payload was invalid, the details of the validation error(s).
     *
     */

    /**
     *
     * Validate material against a "GPII Schema System" schema using a precompiled AJV "validator".
     *
     * @param {Object} that - The validator component.
     * @param {GssSchema} gssSchema - A GSS schema definition.
     * @param {Any} toValidate - The material to be validated.
     * @param {String} [schemaHash] - An optional unique hash of the schema (used for cache lookups).
     * @return {gssValidationError} - An object that describes the results of validation.  The `isValid` property will be `true` if the data is valid, or `false` otherwise.  The `isError` property will be set to `true` if there are validation errors.
     *
     */
    gpii.schema.validator.validate = function (that, gssSchema, toValidate, schemaHash) {
        if (!schemaHash) {
            schemaHash = gpii.schema.hashString(gpii.schema.stringify(gssSchema));
        }

        var validator = that.validatorsByHash[schemaHash];
        if (!validator) {
            try {
                validator = gpii.schema.validator.compileSchema(gssSchema, that.options.ajvOptions);
                that.validatorsByHash[schemaHash] = validator;
            }
            catch (compileErrors) {
                return { isError: true, message: "Error compiling GSS Schema.", errors: compileErrors};
            }
        }

        validator(toValidate);
        return validator.standardiseAjvErrors();
    };

    /**
     * @param {GssSchema} gssSchema - A GSS schema definition.
     * @param {Object} ajvOptions - Optional arguments to pass to the underlying AJV validator.
     * @return {Object} - The compiled AJV validator.
     */
    gpii.schema.validator.compileSchema = function (gssSchema, ajvOptions) {
        ajvOptions = ajvOptions || gpii.schema.validator.defaultAjvOptions;

        // Validate the GSS schema against the metaschema before proceeding.
        var schemaValidationResults = gpii.schema.validator.validateSchema(gssSchema, ajvOptions);
        if (schemaValidationResults.isError) {
            throw schemaValidationResults.errors;
        }
        else {
            var ajv = new Ajv(ajvOptions);
            ajv.addMetaSchema(gpii.schema.metaSchema);

            // We have to validate against a transformed copy of the original rawSchema so that AJV can enforce our
            // required fields, which it would otherwise ignore.
            var rawSchema = gpii.schema.gssToJsonSchema(gssSchema);
            var validator = ajv.compile(rawSchema);
            validator.standardiseAjvErrors = function () {
                return gpii.schema.validator.standardiseAjvErrors(gssSchema, validator.errors);
            };
            return validator;
        }
    };

    /**
     *
     * @typedef schemaValidationResult
     * @property {Boolean} isError - `true` if there is a validation, `false` (or missing) otherwise.
     * @property {String} message - A summary of the result.
     * @property {Array<ajvError>} - An array of validation errors returned by AJV when validating the schema.
     *
     */

    /**
     *
     * Validate a "GPII Schema System" schema.
     *
     * @param {GssSchema} gssSchema - A GSS schema definition.
     * @param {Object} ajvOptions - Optional arguments to pass to the underlying AJV validator.
     * @return {schemaValidationResult} - An object that describes the results of validation.  The `isValid` property will be `true` if the data is valid, or `false` otherwise.  The `isError` property will be set to `true` if there are validation errors.
     *
     */
    gpii.schema.validator.validateSchema = function (gssSchema, ajvOptions) {
        ajvOptions = ajvOptions || gpii.schema.validator.defaultAjvOptions;
        var ajv = new Ajv(ajvOptions);
        ajv.addMetaSchema(gpii.schema.metaSchema);

        // Validate the GSS schema against the metaschema before proceeding.
        var gssSchemaValid = ajv.validateSchema(gssSchema);
        if (gssSchemaValid) {
            return {};
        }
        else {
            return { isError: true, message: "Invalid GSS Schema.", errors: ajv.errors};
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
     *
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
     * @param {ajvError} rawError - A single validation error as returned by AJV.
     * @return {Array.<String>} - An array of EL path segments representing the path to the invalid or missing material.
     *
     */
    gpii.schema.validator.extractElDataPathSegmentsFromError = function (rawError) {
        // We have to use this approach so that we can correctly break up dataPath values that contain escaped dots and apostrophes, i.e. `normal.['dotted.field'].alsoNormal`.
        var rawPathSegments = rawError.dataPath.match(/(([^\[\.]+)|\['([^\]]+)'\])/g) || [];
        var ajvPathSegments = fluid.transform(rawPathSegments, function (pathSegment) {
            // Extract the inner value from enclosing brackets and quotes and remove backslashes.
            return pathSegment.replace(/\['([^\]]+)'\]/, "$1").replace(/\\/g, "");
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
     * @param {ajvError} ajvError - A single raw validation error as returned by AJV.
     * @return {Array.<String>} - An array of EL path segments that point to the failing rule in the schema.
     *
     */
    gpii.schema.validator.extractElSchemaPathSegmentsFromError = function (ajvError) {
        var rawSegments = gpii.schema.validator.jsonPointerToElPath(ajvError.schemaPath);
        var segmentsToContainingElement = rawSegments.slice(0,-1);
        if (ajvError.keyword === "required") {
            var segmentsToRequiredRule = segmentsToContainingElement.concat(["properties", gpii.schema.validator.trimLeadingDot(ajvError.params.missingProperty), "required"]);
            return segmentsToRequiredRule;
        }
        else if (ajvError.keyword === "if") {
            var segmentsToFailingIfBranch = segmentsToContainingElement.concat([gpii.schema.validator.trimLeadingDot(ajvError.params.failingKeyword)]);
            return segmentsToFailingIfBranch;
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
     *
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
     * @param {GssSchema} gssSchema - A GSS schema.
     * @param {String} defaultMessage - The default message to use if no information is found in the schema.
     * @return {String} - A message key for the given error, or the unaltered default message if no message key is found.
     *
     */
    gpii.schema.validator.errorHintForRule = function (rulePath, gssSchema, defaultMessage) {
        defaultMessage = defaultMessage || gpii.schema.validator.defaultI18nKeysByRule.generalFailure;
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
     * Note that as in the examples above, the GSS metaschema defines "error hints" that result in message keys
     * being returned.
     *
     * NOTE: This function is a non-API function, i.e. one that assists public functions in performing their work, but
     * which is not guaranteed to remain available.
     *
     * @param {GssSchema} gssSchema - A GSS schema.
     * @param {ajvErrors|Boolean} ajvErrors - The raw errors returned by AJV, if there are any, or `false` if there are no validation Errors.
     * @return {gssValidationResults} - An object detailing the validation results (see above).
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
     * @param {Array<gssValidationError>} validationErrors - An array of validation errors, see `gpii.schema.validator.standardiseAjvErrors` for details.
     * @param {Any} validatedData - The (optional) data that was validated.
     * @param {Object<String,String>} messages - An (optional) map of message templates (see above).  Defaults to the message bundle provided by this package.
     * @param {Object} localisationTransform - An optional set of rules that control what information is available when localising validation errors (see above).
     * @return {Array<gssValidationError>} - The validation errors, with all message keys replaced with localised strings.
     *
     */
    gpii.schema.validator.localiseErrors = function (validationErrors, validatedData, messages, localisationTransform) {
        messages = messages || gpii.schema.messages.validationErrors;
        localisationTransform = localisationTransform || gpii.schema.validator.defaultLocalisationTransformRules;
        var localisedErrors = fluid.transform(validationErrors, function (validationError) {
            var messageKey = fluid.get(validationError, "message");
            var messageTemplate = messageKey && fluid.get(messages, [messageKey]); // We use the segment format because the keys contain dots.
            if (messageTemplate) {
                var data = validatedData && fluid.get(validatedData, validationError.dataPath);
                var localisationContext = fluid.model.transformWithRules({ data: data, error: validationError}, localisationTransform);
                var localisedMessage = fluid.stringTemplate(messageTemplate, localisationContext);
                return fluid.merge({}, validationError, { message: localisedMessage});
            }
            else {
                return validationError;
            }
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
     * @param {GssSchema} originalGss - The GSS schema.
     * @return {Object} - The equivalent JSON Schema rules.
     *
     */
    gpii.schema.gssToJsonSchema = function (originalGss) {
        var transformedSchema = gpii.schema.gssSegmentToJsonSchemaSegment(originalGss);
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
     * @param {GssSchema} gssSegment - A sub-segment of a GSS schema.
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
            var filteredSegment = Array.isArray(gssSegment) ? gssSegment : fluid.filterKeys(gssSegment, ["required", "hint", "errors", "enumLabels", "$schema"], true);
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
     * As of JSON Schema draft v4, the `required` property is now a property of the enclosing element.  GSS uses the v3
     * syntax, where `required` is a property of the object itself.  This function converts GSS-style properties to an
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

    // A global component that validates material using the above static functions.  Handles the expensive initial
    // compilation of the schema.  For performance reasons, this is not itself a schema-validated component.
    fluid.defaults("gpii.schema.validator", {
        gradeNames: ["fluid.component", "fluid.resolveRootSingle"],
        singleRootType: "gpii.schema.validator",
        members: {
            validatorsByHash: {
            }
        },
        invokers: {
            validate: {
                funcName: "gpii.schema.validator.validate",
                args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"] // gssSchema, toValidate, schemaHash
            },
            clearCache: {
                funcName: "fluid.set",
                args:     ["{that}", "validatorsByHash", {}] // model, path, newValue
            }
        }
    });

    // The global validator cache should always be available.
    gpii.schema.validator();
})(fluid, typeof Ajv !== "undefined" ? Ajv : false);
