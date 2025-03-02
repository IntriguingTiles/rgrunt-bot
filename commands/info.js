const { EmbedBuilder, ButtonInteraction, PermissionsBitField, ButtonStyle, ChatInputCommandInteraction } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder, ContextMenuCommandBuilder, ActionRowBuilder, ButtonBuilder } = require("@discordjs/builders");
const { time, TimestampStyles, escapeMarkdown } = require("@discordjs/formatters");
const { ApplicationCommandType } = require("discord-api-types/v10");
const colors = require("../utils/colors.js");

exports.commands = [
	new SlashCommandBuilder()
		.setName("info")
		.setDescription("View info about the specified user.")
		.addUserOption(option =>
			option.setName("user")
				.setDescription("The target user.")
				.setRequired(true))
		.setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers)
		.setDMPermission(false),
	new ContextMenuCommandBuilder()
		.setName("View Info")
		.setType(ApplicationCommandType.User)
		.setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers)
		.setDMPermission(false)
];

/**
 * @param {import("../types").ClientExt} client
 * @param {ChatInputCommandInteraction} intr
 * @param {import("../types").Settings} guildSettings
 */
exports.run = async (client, intr) => {
	try {
		const member = intr.options.getMember("user");
		const embed = new EmbedBuilder();

		embed.setAuthor({ name: "Member Info", iconURL: member.user.displayAvatarURL() });
		embed.addFields([{ name: "Created", value: `${time(member.user.createdAt, TimestampStyles.RelativeTime)}`, inline: true }]);
		embed.addFields([{ name: "Joined", value: `${time(member.joinedAt, TimestampStyles.RelativeTime)}`, inline: true }]);
		embed.setThumbnail(member.user.displayAvatarURL());
		embed.setColor(colors.GREEN);
		embed.setDescription(`${member.user} ${escapeMarkdown(member.user.tag)}`);
		embed.setFooter({ text: `ID: ${member.id}` });
		embed.setTimestamp();

		const row = new ActionRowBuilder()
			.addComponents([
				new ButtonBuilder()
					.setCustomId(member.id)
					.setLabel("Verify")
					.setStyle(ButtonStyle.Primary)]
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
 * @param {import("../types").ClientExt} client
 * @param {ButtonInteraction} intr
 * @param {import("../types").Settings} guildSettings
 */
exports.buttonPress = async (client, intr, guildSettings) => {
	if (!guildSettings.verifyRole) return intr.followUp({ content: "Use `/roleconfig verify` before using this command.", ephemeral: true });
	if (!intr.guild.roles.cache.has(guildSettings.verifyRole)) return intr.followUp({ content: "The role used for verify no longer exists.", ephemeral: true });
	if (!intr.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) return intr.followUp({ content: "I don't have permission to manage roles.", ephemeral: true });

	try {
		const member = await intr.guild.members.fetch(intr.component.customId);
		await member.roles.add(guildSettings.verifyRole, `Verified by ${intr.user.tag} (${intr.user.id})`);
		const row = new ActionRowBuilder()
			.addComponents([
				new ButtonBuilder()
					.setCustomId("verify_user")
					.setLabel("Verified")
					.setStyle(ButtonStyle.Success)
					.setDisabled(true)
			]
			).toJSON();
		await intr.update({ components: [row] });
		intr.followUp(`Verified ${member}.`);
	} catch (err) {
		const row = new ActionRowBuilder()
			.addComponents([
				new ButtonBuilder()
					.setCustomId("verify_user")
					.setLabel("Failed")
					.setStyle(ButtonStyle.Danger)
					.setDisabled(true)
			]
			).toJSON();
		await intr.update({ components: [row] });
		intr.followUp({ content: "Failed to add the verified role!", ephemeral: true });
	}
};