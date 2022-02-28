const { Client, CommandInteraction } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder } = require("@discordjs/builders");

exports.commands = [
    new SlashCommandBuilder()
        .setName("warn")
        .setDescription("Warns a user.")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("The user to warn.")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("reason")
                .setDescription("The warn reason.")
                .setRequired(true))
];

exports.requireMod = true;

/**
 * @param {Client} client
 * @param {CommandInteraction} intr
 * @param {import("../types").Settings} guildSettings
 */
exports.run = async (client, intr, guildSettings) => {
    const user = intr.options.getUser("user");
    const reason = intr.options.getString("reason");

    guildSettings.warns.push({ date: Math.floor(Date.now() / 1000), user: user.id, mod: intr.user.id, reason: reason });
    client.guildSettings.set(intr.guild.id, guildSettings);
    intr.reply(`${user} has been warned for "${reason}".`);

    if (!user.bot) user.send(`You have been warned in ${intr.guild.name} by ${intr.user} for "${reason}"`).catch(() => { });
};