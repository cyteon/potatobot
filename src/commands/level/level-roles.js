const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../lib/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level-roles')
        .setDescription('Commands to set up level roles')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create roles for levels'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete roles for levels'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('show')
                .setDescription('Show level roles'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set level roles')
                .addIntegerOption(option =>
                    option.setName('level')
                        .setDescription('The level to set the role for')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to set for this level')
                        .setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'create': {
                const guildData = await db.collection('guilds').findOne({ id: interaction.guild.id });
                if (!guildData) {
                    await db.collection('guilds').insertOne({
                        id: interaction.guild.id,
                        level_roles: {}
                    });
                }

                const levels = [1, 3, 5, 10, 15, 20];
                for (const level of levels) {
                    if (!guildData.level_roles[level]) {
                        const role = await interaction.guild.roles.create({
                            name: `Level ${level}`,
                            reason: 'Level role creation'
                        });
                        guildData.level_roles[level] = role.id;
                    }
                }

                await db.collection('guilds').updateOne(
                    { id: interaction.guild.id },
                    { $set: { level_roles: guildData.level_roles } }
                );

                await interaction.reply('Roles created!');
                break;
            }

            case 'delete': {
                const guildData = await db.collection('guilds').findOne({ id: interaction.guild.id });
                if (!guildData || !guildData.level_roles) {
                    return interaction.reply('No level roles found!');
                }

                for (const level in guildData.level_roles) {
                    const role = interaction.guild.roles.cache.get(guildData.level_roles[level]);
                    if (role) {
                        try {
                            await role.delete();
                        } catch (error) {
                            console.error('Error deleting role:', error);
                        }
                    }
                }

                await db.collection('guilds').updateOne(
                    { id: interaction.guild.id },
                    { $set: { level_roles: {} } }
                );

                await interaction.reply('Roles deleted!');
                break;
            }

            case 'show': {
                const guildData = await db.collection('guilds').findOne({ id: interaction.guild.id });
                if (!guildData || !guildData.level_roles) {
                    return interaction.reply('No level roles found!');
                }

                const embed = new EmbedBuilder()
                    .setTitle('Level Roles')
                    .setColor(0x0099FF);

                for (const level in guildData.level_roles) {
                    const role = interaction.guild.roles.cache.get(guildData.level_roles[level]);
                    if (role) {
                        embed.addFields({
                            name: `Level ${level}`,
                            value: role.toString(),
                            inline: false
                        });
                    }
                }

                await interaction.reply({ embeds: [embed] });
                break;
            }

            case 'set': {
                const level = interaction.options.getInteger('level');
                const role = interaction.options.getRole('role');

                const guildData = await db.collection('guilds').findOne({ id: interaction.guild.id });
                if (!guildData) {
                    await db.collection('guilds').insertOne({
                        id: interaction.guild.id,
                        level_roles: {}
                    });
                }

                await db.collection('guilds').updateOne(
                    { id: interaction.guild.id },
                    { $set: { [`level_roles.${level}`]: role.id } }
                );

                await interaction.reply(`Set level ${level} role to ${role.name}`);
                break;
            }
        }
    },
}; 