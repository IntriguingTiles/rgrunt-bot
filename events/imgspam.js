const { GuildMember, PermissionsBitField, Message, ChannelType, EmbedBuilder, escapeMarkdown, AttachmentBuilder } = require("discord.js"); // eslint-disable-line no-unused-vars
const imghash = require("imghash");
const colors = require("../utils/colors");
const truncate = require("../utils/truncate");
const fetch = require("node-fetch").default;
const leven = require("leven").default;

/** @type {import("../types").ClientExt} */
let client;

/**
 * @param {import("../types").ClientExt} c
 */
exports.register = c => {
    client = c;
    c.on("messageCreate", messageCreate);
};

/**
 * @param {import("../types").ClientExt} c
 */
exports.deregister = c => {
    c.removeListener("messageCreate", messageCreate);
};

const hashes = [
    "f862f1e07c70f03c",
    "c03fe730227e14f3",
    "40fefac0f0e2f078",
    "40fefe4030fcf870",
    "40fefe4020fef870",
    "d87860fcbc2a6867",
    "ff001e0f34bc387c",
    "77031f07270f3c3c",
    "3f0c3cacf0e4387c",
    "f1262c3e1e1e0f0f",
    "f078e0ce665a6e38",
    "f0f0e0f81e1e7ec0",
    "f0f020fe3e1cfe80",
    "f0f020fe3e2cfe80",
    "80fe38f8f870f0f0",
    "ff00c1f8f0f0f0f0",
    "ff00c2f878f0f0f0",
    "ff0043f878f0f0f0",
    "e075e178607e7e30",
    "fe80c0de0f0f1f07",
    "7f010f0f0f0f0f0f",
    "a07e7f2080feb0f8",
    "407f2a3e00fff0f0",
    "607e3e1c2c3e7e60",
    "c17c7c3878f0f0f0",
];

/**
 * 
 * @param {Message} msg 
 */
async function messageCreate(msg) {
    if (msg.guild.id !== "154305477323390976") return;
    if (msg.attachments.size !== 4) return;
    if (msg.author.bot) return;
    if (!msg.deletable) return;
    if (msg.member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) return;

    for (let i = 0; i < msg.attachments.size; i++) {
        const attach = msg.attachments[i];
        if (attach.contentType !== "image/jpeg" && attach.contentType !== "image/png") continue;
        const res = await fetch(attach.url);
        if (!res.ok) continue;
        const buf = await res.buffer();
        const hash = await imghash.hash(buf);
        if (hashes.includes(hash) || hashes.some(v => leven(hash, v) <= 9)) {
            const logCh = msg.guild.channels.cache.get("970048913706987540");
            if (!logCh) return;
            const embed = new EmbedBuilder();

            embed.setColor(colors.ORANGE);
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

            embed.setFooter({ text: `ID: ${msg.id}` });
            embed.setTimestamp();

            embed.addFields([{ name: "Deleted by", value: `${client.user} ${escapeMarkdown(client.user.tag)}` }]);
            if (hashes.includes(hash)) embed.addFields([{ name: "Reason", value: `Image ${i + 1} hash match (\`${hash}\`)` }]);
            else {
                const mostSimilar = hashes.map(v => {
                    return { distance: leven(hash, v), hash: v };
                }).filter(v => v.distance <= 9).sort((a, b) => b.distance - a.distance)[0];
                embed.addFields([{ name: "Reason", value: `Image ${i + 1} hash distance below threshold (hash: \`${hash}\`, similar hash: \`${mostSimilar.hash}\`, distance: \`${mostSimilar.distance}\`)` }]);
            }

            await logCh.send({ embeds: [embed], files: [...msg.attachments.values()].map(v => new AttachmentBuilder(v.url)) });
            msg.delete();
            return;
        }
    }
}