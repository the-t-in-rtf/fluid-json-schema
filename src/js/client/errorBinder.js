/* globals fluid */
(function () {
    "use strict";
    var gpii = fluid.registerNamespace("gpii");
    fluid.registerNamespace("gpii.schemas.client.errorBinder");

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

    /*

        These client side grades use model->view bindings like those used with `gpii.templates.binder` to associate
        validation errors reported by the validator with onscreen elements.  That "binding" structure looks something like:

        ```
        bindings: {
            "key": {
                selector: "selector1",
                path:     "path1"
            },
            "selector2": "path2"
        }
        ```

        The map of bindings used by the base component are stored under `options.errorBindings`.  By default, the component
        tries to pick up the existing value from `options.bindings`, so that you can easily reuse existing bindings from
        grades like 'templateFormControl`.

        The core grade requires a `gpii-handlebars` `renderer` component.  An extended version of the `templateFormControl`
        grade that performs all the necessary wiring is also included here.

     */

    // TODO: revalidate using client-side validation when the model changes.
    // TODO: Create a version of this form that includes client-side validation
    /* global fluid */
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

    gpii.schemas.client.errorAwareForm.clientSideValidation.submitForm = function (that, event) {
        if (event) { event.preventDefault(); }

        if (!that.model.fieldErrors || that.model.fieldErrors.length === 0) {
            // Let the `ajaxCapable` grade handle the request and response.
            that.makeRequest();
        }
    };

    gpii.schemas.client.errorAwareForm.clientSideValidation.validateContent = function (that) {
        // We assume that the content we will transmit is governed by the rule system from the `ajaxCapable` grade.
        var dataToValidate = fluid.model.transformWithRules(that.model, that.options.rules.modelToRequestPayload);
        // The trailing empty array seems to avoid problems in relaying the data to the errors component.
        var validatorResults = that.validator.validate(that.options.schemaKey, dataToValidate) || [];
        that.applier.change("fieldErrors", validatorResults);
    };

    // A grade that adds client-side validation.  The form cannot be submitted if there are validation errors.  When the
    // model changes, content is revalidated.
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
                    inlineSchemaUrl: "{gpii.schemas.client.errorAwareForm.clientSideValidation}.options.inlineSchemaUrl",
                    // perform an initial validation pass once the validator is ready
                    listeners: {
                        "onSchemasUpdated": {
                            func: "{gpii.schemas.client.errorAwareForm.clientSideValidation}.validateContent"
                        }
                    }
                }
            }
        },
        modelListeners: {
            "": {
                func:          "{that}.validateContent",
                excludeSource: "init" // The validator will take care of the first pass once it's ready.
            }
        }
    });
})();