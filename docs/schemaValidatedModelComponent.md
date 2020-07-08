# `fluid.schema.modelComponent`

This component extends the concept of a [model
component](https://docs.fluidproject.org/infusion/development/tutorial-gettingStartedWithInfusion/ModelComponents.html)
to add validation of model material whenever changes occur.  A schema-validated modelComponent is by definition also a
[schema validated component](./schemaValidatedComponent.md), although it only requires you to follow the underlying
syntax for standard framework features like invokers, et cetera.

## Component Options

In addition to the options supported by the underlying [`fluid.schema.component`](schemaValidatedComponent.md) grade,
this component supports the following key option:

| Option        | Type     | Description |
| ------------- | -------- | ----------- |
| `modelSchema` | `Object` | One or more rules that describe what model material is valid, defined using [FSS](fss.md). The merged `modelSchema` option will be used to validate the model whenever it changes. |

For examples of how merging can be used to extend an FSS schema, see the [schema validated component docs](schemaValidatedComponent.md).

## The model validation cycle.

This grade listens for model changes.  Whenever the model changes, the model is validated against the FSS schema in
`options.modelSchema`, and the validation results are saved to the `validationResults` model variable.  To avoid
triggering one or more additional validation passes, this grade ignores changes made to the `validationResults` model
variable itself.

If you wish to take action after validation completes, you will need to define a modelListener that listens to changes
to the `validationResults` model variable.  For the format of validation errors, see the [validator
documentation](validator.md).  For an example of a grade that listens for and makes use of validation results as they
appear, see the tests for the error binder included in this package.
