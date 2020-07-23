/* eslint-env node */
"use strict";
var fluid = require("infusion");
fluid.require("%fluid-handlebars");

fluid.registerNamespace("fluid.schema.kettle.validator");

/**
 *
 * Validate a request payload according to an FSS Schema.  Fulfills the contract for a `kettle.middleware` `handle`
 * invoker.
 *
 * @param {fluid.schema.kettle.validator} kettleValidator - A `fluid.schema.kettle.validator` instance that has a schema and rules about which part of the payload should be validated.
 * @param {fluid.schema.validator} globalValidator - The global validator instance.
 * @param {kettle.request.http} requestHandler - The component that is fielding the actual request.
 * @return {Promise} - A `fluid.promise` that is rejected with a validation error if the payload is invalid or resolved if the payload is valid.
 *
 */
fluid.schema.kettle.validator.validateRequest = function (kettleValidator, globalValidator, requestHandler) {
    var validationPromise = fluid.promise();

    var fssSchema = kettleValidator.options.requestSchema;
    var transformationRules = kettleValidator.options.requestContentToValidate;
    var toValidate = fluid.model.transformWithRules(requestHandler.req, transformationRules);
    var validationResults = globalValidator.validate(fssSchema, toValidate, kettleValidator.options.schemaHash);

    if (validationResults.isValid) {
        validationPromise.resolve();
    }
    else {
        var messageBundle = fluid.handlebars.i18n.deriveMessageBundleFromRequest(requestHandler.req, kettleValidator.model.messageBundles, kettleValidator.options.defaultLocale);
        var localisedErrors = fluid.schema.validator.localiseErrors(validationResults.errors, toValidate, messageBundle, kettleValidator.options.localisationTransform);
        var localisedPayload = fluid.copy(validationResults);
        localisedPayload.errors = localisedErrors;

        var failurePayload = fluid.extend({}, kettleValidator.options.errorTemplate, localisedPayload);
        validationPromise.reject(failurePayload);
    }

    return validationPromise;
};

// A kettle.middleware grade that can be used in the requestMiddleware stack, as in:
// https://github.com/fluid-project/kettle/blob/670396acbf4be31be009b2b2dee48373134ea94d/tests/shared/SessionTestDefs.js#L64

fluid.defaults("fluid.schema.kettle.validator", {
    gradeNames: ["kettle.middleware", "fluid.modelComponent"],
    schemaHash: "@expand:fluid.schema.hashSchema({that}.options.requestSchema)",
    defaultLocale: "en_US",
    messageDirs: {
        validation: "%fluid-json-schema/src/messages"
    },
    model: {
        messageBundles: "@expand:fluid.handlebars.i18n.loadMessageBundles({that}.options.messageDirs)"
    },
    localisationTransform: {
        "": ""
    },
    errorTemplate: {
        // "Bad Request": https://developer.mozilla.org/nl/docs/Web/HTTP/Status/400
        statusCode: 400,
        message: "Your request was invalid.  See the errors for details."
    },
    requestSchema: {
        "$schema": "fss-v7-full#"
    },
    requestContentToValidate: {
        "body":   "body",
        "params": "params",
        "query":  "query"
    },
    mergePolicy: {
        "requestSchema": "nomerge",
        "requestContentToValidate": "nomerge"
    },
    invokers: {
        handle: {
            funcName: "fluid.schema.kettle.validator.validateRequest",
            args:    ["{that}", "{fluid.schema.validator}", "{arguments}.0"] // kettleValidator, globalValidator, request
        }
    },
    listeners: {
        "onCreate.cacheSchema": {
            func: "{fluid.schema.validator}.cacheSchema",
            args: ["{that}.options.requestSchema", "{that}.options.schemaHash"] // fssSchema, schemaHash
        }
    }
});

fluid.defaults("fluid.schema.kettle.validator.body", {
    gradeNames: ["fluid.schema.kettle.validator"],
    requestContentToValidate: {
        "": "body"
    }
});

fluid.defaults("fluid.schema.kettle.validator.params", {
    gradeNames: ["fluid.schema.kettle.validator"],
    requestContentToValidate: {
        "": "params"
    }
});

fluid.defaults("fluid.schema.kettle.validator.query", {
    gradeNames: ["fluid.schema.kettle.validator"],
    requestContentToValidate: {
        "":  "query"
    }
});
