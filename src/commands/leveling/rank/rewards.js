import { SlashCommandSubcommandBuilder } from "discord.js";
import Guild from "../../../models/Guild.js";

const data = new SlashCommandSubcommandBuilder()
  .setName("rewards")
  .setDescription("See the rewards for each level");

const execute = async (interaction) => {
  const data = await Guild.findOne({ id: interaction.guild.id });

  if (!data) {
    return interaction.reply({
      content: "This server does not have any level roles set up :/",
      ephemeral: true,
    });
  }

  const levelRoles = data.level_roles;

  if (!levelRoles || Array.from(levelRoles).length === 0) {
    return interaction.reply({
      content: "This server does not have any level roles set up :|",
      ephemeral: true,
    });
  }

  const rewards = Array.from(levelRoles.entries())
    .map(([level, roleId]) => `Level ${level}: <@&${roleId}>`)
    .join("\n");

  return interaction.reply({
    content: `**Level Rewards:**\n${rewards}`,
    allowedMentions: { roles: [] },
  });
};

export default { data, execute };