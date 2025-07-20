import { PermissionFlagsBits, SlashCommandSubcommandBuilder } from "discord.js";
import User from "../../../models/User.js";

const data = new SlashCommandSubcommandBuilder()
  .setName("reset_all")
  .setDescription("Reset all users' levels and XP in the server");

const execute = async (interaction) => {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return interaction.reply({
      content: "You do not have permission to use this command >:(",
      ephemeral: true,
    });
  }

  try {
    await User.updateMany(
      { guild_id: interaction.guild.id },
      { $set: { level: 0, xp: 0 } },
    );

    return interaction.reply({
      content: "Successfully reset all users' levels and XP in this server!",
    });
  } catch (error) {
    console.error("Error resetting user data:", error);
    return interaction.reply({
      content: "An error occurred while resetting user data :c",
      ephemeral: true,
    });
  }
};

export default { data, execute };