const { EmbedBuilder, Guild, PermissionsBitField, AuditLogEvent, escapeMarkdown } = require("discord.js"); // eslint-disable-line no-unused-vars

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
    c.on("guildUpdate", guildUpdate);
};

/**
 * @param {import("../types").ClientExt} c
 */
exports.deregister = c => {
    c.removeListener("guildUpdate", guildUpdate);
};

/**
 * 
 * @param {Guild} oldGuild 
 * @param {Guild} newGuild 
 */
async function guildUpdate(oldGuild, newGuild) {
    const guildSettings = client.guildSettings.get(newGuild.id);

    if (guildSettings.logFlags & flags.logs.SERVER && guildSettings.logChannel && newGuild.channels.cache.has(guildSettings.logChannel)) {
        const embed = new EmbedBuilder();
        let shouldPost = false;

        embed.setAuthor({ name: "Server Updated", iconURL: newGuild.iconURL() });
        embed.setColor(colors.BLUE);

        if (oldGuild.name !== newGuild.name) {
            embed.addFields([{ name: "Name", value: `\`${oldGuild.name}\` → \`${newGuild.name}\`` }]);
            shouldPost = true;
        }

        if (!shouldPost) return;

        embed.setFooter({ text: `ID: ${newGuild.id}` });
        embed.setTimestamp();

        const msg = await newGuild.channels.cache.get(guildSettings.logChannel).send({ embeds: [embed] });

        if (newGuild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
            const timestamp = Date.now();
            await sleep(800);
            const logs = await newGuild.fetchAuditLogs({ type: AuditLogEvent.GuildUpdate, limit: 1 });
            if (logs.entries.first()) {
                const log = logs.entries.first();
                if (Math.abs(timestamp - log.createdTimestamp) < 1400) {
                    embed.addFields([{ name: "Updated by", value: `${log.executor} ${escapeMarkdown(log.executor.tag)}` }]);
                    if (log.reason) embed.addFields([{ name: "Reason", value: escapeMarkdown(log.reason) }]);
                    msg.edit({ embeds: [embed] });
                }
            }
        }
    }
}