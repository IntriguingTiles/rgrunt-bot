const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

exports.help = {
    name: "prefix",
    usage: "prefix <new prefix>",
    info: "Sets the command prefix",
    requireAdmin: true
};

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args, guildSettings) => {
    if (args.length !== 1) return msg.channel.send(`Usage: ${guildSettings.prefix}${exports.help.usage}`, { code: "" });

    guildSettings.prefix = args[0];
    client.guildSettings.set(msg.guild.id, guildSettings);

    msg.channel.send(`The prefix has been successfully updated to \`${guildSettings.prefix}\`.`);
};