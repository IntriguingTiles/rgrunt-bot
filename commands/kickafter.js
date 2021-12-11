const { Client, Message, GuildMember } = require("discord.js"); // eslint-disable-line no-unused-vars
const moment = require("moment");

exports.help = {
    name: "kickafter",
    usage: "kickafter <@mention or id> [reason]",
    info: "Kick all users who joined after, and including, the target user"
};

exports.requireAdmin = true;

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 * @param {import("../types").Settings} guildSettings
 */
exports.run = async (client, msg, args, guildSettings) => {
    if (args.length === 0) return msg.channel.send(`Usage: \`${guildSettings.prefix}${exports.help.usage}\``);
    if (!msg.guild.me.permissions.has("KICK_MEMBERS")) return msg.channel.send("I don't have permission to kick members.");

    try {
        const member = await fetchMember(client, msg, args);

        if (moment(member.joinedTimestamp).isBefore(moment().subtract(1, "day"))) return msg.channel.send("Sorry, I can only kick members who joined in the last 24 hours.");
        msg.channel.send(`This will kick **${msg.guild.members.cache.filter(m => m.joinedTimestamp >= member.joinedTimestamp).size}** members. Are you sure? Type **yes** to continue.`);
        const collector = msg.channel.createMessageCollector(m => m.member.id === msg.member.id, { time: 10000 });
        let kicking = false;
        collector.on("collect", m => {
            if (m.content.toLocaleLowerCase() === "no") return collector.stop();
            if (m.content.toLocaleLowerCase() === "yes") {
                kicking = true;
                const reason = args.length >= 2 ? `${args.slice(1).join(" ")} (initiated by ${msg.author.tag})` : `Initiated by ${msg.author.tag}`;
                msg.channel.send(`Kicking ${msg.guild.members.cache.filter(m => m.joinedTimestamp >= member.joinedTimestamp).size} members, this might take a while.`);
                msg.guild.members.cache.filter(m => m.joinedTimestamp >= member.joinedTimestamp).forEach(m => m.kick(reason));
            }
        });
        collector.on("end", () => {
            if (!kicking) msg.channel.send("Cancelled kick.");
        });
    } catch (err) {
        //
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