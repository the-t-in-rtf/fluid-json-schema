/*

    A Fluid component to handle JSON Schema validation.  See the documentation for details:

    https://github.com/the-t-in-rtf/gpii-json-schema/blob/GPII-1336/docs/validator.md

 */

"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var Ajv = require("ajv");

fluid.registerNamespace("gpii.schema.validator.ajv");

gpii.schema.validator.ajv.init = function (that) {
    // We persist a single AJV instance so that we can take advantage of its automatic compiling and caching.
    that.ajv = Ajv(that.options.validatorOptions); // jshint ignore:line

    gpii.schema.validator.ajv.refreshSchemas(that);
};

/*

 Validate JSON content against a known Schema.  See the documentation for details:

 https://github.com/the-t-in-rtf/gpii-json-schema/blob/GPII-1336/docs/validator.md#gpiischemavalidatorajvvalidatethat-key-content

 */
gpii.schema.validator.ajv.validate = function (that, key, content) {
    var contentValid = that.ajv.validate(key, content);
    if (!contentValid) {
        return (gpii.schema.validator.ajv.sanitizeValidationErrors(that, key, that.ajv.errors));
    }

    return undefined;
};


/*

    Transform raw validator output into a more human-readable form that corresponds to the structure of the original
    JSON input.  See the documentation for details:

    https://github.com/the-t-in-rtf/gpii-json-schema/blob/GPII-1336/docs/validator.md#gpiischemavalidatorajvsanitizevalidationerrorsthat-schemakey-errors

 */
gpii.schema.validator.ajv.sanitizeValidationErrors = function (that, schemaKey, errors) {
    var sanitizedErrors = { fieldErrors: {}};

    fluid.each(errors, function (error) {
        // Errors are associated with the right field based on the `dataPath` received from AJV.
        var path = gpii.schema.validator.ajv.extractPathSegmentsFromError(error);

        var errorMessage      = error.message;
        var overwriteExisting = false;

        var evolvedMessage = that.parser.lookupDescription(schemaKey, path);
        if (evolvedMessage) {
            errorMessage = evolvedMessage;
            overwriteExisting = true;
        }

        gpii.schema.validator.ajv.saveToPath(path, errorMessage, sanitizedErrors, overwriteExisting);
    });

    return sanitizedErrors;
};


/*

    Break an AJV path down into discrete segments.  See the documentation for details:

    https://github.com/the-t-in-rtf/gpii-json-schema/blob/GPII-1336/docs/validator.md#extractpathsegmentsstring

 */
