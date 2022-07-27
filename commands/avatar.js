const { Client, CommandInteraction, MessageAttachment } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder, ContextMenuCommandBuilder } = require("@discordjs/builders");
const { ApplicationCommandType } = require("discord-api-types/v9");

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
 * @param {Client} client
 * @param {CommandInteraction} intr
 * @param {import("../types").Settings} guildSettings
 */
exports.run = async (client, intr) => {
	intr.reply({
		files: [intr.options.getUser("user").displayAvatarURL({
			dynamic: true,
			size: 4096
		})],
		ephemeral: true
	});
};