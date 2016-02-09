
# What is the parser?

The parser component provided by this package is designed to make it easier to understand an existing JSON Schema, and to make it easier to provide clear feedback to end users.

[JSON Schema](http://json-schema.org/) is a standard for describing JSON data formats using JSON notation.  Simple schemas are more or less human-readable descriptions of what structure is expected and what data is allowed at each level.

You can reuse content within or between schemas using the `$ref` notation, which allows you to refer to content found elsewhere.  Schemas that make use of the `$ref` notation are not generally human readable, especially when there is a chain of inherited definitions that must each be retrieved and understood before you reach the level of "simple" rules.

This component parses a JSON Schema and dereferences all of its `$ref` links (including chains of references).  The final result is a JSON Schema that enforces the same structure as the original, but which is composed only of "simple" rules.

# What is it used for?

The parser is generally used to evolve raw schema validation errors so that we can see the full definition of the rule that was broken.  By convention, we enter a human-readable description of the required data in the `description` metadata associated with each rule.  Using the path data we get from the validator and the lookup function provided by the parser, we can retrieve the `description` metadata associated with the failing rule.

Say we have a schema like the following:

    {
        type: "object",
        definitions: {
            field1: {
                description: "Field one must contain at least one uppercase character.",
                type:        "string",
                pattern:     "[A-Z]+"
            }
        },
        properties: {
            field1: { $ref: "#/definitions/field1" }
        }
    }

  If the validator tells us that `.field1` is invalid, it will produce error data like the following:

    {
        fieldErrors: {
            field1: ["should match pattern \"[A-Z]\""]
        }
    }

  The parser allows us to replace this with the description from the JSON Schema, as in:

     {
         fieldErrors: {
             field1: ["Field one must contain at least one uppercase character."]
         }
     }

  This is clearer to read in even the simplest case, and is especially useful when using `allOf` and `anyOf` to combine
  rules.  Even a simple validation error for a field that uses `allOf` and `anyOf` would return at least two warnings
  from the validator, one of which simply says how many rules failed, or that one of them must match.

  If the desired schema property lacks a description, the raw message from the validator will be used as a fallback.

  To use this component, you will need to instantiate it and make it aware of your schemas.  These will be dereferenced
  and cached as they are added.  You can then use the `lookupField` method to retrieve any property of the field from
  the schema definition, as in:

    parser.lookupField("user", ".password.description")

  This component uses [json-schema-ref-parser](https://github.com/BigstickCarpet/json-schema-ref-parser).  We configure
  it using `options.parserOptions` (empty by default).  Read the library's documentation for details of [what options
  are available](https://github.com/BigstickCarpet/json-schema-ref-parser/blob/master/docs/options.md).

  Note that this library expects to be able to resolve external references relative to the first argument passed to its
  `dereference` function, and it expects to load and cache the references itself as needed.  Since we are receiving keys
  from the `validator`, we need to some how convert these to URLs.  We do this using `fluid.stringTemplate` to combine
  `options.schemaPath` with the individual key, which means:

  1.  If `options.schemaPath` is a directory location, a full path will be produced.
  2.  If `options.schemaPath` is a URL, a full URL will be produced.
  3.  If `options.schemaPath` is empty, paths will be resolved relative to the working directory.

  If you are using this with the `validator`, it takes care of that bit of wiring for you.

# Functions

## gpii.schema.parser.dereferenceSchema(that, schemaPath, schemaKey)

 * `that`: The component itself.
 * `schemaPath {String}`:  A path or URI to the directory or base URL where the schema can be found.
 * `schemaKey {String}`: The filename of the schema relative to `schemaPath`.
 * Returns: A `promise` that will be satisfied when the parser finishes its work.

 Dereference a single schema.  As the process is asynchronous, this function returns a promise.  Typically accessed using the parser component's `dereferenceSchema` invoker and the `schemaKey` attribute.

## gpii.schema.parser.lookupField(that, schemaKey, schemaFieldPath)

* `that`: The component itself.
* `schemaKey {String}`: The `key` of the schema (generally the filename, i.e. `base.json`).
* `schemaFieldPath {String}`: a string like `.root.nested.value.description` or an array of path segments like `["root", "nested", "value", "description"]`.
* Returns: `Object` The portion of the dereferenced JSON Schema that defines the acceptable format for the field.

 Given the path to a field and a schema key, look up the definition in the JSON Schema.  Typically accessed using the parser component's `lookupField` invoker and the last two arguments.

 This function assumes it is working with an object that directly represents a JSON Schema, and that child properties
 will be represented within the `properties` element of each level.  The path `.root.nested.value.description` implies
 a structure like the following:

    {
      root: {
        properties: {
          nested: {
            properties: {
              value: {
                description: "Text description"
              }
            }
          }
        }
      }
    }

  At all but the last level, the segment (`nested`, for example`) is looked for first as a property, then as a root
  element.  On the last level, the segment (`description`, for example) is looked for first as a root element, and then
  as a property. This is done to avoid unexpected behavior in dealing with schema properties that match JSON Schema
  keywords, such as `required`, `title`, or `description`.

## gpii.schema.parser.lookupDescription(that, schemaKey, schemaFieldPath)

* `that`: The component itself.
* `schemaKey {String}`: See [gpii.schema.parser.lookupField](#gpiischemaparserlookupfieldthat-schemakey-schemafieldpath) above.
* `schemaFieldPath {String}`: See [gpii.schema.parser.lookupField](#gpiischemaparserlookupfieldthat-schemakey-schemafieldpath) above.
* Returns: `String` the text of the description metadata for the field.

Convenience function to lookup the most commonly used field (the description). Typically accessed using the parser component's `lookupDescription` invoker and the last two arguments.
