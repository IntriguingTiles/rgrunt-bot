const { Client, MessageEmbed, GuildEmoji } = require("discord.js"); // eslint-disable-line no-unused-vars

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
    c.on("emojiCreate", emojiCreate);
    c.on("emojiUpdate", emojiUpdate);
    c.on("emojiDelete", emojiDelete);
};

/**
 * @param {Client} c
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

    if (guildSettings.logFlags & flags.logs.EMOJI && guildSettings.logChannel && emoji.guild.channels.cache.has(guildSettings.logChannel)) {
        const embed = new MessageEmbed();

        embed.setAuthor("Emoji Created", emoji.guild.iconURL());
        embed.setColor(colors.GREEN);
        embed.addField("Name", emoji.name, true);
        embed.setThumbnail(emoji.url);
        embed.setFooter(`ID: ${emoji.id}`);
        embed.setTimestamp();

        if (!emoji.guild.me.hasPermission("VIEW_AUDIT_LOG")) embed.addField("Created by", `${await emoji.fetchAuthor()} ${await emoji.fetchAuthor().tag}`);

        const msg = emoji.guild.channels.cache.get(guildSettings.logChannel).send(embed);

        if (emoji.guild.me.hasPermission("VIEW_AUDIT_LOG")) {
            await sleep(800);
            const logs = await emoji.guild.fetchAuditLogs({ type: "EMOJI_CREATE", limit: 1 });
            if (logs.entries.first() && logs.entries.first().target.id === emoji.id) {
                const log = logs.entries.first();

                if (Date.now() - log.createdTimestamp < 1400) {
                    embed.addField("Created by", `${log.executor} ${log.executor.tag}`);
                    embed.setTimestamp(log.createdAt);
                    if (log.reason) embed.addField("Reason", log.reason);
                    msg.edit(embed);
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

    if (guildSettings.logFlags & flags.logs.EMOJI && guildSettings.logChannel && newEmoji.guild.channels.cache.has(guildSettings.logChannel) && oldEmoji.name !== newEmoji.name) {
        const embed = new MessageEmbed();

        embed.setAuthor("Emoji Updated", newEmoji.guild.iconURL());
        embed.setColor(colors.BLUE);
        embed.addField("Name", `\`${oldEmoji.name}\` → \`${newEmoji.name}\``, true);
        embed.setThumbnail(newEmoji.url);
        embed.setFooter(`ID: ${newEmoji.id}`);
        embed.setTimestamp();

        if (newEmoji.guild.me.hasPermission("VIEW_AUDIT_LOG")) {
            await sleep(800);
            const logs = await newEmoji.guild.fetchAuditLogs({ type: "EMOJI_UPDATE", limit: 1 });
            if (logs.entries.first() && logs.entries.first().target.id === newEmoji.id) {
                const log = logs.entries.first();

                if (Date.now() - log.createdTimestamp < 1400) {
                    embed.addField("Updated by", `${log.executor} ${log.executor.tag}`);
                    embed.setTimestamp(log.createdAt);
                    if (log.reason) embed.addField("Reason", log.reason);
                }
            }
        }

        newEmoji.guild.channels.cache.get(guildSettings.logChannel).send(embed);
    }
}

/**
 * @param {GuildEmoji} emoji
 */
async function emojiDelete(emoji) {
    const guildSettings = client.guildSettings.get(emoji.guild.id);

    if (guildSettings.logFlags & flags.logs.EMOJI && guildSettings.logChannel && emoji.guild.channels.cache.has(guildSettings.logChannel)) {
        const embed = new MessageEmbed();

        embed.setAuthor("Emoji Deleted", emoji.guild.iconURL());
        embed.setColor(colors.RED);
        embed.addField("Name", emoji.name, true);
        embed.setThumbnail(emoji.url);
        embed.setFooter(`ID: ${emoji.id}`);
        embed.setTimestamp();

        if (emoji.guild.me.hasPermission("VIEW_AUDIT_LOG")) {
            await sleep(800);
            const logs = await emoji.guild.fetchAuditLogs({ type: "EMOJI_DELETE", limit: 1 });
            if (logs.entries.first() && logs.entries.first().target.id === emoji.id) {
                const log = logs.entries.first();

                if (Date.now() - log.createdTimestamp < 1400) {
                    embed.addField("Deleted by", `${log.executor} ${log.executor.tag}`);
                    embed.setTimestamp(log.createdAt);
                    if (log.reason) embed.addField("Reason", log.reason);
                }
            }
        }

        emoji.guild.channels.cache.get(guildSettings.logChannel).send(embed);
    }
}