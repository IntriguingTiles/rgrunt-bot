
const { ChatInputCommandInteraction, EmbedBuilder } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder, escapeMarkdown } = require("@discordjs/builders");
const xp = require("../utils/xp.js");

exports.commands = [
	new SlashCommandBuilder()
		.setName("leaderboard")
		.setDescription("View the level leaderboard and where you stand in it")
		.addUserOption(option =>
			option.setName("user")
				.setDescription("The target user."))
		.setDMPermission(false)
];

/**
 * @param {import("../types").ClientExt} client
 * @param {ChatInputCommandInteraction} intr
 * @param {import("../types").Settings} guildSettings
 */
exports.run = async (client, intr, guildSettings) => {
	if (!guildSettings.levelSystem) return intr.reply({ content: "The level system is not enabled in this server.", ephemeral: true });

	const user = intr.options.getUser("user", false) ? intr.options.getUser("user", false) : intr.user;
	if (guildSettings.levels.filter(l => l.id === user.id).length === 0) return intr.reply({ content: "Sorry, I couldn't find that user.", ephemeral: true });

	const levels = guildSettings.levels.slice();
	const topTen = levels.sort((a, b) => b.xp - a.xp).slice(0, 10);

	let reply = "";
	let position = 1;
	let present = false;

	for (const entry of topTen) {
		if (entry.id === user.id) {
			reply += `\n**${position}. Level ${xp.levelFromXP(entry.xp)}: ${escapeMarkdown((await client.users.fetch(entry.id)).tag)}**\n`;
			present = true;
		} else {
			reply += `${position}. Level ${xp.levelFromXP(entry.xp)}: ${escapeMarkdown((await client.users.fetch(entry.id)).tag)}\n`;
		}
		position++;
	}

	if (!present) {
		reply += `\n**${xp.rank(user.id, levels)}. Level ${xp.levelFromXP(guildSettings.levels.find(l => l.id === user.id).xp)}: ${escapeMarkdown((await client.users.fetch(user.id)).tag)}**\n`;
	}

	const embed = new EmbedBuilder();

	embed.setAuthor({ name: `Leaderboard for ${intr.member.guild.name}`, iconURL: intr.member.guild.iconURL() });
	embed.setDescription(`${reply}`);

	intr.reply({ embeds: [embed], ephemeral: true });
};