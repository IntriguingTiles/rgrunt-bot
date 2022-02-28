const { Client, CommandInteraction, MessageEmbed } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder, ContextMenuCommandBuilder } = require("@discordjs/builders");
const { ApplicationCommandType } = require("discord-api-types/v9");
const colors = require("../utils/colors");

exports.commands = [
    new SlashCommandBuilder()
        .setName("infractions")
        .setDescription("Shows the warns given to the specified user.")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("The user to show warns for.")
                .setRequired(true)),
    new ContextMenuCommandBuilder()
        .setName("View Infractions")
        .setType(ApplicationCommandType.User)
];

exports.requireMod = true;

/**
 * @param {Client} client
 * @param {CommandInteraction} intr
 * @param {import("../types").Settings} guildSettings
 */
exports.run = async (client, intr, guildSettings) => {
    const user = intr.options.getUser("user");
    const warns = guildSettings.warns.filter(w => w.user === user.id);

    if (warns.length === 0) return intr.reply({ content: `${user} has no warns.`, ephemeral: true });

    const embed = new MessageEmbed();

    embed.setAuthor({ name: "Warns For", iconURL: user.displayAvatarURL({ dynamic: true }) });
    embed.setColor(colors.RED);
    embed.setDescription(`${user} ${user.tag}`);
    embed.setFooter({ text: `ID: ${user.id}` });
    embed.setTimestamp();

    let warnText = "";

    warns.forEach(warn => {
        warnText += `${warn.reason} - <t:${warn.date}:R> - <@${warn.mod}>\n`;
    });

    embed.addField("Warns", warnText);

    intr.reply({ embeds: [embed], ephemeral: true });
};