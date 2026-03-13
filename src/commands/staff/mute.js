import { SlashCommandBuilder } from "@discordjs/builders";
import { PermissionFlagsBits } from "discord.js";
import Guild from "../../models/Guild.js";

const data = new SlashCommandBuilder()
  .setName("mute")
  .setDescription("Timeout (mute) a user")
  .setIntegrationTypes(0)
  .addUserOption((option) =>
    option.setName("user").setDescription("The user to mute").setRequired(true),
  )
  .addIntegerOption((option) =>
    option
      .setName("duration")
      .setDescription("Duration in minutes (max 40320 = 28 days)")
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(40320),
  )
  .addStringOption((option) =>
    option.setName("reason").setDescription("The reason for muting"),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  }
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  return h === 0 ? `${d}d` : `${d}d ${h}h`;
}

const execute = async function (interaction) {
  const user = interaction.options.getUser("user");
  const duration = interaction.options.getInteger("duration");
  const reason = interaction.options.getString("reason") || "no reason provided";
  const member = interaction.guild.members.cache.get(user.id);

  if (!member) {
    return interaction.reply({
      embeds: [{ title: "couldn't find that member :O", color: 0xfdfd96 }],
    });
  }

  if (
    interaction.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 &&
    interaction.user.id !== interaction.guild.ownerId
  ) {
    return interaction.reply({
      embeds: [{ title: "you can't mute someone with a higher or equal role! >:(", color: 0xfdfd96 }],
    });
  }

  const durationStr = formatDuration(duration);
  const timeoutUntil = new Date(Date.now() + duration * 60 * 1000);

  try {
    await member.disableCommunicationUntil(timeoutUntil, reason);
  } catch (_) {
    return interaction.reply({
      embeds: [{ title: "uh oh, couldn't mute that user :c", color: 0xfdfd96 }],
    });
  }

  let sentMessageToUser = false;
  try {
    await member.send({
      embeds: [{
        title: "you've been muted :c",
        description: `you were timed out in **${interaction.guild.name}** for **${durationStr}**`,
        fields: [{ name: "Reason", value: reason }],
        color: 0xff6961,
      }],
    });
    sentMessageToUser = true;
  } catch (_) {}

  const embed = {
    title: "user muted :mute:",
    description: `
      :white_check_mark: <@${user.id}> has been muted for **${durationStr}**
      ${sentMessageToUser ? ":white_check_mark: user has been notified" : ":x: couldn't dm the user"}
    `,
    fields: [{ name: "Reason", value: reason }],
    color: 0xff6961,
  };

  await interaction.reply({ embeds: [embed] });

  const guild = await Guild.findOne({ id: interaction.guild.id });
  if (guild?.log_channel) {
    const channel = interaction.guild.channels.cache.get(guild.log_channel);
    if (channel) {
      await channel.send({
        embeds: [{
          ...embed,
          fields: [
            { name: "Reason", value: reason },
            { name: "Duration", value: durationStr },
            { name: "Moderator", value: `<@${interaction.user.id}>` },
          ],
        }],
      });
    }
  }
};

export default { data, execute };
