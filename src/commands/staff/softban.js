import { SlashCommandBuilder } from "@discordjs/builders";
import { PermissionFlagsBits } from "discord.js";
import Guild from "../../models/Guild.js";

const data = new SlashCommandBuilder()
  .setName("softban")
  .setDescription("Softban a user (ban + unban to delete their messages)")
  .setIntegrationTypes(0)
  .addUserOption((option) =>
    option.setName("user").setDescription("The user to softban").setRequired(true),
  )
  .addStringOption((option) =>
    option.setName("reason").setDescription("The reason for softbanning"),
  )
  .addIntegerOption((option) =>
    option
      .setName("delete_messages")
      .setDescription("Days of messages to delete (0-7, default 7)")
      .setMinValue(0)
      .setMaxValue(7),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

const execute = async function (interaction) {
  const user = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason") || "no reason provided";
  const deleteMessageDays = interaction.options.getInteger("delete_messages") ?? 7;
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
      embeds: [{ title: "you can't softban someone with a higher or equal role! >:(", color: 0xfdfd96 }],
    });
  }

  if (!member.bannable) {
    return interaction.reply({
      embeds: [{ title: "i can't ban this user :c", color: 0xfdfd96 }],
    });
  }

  let sentMessageToUser = false;
  try {
    await member.send({
      embeds: [{
        title: "you've been softbanned :c",
        description: `you were softbanned from **${interaction.guild.name}** — your messages were deleted but you can rejoin!`,
        fields: [{ name: "Reason", value: reason }],
        color: 0xff6961,
      }],
    });
    sentMessageToUser = true;
  } catch (_) {}

  try {
    await interaction.guild.members.ban(user.id, {
      reason,
      deleteMessageSeconds: deleteMessageDays * 86400,
    });
    await interaction.guild.members.unban(user.id, "softban - automatic unban");
  } catch (_) {
    return interaction.reply({
      embeds: [{ title: "uh oh, couldn't softban that user :c", color: 0xfdfd96 }],
    });
  }

  const embed = {
    title: "user softbanned :hammer:",
    description: `
      :white_check_mark: <@${user.id}> has been softbanned (banned + unbanned, messages deleted)
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
            { name: "Moderator", value: `<@${interaction.user.id}>` },
          ],
        }],
      });
    }
  }
};

export default { data, execute };
