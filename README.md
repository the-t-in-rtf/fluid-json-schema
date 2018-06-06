# gpii-json-schema

## What is this?

[JSON Schemas](http://json-schema.org) are JSON documents that describe how a JSON object should be structured.  The
JSON Schema standard includes rules about what fields are required, what type and format of data is allowed in a field,
and many other complex rules that allow you to do things like limit the length of a text field, or require between one
and three entries in an array.

This package provides a series of [Fluid components](https://github.com/fluid-project/infusion-docs/blob/master/src/documents/UnderstandingInfusionComponents.md)
and static functions that are intended to help with two general use cases:

1. Defining the fields and values that are allowed in JSON using [GSS](./docs/gss.md), a variant of the underlying JSON Schema language.
2. Validating JSON data against a GSS Schema and reporting errors to the user.  See the [validator documentation](./docs/validator.md) for more details.

Although you can reuse the above in various additional ways, this package provides components and functions to assist
with the following specific use cases:

1. (In both Node and a browser) Defining the information a [schema-validated component](./docs/schemaValidatedComponent.md) requires to start up and preventing its creation if material is missing or incorrect.
2. (In both Node and a browser) Defining what is allowed in the [model](https://docs.fluidproject.org/infusion/development/ChangeApplier.html) of a [schema-validated modelComponent](./docs/schemaValidatedModelComponent.md), and automatically (re)validating the model when changes are made.
3. (In Node) Rejecting invalid data sent to a REST endpoint (presumably via a POST or PUT request).  See the [middleware documentation](./docs/schemaValidationMiddleware.md) for more details.
4. (In a browser) Associating model material with HTML DOM elements, and displaying validation errors in context using the ["error binder"](./docs/errorBinder.md).

## Running the tests

### Running the Tests in a Virtual Machine

The preferred way to run the tests is to create a virtual machine and run the tests in that supported and
pre-configured environment.  To run the tests in a virtual machine, you will need to have VirtualBox, Vagrant, and the
Vagrant CI Plugin installed.  See the [QI development environment requirements](https://github.com/GPII/qi-development-environments/#requirements) for more details.

Once you have satisfied the requirements, you can run the tests using commands like the following from the root of the
repository:

```bash
vagrant up
vagrant ci test
```

If you would like to remove the VM, use the command `vagrant destroy` from the root of the repository.

### Running the Tests on a Local Machine

You can run the tests on a local machine using commands like the following from the root of the repository:

```bash
npm install
npm test
```

## Using these components in a browser

This package depends on [AJV](https://github.com/epoberezkin/ajv).  AJV can be used on the client-side, but must first
be bundled using `browserify`.  The AJV package takes care of this automatically when it's installed, the required
client-side bundle can be found in `./node_modules/ajv/dist/ajv.bundle.js` once you've installed this package's
dependencies.  The remaining client-side dependencies depend on which parts of this package you're using. See the HTML
browser test fixtures in `./tests/static/` for examples.
