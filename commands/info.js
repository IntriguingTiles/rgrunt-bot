const { Client, CommandInteraction, MessageEmbed, Constants, ButtonInteraction } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder, ContextMenuCommandBuilder, ActionRowBuilder, ButtonBuilder } = require("@discordjs/builders");
const { ApplicationCommandType } = require("discord-api-types/v9");
const colors = require("../utils/colors.js");
const moment = require("moment");

exports.commands = [
	new SlashCommandBuilder()
		.setName("info")
		.setDescription("View info about the specified user.")
		.addUserOption(option =>
			option.setName("user")
				.setDescription("The target user.")
				.setRequired(true)),
	new ContextMenuCommandBuilder()
		.setName("View Info")
		.setType(ApplicationCommandType.User)
];

exports.requireMod = true;

/**
 * @param {Client} client
 * @param {CommandInteraction} intr
 * @param {import("../types").Settings} guildSettings
 */
exports.run = async (client, intr) => {
	try {
		const member = intr.options.getMember("user");
		const embed = new MessageEmbed();

		embed.setAuthor({ name: "Member Info", iconURL: member.user.displayAvatarURL({ dynamic: true }) });
		embed.addField("Account Created", `${moment(member.user.createdTimestamp).fromNow()}`);
		embed.setThumbnail(member.user.displayAvatarURL({ dynamic: true }));
		embed.setColor(colors.GREEN);
		embed.setDescription(`${member.user} ${member.user.tag}`);
		embed.setFooter({ text: `ID: ${member.id}` });
		embed.setTimestamp();

		const row = new ActionRowBuilder()
			.addComponents([
				new ButtonBuilder()
					.setCustomId(member.id)
					.setLabel("Verify")
					.setStyle(Constants.MessageButtonStyles.PRIMARY)]
			).toJSON();

		intr.reply({
			embeds: [embed],
			components: [row],
			ephemeral: true
		});
	} catch (err) {
		console.log(err);
		intr.reply({ content: "Failed to retrieve info!", ephemeral: true });
	}
};

/**
 * @param {Client} client
 * @param {ButtonInteraction} intr
 * @param {import("../types").Settings} guildSettings
 */
exports.buttonPress = async (client, intr, guildSettings) => {
	if (!guildSettings.verifyRole) return intr.followUp({ content: "Use `/roleconfig verify` before using this command.", ephemeral: true });
	if (!intr.guild.roles.cache.has(guildSettings.verifyRole)) return intr.followUp({ content: "The role used for verify no longer exists.", ephemeral: true });
	if (!intr.guild.me.permissions.has("MANAGE_ROLES")) return intr.followUp({ content: "I don't have permission to manage roles.", ephemeral: true });

	try {
		const member = await intr.guild.members.fetch(intr.component.customId);
		await member.roles.add(guildSettings.verifyRole, `Verified by ${intr.user.tag}`);
		const row = new ActionRowBuilder()
			.addComponents([
				new ButtonBuilder()
					.setCustomId("verify_user")
					.setLabel("Verified")
					.setStyle(Constants.MessageButtonStyles.SUCCESS)
					.setDisabled(true)
			]
			).toJSON();
		await intr.update({ components: [row] });
		intr.followUp(`Verified ${member}.`);
	} catch (err) {
		console.log(err);
		const row = new ActionRowBuilder()
			.addComponents([
				new ButtonBuilder()
					.setCustomId("verify_user")
					.setLabel("Failed")
					.setStyle(Constants.MessageButtonStyles.DANGER)
					.setDisabled(true)
			]
			).toJSON();
		await intr.update({ components: [row] });
		intr.followUp({ content: "Failed to add the verified role!", ephemeral: true });
	}
};