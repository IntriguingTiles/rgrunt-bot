const { ChatInputCommandInteraction, PermissionsBitField } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder } = require("@discordjs/builders");
const moment = require("moment");

exports.commands = [
    new SlashCommandBuilder()
        .setName("kickafter")
        .setDescription("Kicks all users who joined after, and including, the target user.")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("The target user.")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("reason")
                .setDescription("The reason for kicking."))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .setDMPermission(false)
];

/**
 * @param {import("../types").ClientExt} client
 * @param {ChatInputCommandInteraction} intr
 */
exports.run = async (client, intr) => {
    if (!intr.guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers)) return intr.reply({ content: "I don't have permission to kick members.", ephemeral: true });

    try {
        const member = intr.options.getMember("user");

        if (moment(member.joinedTimestamp).isBefore(moment().subtract(1, "day"))) return intr.reply("Sorry, I can only kick members who joined in the last 24 hours.");
        intr.reply(`This will kick **${intr.guild.members.cache.filter(m => m.joinedTimestamp >= member.joinedTimestamp).size}** members. Are you sure? Type **yes** to continue.`);
        const collector = intr.channel.createMessageCollector(m => m.member.id === intr.member.id, { time: 10000 });
        let kicking = false;
        collector.on("collect", m => {
            if (m.content.toLocaleLowerCase() === "no") return collector.stop();
            if (m.content.toLocaleLowerCase() === "yes") {
                kicking = true;
                const reason = intr.options.getString("reason", false) ? `${intr.options.getString("reason", false)} (initiated by ${intr.user.tag} (${intr.user.id}))` : `Initiated by ${intr.user.tag} (${intr.user.id})`;
                intr.followUp(`Kicking ${intr.guild.members.cache.filter(m => m.joinedTimestamp >= member.joinedTimestamp).size} members, this might take a while.`);
                intr.guild.members.cache.filter(m => m.joinedTimestamp >= member.joinedTimestamp).forEach(m => m.kick(reason));
                collector.stop();
            }
        });
        collector.on("end", () => {
            if (!kicking) intr.followUp("Cancelled kick.");
        });
    } catch (err) {
        //
    }
};