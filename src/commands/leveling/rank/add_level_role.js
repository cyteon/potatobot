import { PermissionFlagsBits, SlashCommandSubcommandBuilder } from "discord.js";
import Guild from "../../../models/Guild.js";

const data = new SlashCommandSubcommandBuilder()
  .setName("add_level_role")
  .setDescription("Add a role to be given when a user reaches a certain level")
  .addIntegerOption((option) =>
    option
      .setName("level")
      .setDescription("The level to assign the role to")
      .setRequired(true),
  )
  .addRoleOption((option) =>
    option
      .setName("role")
      .setDescription("The role to assign at the specified level")
      .setRequired(true),
  );

const execute = async (interaction) => {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return interaction.reply({
      content: "You do not have permission to use this command >:(",
      ephemeral: true,
    });
  }

  const level = interaction.options.getInteger("level");
  const role = interaction.options.getRole("role");

  if (level < 0) {
    return interaction.reply({
      content: "Level cannot be negative :p",
      ephemeral: true,
    });
  }

  try {
    if (role.managed) {
      return interaction.reply({
        content:
          "You cannot assign managed roles (like bot roles) as level roles :P",
        ephemeral: true,
      });
    }

    if (role.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.reply({
        content:
          "I cannot assign roles that are higher than my highest role :|",
        ephemeral: true,
      });
    }

    const guildData = await Guild.findOneAndUpdate(
      { id: interaction.guild.id },
      { $set: { [`level_roles.${level}`]: role.id } },
      { new: true, upsert: true },
    );

    if (!guildData) {
      return interaction.reply({
        content: `Failed to add role for level **${level}** :c`,
        ephemeral: true,
      });
    }

    return interaction.reply({
      content: `Successfully added <@&${role.id}> for level **${level}**!`,
      allowedMentions: { roles: [] },
    });
  } catch (error) {
    console.error("Error updating level roles:", error);
    return interaction.reply({
      content: "An error occurred while updating the level roles :c",
      ephemeral: true,
    });
  }
};

export default { data, execute };