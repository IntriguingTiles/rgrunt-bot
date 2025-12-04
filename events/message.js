const { EmbedBuilder, Message, PermissionsBitField, ChannelType, AuditLogEvent, escapeMarkdown } = require("discord.js"); // eslint-disable-line no-unused-vars

const flags = require("../utils/flags.js");
const colors = require("../utils/colors.js");
const truncate = require("../utils/truncate.js");
const sleep = require("util").promisify(setTimeout);

/** @type {import("../types").ClientExt} */
let client;

/**
 * @param {import("../types").ClientExt} c
 */
exports.register = c => {
    client = c;
    c.on("messageDelete", messageDelete);
    c.on("messageUpdate", messageUpdate);
};

/**
 * @param {import("../types").ClientExt} c
 */
exports.deregister = c => {
    c.removeListener("messageDelete", messageDelete);
    c.removeListener("messageUpdate", messageUpdate);
};

/**
 * @param {Message} msg
 */
async function messageDelete(msg) {
    if (msg.channel.type === ChannelType.DM) return;

    const guildSettings = client.guildSettings.get(msg.guild.id);

    if (guildSettings.logFlags & flags.logs.DELETE && guildSettings.logChannel && msg.guild.channels.cache.has(guildSettings.logChannel) &&
        msg.guild.channels.cache.get(guildSettings.logChannel).permissionsFor(msg.guild.members.me).has(PermissionsBitField.Flags.ViewChannel | PermissionsBitField.Flags.SendMessages | PermissionsBitField.Flags.EmbedLinks)) {
        if (msg.channel.topic && msg.channel.topic.includes("[NO-LOGS]")) return;

        const embed = new EmbedBuilder();

        embed.setAuthor({ name: "Message Deleted", iconURL: msg.guild.iconURL() });
        embed.setColor(colors.ORANGE);

        if (!msg.partial) {
            if (msg.author.bot) return;

            embed.setAuthor({ name: "Message Deleted", iconURL: msg.author.displayAvatarURL() });
            embed.addFields([{ name: "Author", value: `${msg.author} ${escapeMarkdown(msg.author.tag)}`, inline: true }]);
            embed.addFields([{ name: "Channel", value: `${msg.channel}`, inline: true }]);

            if (msg.content.length !== 0) embed.addFields([{ name: "Contents", value: truncate(msg.content, 300, 8) }]);

            if (msg.attachments.size !== 0) {
                let attachments = "";

                msg.attachments.forEach(attachment => {
                    attachments += `${attachment.proxyURL}\n`;
                });

                embed.addFields([{ name: "Attachments", value: attachments }]);
            }
        } else {
            embed.addFields([{ name: "Channel", value: `${msg.channel}`, inline: true }]);
        }

        embed.setFooter({ text: `ID: ${msg.id}` });
        embed.setTimestamp();

        if (msg.badWords) {
            embed.addFields([{ name: "Deleted by", value: `${client.user} ${escapeMarkdown(client.user.tag)}` }]);
            embed.addFields([{ name: "Reason", value: "Word filter" }]);
            msg.guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });

            if (msg.guild.id === "154305477323390976") {
                const ch = await msg.guild.channels.fetch("970048913706987540");
                ch.send({ embeds: [embed] });
            }
        } else if (msg.guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
            const logMsg = await msg.guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });
            const timestamp = Date.now();
            await sleep(800);
            const logs = await msg.guild.fetchAuditLogs({ type: AuditLogEvent.MessageDelete, limit: 1 });
            if (logs.entries.first()) {
                const log = logs.entries.first();
                if (Math.abs(timestamp - log.createdTimestamp) < 1400) {
                    embed.addFields([{ name: "Deleted by", value: `${log.executor} ${escapeMarkdown(log.executor.tag)}` }]);
                    embed.setTimestamp(log.createdAt);
                    if (log.reason) embed.addFields([{ name: "Reason", value: escapeMarkdown(log.reason) }]);
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
    if (newMsg.channel.type === ChannelType.DM) return;

    const guildSettings = client.guildSettings.get(newMsg.guild.id);

    if (guildSettings.logFlags & flags.logs.EDIT && guildSettings.logChannel && newMsg.guild.channels.cache.has(guildSettings.logChannel) &&
        newMsg.guild.channels.cache.get(guildSettings.logChannel).permissionsFor(newMsg.guild.members.me).has(PermissionsBitField.Flags.ViewChannel | PermissionsBitField.Flags.SendMessages | PermissionsBitField.Flags.EmbedLinks) && oldMsg.content !== newMsg.content) {
        if (newMsg.channel.topic && newMsg.channel.topic.includes("[NO-LOGS]")) return;
        if (oldMsg.partial) return;
        if (newMsg.partial) await newMsg.fetch();
        if (newMsg.author.bot) return;
        const embed = new EmbedBuilder();

        embed.setAuthor({ name: "Message Edited", iconURL: newMsg.author.displayAvatarURL() });
        embed.setDescription(`[Jump to Message](${newMsg.url})`);
        embed.setColor(colors.BLUE);

        embed.addFields([{ name: "Author", value: `${newMsg.author} ${escapeMarkdown(newMsg.author.tag)}`, inline: true }]);
        embed.addFields([{ name: "Channel", value: `${newMsg.channel}`, inline: true }]);
        embed.addFields([{ name: "Before", value: oldMsg.content ? truncate(oldMsg.content, 300, 4) : "None" }]);
        embed.addFields([{ name: "After", value: newMsg.content ? truncate(newMsg.content, 300, 4) : "None" }]);

        embed.setFooter({ text: `ID: ${newMsg.id}` });
        embed.setTimestamp();

        newMsg.guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });
    }
}