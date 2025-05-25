const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { db } = require('../lib/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('starboard')
        .setDescription('Commands for managing the starboard.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('channel')
                .setDescription('Set the starboard channel.')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to set as starboard')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('threshold')
                .setDescription('Set the starboard threshold required to show in starboard channel')
                .addIntegerOption(option =>
                    option.setName('threshold')
                        .setDescription('The threshold for starboard')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Disable the starboard.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('enable')
                .setDescription('Enable the starboard.')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'channel': {
                const channel = interaction.options.getChannel('channel');
                await db.collection('guilds').updateOne(
                    { id: interaction.guild.id },
                    { $set: { 'starboard.channel': channel.id } },
                    { upsert: true }
                );
                await interaction.reply(`Starboard channel set to ${channel}.`);
                break;
            }
            case 'threshold': {
                const threshold = interaction.options.getInteger('threshold');
                await db.collection('guilds').updateOne(
                    { id: interaction.guild.id },
                    { $set: { 'starboard.threshold': threshold } },
                    { upsert: true }
                );
                await interaction.reply(`Starboard threshold set to ${threshold}.`);
                break;
            }
            case 'disable': {
                await db.collection('guilds').updateOne(
                    { id: interaction.guild.id },
                    { $set: { 'starboard.enabled': false } },
                    { upsert: true }
                );
                await interaction.reply('Starboard disabled.');
                break;
            }
            case 'enable': {
                await db.collection('guilds').updateOne(
                    { id: interaction.guild.id },
                    { $set: { 'starboard.enabled': true } },
                    { upsert: true }
                );
                await interaction.reply('Starboard enabled.');
                break;
            }
        }
    },
}; 