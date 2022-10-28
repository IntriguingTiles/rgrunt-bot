const { EmbedBuilder, GuildEmoji, PermissionsBitField, AuditLogEvent } = require("discord.js"); // eslint-disable-line no-unused-vars

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
    c.on("emojiCreate", emojiCreate);
    c.on("emojiUpdate", emojiUpdate);
    c.on("emojiDelete", emojiDelete);
};

/**
 * @param {import("../types").ClientExt} c
 */
exports.deregister = c => {
    c.removeListener("emojiCreate", emojiCreate);
    c.removeListener("emojiUpdate", emojiUpdate);
    c.removeListener("emojiDelete", emojiDelete);
};

/**
 * @param {GuildEmoji} emoji 
 */
async function emojiCreate(emoji) {
    const guildSettings = client.guildSettings.get(emoji.guild.id);

    if (guildSettings.logFlags & flags.logs.EMOJI && guildSettings.logChannel && emoji.guild.channels.cache.has(guildSettings.logChannel) &&
        emoji.guild.channels.cache.get(guildSettings.logChannel).permissionsFor(emoji.guild.members.me).has(PermissionsBitField.Flags.ViewChannel | PermissionsBitField.Flags.SendMessages | PermissionsBitField.Flags.EmbedLinks)) {
        const embed = new EmbedBuilder();

        embed.setAuthor({ name: "Emoji Created", iconURL: emoji.guild.iconURL() });
        embed.setColor(colors.GREEN);
        embed.addFields([{ name: "Name", value: emoji.name, inline: true }]);
        embed.setThumbnail(emoji.url);
        embed.setFooter({ text: `ID: ${emoji.id}` });
        embed.setTimestamp();

        if (!emoji.guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) embed.addFields([{ name: "Created by", value: `${await emoji.fetchAuthor()} ${await emoji.fetchAuthor().tag}` }]);

        const msg = await emoji.guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });

        if (emoji.guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
            const timestamp = Date.now();
            await sleep(800);
            const logs = await emoji.guild.fetchAuditLogs({ type: AuditLogEvent.EmojiCreate, limit: 1 });
            if (logs.entries.first() && logs.entries.first().target.id === emoji.id) {
                const log = logs.entries.first();

                if (Math.abs(timestamp - log.createdTimestamp) < 1400) {
                    embed.addFields([{ name: "Created by", value: `${log.executor} ${log.executor.tag}` }]);
                    embed.setTimestamp(log.createdAt);
                    if (log.reason) embed.addFields([{ name: "Reason", value: log.reason }]);
                    msg.edit({ embeds: [embed] });
                }
            }
        }

    }
}

/**
 * @param {GuildEmoji} oldEmoji
 * @param {GuildEmoji} newEmoji
 */
async function emojiUpdate(oldEmoji, newEmoji) {
    const guildSettings = client.guildSettings.get(newEmoji.guild.id);

    if (guildSettings.logFlags & flags.logs.EMOJI && guildSettings.logChannel && newEmoji.guild.channels.cache.has(guildSettings.logChannel) &&
        newEmoji.guild.channels.cache.get(guildSettings.logChannel).permissionsFor(newEmoji.guild.members.me).has(PermissionsBitField.Flags.ViewChannel | PermissionsBitField.Flags.SendMessages | PermissionsBitField.Flags.EmbedLinks) && oldEmoji.name !== newEmoji.name) {
        const embed = new EmbedBuilder();

        embed.setAuthor({ name: "Emoji Updated", iconURL: newEmoji.guild.iconURL() });
        embed.setColor(colors.BLUE);
        embed.addFields([{ name: "Name", value: `\`${oldEmoji.name}\` → \`${newEmoji.name}\``, inline: true }]);
        embed.setThumbnail(newEmoji.url);
        embed.setFooter({ text: `ID: ${newEmoji.id}` });
        embed.setTimestamp();

        if (newEmoji.guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
            const timestamp = Date.now();
            await sleep(800);
            const logs = await newEmoji.guild.fetchAuditLogs({ type: AuditLogEvent.EmojiUpdate, limit: 1 });
            if (logs.entries.first() && logs.entries.first().target.id === newEmoji.id) {
                const log = logs.entries.first();

                if (Math.abs(timestamp - log.createdTimestamp) < 1400) {
                    embed.addFields([{ name: "Updated by", value: `${log.executor} ${log.executor.tag}` }]);
                    embed.setTimestamp(log.createdAt);
                    if (log.reason) embed.addFields([{ name: "Reason", value: log.reason }]);
                }
            }
        }

        newEmoji.guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });
    }
}

/**
 * @param {GuildEmoji} emoji
 */
async function emojiDelete(emoji) {
    const guildSettings = client.guildSettings.get(emoji.guild.id);

    if (guildSettings.logFlags & flags.logs.EMOJI && guildSettings.logChannel && emoji.guild.channels.cache.has(guildSettings.logChannel) &&
        emoji.guild.channels.cache.get(guildSettings.logChannel).permissionsFor(emoji.guild.members.me).has(PermissionsBitField.Flags.ViewChannel | PermissionsBitField.Flags.SendMessages | PermissionsBitField.Flags.EmbedLinks)) {
        const embed = new EmbedBuilder();

        embed.setAuthor({ name: "Emoji Deleted", iconURL: emoji.guild.iconURL() });
        embed.setColor(colors.ORANGE);
        embed.addFields([{ name: "Name", value: emoji.name, inline: true }]);
        embed.setThumbnail(emoji.url);
        embed.setFooter({ text: `ID: ${emoji.id}` });
        embed.setTimestamp();

        if (emoji.guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
            const timestamp = Date.now();
            await sleep(800);
            const logs = await emoji.guild.fetchAuditLogs({ type: AuditLogEvent.EmojiDelete, limit: 1 });
            if (logs.entries.first() && logs.entries.first().target.id === emoji.id) {
                const log = logs.entries.first();

                if (Math.abs(timestamp - log.createdTimestamp) < 1400) {
                    embed.addFields([{ name: "Deleted by", value: `${log.executor} ${log.executor.tag}` }]);
                    embed.setTimestamp(log.createdAt);
                    if (log.reason) embed.addFields([{ name: "Reason", value: log.reason }]);
                }
            }
        }

        emoji.guild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });
    }
}