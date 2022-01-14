const { Client, CommandInteraction, MessageAttachment } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder } = require("@discordjs/builders");
const { createCanvas, loadImage } = require("canvas");
const xp = require("../utils/xp.js");
const numeral = require("numeral");

exports.commands = [
    new SlashCommandBuilder()
        .setName("rank")
        .setDescription("Displays your rank or the rank of another member.")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("The member to show the rank of."))
];

/**
 * @param {Client} client
 * @param {CommandInteraction} intr
 * @param {import("../types").Settings} guildSettings
 */
exports.run = async (client, intr, guildSettings) => {
    if (!guildSettings.levelSystem) return intr.reply({ content: "The level system is not enabled in this server.", ephemeral: true });

    const user = intr.options.getUser("user", false) ? intr.options.getUser("user", false) : intr.user;
    const member = intr.options.getMember("user", false) ? intr.options.getMember("user", false) : intr.member;

    if (guildSettings.levels.filter(l => l.id === user.id).length === 0) return intr.reply({ content: "Sorry, I couldn't find that user.", ephemeral: true });

    let color = "none";

    if (member.presence) {
        switch (member.presence.status) {
            case "online":
                color = "#3BA55D";
                break;
            case "idle":
                color = "#FAA81A";
                break;
            case "dnd":
                color = "#ED4245";
                break;
            case "offline":
                color = "#747F8D";
                break;
        }
    }

    const xp = guildSettings.levels.find(l => l.id === user.id).xp;
    intr.reply({ files: [new MessageAttachment(await generateCard(user, xp, guildSettings.levels, color))], ephemeral: true });
};

/**
 * @param {User} user
 * @param {number} totalXP
 * @param {any[]} levels
 * @param {string} statusColor
 * @returns {Buffer}
 */
async function generateCard(user, totalXP, levels, statusColor) {
    const canvas = createCanvas(886, 210);
    const pfp = await loadImage(user.displayAvatarURL({ format: "png" }));
    let username = user.username;
    const discrim = user.discriminator;
    const level = xp.levelFromXP(totalXP);
    const curXP = xp.totalXPToLevelXP(totalXP);
    const nextXP = xp.xpForNextLevel(level);
    const rank = xp.rank(user.id, levels);
    const ctx = canvas.getContext("2d");

    // draw background
    ctx.fillRect(0, 0, 886, 210);
    ctx.save();

    // draw pfp
    ctx.beginPath();
    ctx.arc(18 + 80, 26 + 80, 160 / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(pfp, 18, 26, 160, 160);

    ctx.restore();
    ctx.save();

    if (statusColor !== "none") {
        // draw status icon bg
        ctx.beginPath();
        ctx.arc(136 + 24, 134 + 24, 24, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.fillStyle = "#000000";
        ctx.fillRect(136, 134, 48, 48);

        ctx.restore();
        ctx.save();

        // draw status icon
        ctx.beginPath();
        ctx.arc(140 + 20, 138 + 20, 20, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.fillStyle = statusColor;
        ctx.fillRect(140, 138, 40, 40);

        ctx.restore();
        ctx.save();
    }

    // draw xp bar
    ctx.beginPath();
    ctx.arc(234 + 18, 148 + 18, 18, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.clearRect(234, 148, 18, 36);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.arc(866 - 18, 148 + 18, 18, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.clearRect(866 - 18, 148, 18, 36);
    ctx.restore();
    ctx.clearRect(252, 148, 596, 36);
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#00AC21";
    ctx.fillRect(234, 148, (curXP / nextXP) * 632, 36); // xp
    ctx.fillStyle = "#484B4E";
    ctx.fillRect(234, 148, 632, 36); // bg
    ctx.globalCompositeOperation = "source-over";


    // draw username
    ctx.font = "40px Calibri";
    ctx.fillStyle = "#FFFFFF";
    let usernameLength = ctx.measureText(username);

    while (usernameLength.width > 400) {
        username = username.substring(0, username.length - 1);
        usernameLength = ctx.measureText(username + "...");
        if (usernameLength.width <= 400) username = username + "...";
    }

    ctx.fillText(username, 251, 92 + usernameLength.emHeightAscent);

    // draw tag
    ctx.font = "28px Calibri";
    ctx.fillStyle = "#7F8384";
    if (usernameLength.width < 330) {
        ctx.fillText(`#${discrim}`, 251 + usernameLength.width + 12, 92 + usernameLength.emHeightAscent);
    }

    // draw total xp
    const totalXPLength = ctx.measureText(`/ ${shorten(nextXP)} XP`);
    ctx.fillText(`/ ${shorten(nextXP)} XP`, 856 - totalXPLength.width, 92 + usernameLength.emHeightAscent);

    // draw current xp
    ctx.fillStyle = "#FFFFFF";
    const curXPLength = ctx.measureText(shorten(curXP));
    ctx.fillText(shorten(curXP), 856 - totalXPLength.width - curXPLength.width - 8, 92 + usernameLength.emHeightAscent);

    // draw level number
    ctx.font = "70px Calibri";
    ctx.fillStyle = "#00AC21";
    const levelNumLength = ctx.measureText(level);
    ctx.fillText(level, 856 - levelNumLength.width, levelNumLength.emHeightAscent);

    // draw level text
    ctx.font = "28px Calibri";
    const levelTextLength = ctx.measureText("LEVEL");
    ctx.fillText("LEVEL", 856 - levelNumLength.width - levelTextLength.width, levelNumLength.emHeightAscent);

    // draw rank number
    ctx.font = "70px Calibri";
    ctx.fillStyle = "#FFFFFF";
    const rankNumLength = ctx.measureText(`#${rank}`);
    ctx.fillText(`#${rank}`, 856 - levelNumLength.width - levelTextLength.width - rankNumLength.width - 15, levelNumLength.emHeightAscent);

    // draw rank text
    ctx.font = "28px Calibri";
    const rankTextLength = ctx.measureText("RANK");
    ctx.fillText("RANK", 856 - levelNumLength.width - levelTextLength.width - rankNumLength.width - 15 - rankTextLength.width - 10, levelNumLength.emHeightAscent);

    return canvas.toBuffer();
}

/**
 * @param {number} num
 * @returns {string}
 */
function shorten(num) {
    return numeral(num).format("0.0a").toUpperCase().replace(".0", "");
}