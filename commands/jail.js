const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

exports.aliases = ["unjail"];

exports.help = {
    name: "jail",
    usage: "jail <@mention or id>",
    info: "Jails/unjails the target user"
};

exports.requireMod = true;

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 * @param {import("../types").Settings} guildSettings
 */
exports.run = async (client, msg, args, guildSettings) => {
    if (!guildSettings.jailRole) return msg.channel.send(`Use \`${guildSettings.prefix}roleconfig jail\` before using this command.`);
    if (!msg.guild.roles.cache.has(guildSettings.jailRole)) return msg.channel.send("The role used for jail no longer exists.");
    if (args.length === 0) return msg.channel.send(`\`${guildSettings.prefix}${exports.help.usage}\``);

    try {
        const member = await fetchMember(client, msg, args);
        if (member.roles.cache.has(guildSettings.jailRole)) {
            member.roles.remove(guildSettings.jailRole, `Unjailed by ${msg.author.tag}`);
            msg.channel.send("Unjailed!");
        } else {
            member.roles.add(guildSettings.jailRole, `Jailed by ${msg.author.tag}`);
            msg.channel.send("Jailed!");
        }
    } catch (err) {
        msg.channel.send("Failed to add/remove the jail role!");
    }
};

/**
 * @param {Client} client 
 * @param {Message} msg 
 * @param {string[]} args
 * @param {import("../types").Settings} guildSettings
 * @returns {GuildMember}
 */
async function fetchMember(client, msg, args) {
    if (msg.mentions.users.size !== 0) return msg.mentions.members.first();// mentions
    const idRegex = /[0-9]+/g;

    if (idRegex.test(args[0])) {
        try {
            return await msg.guild.members.fetch(args[0].match(idRegex)[0]);
        } catch (err) { /* I'm cheating */ }
    }
    msg.channel.send("Sorry, I couldn't find that user.");
}