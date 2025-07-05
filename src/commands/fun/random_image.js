import { SlashCommandBuilder } from "@discordjs/builders";

const data = new SlashCommandBuilder()
  .setName("random_image")
  .setDescription("Gets a random image of something.")
  .setIntegrationTypes(0, 1)
  .setContexts(0, 1, 2)
  .addStringOption((option) =>
    option.setName("option")
      .setDescription("The type of image to get")
      .setRequired(true)
      .addChoices(
        { name: "Bird", value: "bird" },
        { name: "Cat", value: "cat" },
        { name: "Coffee", value: "coffee" },
        { name: "Dog", value: "dog" },
        { name: "Fox", value: "fox" },
        { name: "Gary", value: "gary" },
        { name: "Kangaroo", value: "kangaroo" },
        { name: "Koala", value: "koala" },
        { name: "Panda", value: "panda" },
        { name: "Raccoon", value: "raccoon" },
        { name: "Red Panda", value: "red-panda" },
      )
  )

const execute = async function (interaction) {
  const { options } = interaction;
  const option = options.getString("option");

  if (option === "bird") {
    const response = await fetch("https://some-random-api.com/animal/bird");
    const json = await response.json();
    const imgurl = json.image;

    await interaction.reply({ content: imgurl, ephemeral: false });
  } else if (option === "cat") {
    const response = await fetch("https://some-random-api.com/animal/cat");
    const json = await response.json();
    const imgurl = json.image;

    await interaction.reply({ content: imgurl, ephemeral: false });
  } else if (option === "coffee") {
    const response = await fetch("https://coffee.alexflipnote.dev/random.json");
    const json = await response.json();
    const imgurl = json.file;

    await interaction.reply({ content: imgurl, ephemeral: false });
  } else if (option === "dog") {
    const response = await fetch("https://some-random-api.com/animal/dog");
    const json = await response.json();
    const imgurl = json.image;

    await interaction.reply({ content: imgurl, ephemeral: false });
  } else if (option === "fox") {
    const response = await fetch("https://some-random-api.com/animal/fox");
    const json = await response.json();
    const imgurl = json.image;

    await interaction.reply({ content: imgurl, ephemeral: false });
  } else if (option === "gary") {
    const response = await fetch("https://garybot.dev/api/gary");
    const json = await response.json();
    const imgurl = json.url;

    await interaction.reply({ content: imgurl, ephemeral: false });
  } else if (option === "kangaroo") {
    const response = await fetch("https://some-random-api.com/animal/kangaroo");
    json = await response.json();
    imgurl = json.image;

    await interaction.reply({ content: imgurl, ephemeral: false });
  } else if (option === "koala") {
    const response = await fetch("https://some-random-api.com/animal/koala");
    const json = await response.json();
    const imgurl = json.image;

    await interaction.reply({ content: imgurl, ephemeral: false });
  } else if (option === "panda") {
    const response = await fetch("https://some-random-api.com/animal/panda");
    const json = await response.json();
    const imgurl = json.image;

    await interaction.reply({ content: imgurl, ephemeral: false });
  } else if (option === "raccoon") {
    const response = await fetch("https://some-random-api.com/animal/raccoon");
    const json = await response.json();
    const imgurl = json.image;

    await interaction.reply({ content: imgurl, ephemeral: false });
  } else if (option === "red-panda") {
    const response = await fetch(
      "https://some-random-api.com/animal/red_panda",
    );
    const json = await response.json();
    const imgurl = json.image;

    await interaction.reply({ content: imgurl, ephemeral: false });
  }
};

export default { data, execute };
