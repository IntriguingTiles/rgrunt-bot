const { ChatInputCommandInteraction, PermissionsBitField } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder, ContextMenuCommandBuilder } = require("@discordjs/builders");
const { ApplicationCommandType } = require("discord-api-types/v10");

exports.commands = [
    new SlashCommandBuilder()
        .setName("verify")
        .setDescription("Adds the verified role to the specified user.")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("The target user.")
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers)
        .setDMPermission(false),
    new ContextMenuCommandBuilder()
        .setName("Verify")
        .setType(ApplicationCommandType.User)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers)
        .setDMPermission(false)
];

/**
 * @param {import("../types").ClientExt} client
 * @param {ChatInputCommandInteraction} intr
 * @param {import("../types").Settings} guildSettings
 */
exports.run = async (client, intr, guildSettings) => {
    if (!guildSettings.verifyRole) return intr.reply({ content: "Use `/roleconfig verify` before using this command.", ephemeral: true });
    if (!intr.guild.roles.cache.has(guildSettings.verifyRole)) return intr.reply({ content: "The role used for verify no longer exists.", ephemeral: true });
    if (!intr.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) return intr.reply({ content: "I don't have permission to manage roles.", ephemeral: true });

    try {
        await intr.options.getMember("user").roles.add(guildSettings.verifyRole, `Verified by ${intr.user.tag}`);
        intr.reply(`Verified ${intr.options.getMember("user")}.`);
    } catch (err) {
        console.log(err);
        intr.reply({ content: "Failed to add the verified role!", ephemeral: true });
    }
};