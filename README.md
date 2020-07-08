# fluid-json-schema

## What is this?

[JSON Schemas](http://json-schema.org) are JSON documents that describe how a JSON object should be structured.  The
JSON Schema standard includes rules about what fields are required, what type and format of data is allowed in a field,
and many other complex rules that allow you to do things like limit the length of a text field, or require between one
and three entries in an array.

This package provides a series of [Fluid
components](https://github.com/fluid-project/infusion-docs/blob/master/src/documents/UnderstandingInfusionComponents.md)
and static functions that are intended to help with two general use cases:

1. Defining the fields and values that are allowed in JSON using [FSS](docs/fss.md), a variant of the underlying JSON
   Schema language.
2. Validating JSON data against an FSS Schema and reporting errors to the user.  See the [validator
   documentation](./docs/validator.md) for more details.

Although you can reuse the above in various additional ways, this package provides components and functions to assist
with the following specific use cases:

1. (In both Node and a browser) Defining the information a [schema-validated
   component](./docs/schemaValidatedComponent.md) requires to start up and preventing its creation if material is missing
   or incorrect.
2. (In both Node and a browser) Defining what is allowed in the
   [model](https://docs.fluidproject.org/infusion/development/ChangeApplier.html) of a [schema-validated
   modelComponent](./docs/schemaValidatedModelComponent.md), and automatically (re)validating the model when changes are
   made.
3. (In Node) Rejecting invalid data sent to a REST endpoint (presumably via a POST or PUT request) served up by either
   fluid-express or kettle.  See the [middleware documentation](./docs/schemaValidationMiddleware.md) for more details.
4. (In a browser) Associating model material with HTML DOM elements, and displaying validation errors in context using
   the ["error binder"](./docs/errorBinder.md).

## Running the tests

You can run the tests on a local machine using commands like the following from the root of the repository:

```bash
npm install
npm test
```

### Running the Browser Tests without Instrumentation

By default, the browser tests are run against instrumented code so that we can prepare a code coverage report at the end
of each test run.  If you need to troubleshoot a problem with the browser tests, you can also run the tests against the
raw source code by hosting the content in a standalone web server and then opening the tests in a browser.  For example,
if you have python installed, you can  use the command `python -m SimpleHTTPServer` from the root of the repository, and
then open
[http://localhost:8000/tests/browser-fixtures/all-tests.html](http://localhost:8000/tests/browser-fixtures/all-tests.html)
in a browser.

## Using these components in a browser

This package depends on [AJV](https://github.com/epoberezkin/ajv).  AJV can be used on the client-side, but must first
be bundled using `browserify`.  The AJV package takes care of this automatically when it's installed, the required
client-side bundle can be found in `./node_modules/ajv/dist/ajv.bundle.js` once you've installed this package's
dependencies.  The remaining client-side dependencies depend on which parts of this package you're using. See the HTML
browser test fixtures in `./tests/static/` for examples.
