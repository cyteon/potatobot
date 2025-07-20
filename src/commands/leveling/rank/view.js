import { SlashCommandSubcommandBuilder } from "discord.js";
import User from "../../../models/User.js";
import { LEVELS } from "../../../utils/levels.js";

const data = new SlashCommandSubcommandBuilder()
  .setName("view")
  .setDescription("Check your, or someone else's, rank")
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("The user to check the rank of")
      .setRequired(false),
  );

const execute = async (interaction) => {
  const user = interaction.options.getUser("user") || interaction.user;
  const guildId = interaction.guild.id;

  try {
    const data = await User.findOne({
      id: user.id,
      guild_id: guildId,
    });

    if (!data) {
      return interaction.reply({
        content:
          user !== interaction.user
            ? `**${user.tag}** has not sent any messages in this server :(`
            : "Send a message to start leveling up!",
        ephemeral: true,
      });
    }

    const level = data.level || 0;
    const xp = data.xp || 0;

    const msg = user === interaction.user ? "you are" : `**${user.tag}** is`;

    return interaction.reply({
      content: `:chart_with_upwards_trend: ${msg} level **${level}** with **${xp}**/${LEVELS[level + 1]} XP to the next level :O`,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);

    return interaction.reply({
      content: "An error occurred while fetching the user data",
      ephemeral: true,
    });
  }
};

export default { data, execute };