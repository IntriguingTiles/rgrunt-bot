const { ChatInputCommandInteraction } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder, ContextMenuCommandBuilder } = require("@discordjs/builders");
const { ApplicationCommandType } = require("discord-api-types/v10");

exports.commands = [
	new SlashCommandBuilder()
		.setName("avatar")
		.setDescription("View the profile picture of the specified user.")
		.addUserOption(option =>
			option.setName("user")
				.setDescription("The target user.")
				.setRequired(true)),
	new ContextMenuCommandBuilder()
		.setName("View Avatar")
		.setType(ApplicationCommandType.User)
];

/**
 * @param {import("../types").ClientExt} client
 * @param {ChatInputCommandInteraction} intr
 * @param {import("../types").Settings} guildSettings
 */
exports.run = async (client, intr) => {
	intr.reply({
		files: [intr.options.getUser("user").displayAvatarURL({ size: 4096 })],
		ephemeral: true
	});
};