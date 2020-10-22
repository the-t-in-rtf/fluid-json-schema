/*

    This package provides client side components that:

    1. Bind validation errors to onscreen elements.
    2. Display server-side validation feedback.
    3. Perform client-side validation and prevent submission if the data is invalid.

    See the documentation for more details:

    https://github.com/fluid-project/fluid-json-schema/blob/main/docs/validator.md

 */
(function () {
    "use strict";
    fluid.registerNamespace("fluid.schema.client.errorBinder");

    // The base component used to actually display validation errors.
    fluid.defaults("fluid.schema.client.errorBinder", {
        gradeNames: ["fluid.schema.modelComponent", "fluid.handlebars.templateAware.serverResourceAware"],
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
                funcName: "fluid.schema.client.errorAwareForm.renderErrors",
                args:     ["{that}", "{fluid.handlebars.renderer}"] // renderer
            }
        },
        components: {
            // We have to wait to render until the renderer is available, but also reload if our templates change.
            gatedModelWatcher: {
                type: "fluid.modelComponent",
                createOnEvent: "{that}.events.onRendererAvailable",
                options: {
                    model: {
                        messages: "{fluid.schema.client.errorBinder}.model.messages",
                        templates: "{fluid.schema.client.errorBinder}.model.templates",
                        validationResults: "{fluid.schema.client.errorBinder}.model.validationResults"
                    },
                    modelListeners: {
                        validationResults: {
                            func: "{fluid.schema.client.errorBinder}.renderErrors"
                        }
                    }
                }
            }
        }
    });

    fluid.registerNamespace("fluid.schema.client.errorAwareForm");

    fluid.schema.client.elPathsEqual = function (rawElPath1, rawElPath2) {
        var elPath1 = fluid.schema.client.flattenElPath(rawElPath1);
        var elPath2 = fluid.schema.client.flattenElPath(rawElPath2);
        return elPath1 === elPath2;
    };

    fluid.schema.client.flattenElPath = function (elPath) {
        return Array.isArray(elPath) ? elPath.join(".") : elPath;
    };

    // We need to ensure that both our own markup and the field errors are rendered before we fire `onMarkupRendered`.
    fluid.schema.client.errorAwareForm.renderErrors = function (that, renderer) {
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
                            if (fluid.schema.client.elPathsEqual(error.dataPath, bindingPath)) {
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
     * @param {fluid.schema.client.errorAwareForm} that - The clientSideValidation component itself.
     * @param {String} event - The jQuery Event (see http://api.jquery.com/Types/#Event) passed by the DOM element we're bound to.
     */
    fluid.schema.client.errorAwareForm.submitForm = function (that, event) {
        if (event) { event.preventDefault(); }

        if (fluid.get(that, "model.validationResults.isValid")) {
            // Let the `ajaxCapable` grade handle the request and response.
            that.makeRequest();
        }
    };

    // An instance of `templateFormControl` that supports both client and server-side validation.
    fluid.defaults("fluid.schema.client.errorAwareForm", {
        gradeNames: ["fluid.schema.client.errorBinder", "fluid.handlebars.templateFormControl"],
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
                        message: "{fluid.schema.client.errorAwareForm}.model.successMessage"
                    }
                }
            },
            error: {
                options: {
                    templateKey: "validation-error-summary",
                    model: {
                        message:           "{fluid.schema.client.errorAwareForm}.model.errorMessage",
                        validationResults: "{fluid.schema.client.errorAwareForm}.model.validationResults"
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
                                func: "{fluid.schema.client.errorBinder}.renderErrors"
                            }
                        ]
                    }
                }
            }
        },
        invokers: {
            submitForm: {
                funcName: "fluid.schema.client.errorAwareForm.submitForm",
                args:     ["{that}", "{arguments}.0"]
            }
        },
        listeners: {
            // Break the contract inherited from fluid-handlebars.
            "onCreate.renderMarkup": {
                funcName: "fluid.identity"
            },
            "onRendererAvailable.renderMarkup": {
                func: "{that}.renderInitialMarkup"
            },
            "onResourcesLoaded.log": {
                funcName: "console.log",
                args: ["Resources loaded..."]
            }
        }
    });
})();
