/*

    This package provides client side components that:

    1. Bind validation errors to onscreen elements.
    2. Display server-side validation feedback.
    3. Perform client-side validation and prevent submission if the data is invalid.

    See the documentation for more details:

    https://github.com/the-t-in-rtf/gpii-json-schema/blob/GPII-1336/docs/validator.md

 */
/* globals fluid */
(function () {
    "use strict";
    var gpii = fluid.registerNamespace("gpii");
    fluid.registerNamespace("gpii.schemas.client.errorBinder");

    /**
     *
     * Iterate through the list of validation errors and insert error feedback before the appropriate views.
     *
     * @param that - The errorBinder component.
     *
     */
    gpii.schemas.client.errorBinder.displayErrors = function (that) {
        // Get rid of any previous validation errors.
        that.locate("fieldError").remove();

        // Step through the list of bindings and look for anything that matches the current validation errors.
        fluid.each(that.options.errorBindings, function (value, key) {
            var selector     = typeof value === "string" ? key   : value.selector;
            var element      = that.locate(selector);
            if (element) {
                var expectedPath = "." + (typeof value === "string" ? value : value.path);
                fluid.each(that.model.fieldErrors, function (error) {
                    var errorDataPath = error.keyword === "required" ? error.dataPath + "." + error.params.missingProperty : error.dataPath;
                    if (errorDataPath === expectedPath) {
                        // element, key, context
                        that.renderer.before(element, that.options.templates.inlineError, error);
                    }
                });
            }
        });

        // We have inserted new elements and need to fire an event so that interested parties can update their bindings.
        that.events.onDomBind.fire(that);
    };

    // The base component used to actually display validation errors.
    fluid.defaults("gpii.schemas.client.errorBinder", {
        gradeNames: ["fluid.component"],
        errorBindings: "{that}.options.bindings",
        selectors: {
            "fieldError": ".fieldError"
        },
        templates: {
            inlineError: "validation-error-inline"
        },
        model: {
            fieldErrors: []
        },
        components: {
            renderer: {
                type: "gpii.templates.renderer"
            }
        },
        modelListeners: {
            fieldErrors: {
                funcName: "gpii.schemas.client.errorBinder.displayErrors",
                excludeSource: "init",
                args: ["{that}"]
            }
        }
    });

    // An instance of `templateFormControl` that uses the `errorBinder` to display server-side errors.
    fluid.defaults("gpii.schemas.client.errorAwareForm", {
        gradeNames: ["gpii.schemas.client.errorBinder", "gpii.templates.templateFormControl"],
        templates: {
            error:   "validation-error-summary"
        },
        rules: {
            successResponseToModel: {
                fieldErrors:  { literalValue: [] },
                errorMessage: { literalValue: false }
            },
            errorResponseToModel: {
                "":             "notfound",
                successMessage: { literalValue: false},
                errorMessage:   "responseJSON.message",
                fieldErrors:    "responseJSON.fieldErrors"
            }
        },
        components: {
            renderer: {
                type: "gpii.templates.renderer.serverAware",
                options: {
                    listeners: {
                        "onTemplatesLoaded.renderMarkup": {
                            func: "{gpii.schemas.client.errorAwareForm}.renderInitialMarkup"
                        },
                        "onTemplatesLoaded.displayErrors": {
                            funcName: "gpii.schemas.client.errorBinder.displayErrors",
                            args: ["{gpii.schemas.client.errorAwareForm}"]
                        }
                    }
                }
            },
            success: {
                options: {
                    model: {
                        message:    "{gpii.schemas.client.errorAwareForm}.model.successMessage"
                    }
                }
            },
            error: {
                options: {
                    model: {
                        message:    "{gpii.schemas.client.errorAwareForm}.model.errorMessage",
                        fieldErrors: "{gpii.schemas.client.errorAwareForm}.model.fieldErrors"
                    }
                }
            }
        }
    });

    fluid.registerNamespace("gpii.schemas.client.errorAwareForm.clientSideValidation");

    /**
     *
     * A gatekeeper function that only allows form submission if there are no validation errors.
     *
     * @param that - The clientSideValidation component itself.
     * @param event - The jQuery Event (see http://api.jquery.com/Types/#Event) passed by the DOM element we're bound to.
     */
    gpii.schemas.client.errorAwareForm.clientSideValidation.submitForm = function (that, event) {
        if (event) { event.preventDefault(); }

        // Validate our data at least once before attempting to submit it.
        that.validateContent();

        if (!that.model.fieldErrors || that.model.fieldErrors.length === 0) {
            // Let the `ajaxCapable` grade handle the request and response.
            that.makeRequest();
        }
    };

    /**
     *
     * Validate client-side model content and display any errors.
     *
     * @param that - The clientSideValidation component itself.
     *
     */
    gpii.schemas.client.errorAwareForm.clientSideValidation.validateContent = function (that) {
        // We assume that the content we will transmit is governed by the rule system from the `ajaxCapable` grade.
        var dataToValidate = fluid.model.transformWithRules(that.model, that.options.rules.modelToRequestPayload);
        // The trailing empty array seems to avoid problems in relaying the data to the errors component.
        var validatorResults = that.validator.validate(that.options.schemaKey, dataToValidate) || [];
        that.applier.change("fieldErrors", validatorResults);
    };

    // A grade that adds client-side validation before the form is submitted.  The form cannot be submitted if there are validation errors.
    //
    // You must be able to reach an instance of the `inlineSchema` router as well as individual schemas to use this grade.
    fluid.defaults("gpii.schemas.client.errorAwareForm.clientSideValidation", {
        gradeNames:      ["gpii.hasRequiredOptions", "gpii.schemas.client.errorAwareForm"],
        requiredOptions: ["inlineSchemaUrl", "schemaKey", "rules.modelToRequestPayload"],
        inlineSchemaUrl: "/allSchemas",
        invokers: {
            submitForm: {
                funcName: "gpii.schemas.client.errorAwareForm.clientSideValidation.submitForm",
                args:     ["{that}", "{arguments}.0"]
            },
            validateContent: {
                funcName: "gpii.schemas.client.errorAwareForm.clientSideValidation.validateContent",
                args:     ["{that}"]
            }
        },
        components: {
            validator: {
                type: "gpii.schema.validator.ajv.client",
                options: {
                    inlineSchemaUrl: "{gpii.schemas.client.errorAwareForm.clientSideValidation}.options.inlineSchemaUrl"
                }
            }
        }
    });

    // A "real time" validation grade that extends the `clientSideValidation` grade to revalidate when the model changes.
    fluid.defaults("gpii.schemas.client.errorAwareForm.clientSideValidation.realTime", {
        gradeNames:      ["gpii.schemas.client.errorAwareForm.clientSideValidation"],
        modelListeners: {
            "": {
                func:          "{that}.validateContent",
                excludeSource: "init" // The validator will take care of the first pass once it's ready.
            }
        },
        components: {
            validator: {
                options: {
                    // perform an initial validation pass once the validator is ready
                    listeners: {
                        "onSchemasUpdated.validateContent": {
                            func: "{gpii.schemas.client.errorAwareForm.clientSideValidation}.validateContent"
                        }
                    }
                }
            }
        }

    });
})();