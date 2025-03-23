import { SlashCommandSubcommandBuilder } from "discord.js";
import { RateLimiter } from "discord.js-rate-limiter";
import random from "random";
import EconomyUser from "../../../lib/models/EconomyUser.js";

const rateLimiter = new RateLimiter(1, 15 * 60 * 1000);

const jobs = [
  { title: "Janitor", minPay: 350, maxPay: 600, weight: 30 },
  { title: "Cashier", minPay: 400, maxPay: 700, weight: 28 },
  { title: "Waiter", minPay: 450, maxPay: 800, weight: 26 },
  { title: "Delivery Driver", minPay: 500, maxPay: 850, weight: 24 },
  { title: "Factory Worker", minPay: 550, maxPay: 900, weight: 22 },
  { title: "Mechanic", minPay: 600, maxPay: 1000, weight: 20 },
  { title: "Bartender", minPay: 650, maxPay: 1100, weight: 18 },
  { title: "Firefighter", minPay: 700, maxPay: 1200, weight: 16 },
  { title: "Chef", minPay: 750, maxPay: 1300, weight: 14 },
  { title: "Electrician", minPay: 800, maxPay: 1400, weight: 12 },
  { title: "Plumber", minPay: 850, maxPay: 1500, weight: 11 },
  { title: "Police Officer", minPay: 900, maxPay: 1600, weight: 10 },
  { title: "Nurse", minPay: 950, maxPay: 1700, weight: 9 },
  { title: "Architect", minPay: 1000, maxPay: 1800, weight: 8 },
  { title: "Engineer", minPay: 1100, maxPay: 1900, weight: 7 },
  { title: "Data Analyst", minPay: 1200, maxPay: 2000, weight: 6 },
  { title: "Marketing Manager", minPay: 1300, maxPay: 2100, weight: 5 },
  { title: "Doctor", minPay: 1400, maxPay: 2300, weight: 4 },
  { title: "Game Developer", minPay: 1500, maxPay: 2400, weight: 4 },
  { title: "Software Developer", minPay: 1600, maxPay: 2500, weight: 3 },
  { title: "Cybersecurity Specialist", minPay: 1700, maxPay: 2600, weight: 3 },
  { title: "Financial Analyst", minPay: 1800, maxPay: 2700, weight: 3 },
  { title: "Dentist", minPay: 1900, maxPay: 2800, weight: 2 },
  { title: "Lawyer", minPay: 2000, maxPay: 2900, weight: 2 },
  { title: "Pilot", minPay: 2100, maxPay: 3000, weight: 2 },
  { title: "CEO", minPay: 2500, maxPay: 3000, weight: 1 },
  { title: "Investor", minPay: 2600, maxPay: 3000, weight: 1 },
  { title: "Celebrity", minPay: 2700, maxPay: 3000, weight: 1 },
  { title: "Neurosurgeon", minPay: 2800, maxPay: 3000, weight: 1 },
  { title: "Astronaut", minPay: 2900, maxPay: 3000, weight: 1 },
  { title: "Librarian", minPay: 800, maxPay: 1300, weight: 10 },
  { title: "Photographer", minPay: 900, maxPay: 1500, weight: 9 },
  { title: "Zookeeper", minPay: 1000, maxPay: 1700, weight: 8 },
  { title: "Truck Driver", minPay: 1100, maxPay: 1800, weight: 8 },
  { title: "Paramedic", minPay: 1200, maxPay: 1900, weight: 7 },
  { title: "Musician", minPay: 1300, maxPay: 2000, weight: 6 },
  { title: "Veterinarian", minPay: 1400, maxPay: 2100, weight: 5 },
  { title: "Teacher", minPay: 1500, maxPay: 2200, weight: 5 },
  { title: "Journalist", minPay: 1600, maxPay: 2300, weight: 4 },
  { title: "Stock Trader", minPay: 1700, maxPay: 2400, weight: 4 },
  { title: "Professional Athlete", minPay: 1800, maxPay: 2600, weight: 3 },
  { title: "Movie Director", minPay: 1900, maxPay: 2700, weight: 3 },
  { title: "YouTuber", minPay: 2000, maxPay: 2800, weight: 2 },
  { title: "Streamer", minPay: 2100, maxPay: 2900, weight: 2 },
  { title: "Entrepreneur", minPay: 2200, maxPay: 3000, weight: 2 },
  { title: "Astronomer", minPay: 2300, maxPay: 3100, weight: 1 },
  { title: "Deep Sea Diver", minPay: 2400, maxPay: 3200, weight: 1 },
  { title: "Spy", minPay: 2500, maxPay: 3300, weight: 1 },
  { title: "Artificial Intelligence Researcher", minPay: 2600, maxPay: 3400, weight: 1 },
  { title: "Biotech Scientist", minPay: 2700, maxPay: 3500, weight: 1 },
  { title: "F1 Driver", minPay: 2800, maxPay: 3600, weight: 1 },
  { title: "Esports Pro", minPay: 2900, maxPay: 3700, weight: 1 },
  { title: "Luxury Car Designer", minPay: 3000, maxPay: 3800, weight: 1 },
  { title: "Theme Park Engineer", minPay: 3100, maxPay: 3900, weight: 1 },
  { title: "Cryptocurrency Trader", minPay: 3200, maxPay: 4000, weight: 1 },
  { title: "Private Investigator", minPay: 1300, maxPay: 2000, weight: 5 },
  { title: "Stand-Up Comedian", minPay: 1400, maxPay: 2200, weight: 4 },
  { title: "Tattoo Artist", minPay: 1500, maxPay: 2300, weight: 4 },
  { title: "Ghostwriter", minPay: 1600, maxPay: 2400, weight: 3 },
  { title: "Drone Pilot", minPay: 1700, maxPay: 2500, weight: 3 },
  { title: "Air Traffic Controller", minPay: 1800, maxPay: 2700, weight: 2 },
  { title: "Magician", minPay: 1900, maxPay: 2800, weight: 2 },
  { title: "Astronaut Trainer", minPay: 2000, maxPay: 3000, weight: 1 },
];

const weightedJobs = jobs.flatMap(job => Array(job.weight).fill(job));

const data = new SlashCommandSubcommandBuilder()
  .setName("work")
  .setDescription("Work for money.");

const execute = async function (interaction) {
  const limited = rateLimiter.take(interaction.user.id);
  if (limited) {
    return await interaction.reply({
      content: "🕒 You can only work once every 15 minutes!",
      ephemeral: true,
    });
  }

  let user = await EconomyUser.findOne({ id: interaction.user.id });
  if (!user) {
    user = await EconomyUser.create({ id: interaction.user.id, balance: 0 });
  }

  const job = weightedJobs[random.int(0, weightedJobs.length - 1)];
  const pay = random.int(job.minPay, job.maxPay);

  user.balance += pay;
  await user.save();

  await interaction.reply(
    `💼 You worked as a **${job.title}** and earned **$${pay}**!`
  );
};

export default { data, execute };
