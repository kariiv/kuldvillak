const Compressor = function () {}
Compressor.compressors = []
Compressor.add = function (compress, decompress) {
    this.compressors.push({c: compress, dec: decompress})
}
Compressor.compress = function (text) {
    let compressed = null
    let method = 0
    do {
        if (method >= Compressor.compressors.length)
            throw Error("No method that can compress this data")

        compressed = Compressor.compressors[method].c(text)
        if (Compressor.compressors[method].dec(compressed) === null)
            compressed = null
        console.log(compressed)
        method++
    } while (!!!compressed)
    console.log("Is shorter ", text.length - compressed.length)
    return compressed
}
Compressor.decompress = function (text) {
    let decompressed = null
    let method = 0
    do {
        console.log(text)
        if (method >= Compressor.compressors.length)
            throw Error("No method that can decompress this data")

        decompressed = Compressor.compressors[method].dec(text)
        method++
    } while (!!!decompressed)
    return decompressed
}

// Compressor.add(LZString.compress, LZString.decompress)
Compressor.add()