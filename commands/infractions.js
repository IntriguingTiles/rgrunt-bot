const { ChatInputCommandInteraction, EmbedBuilder, PermissionsBitField } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder, ContextMenuCommandBuilder } = require("@discordjs/builders");
const { ApplicationCommandType } = require("discord-api-types/v10");
const colors = require("../utils/colors");

exports.commands = [
    new SlashCommandBuilder()
        .setName("infractions")
        .setDescription("Shows the warns given to the specified user.")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("The user to show warns for.")
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers)
        .setDMPermission(false),
    new ContextMenuCommandBuilder()
        .setName("View Infractions")
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
    const user = intr.options.getUser("user");
    const warns = guildSettings.warns.filter(w => w.user === user.id);

    if (warns.length === 0) return intr.reply({ content: `${user} has no warns.`, ephemeral: true });

    const embed = new EmbedBuilder();

    embed.setAuthor({ name: "Warns For", iconURL: user.displayAvatarURL() });
    embed.setColor(colors.RED);
    embed.setDescription(`${user} ${user.tag}`);
    embed.setFooter({ text: `ID: ${user.id}` });
    embed.setTimestamp();

    let warnText = "";

    warns.forEach(warn => {
        warnText += `${warn.reason} - <t:${warn.date}:R> - <@${warn.mod}>\n`;
    });

    embed.addFields([{ name: "Warns", value: warnText }]);

    intr.reply({ embeds: [embed], ephemeral: true });
};