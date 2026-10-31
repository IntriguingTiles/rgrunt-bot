const { Message } = require("discord.js"); // eslint-disable-line no-unused-vars

/**
 * @param {import("../types").ClientExt} c
 */
exports.register = c => {
    c.on("messageCreate", messageCreate);
};

/**
 * @param {import("../types").ClientExt} c
 */
exports.deregister = c => {
    c.removeListener("messageCreate", messageCreate);
};

/**
 * 
 * @param {Message} msg 
 */
async function messageCreate(msg) {
    if (msg.channel.id === "1565798505287778344" && msg.crosspostable) msg.crosspost();
}