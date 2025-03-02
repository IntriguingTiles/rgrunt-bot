const { EmbedBuilder, GuildChannel, PermissionsBitField, AuditLogEvent, ChannelType, escapeMarkdown } = require("discord.js"); // eslint-disable-line no-unused-vars

const flags = require("../utils/flags.js");
const colors = require("../utils/colors.js");
const sleep = require("util").promisify(setTimeout);

/** @type {import("../types").ClientExt} */
let client;

/**
 * @param {import("../types").ClientExt} c
 */
exports.register = c => {
    client = c;
    c.on("channelCreate", channelCreate);
    c.on("channelUpdate", channelUpdate);
    c.on("channelDelete", channelDelete);
};

/**
 * @param {import("../types").ClientExt} c
 */
exports.deregister = c => {
    c.removeListener("channelCreate", channelCreate);
    c.removeListener("channelUpdate", channelUpdate);
    c.removeListener("channelDelete", channelDelete);
};

/**
 * @param {GuildChannel} ch 
 */
async function channelCreate(ch) {
    if (ch.type === ChannelType.DM) return;
    const guildSettings = client.guildSettings.get(ch.guild.id);

    if (guildSettings.logFlags & flags.logs.CHANNEL && guildSettings.logChannel && ch.guild.channels.cache.has(guildSettings.logChannel) &&
        ch.guild.channels.cache.get(guildSettings.logChannel).permissionsFor(ch.guild.members.me).has(PermissionsBitField.Flags.ViewChannel | PermissionsBitField.Flags.SendMessages | PermissionsBitField.Flags.EmbedLinks)) {
        const embed = new EmbedBuilder();

        embed.setAuthor({ name: "Channel Created", iconURL: ch.guild.iconURL() });
        embed.setColor(colors.GREEN);
        embed.addFields([{ name: "Name", value: ch.name, inline: true }]);
        embed.setFooter({ text: `ID: ${ch.id}` });
        embed.setTimestamp();

        const msg = await ch.guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });

        if (ch.guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
            const timestamp = Date.now();
            await sleep(800);
            const logs = await ch.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelCreate, limit: 1 });
            if (logs.entries.first() && logs.entries.first().target.id === ch.id) {
                const log = logs.entries.first();

                if (Math.abs(timestamp - log.createdTimestamp) < 1400) {
                    embed.addFields([{ name: "Created by", value: `${log.executor} ${escapeMarkdown(log.executor.tag)}` }]);
                    embed.setTimestamp(log.createdAt);
                    if (log.reason) embed.addFields([{ name: "Reason", value: escapeMarkdown(log.reason) }]);
                    msg.edit({ embeds: [embed] });
                }
            }
        }

    }
}

/**
 * @param {GuildChannel} oldCh 
 * @param {GuildChannel} newCh 
 */
async function channelUpdate(oldCh, newCh) {
    if (newCh.type === ChannelType.DM) return;
    const guildSettings = client.guildSettings.get(newCh.guild.id);

    if (guildSettings.logFlags & flags.logs.CHANNEL && guildSettings.logChannel && newCh.guild.channels.cache.has(guildSettings.logChannel) &&
        newCh.guild.channels.cache.get(guildSettings.logChannel).permissionsFor(newCh.guild.members.me).has(PermissionsBitField.Flags.ViewChannel | PermissionsBitField.Flags.SendMessages | PermissionsBitField.Flags.EmbedLinks)) {
        if (newCh.topic && newCh.topic.includes("[NO-LOGS]")) return;
        const embed = new EmbedBuilder();
        let shouldPost = false;

        embed.setAuthor({ name: "Channel Updated", iconURL: newCh.guild.iconURL() });
        embed.setColor(colors.BLUE);

        if (oldCh.name !== newCh.name) {
            embed.addFields([{ name: "Name", value: `\`${oldCh.name}\` → \`${newCh.name}\``, inline: true }]);
            shouldPost = true;
        } else {
            embed.addFields([{ name: "Name", value: newCh.name, inline: true }]);
        }

        if (oldCh.topic !== newCh.topic) {
            embed.addFields([{ name: "Topic", value: `${oldCh.topic ? `\`${oldCh.topic}\`` : "None"} → ${newCh.topic ? `\`${newCh.topic}\`` : "None"}`, inline: true }]);
            shouldPost = true;
        }

        if (!shouldPost) return;

        embed.setFooter({ text: `ID: ${newCh.id}` });
        embed.setTimestamp();

        const msg = await newCh.guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });

        if (newCh.guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
            const timestamp = Date.now();
            await sleep(800);
            const logs = await newCh.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelUpdate, limit: 1 });
            if (logs.entries.first() && logs.entries.first().target.id === newCh.id) {
                const log = logs.entries.first();

                if (Math.abs(timestamp - log.createdTimestamp) < 1400) {
                    embed.addFields([{ name: "Updated by", value: `${log.executor} ${escapeMarkdown(log.executor.tag)}` }]);
                    embed.setTimestamp(log.createdAt);
                    if (log.reason) embed.addFields([{ name: "Reason", value: escapeMarkdown(log.reason) }]);
                    msg.edit({ embeds: [embed] });
                }
            }
        }

    }
}

/**
 * @param {GuildChannel} ch 
 */
async function channelDelete(ch) {
    if (ch.type === ChannelType.DM) return;
    const guildSettings = client.guildSettings.get(ch.guild.id);

    if (guildSettings.logFlags & flags.logs.CHANNEL && guildSettings.logChannel && ch.guild.channels.cache.has(guildSettings.logChannel) &&
        ch.guild.channels.cache.get(guildSettings.logChannel).permissionsFor(ch.guild.members.me).has(PermissionsBitField.Flags.ViewChannel | PermissionsBitField.Flags.SendMessages | PermissionsBitField.Flags.EmbedLinks)) {
        const embed = new EmbedBuilder();

        embed.setAuthor({ name: "Channel Deleted", iconURL: ch.guild.iconURL() });
        embed.setColor(colors.ORANGE);
        embed.addFields([{ name: "Name", value: ch.name, inline: true }]);
        embed.setFooter({ text: `ID: ${ch.id}` });
        embed.setTimestamp();

        const msg = await ch.guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });

        if (ch.guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
            const timestamp = Date.now();
            await sleep(800);
            const logs = await ch.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete, limit: 1 });
            if (logs.entries.first() && logs.entries.first().target.id === ch.id) {
                const log = logs.entries.first();

                if (Math.abs(timestamp - log.createdTimestamp) < 1400) {
                    embed.addFields([{ name: "Deleted by", value: `${log.executor} ${escapeMarkdown(log.executor.tag)}` }]);
                    embed.setTimestamp(log.createdAt);
                    if (log.reason) embed.addFields([{ name: "Reason", value: escapeMarkdown(log.reason) }]);
                    msg.edit({ embeds: [embed] });
                }
            }
        }

    }
}