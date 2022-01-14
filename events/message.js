const { Client, MessageEmbed, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

const flags = require("../utils/flags.js");
const colors = require("../utils/colors.js");
const truncate = require("../utils/truncate.js");
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
    if (msg.channel.type === "DM") return;

    const guildSettings = client.guildSettings.get(msg.guild.id);

    if (guildSettings.logFlags & flags.logs.DELETE && guildSettings.logChannel && msg.guild.channels.cache.has(guildSettings.logChannel)) {
        if (msg.channel.topic && msg.channel.topic.includes("[NO-LOGS]")) return;

        const embed = new MessageEmbed();

        embed.setAuthor({ name: "Message Deleted", iconURL: msg.guild.iconURL({ dynamic: true }) });
        embed.setColor(colors.ORANGE);

        if (!msg.partial) {
            if (msg.author.bot) return;

            embed.setAuthor({ name: "Message Deleted", iconURL: msg.author.displayAvatarURL({ dynamic: true }) });
            embed.addField("Author", `${msg.author} ${msg.author.tag}`, true);
            embed.addField("Channel", `${msg.channel}`, true);

            if (msg.content.length !== 0) embed.addField("Contents", truncate(msg.content, 300, 8));

            if (msg.attachments.size !== 0) {
                let attachments = "";

                msg.attachments.forEach(attachment => {
                    attachments += `${attachment.proxyURL}\n`;
                });

                embed.addField("Attachments", attachments);
            }
        } else {
            embed.addField("Channel", `${msg.channel}`, true);
        }

        embed.setFooter(`ID: ${msg.id}`);
        embed.setTimestamp();

        if (msg.badWords) {
            embed.addField("Deleted by", `${client.user} ${client.user.tag}`);
            embed.addField("Reason", "Word filter");
            msg.guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });
        } else if (msg.guild.me.permissions.has("VIEW_AUDIT_LOG")) {
            const logMsg = await msg.guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });
            const timestamp = Date.now();
            await sleep(800);
            const logs = await msg.guild.fetchAuditLogs({ type: "MESSAGE_DELETE", limit: 1 });
            if (logs.entries.first()) {
                const log = logs.entries.first();
                if (Math.abs(timestamp - log.createdTimestamp) < 1400) {
                    embed.addField("Deleted by", `${log.executor} ${log.executor.tag}`);
                    embed.setTimestamp(log.createdAt);
                    if (log.reason) embed.addField("Reason", log.reason);
                    logMsg.edit({ embeds: [embed] });
                }
            }
        }
    }
}

/**
 * @param {Message} oldMsg 
 * @param {Message} newMsg 
 */
async function messageUpdate(oldMsg, newMsg) {
    if (newMsg.channel.type === "DM") return;

    const guildSettings = client.guildSettings.get(newMsg.guild.id);

    if (guildSettings.logFlags & flags.logs.EDIT && guildSettings.logChannel && newMsg.guild.channels.cache.has(guildSettings.logChannel) && oldMsg.content !== newMsg.content) {
        if (newMsg.channel.topic && newMsg.channel.topic.includes("[NO-LOGS]")) return;
        if (newMsg.partial) await newMsg.fetch();
        if (newMsg.author.bot) return;
        const embed = new MessageEmbed();

        embed.setAuthor({ name: "Message Edited", iconURL: newMsg.author.displayAvatarURL({ dynamic: true }) });
        embed.setDescription(`[Jump to Message](${newMsg.url})`);
        embed.setColor(colors.BLUE);

        embed.addField("Author", `${newMsg.author} ${newMsg.author.tag}`, true);
        embed.addField("Channel", `${newMsg.channel}`, true);

        if (!oldMsg.partial) {
            embed.addField("Before", oldMsg.content ? truncate(oldMsg.content, 300, 4) : "None");
            embed.addField("After", newMsg.content ? truncate(newMsg.content, 300, 4) : "None");
        }

        embed.setFooter(`ID: ${newMsg.id}`);
        embed.setTimestamp();

        newMsg.guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });
    }
}