import { PermissionFlagsBits, SlashCommandSubcommandBuilder } from "discord.js";
import User from "../../../models/User.js";

const data = new SlashCommandSubcommandBuilder()
  .setName("set_level")
  .setDescription("Set a user's level in the server")
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("The user to set the level for")
      .setRequired(true),
  )
  .addIntegerOption((option) =>
    option
      .setName("level")
      .setDescription("The level to set for the user")
      .setRequired(true),
  );

const execute = async (interaction) => {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return interaction.reply({
      content: "You do not have permission to use this command >:(",
      ephemeral: true,
    });
  }

  const user = interaction.options.getUser("user");
  const level = interaction.options.getInteger("level");

  if (level < 0) {
    return interaction.reply({
      content: "Level cannot be negative :p",
      ephemeral: true,
    });
  }

  try {
    const data = await User.findOneAndUpdate(
      { id: user.id, guild_id: interaction.guild.id },
      { level: level, xp: 0 },
      { new: true, upsert: true },
    );

    if (!data) {
      return interaction.reply({
        content: `Failed to update level for **${user.tag}** :c`,
        ephemeral: true,
      });
    }

    return interaction.reply({
      content: `Successfully set **${user.tag}**'s level to **${level}**!`,
    });
  } catch (error) {
    console.error("Error updating user level:", error);
    return interaction.reply({
      content: "An error occurred while updating the user's level :c",
      ephemeral: true,
    });
  }
};

export default { data, execute };