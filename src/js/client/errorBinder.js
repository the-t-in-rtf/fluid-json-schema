/*

    This package provides client side components that:

    1. Bind validation errors to onscreen elements.
    2. Display server-side validation feedback.
    3. Perform client-side validation and prevent submission if the data is invalid.

    See the documentation for more details:

    https://github.com/the-t-in-rtf/gpii-json-schema/blob/master/docs/validator.md

 */
/* globals fluid */
(function () {
    "use strict";
    var gpii = fluid.registerNamespace("gpii");
    fluid.registerNamespace("gpii.schemas.client.errorBinder");

    // The base component used to actually display validation errors.
    fluid.defaults("gpii.schemas.client.errorBinder", {
        gradeNames: ["fluid.component"], // TODO:  This should really be a more specific grade
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
                type: "gpii.handlebars.renderer"
            }
        },
        invokers: {
            renderErrors: {
                funcName: "gpii.schemas.client.errorAwareForm.renderErrors",
                args:     ["{that}", "{renderer}"]
            }
        },
        modelListeners: {
            // TODO: This is a problem, as it rips the rug out from under the form before it can submit.
            // Split into two steps, one that renders the initial markup, the other that renders the errors (if any)
            fieldErrors: {
                funcName: "{that}.renderErrors",
                excludeSource: "init",
                args: ["{that}"]
            }
        }
    });

    fluid.registerNamespace("gpii.schemas.client.errorAwareForm");

    // We need to ensure that both our own markup and the field errors are rendered before we fire `onMarkupRendered`.
    gpii.schemas.client.errorAwareForm.renderMarkup = function (that, renderer, selector, template, data, manipulator) {
        manipulator = manipulator ? manipulator : "html";
        if (renderer) {
            var mainElement = that.locate(selector);
            renderer[manipulator](mainElement, template, data);
            gpii.handlebars.templateAware.refreshDom(that);

            // Let everyone else know that the markup has been updated.
            that.events.onMarkupRendered.fire(that);
        }
        else {
            fluid.fail("I cannot render content without a renderer.");
        }
    };

    // We need to ensure that both our own markup and the field errors are rendered before we fire `onMarkupRendered`.
    gpii.schemas.client.errorAwareForm.renderErrors = function (that, renderer) {
        if (renderer) {
            // var mainElement = that.locate(selector);
            // renderer[manipulator](mainElement, template, data);
            // Refresh the DOM once without firing any events.  This intermediate refresh is required before we can
            // render our field-specific errors.
            // gpii.handlebars.templateAware.refreshDom(that);

            // Get rid of any previous validation errors.
            that.locate("fieldError").remove();

            // Step through the list of bindings and look for anything that matches the current validation errors.
            fluid.each(that.options.errorBindings, function (value, key) {
                var selector = typeof value === "string" ? key   : value.selector;
                var fieldElement  = that.locate(selector);
                if (fieldElement) {
                    var expectedPath = "." + (typeof value === "string" ? value : value.path);
                    fluid.each(that.model.fieldErrors, function (error) {
                        var errorDataPath = error.keyword === "required" ? error.dataPath + "." + error.params.missingProperty : error.dataPath;
                        if (errorDataPath === expectedPath) {
                            // element, key, context
                            that.renderer.before(fieldElement, that.options.templates.inlineError, error);
                        }
                    });
                }
            });
        }
        else {
            fluid.fail("I cannot render errors without a renderer.");
        }
    };

    // An instance of `templateFormControl` that uses the `errorBinder` to display server-side errors.
    fluid.defaults("gpii.schemas.client.errorAwareForm", {
        gradeNames: ["gpii.schemas.client.errorBinder", "gpii.handlebars.templateFormControl"],
        templates: {
            error:   "validation-error-summary"
        },
        events: {
            onTemplatesLoaded: null,
            onReady: {
                events: {
                    onTemplatesLoaded: "onTemplatesLoaded"
                }
            }
        },
        invokers: {
            renderMarkup: {
                funcName: "gpii.schemas.client.errorAwareForm.renderMarkup",
                args:     ["{that}", "{renderer}", "{arguments}.0", "{arguments}.1", "{arguments}.2", "{arguments}.3"] // renderer, selector, template, data, manipulator
            }
        },
        listeners: {
            "onReady.renderMarkup": {
                func: "{that}.renderInitialMarkup"
            }
        },
        rules: {
            successResponseToModel: {
                successMessage: "responseJSON.message",
                fieldErrors:  { literalValue: [] },
                errorMessage: { literalValue: false }
            },
            errorResponseToModel: {
                successMessage: { literalValue: false},
                errorMessage:   "responseJSON.message",
                fieldErrors:    "responseJSON.fieldErrors"
            }
        },
        components: {
            renderer: {
                type: "gpii.handlebars.renderer.serverAware",
                options: {
                    listeners: {
                        "onTemplatesLoaded.notifyParent": {
                            func: "{gpii.schemas.client.errorAwareForm}.events.onTemplatesLoaded.fire"
                        }
                    }
                }
            },
            success: {
                options: {
                    listeners: {
                        "onCreate.renderMarkup": {
                            func: "{that}.renderInitialMarkup"
                        }
                    },
                    model: {
                        message: "{gpii.schemas.client.errorAwareForm}.model.successMessage"
                    }
                }
            },
            error: {
                options: {
                    listeners: {
                        "onCreate.renderMarkup": {
                            func: "{that}.renderInitialMarkup"
                        }
                    },
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
        that.validateContent(false);

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

        that.applier.fireChangeRequest({ path: "fieldErrors", value: validatorResults, source: "validator"});

        // Clear out any previous "success" messages if there are validation errors.
        if (validatorResults && validatorResults.length > 0) {
            that.applier.fireChangeRequest({ path: "successMessage", value: false, source: "validator"});
        }
    };

    // A grade that adds client-side validation before the form is submitted.  The form cannot be submitted if there are validation errors.
    //
    // You must be able to reach an instance of the `inlineSchema` router as well as individual schemas to use this grade.
    fluid.defaults("gpii.schemas.client.errorAwareForm.clientSideValidation", {
        gradeNames:      ["gpii.hasRequiredOptions", "gpii.schemas.client.errorAwareForm"],
        requiredOptions: ["inlineSchemaUrl", "schemaKey", "rules.modelToRequestPayload"],
        inlineSchemaUrl: "/allSchemas",
        events: {
            onSchemasLoaded: null,
            onReady: {
                events: {
                    onSchemasLoaded: "onSchemasLoaded"
                }
            }
        },
        listeners: {
            "onReady.validateContent": {
                func: "{that}.validateContent"
            }
        },
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
                    inlineSchemaUrl: "{gpii.schemas.client.errorAwareForm.clientSideValidation}.options.inlineSchemaUrl",
                    listeners: {
                        "onSchemasLoaded.notifyParent": {
                            func: "{gpii.schemas.client.errorAwareForm.clientSideValidation}.events.onSchemasLoaded.fire"
                        }
                    }
                }
            }
        }
    });

    // A "real time" validation grade that extends the `clientSideValidation` grade to revalidate when the model changes.
    fluid.defaults("gpii.schemas.client.errorAwareForm.clientSideValidation.realTime", {
        gradeNames:      ["gpii.schemas.client.errorAwareForm.clientSideValidation"],
        events: {
            onReady: {
                events: {
                    onSchemasLoaded:   "onSchemasLoaded",
                    onTemplatesLoaded: "onTemplatesLoaded"
                }
            }
        },
        // // TODO:  Remove these once we figure out our timing problems.
        // invokers: {
        //     logEvent: {
        //         funcName: "fluid.log", args: ["event", "{arguments}.0", " fired for component ", "{that}.typename", ":", "{that}.id"]
        //     }
        // },
        // listeners: {
        //     onReady: { func: "{that}.logEvent", args: "onReady"},
        //     onSchemasLoaded: { func: "{that}.logEvent", args: "onSchemasLoaded"},
        //     onTemplatesLoaded: { func: "{that}.logEvent", args: "onTemplatesLoaded"},
        //     onMarkupRendered: { func: "{that}.logEvent", args: "onMarkupRendered"},
        //     onDomChange: { func: "{that}.logEvent", args: "onDomChange"}
        // },
        modelListeners: {
            "": {
                func:          "{that}.validateContent",
                excludeSource: [
                    "init",     // The validator will take care of the first pass once it's ready.
                    "validator" // Do not validate if the validator itself is saving its results.
                ]
            }
        }
    });
})();
