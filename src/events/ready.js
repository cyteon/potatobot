import chalk from "chalk";
import AiChannels from "../models/AiChannels.js";

export default {
  name: "ready",
  once: true,
  async execute(client) {
    console.log(chalk.green("Logged in as " + chalk.bold(client.user.tag)));

    const data = await AiChannels.findOne({ listOfChannels: true });

    if (data) {
      client.aiChannels = data.ai_channels.map(String);
    } else {
      await AiChannels.create({ listOfChannels: true, ai_channels: [] });
      client.aiChannels = [];
    }
  },
};