gpii.schema.validator.ajv.extractPathSegments = function (string) {
    var segments = [];

    // A regular expression to split the current segment and the remainder from one another. Handles variations like:
    //
    // 1. `simple.simon`
    // 2. `['kinda.complex'].simple`
    // 3. `simple['kinda.complex']`
    // 4. `['really.complex']['don\'t I know it']`
    //
    // See https://xkcd.com/1171/
    //
    // The matching within single quotes must be non-greedy to ensure that things like `['a.b']['c.d']` are treated as
    // separate segments.
    var slicingRegexp = /^\.?(\['.+?']|[^\[\.]+)([\[\.].+)$/;

    var remainingPath = string;

    // Iterate through, splitting by dots while preserving escaped dot notation (see above).
    var matches = remainingPath.match(slicingRegexp);
    while (matches) {
        segments.push(gpii.schema.validator.ajv.sanitizePathSegment(matches[1]));
        remainingPath = matches[2];
        matches = remainingPath.match(slicingRegexp);
    }

    // The last segment will not have two parts and can be added in its entirety
    segments.push(gpii.schema.validator.ajv.sanitizePathSegment(remainingPath));

    return segments;
};

/*

  Convenience function to extract the path segments from the `error` data structure returned by AJV.

 */
gpii.schema.validator.ajv.extractPathSegmentsFromError = function (error) {
    return gpii.schema.validator.ajv.extractPathSegments(error.dataPath);
};


/*

    Sanitize a single raw path segment returned by AJV.  See the documentation for details:

    https://github.com/the-t-in-rtf/gpii-json-schema/blob/GPII-1336/docs/validator.md#sanitizepathsegmentsegment

 */
gpii.schema.validator.ajv.sanitizePathSegment = function (segment) {
    // Discard any leading dot
    var segmentMinusLeadingDot = segment.replace(/^\./, "");

    // If we are surrounded by `['']`, extract the inner content and then unescape it.
    var hasSpecialRegexp = /\['(.+)'\]/;
    var specialMatches = segmentMinusLeadingDot.match(hasSpecialRegexp);
    if (specialMatches) {
        return specialMatches[1];
    }

    return segmentMinusLeadingDot;
};

/*

    Return a deep path if it exists, create and return an empty array at the path if it doesn't.  See the documentation
    for details:

    https://github.com/the-t-in-rtf/gpii-json-schema/blob/GPII-1336/docs/validator.md#resolveorcreatetargetfrompathtarget-path-createmissingsegments

 */
gpii.schema.validator.ajv.resolveOrCreateTargetFromPath = function (target, path, createMissingSegments) {
    var value = fluid.get(target, path);
    if (!value && createMissingSegments) {
        value = [];
        fluid.set(target, path, value);
    }
    return value;
};
/*

    Save an error message to the right location in our deep structure.  See the documentation for details:

    https://github.com/the-t-in-rtf/gpii-json-schema/blob/GPII-1336/docs/validator.md#gpiischemavalidatorajvsaveTopathpath-errorstring-errormap-overwriteexisting

 */
gpii.schema.validator.ajv.saveToPath = function (path, errorString, errorMap, overwriteExisting) {
    var target = errorMap.fieldErrors;
    target     = gpii.schema.validator.ajv.resolveOrCreateTargetFromPath(target, path, true);
    if (overwriteExisting) {
        target[0] = errorString;
    }
    else {
        target.push(errorString);
    }
};

/*

If we receive new schemas, make the validator aware of them so that we can simply validate using their key.

 */
gpii.schema.validator.ajv.refreshSchemas = function (that) {
    // Update the list of schemas using the supplied content
    fluid.each(that.model.schemas, function (schemaContent, schemaKey) {
        // AJV will not let us overwrite an existing schema , so we have to remove the current content first.
        if (that.ajv.getSchema(schemaKey)) {
            that.ajv.removeSchema(schemaKey);
        }

        try {
            that.ajv.addSchema(schemaContent, schemaKey);
        }
        catch (e) {
            fluid.fail("There was an error loading one of your JSON Schemas:", e);
        }
    });

    that.events.schemasLoaded.fire(that);
};

fluid.defaults("gpii.schema.validator.ajv", {
    gradeNames: ["fluid.modelComponent"],
    validatorOptions: {
        verbose: false,  // Prevent invalid data (such as passwords) from being displayed in error messages
        messages: true,  // Display human-readable error messages
        allErrors: true  // Generate a complete list of errors and not just the first failure.
    },
    events: {
        schemasLoaded: null
    },
    model: {
        schemas: {}
    },
    invokers: {
        validate: {
            funcName: "gpii.schema.validator.ajv.validate",
            args:     ["{that}", "{arguments}.0", "{arguments}.1"]
        }
    },
    listeners: {
        "onCreate.init": {
            funcName: "gpii.schema.validator.ajv.init",
            args:     ["{that}"]
        }
    },
    modelListeners: {
        "schemas": {
            funcName:      "gpii.schema.validator.ajv.refreshSchemas",
            excludeSource: "init",
            args:          ["{that}"]
        }
    },
    components: {
        parser: {
            type: "gpii.schema.parser",
            options: {
                schemaPath: "{gpii.schema.validator.ajv}.options.schemaPath",
                model: {
                    schemas: "{gpii.schema.validator.ajv}.model.schemas"
                }
            }
        }
    }
});

