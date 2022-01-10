const { Client, CommandInteraction } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder } = require("@discordjs/builders");

exports.commands = [
    new SlashCommandBuilder()
        .setName("antispam")
        .setDescription("Configures the antispam feature.")
        .addBooleanOption(option =>
            option.setName("enabled")
                .setDescription("Whether antispam should be enabled.")
                .setRequired(true))
];

exports.requireAdmin = true;

/**
 * @param {Client} client
 * @param {CommandInteraction} intr
 * @param {import("../types").Settings} guildSettings
 */
exports.run = async (client, intr, guildSettings) => {
    if (!guildSettings.jailRole) return intr.reply({ content: "Use `/roleconfig jail` before using this command.", ephemeral: true });

    if (intr.options.getBoolean("enabled")) {
        guildSettings.antiSpam = true;
        client.guildSettings.set(intr.guild.id, guildSettings);

        intr.reply("Successfully enabled anti-spam.");
    } else {
        guildSettings.antiSpam = false;
        client.guildSettings.set(intr.guild.id, guildSettings);

        intr.reply("Successfully disabled anti-spam.");
    }
};