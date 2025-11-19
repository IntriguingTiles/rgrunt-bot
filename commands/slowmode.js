const { ChatInputCommandInteraction, PermissionsBitField } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder } = require("@discordjs/builders");

exports.commands = [
    new SlashCommandBuilder()
        .setName("slowmode")
        .setDescription("Set or clear slowmode for the current channel.")
        .addIntegerOption(option =>
            option.setName("seconds")
                .setDescription("The number of seconds users must wait before sending another message. 0 disables slowmode.")
                .setMaxValue(21600)
                .setMinValue(0)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels)
        .setDMPermission(false)
];

/**
 * @param {import("../types").ClientExt} client
 * @param {ChatInputCommandInteraction} intr
 * @param {import("../types").Settings} guildSettings
 */
exports.run = async (client, intr) => {
    if (!intr.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) return intr.reply({ content: "I don't have permission to manage channels.", ephemeral: true });
    try {
        await intr.channel.setRateLimitPerUser(intr.options.getInteger("seconds"), `Slowmode set by ${intr.user.tag} (${intr.user.id})`);
        return intr.reply(`Set slowmode to ${intr.options.getInteger("seconds")} seconds.`);
    } catch (err) {
        console.log(err);
        return intr.reply({ content: "Failed to set slowmode.", ephemeral: true });
    }
};