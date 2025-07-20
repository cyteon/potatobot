import { SlashCommandSubcommandBuilder } from "discord.js";
import User from "../../../models/User.js";
import { LEVELS } from "../../../utils/levels.js";

const data = new SlashCommandSubcommandBuilder()
  .setName("leaderboard")
  .setDescription("View the top 10 users in the server by level");

const execute = async (interaction) => {
  const guildId = interaction.guild.id;

  try {
    const users = await User.find({ guild_id: guildId })
      .sort({ level: -1, xp: -1 })
      .limit(10);

    if (users.length === 0) {
      return interaction.reply({
        content: "No users found in this server :(",
        ephemeral: true,
      });
    }

    const leaderboard = users
      .map((user, index) => {
        let label = `**${index + 1}`;

        if (index === 0) label += "st**";
        else if (index === 1) label += "nd**";
        else if (index === 2) label += "rd**";
        else label += "th**";

        return `${user.id == interaction.user.id ? "➡️ " : ""}${label}. <@${user.id}> - Level: ${user.level} (**${user.xp}**/${LEVELS[user.level + 1]} xp)`;
      })
      .join("\n");

    return interaction.reply({
      content: `# 🏆 Leaderboard\n${leaderboard}`,
      allowedMentions: { users: [] },
    });
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);

    return interaction.reply({
      content: "An error occurred while fetching the leaderboard data :c",
      ephemeral: true,
    });
  }
};

export default { data, execute };