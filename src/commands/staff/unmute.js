import { SlashCommandBuilder } from "@discordjs/builders";
import { PermissionFlagsBits } from "discord.js";
import Guild from "../../models/Guild.js";

const data = new SlashCommandBuilder()
  .setName("unmute")
  .setDescription("Remove a timeout (unmute) from a user")
  .setIntegrationTypes(0)
  .addUserOption((option) =>
    option.setName("user").setDescription("The user to unmute").setRequired(true),
  )
  .addStringOption((option) =>
    option.setName("reason").setDescription("The reason for unmuting"),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

const execute = async function (interaction) {
  const user = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason") || "no reason provided";
  const member = interaction.guild.members.cache.get(user.id);

  if (!member) {
    return interaction.reply({
      embeds: [{ title: "couldn't find that member :O", color: 0xfdfd96 }],
    });
  }

  if (!member.communicationDisabledUntil) {
    return interaction.reply({
      embeds: [{ title: "that user isn't muted silly! :p", color: 0xfdfd96 }],
    });
  }

  try {
    await member.disableCommunicationUntil(null, reason);
  } catch (_) {
    return interaction.reply({
      embeds: [{ title: "uh oh, couldn't unmute that user :c", color: 0xfdfd96 }],
    });
  }

  let sentMessageToUser = false;
  try {
    await member.send({
      embeds: [{
        title: "you've been unmuted :D",
        description: `your timeout in **${interaction.guild.name}** has been removed`,
        fields: [{ name: "Reason", value: reason }],
        color: 0x77dd77,
      }],
    });
    sentMessageToUser = true;
  } catch (_) {}

  const embed = {
    title: "user unmuted :sound:",
    description: `
      :white_check_mark: <@${user.id}> has been unmuted
      ${sentMessageToUser ? ":white_check_mark: user has been notified" : ":x: couldn't dm the user"}
    `,
    fields: [{ name: "Reason", value: reason }],
    color: 0x77dd77,
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
            { name: "Moderator", value: `<@${interaction.user.id}>` },
          ],
        }],
      });
    }
  }
};

export default { data, execute };
