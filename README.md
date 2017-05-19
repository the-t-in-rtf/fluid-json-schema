# What is this?

[JSON Schemas](http://json-schema.org) are JSON documents that describe how a JSON object should be structured.  The
JSON Schema standard includes rules about what fields are required, what type and format of data is allowed in a field,
and many other complex rules that allow you to do things like limit the length of a text field, or require between one
and three entries in an array.

This package provides a series of [Fluid components](https://github.com/fluid-project/infusion-docs/blob/master/src/documents/UnderstandingInfusionComponents.md)
to help add the power of [JSON Schemas](http://json-schema.org) to your project.

This package is intended to help with three key use cases:

1.  Validating arbitrary JSON data and reporting problems to the end user.  See the [validator documentation](./docs/validator.md) and [parser documentation](./docs/parser.md) for more details.
2.  Rejecting invalid data sent to a REST endpoint (presumably via a POST or PUT request).  See the [middleware documentation](./docs/middleware) for more details.
3.  Adding appropriate headers to JSON responses so that it is clear what JSON Schema they adhere to.  See the [handler documentation](./docs/handler.md) for more details.

# Running the tests

## Running the Tests in a Virtual Machine

The preferred way to run the tests is to create a virtual machine and run the tests in that supported and
pre-configured environment.  To run the tests in a virtual machine, you will need to have VirtualBox, Vagrant, and the
Vagrant CI Plugin installed.  See the [QI development environment requirements](https://github.com/GPII/qi-development-environments/#requirements) for more details.

Once you have satisfied the requirements, you can run the tests using the following commands from the root of the
repository:

1. `vagrant up`
2. `vagrant ci test`

If you would like to remove the VM, use the command `vagrant destroy` from the root of the repository.

## Running the Tests on a Local Machine

Before you can successfully run the tests on a local machine, you will need to have the following installed:

# `node` (4.x or 6.x)
# `npm` or [`yarn`](http://yarnpkg.com/)
# [Chrome](https://www.google.com/chrome/)
# [`chromedriver`](https://sites.google.com/a/chromium.org/chromedriver/)

Once you have these installed, you can run the tests using commands like:

1. `yarn install`
2. `yarn test`

Or, if you're using `npm`, you can use commands like:

1. `npm install`
2. `npm test`

# Using these components in a browser

This package depends on AJV.  AJV can be used on the client-side, but must first be bundled using `browserify`.  The
AJV package takes care of this automatically when it's installed, the required client-side bundle can be found in
`./node_modules/ajv/dist/ajv.bundle.js` once you've installed this package's dependencies.