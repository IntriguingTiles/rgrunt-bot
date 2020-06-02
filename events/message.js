const { Client, MessageEmbed, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

const flags = require("../utils/flags.js");
const colors = require("../utils/colors.js");
const sleep = require("util").promisify(setTimeout);

/** @type {Client} */
let client;

/**
 * @param {Client} c
 */
exports.register = c => {
    client = c;
    c.on("messageDelete", messageDelete);
    c.on("messageUpdate", messageUpdate);
};

/**
 * @param {Client} c
 */
exports.deregister = c => {
    c.removeListener("messageDelete", messageDelete);
    c.removeListener("messageUpdate", messageUpdate);
};

/**
 * @param {Message} msg
 */
async function messageDelete(msg) {
    if (msg.channel.type === "dm") return;

    const guildSettings = client.guildSettings.get(msg.guild.id);

    if (guildSettings.logFlags & flags.logs.DELETE && guildSettings.logChannel && msg.guild.channels.cache.has(guildSettings.logChannel)) {
        if (msg.channel.topic && msg.channel.topic.includes("[NO-LOGS]")) return;

        const embed = new MessageEmbed();

        embed.setAuthor("Message Deleted");
        embed.setColor(colors.RED);

        if (!msg.partial) {
            if (msg.author.bot) return;

            embed.setAuthor("Message Deleted", msg.author.displayAvatarURL());
            embed.addField("Author", `${msg.author} ${msg.author.tag}`, true);
            embed.addField("Channel", `${msg.channel}`, true);

            if (msg.content.length !== 0) embed.addField("Contents", cutOff(msg.content, 300, 8));

            if (msg.attachments.size !== 0) {
                let attachments = "";

                msg.attachments.forEach(attachment => {
                    attachments += `${attachment.url}\n`;
                });

                embed.addField("Attachments", attachments);
            }
        } else {
            embed.addField("Channel", `${msg.channel}`, true);
        }

        if (msg.badWords) {
            embed.addField("Deleted by", `${client.user} ${client.user.tag}`);
            embed.addField("Reason", "Word filter");
        } else if (msg.guild.me.hasPermission("VIEW_AUDIT_LOG")) {
            await sleep(500);
            const logs = await msg.guild.fetchAuditLogs({ type: "MESSAGE_DELETE", limit: 1 });
            if (logs.entries.first()) {
                const log = logs.entries.first();
                if (Date.now() - log.createdTimestamp < 800) {
                    embed.addField("Deleted by", `${log.executor} ${log.executor.tag}`);
                    embed.setTimestamp(log.createdAt);
                    if (log.reason) embed.addField("Reason", log.reason);
                }
            }
        }

        embed.setFooter(`ID: ${msg.id}`);
        embed.setTimestamp();

        msg.guild.channels.cache.get(guildSettings.logChannel).send(embed);
    }
}

/**
 * @param {Message} oldMsg 
 * @param {Message} newMsg 
 */
async function messageUpdate(oldMsg, newMsg) {
    if (newMsg.channel.type === "dm") return;

    const guildSettings = client.guildSettings.get(newMsg.guild.id);

    if (guildSettings.logFlags & flags.logs.EDIT && guildSettings.logChannel && newMsg.guild.channels.cache.has(guildSettings.logChannel) && oldMsg.content !== newMsg.content) {
        if (newMsg.channel.topic && newMsg.channel.topic.includes("[NO-LOGS]")) return;
        if (newMsg.partial) await newMsg.fetch();
        if (newMsg.author.bot) return;
        const embed = new MessageEmbed();

        embed.setAuthor("Message Edited", newMsg.author.displayAvatarURL());
        embed.setDescription(`[Jump to Message](${newMsg.url})`);
        embed.setColor(colors.BLUE);

        embed.addField("Author", `${newMsg.author} ${newMsg.author.tag}`, true);
        embed.addField("Channel", `${newMsg.channel}`, true);

        if (!oldMsg.partial) {
            embed.addField("Before", oldMsg.content ? cutOff(oldMsg.content, 300, 4) : "None");
            embed.addField("After", newMsg.content ? cutOff(newMsg.content, 300, 4) : "None");
        }

        embed.setFooter(`ID: ${newMsg.id}`);
        embed.setTimestamp();

        newMsg.guild.channels.cache.get(guildSettings.logChannel).send(embed);
    }
}

/**
 * @param {string} str 
 * @param {number} maxLen 
 * @param {number} maxLines 
 */
function cutOff(str, maxLen, maxLines) {
    let finalStr = str.length > maxLen ? str.substr(0, maxLen) + "..." : str;
    finalStr = finalStr.split("\n").length > maxLines ? finalStr.split("\n").slice(0, maxLines).join("\n") + "..." : finalStr;
    return finalStr;
}