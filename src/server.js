import express from "express";
import cors from "cors";
import chalk from "chalk";
import Guild from "./models/Guild.js";
import GlobalUser from "./models/GlobalUser.js";
import Stats from "./models/Stats.js";

const app = express();
const port = process.env.PORT || 3000;

function walkCommands(client) {
  const result = [];

  for (const [, cmd] of client.commands) {
    const json = cmd.data.toJSON ? cmd.data.toJSON() : cmd.data;
    const category = cmd.category || "unknown";

    const options = json.options || [];
    const subcommands = options.filter((o) => o.type === 1);
    const groups = options.filter((o) => o.type === 2);

    if (subcommands.length === 0 && groups.length === 0) {
      result.push({
        name: json.name,
        description: json.description,
        category,
        subcommand: false,
        aliases: [],
        extras: {},
      });
    } else {
      for (const sub of subcommands) {
        result.push({
          name: `${json.name} ${sub.name}`,
          description: sub.description,
          category,
          subcommand: true,
          aliases: [],
          extras: {},
        });
      }
      for (const group of groups) {
        for (const sub of group.options || []) {
          result.push({
            name: `${json.name} ${group.name} ${sub.name}`,
            description: sub.description,
            category,
            subcommand: true,
            aliases: [],
            extras: {},
          });
        }
      }
    }
  }

  return result;
}

export default function runServer(client) {
  console.log(chalk.yellow("Starting server..."));

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : ["*"];

  app.use(
    cors({
      origin: allowedOrigins.includes("*") ? "*" : allowedOrigins,
      credentials: true,
    }),
  );

  app.get("/", (req, res) => {
    res.json({
      message: `User: ${client.user?.username ?? "unknown"} is online!`,
    });
  });

  app.get("/api", (req, res) => {
    res.json({ message: "OK" });
  });

  app.get("/api/commands/:category", (req, res) => {
    const { category } = req.params;

    let commands = walkCommands(client).filter((c) => c.category !== "dev");

    if (category !== "all") {
      commands = commands.filter((c) => c.category === category);

      if (commands.length === 0) {
        return res.status(404).json({ message: "Category not found.", status: 404 });
      }
    }

    res.json(commands);
  });

  app.get("/api/categories", (req, res) => {
    const categories = [...(client.categories ?? [])].filter(
      (c) => c !== "dev",
    );
    res.json(categories);
  });

  app.get("/api/stats", async (req, res) => {
    const stats = await Stats.findOne({}) ?? { commands_ran: 0, ai_requests: 0 };
    res.json({
      users: client.guilds.cache.reduce((a, g) => a + g.memberCount, 0),
      guilds: client.guilds.cache.size,
      commands_ran: stats.commands_ran,
      ai_requests: stats.ai_requests,
    });
  });

  app.listen(port, () => {
    console.log(chalk.green(`Server is running on http://localhost:${port}`));
  });
}
