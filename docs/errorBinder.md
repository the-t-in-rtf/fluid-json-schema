# `gpii.schemas.client.errorBinder`

The `gpii-json-schema` package provides both [server and client-side validation](validator.md).  The `errorBinder`
component provides a consistent means of associating errors returned by the validator with onscreen elements.

This component does not expose any invokers.  Instead, it listens for changes to the `fieldErrors` model variable and
updates the display if needed.

## How do "bindings" work?

The `errorBinder` uses model->view bindings like those used with [`gpii-binder`](https://github.com/GPII/gpii-binder) to
associate validation errors reported by the validator with onscreen elements.  That "binding" structure looks something
like:

```snippet
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

## Requirements

In addition to the validator and other material from this package, the `errorBinder` component also requires both
`gpii-binder` and `gpii-handlebars`.

## Component options

| Option             | Type     | Description |
| ------------------ | -------- | ----------- |
| `selectors.fieldError` | `Selector` | The selector representing the view that will display our error summary. |
| `templateKeys.inlineError` | `String` | The filename/id of the template that will be used to produce the inline error output. |

## `gpii.schemas.client.errorAwareForm`

This is an extended version of the `templateFormControl` grade provided by the `gpii-handlebars` package.
It validates the model whenever it changes, and displays the errors next to each field.  It also displays a summary of
all errors.

### Component options

Here are the unique options you will likely want to customize when using the `errorAwareForm` component.

| Option             | Type     | Description |
| ------------------ | -------- | ----------- |
| `templateKeys.error` | `String` | The filename/id of the template that will be used to produce the error summary. |
| `rules` | `Object` | The [model transformation rules](https://wiki.fluidproject.org/display/docs/fluid.model.transformWithRules) that control what information is passed to the server on form submit, and how the response is handled.  See the `ajaxCapable` documentation in the `gpii-handlebars` package for details. |
| `rules.modelToRequestPayload` | `Object` | The [model transformation rules](https://wiki.fluidproject.org/display/docs/fluid.model.transformWithRules) that control what information is submitted by the form are also used in validating the form data. |

See the `templateFormControl`documentation in the [`gpii-handlebars`](https://github.com/GPII/gpii-handlebars) package
for more details about supported options.

### Invokers

#### `{gpii.schemas.client.errorAwareForm.clientSideValidation}.submitForm(event)`

* `event {Object}`: The [jQuery event object](http://api.jquery.com/Types/#Event) passed to us by the DOM elements we're
  bound to.
* Returns: Nothing.

A gatekeeper function that only allows the form to be submitted if client-side validation succeeds.  For details on
binding this to your own elements, see the `templateFormControl` documentation in the `gpii-handlebars` package.
