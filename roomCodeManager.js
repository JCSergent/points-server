const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const codeLength = 4;
var usedCodes = new Set();

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function generateCode() {
    const max = Math.pow(ALPHABET.length, codeLength);
    let code = randInt(0, max);

    let alphaCode = encodeAlphabet(code);
    while (usedCodes.has(alphaCode)) {
        code = (code + 1) % max;
        alphaCode = encodeAlphabet(code);
    }

    usedCodes.add(alphaCode);
    return alphaCode;
}

function encodeAlphabet(num) {
    let str = "";
    const len = ALPHABET.length;
    while (num > 0) {
    let radix = num % len;
    str = ALPHABET[radix] + str;
    num = Math.floor(num / len);
    }
    return str.padStart(this.codeLength, ALPHABET[0]);
}

function releaseCode(code) {
    usedCodes.delete(code)
}

module.exports = { generateCode, releaseCode };

