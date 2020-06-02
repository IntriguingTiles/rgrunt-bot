const { Client, MessageEmbed, Guild } = require("discord.js"); // eslint-disable-line no-unused-vars

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
    c.on("guildUpdate", guildUpdate);
};

/**
 * @param {Client} c
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
        const embed = new MessageEmbed();
        let shouldPost = false;

        embed.setAuthor("Server Updated", newGuild.iconURL());
        embed.setColor(colors.BLUE);

        if (oldGuild.name !== newGuild.name) {
            embed.addField("Name", `\`${oldGuild.name}\` → \`${newGuild.name}\``);
            shouldPost = true;
        }

        if (oldGuild.region !== newGuild.region) {
            embed.addField("Region", `\`${oldGuild.region}\` → \`${newGuild.region}\``);
            shouldPost = true;
        }

        if (!shouldPost) return;

        if (newGuild.me.hasPermission("VIEW_AUDIT_LOG")) {
            await sleep(500);
            const logs = await newGuild.fetchAuditLogs({ type: "GUILD_UPDATE", limit: 1 });
            if (logs.entries.first()) {
                const log = logs.entries.first();
                if (Date.now() - log.createdTimestamp < 800) {
                    embed.addField("Updated by", `${log.executor} ${log.executor.tag}`);
                    if (log.reason) embed.addField("Reason", log.reason);
                }
            }
        }

        embed.setFooter(`ID: ${newGuild.id}`);
        embed.setTimestamp();

        newGuild.channels.cache.get(guildSettings.logChannel).send(embed);
    }
}