import { SlashCommandBuilder } from "discord.js";

const data = new SlashCommandBuilder()
  .setName("source")
  .setIntegrationTypes(0, 1)
  .setContexts(0, 1, 2)
  .setDescription("Get the source information for this project");

const execute = async function (interaction) {
  await interaction.reply({
    embeds: [
      {
        title: "Source Information",
        fields: [
          {
            name: "Author",
            value: "Cyteon - https://github.com/cyteon",
          },
          {
            name: "📜 License",
            value: "GNU Affero General Public License v3",
          },
          {
            name: "📜 GNU AGPL v3",
            value: "https://www.gnu.org/licenses/agpl-3.0.html",
          }
        ],
      },
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 5,
            emoji: "📁",
            label: "View Source",
            url: "https://github.com/cyteon/potatobot",
          },
          {
            type: 2,
            style: 5,
            emoji: "📜",
            label: "View License",
            url: "https://raw.githubusercontent.com/Cyteon/potatobot/refs/heads/v3-js/LICENSE",
          },
        ],
      },
    ],
  });
};

export default { data, execute };
