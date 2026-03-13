import { SlashCommandBuilder } from "@discordjs/builders";
import { PermissionFlagsBits } from "discord.js";
import Guild from "../../models/Guild.js";

const data = new SlashCommandBuilder()
  .setName("unban")
  .setDescription("Unban a user from the server")
  .setIntegrationTypes(0)
  .addStringOption((option) =>
    option.setName("user_id").setDescription("The ID of the user to unban").setRequired(true),
  )
  .addStringOption((option) =>
    option.setName("reason").setDescription("The reason for unbanning"),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

const execute = async function (interaction) {
  const userId = interaction.options.getString("user_id");
  const reason = interaction.options.getString("reason") || "no reason provided";

  if (!/^\d{17,20}$/.test(userId)) {
    return interaction.reply({
      embeds: [{ title: "that doesn't look like a valid user ID :O", color: 0xfdfd96 }],
      ephemeral: true,
    });
  }

  try {
    await interaction.guild.members.unban(userId, reason);
  } catch (_) {
    return interaction.reply({
      embeds: [{
        title: "uh oh, couldn't unban that user :c",
        description: "they might not be banned!",
        color: 0xfdfd96,
      }],
    });
  }

  const embed = {
    title: "user unbanned :D",
    description: `unbanned user with ID \`${userId}\``,
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
