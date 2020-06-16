/**
 * Truncates a string
 * @param {string} str 
 * @param {number} maxLen 
 * @param {number} maxLines 
 */
module.exports = (str, maxLen, maxLines) => {
    let finalStr = str.length > maxLen ? str.substr(0, maxLen) + "..." : str;
    finalStr = finalStr.split("\n").length > maxLines ? finalStr.split("\n").slice(0, maxLines).join("\n") + "..." : finalStr;
    return finalStr;
};