(function (fluid) {
    "use strict";

    var gpii = fluid.registerNamespace("gpii");
    fluid.registerNamespace("gpii.schema");

    /**
     *
     * Break down a string into 50,000 character blocks and construct a composite "hash" based on each "segment".  The
     * smaller segment size is meant to avoid the risk of "collisions" when comparing very large strings (the previous
     * approach collided infrequently but consistently when comparing 175,000 close variations on a 175,000 character
     * string).
     *
     * Strings shorter than 50,000 characters will return a hash that looks like a single stringified 32-bit integer, as
     * in:
     *
     * `-1864109329`
     *
     * Strings longer than 50,000 characters will return a hash that looks like multiple stringified 32-bit integers
     * joined using a colon, as in:
     *
     * `1464911337:-123853895:59841156:-143877442`
     *
     * @param {String} originalString - The original string to be hashed.
     * @return {String} - A hash composed of the hashes for each sub-segment in the original string.
     *
     */
    gpii.schema.hashString = function (originalString) {
        var segmentSize = 50000;
        var numSegments = Math.ceil(originalString.length / segmentSize);
        var hashSegments = [];
        for (var a = 0; a < numSegments; a++) {
            var start = (a * segmentSize);
            var segment = originalString.substring(start, start + segmentSize);
            var segmentHash = gpii.schema.hashStringSegment(segment);
            hashSegments.push(segmentHash);
        }
        return hashSegments.join(":");
    };

    // Adapted from: https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript/22429679
    /**
     *
     * Generate a unique hash (32-bit integer) for an input string.
     *
     * @param {String} stringSegment - The string to hash.
     * @return {String} - A hash generated from the original string.
     *
     */
    gpii.schema.hashStringSegment = function (stringSegment) {
        var hash = 0;
        if (stringSegment.length === 0) {
            return hash;
        }

        for (var i = 0; i < stringSegment.length; i++) {
            var chr = stringSegment.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash.toString();
    };
})(fluid);
