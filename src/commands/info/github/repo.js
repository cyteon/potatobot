import {
  SlashCommandSubcommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} from "discord.js";

const data = new SlashCommandSubcommandBuilder()
  .setName("repo")
  .setDescription("Searches for the specified GitHub repo.")
  .addStringOption((input) =>
    input.setName("owner").setDescription("...").setRequired(true),
  )
  .addStringOption((input) =>
    input.setName("repo").setDescription("...").setRequired(true),
  );

const execute = async function (interaction) {
  try {
    const owner = interaction.options.getString("owner");
    const repo = interaction.options.getString("repo");
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
    );
    const repoData = await response.json();

    if (response.status == 404) {
      return await interaction.reply("couldn't find that repo :O");
    } else if (response.status == 429) {
      return await interaction.reply("github's telling me to slow down :c try again in a bit!");
    }

    const embed = new EmbedBuilder()
      .setTitle(`GitHub Repository: ${repoData.name}`)
      .setDescription(`**Description:** ${repoData.description}`)
      .setColor(0xffffff)
      .setThumbnail(repoData.owner.avatar_url)
      .addFields({
        name: "Author 🖊:",
        value: `__${repoData.owner.login}__`,
        inline: true,
      })
      .addFields({
        name: "Stars ⭐:",
        value: repoData.stargazers_count.toLocaleString("en-US"),
        inline: true,
      })
      .addFields({
        name: "Forks 🍴:",
        value: repoData.forks_count.toLocaleString("en-US"),
        inline: true,
      })
      .addFields({
        name: "Language 💻:",
        value: repoData.language,
        inline: true,
      })
      .addFields({
        name: "Size 🗃️:",
        value: `${(repoData.size / 1000).toFixed(2)} MB`,
        inline: true,
      });

    if (repoData.license) {
      embed.addFields({
        name: "License name 📃:",
        value: repoData.license.name,
        inline: true,
      });
    } else {
      embed.addFields({
        name: "License name 📃:",
        value: "This Repo doesn't have a license",
        inline: true,
      });
    }

    const repoButton = new ButtonBuilder()
      .setLabel("GitHub Repository")
      .setStyle(ButtonStyle.Link)
      .setURL(repoData.html_url);

    const row = new ActionRowBuilder().addComponents(repoButton);

    return await interaction.reply({ embeds: [embed], components: [row] });
  } catch (error) {
    console.error(error);
  }
};

export default { data, execute };
