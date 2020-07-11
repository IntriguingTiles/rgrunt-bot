const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

exports.requireMod = true;

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg) => {
    if (msg.guild.id !== "154305477323390976") return;

    try {
        if (!msg.guild.channels.cache.get("600155691428216835").lastMessage) {
            await (await msg.guild.channels.cache.get("600155691428216835").messages.fetch({ limit: 1 })).first().crosspost();
        } else await msg.guild.channels.cache.get("600155691428216835").lastMessage.crosspost();
    } catch (err) {
        return msg.channel.send("Failed to publish.");
    }
        
    msg.channel.send("Published.");
};