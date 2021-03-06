const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

exports.help = {
    name: "verify",
    usage: "verify <@mention or id>",
    info: "Gives the target user the verified role"
};

exports.requireMod = true;

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args, guildSettings) => {
    if (!guildSettings.verifyRole) return msg.channel.send(`Use \`${guildSettings.prefix}roleconfig verify\` before using this command.`);
    if (!msg.guild.roles.cache.has(guildSettings.verifyRole)) return msg.channel.send("The role used for verify no longer exists.");
    if (args.length === 0) return msg.channel.send(`${guildSettings.prefix}${exports.help.usage}`, { code: "" });

    try {
        (await fetchMember(client, msg, args)).roles.add(guildSettings.verifyRole, `Verified by ${msg.author.tag}`);
        msg.channel.send("Verified!");
    } catch (err) {
        msg.channel.send("Failed to add the verified role!");
    }
};

/**
 * @param {Client} client 
 * @param {Message} msg 
 * @param {String[]} args
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