const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../../lib/database');
const { Groq } = require('groq-sdk');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ai')
        .setDescription('Interact with the AI')
        .addSubcommand(subcommand =>
            subcommand
                .setName('chat')
                .setDescription('Chat with the AI')
                .addStringOption(option =>
                    option.setName('prompt')
                        .setDescription('What would you like to ask the AI?')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('image')
                .setDescription('Generate an image using AI')
                .addStringOption(option =>
                    option.setName('prompt')
                        .setDescription('Describe the image you want to generate')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('system-prompt')
                .setDescription('Set the system prompt for the AI')
                .addStringOption(option =>
                    option.setName('prompt')
                        .setDescription('The system prompt to set')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reset the AI conversation')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // Check if user is blacklisted or ignored
        const userData = await db.collection('users_global').findOne({ id: interaction.user.id });
        if (userData) {
            if (userData.ai_ignore) {
                return interaction.reply(`You are being ignored by the AI, reason: ${userData.ai_ignore_reason}`);
            }
            if (userData.blacklisted) {
                return interaction.reply(`You are blacklisted from using the bot, reason: ${userData.blacklist_reason}`);
            }
        }

        // Get guild settings
        const guildData = await db.collection('guilds').findOne({ id: interaction.guild.id });
        if (!guildData?.ai_access) {
            return interaction.reply('This server does not have access to the AI. Please contact the server owner to enable it.');
        }

        switch (subcommand) {
            case 'chat': {
                await interaction.deferReply();
                const prompt = interaction.options.getString('prompt');

                try {
                    const client = new Groq({
                        apiKey: process.env.GROQ_API_KEY
                    });

                    const completion = await client.chat.completions.create({
                        messages: [
                            {
                                role: 'system',
                                content: guildData.system_prompt || 'You are a helpful AI assistant.'
                            },
                            {
                                role: 'user',
                                content: prompt
                            }
                        ],
                        model: 'mixtral-8x7b-32768',
                        temperature: 0.7,
                        max_tokens: 1024
                    });

                    const response = completion.choices[0].message.content;

                    // Update stats
                    await db.collection('guilds').updateOne(
                        { id: interaction.guild.id },
                        { $inc: { 'stats.ai_requests': 1 } }
                    );

                    await db.collection('users_global').updateOne(
                        { id: interaction.user.id },
                        { $inc: { 'inspect.ai_requests': 1 } },
                        { upsert: true }
                    );

                    if (response.length > 2000) {
                        const buffer = Buffer.from(response, 'utf-8');
                        await interaction.editReply({
                            content: 'Response was too long for a normal message:',
                            files: [{
                                attachment: buffer,
                                name: 'ai_response.txt'
                            }]
                        });
                    } else {
                        await interaction.editReply(response);
                    }
                } catch (error) {
                    console.error('Error in AI chat:', error);
                    await interaction.editReply('An error occurred while processing your request.');
                }
                break;
            }

            case 'image': {
  await interaction.deferReply();
                const imagePrompt = interaction.options.getString('prompt');
                
                // Check if NSFW content is allowed
                const guildSettings = await db.collection('guilds').findOne({ guildId: interaction.guildId });
                if (!guildSettings?.nsfwEnabled) {
                    return await interaction.editReply('NSFW content is not enabled in this server.');
                }
                
                return await interaction.editReply('Please use the `/imagine` command for image generation.');
            }

            case 'system-prompt': {
                if (!interaction.member.permissions.has('ManageMessages')) {
                    return interaction.reply('You need the Manage Messages permission to use this command.');
                }

                const prompt = interaction.options.getString('prompt');

                if (!prompt) {
                    const currentPrompt = guildData?.system_prompt || 'No system prompt set.';
                    return interaction.reply(`Current system prompt: ${currentPrompt}`);
                }

                await db.collection('guilds').updateOne(
                    { id: interaction.guild.id },
                    { $set: { system_prompt: prompt } },
                    { upsert: true }
                );

                await interaction.reply(`System prompt set to: ${prompt}`);
      break;
            }

            case 'reset': {
                if (!interaction.member.permissions.has('ManageMessages')) {
                    return interaction.reply('You need the Manage Messages permission to use this command.');
                }

                await db.collection('ai_convos').deleteOne({ channel_id: interaction.channel.id });
                await interaction.reply('AI conversation has been reset for this channel.');
                break;
            }
        }
    },
};
