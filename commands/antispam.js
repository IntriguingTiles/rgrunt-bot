const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

exports.help = {
    name: "antispam",
    usage: "antispam <enable|disable>",
    info: "Enables/disables antispam"
};

exports.requireAdmin = true;

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 * @param {import("../types").Settings} guildSettings
 */
exports.run = async (client, msg, args, guildSettings) => {
    if (args.length !== 1) return msg.channel.send(`Usage: \`${guildSettings.prefix}${exports.help.usage}\``);
    if (!guildSettings.jailRole) return msg.channel.send(`Use \`${guildSettings.prefix}roleconfig jail\` before using this command.`);

    if (args[0] === "enable") {
        guildSettings.antiSpam = true;
        client.guildSettings.set(msg.guild.id, guildSettings);

        msg.channel.send("Successfully enabled anti-spam.");
    } else if (args[0] === "disable") {
        guildSettings.antiSpam = false;
        client.guildSettings.set(msg.guild.id, guildSettings);

        msg.channel.send("Successfully disabled anti-spam.");
    } else {
        msg.channel.send(`Usage: \`${guildSettings.prefix}${exports.help.usage}\``);
    }
};