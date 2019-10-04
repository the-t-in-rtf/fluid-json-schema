/*

    This package provides client side components that:

    1. Bind validation errors to onscreen elements.
    2. Display server-side validation feedback.
    3. Perform client-side validation and prevent submission if the data is invalid.

    See the documentation for more details:

    https://github.com/the-t-in-rtf/gpii-json-schema/blob/master/docs/validator.md

 */
(function () {
    "use strict";
    var gpii = fluid.registerNamespace("gpii");
    fluid.registerNamespace("gpii.schema.client.errorBinder");

    // The base component used to actually display validation errors.
    fluid.defaults("gpii.schema.client.errorBinder", {
        gradeNames: ["gpii.schema.modelComponent", "gpii.handlebars.templateAware.serverResourceAware"],
        errorBindings: "{that}.options.bindings",
        selectors: {
            "fieldError": ".fieldError"
        },
        templateKeys: {
            inlineError: "validation-error-inline"
        },
        model: {
            validationResults: {}
        },
        invokers: {
            renderErrors: {
                funcName: "gpii.schema.client.errorAwareForm.renderErrors",
                args:     ["{that}", "{gpii.handlebars.renderer}"] // renderer
            }
        },
        components: {
            // We have to wait to render until the renderer is available, but also reload if our templates change.
            gatedModelWatcher: {
                type: "fluid.modelComponent",
                createOnEvent: "{that}.events.onRendererAvailable",
                options: {
                    model: {
                        messages: "{gpii.schema.client.errorBinder}.model.messages",
                        templates: "{gpii.schema.client.errorBinder}.model.templates",
                        validationResults: "{gpii.schema.client.errorBinder}.model.validationResults"
                    },
                    modelListeners: {
                        validationResults: {
                            func: "{gpii.schema.client.errorBinder}.renderErrors"
                        }
                    }
                }
            }
        }
    });

    fluid.registerNamespace("gpii.schema.client.errorAwareForm");

    gpii.schema.client.elPathsEqual = function (rawElPath1, rawElPath2) {
        var elPath1 = gpii.schema.client.flattenElPath(rawElPath1);
        var elPath2 = gpii.schema.client.flattenElPath(rawElPath2);
        return elPath1 === elPath2;
    };

    gpii.schema.client.flattenElPath = function (elPath) {
        return Array.isArray(elPath) ? elPath.join(".") : elPath;
    };

    // We need to ensure that both our own markup and the field errors are rendered before we fire `onMarkupRendered`.
    gpii.schema.client.errorAwareForm.renderErrors = function (that, renderer) {
        var templateExists = fluid.get(renderer, ["model", "templates", "pages", that.options.templateKeys.inlineError]);
        if (templateExists && renderer) {
            // Get rid of any previous validation errors.
            that.locate("fieldError").remove();

            if (fluid.get(that, "model.validationResults.isValid") === false) {
                // Step through the list of bindings and look for anything that matches the current validation errors.
                fluid.each(that.options.errorBindings, function (value, key) {
                    var selector = fluid.get(value, "selector") || key;
                    var fieldElement  = that.locate(selector);
                    if (fieldElement) {
                        var bindingPath = fluid.get(value, "path") || value;
                        fluid.each(that.model.validationResults.errors, function (error) {
                            if (gpii.schema.client.elPathsEqual(error.dataPath, bindingPath)) {
                                renderer.before(fieldElement, that.options.templateKeys.inlineError, error); // element, key, context
                            }
                        });
                    }
                });
            }
        }
    };

    /**
     *
     * A gatekeeper function that only allows form submission if there are no validation errors.
     *
     * @param {gpii.schema.client.errorAwareForm} that - The clientSideValidation component itself.
     * @param {String} event - The jQuery Event (see http://api.jquery.com/Types/#Event) passed by the DOM element we're bound to.
     */
    gpii.schema.client.errorAwareForm.submitForm = function (that, event) {
        if (event) { event.preventDefault(); }

        if (fluid.get(that, "model.validationResults.isValid")) {
            // Let the `ajaxCapable` grade handle the request and response.
            that.makeRequest();
        }
    };

    // An instance of `templateFormControl` that supports both client and server-side validation.
    fluid.defaults("gpii.schema.client.errorAwareForm", {
        gradeNames: ["gpii.schema.client.errorBinder", "gpii.handlebars.templateFormControl"],
        rules: {
            successResponseToModel: {
                successMessage:    {
                    transform: {
                        type: "fluid.transforms.firstValue",
                        values: ["responseJSON.message", "responseText"]
                    }
                },
                validationResults: { literalValue: {} },
                errorMessage:      { literalValue: false }
            },
            errorResponseToModel: {
                successMessage:    { literalValue: false},
                errorMessage:      "responseJSON.message",
                validationResults: "responseJSON"
            }
        },
        model: {
            message: false,
            validationResults: false
        },
        components: {
            success: {
                options: {
                    model: {
                        message: "{gpii.schema.client.errorAwareForm}.model.successMessage"
                    }
                }
            },
            error: {
                options: {
                    templateKey: "validation-error-summary",
                    model: {
                        message:           "{gpii.schema.client.errorAwareForm}.model.errorMessage",
                        validationResults: "{gpii.schema.client.errorAwareForm}.model.validationResults"
                    },
                    modelListeners: {
                        validationResults: "{that}.renderInitialMarkup"
                    }
                }
            },
            // Use the "gated model watcher" defined above to ensure that rerender waits for the renderer.
            gatedModelWatcher: {
                options: {
                    modelListeners: {
                        validationResults: [
                            {
                                func: "{gpii.schema.client.errorBinder}.renderErrors"
                            }
                        ]
                    }
                }
            }
        },
        invokers: {
            submitForm: {
                funcName: "gpii.schema.client.errorAwareForm.submitForm",
                args:     ["{that}", "{arguments}.0"]
            }
        },
        listeners: {
            "onCreate.renderMarkup": {
                funcName: "fluid.identity"
            },
            "onResourcesLoaded.log": {
                funcName: "console.log",
                args: ["Resources loaded..."]
            }
        }
    });
})();
