const { EmbedBuilder, ThreadAutoArchiveDuration } = require('discord.js');
const { db } = require('../../lib/database');
const { Groq } = require('groq-sdk');

module.exports = [
    {
        name: 'messageCreate',
        async execute(message) {
            if (message.author.bot || !message.guild) return;

            // Check if message is in an AI thread
            const threadData = await db.collection('ai_threads').findOne({ channel_id: message.channel.id });
            if (!threadData) return;

            // Check if user is blacklisted or ignored
            const userData = await db.collection('users_global').findOne({ id: message.author.id });
            if (userData) {
                if (userData.ai_ignore) {
                    return message.reply(`You are being ignored by the AI, reason: ${userData.ai_ignore_reason}`);
                }
                if (userData.blacklisted) {
                    return message.reply(`You are blacklisted from using the bot, reason: ${userData.blacklist_reason}`);
                }
            }

            // Get guild settings
            const guildData = await db.collection('guilds').findOne({ id: message.guild.id });
            if (!guildData?.ai_access) {
                return message.reply('This server does not have access to the AI. Please contact the server owner to enable it.');
            }

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
                            content: message.content
                        }
                    ],
                    model: 'mixtral-8x7b-32768',
                    temperature: 0.7,
                    max_tokens: 1024
                });

                const response = completion.choices[0].message.content;

                // Update stats
                await db.collection('guilds').updateOne(
                    { id: message.guild.id },
                    { $inc: { 'stats.ai_requests': 1 } }
                );

                await db.collection('users_global').updateOne(
                    { id: message.author.id },
                    { $inc: { 'inspect.ai_requests': 1 } },
                    { upsert: true }
                );

                if (response.length > 2000) {
                    const buffer = Buffer.from(response, 'utf-8');
                    await message.reply({
                        content: 'Response was too long for a normal message:',
                        files: [{
                            attachment: buffer,
                            name: 'ai_response.txt'
                        }]
                    });
                } else {
                    await message.reply(response);
                }
            } catch (error) {
                console.error('Error in AI thread:', error);
                await message.reply('An error occurred while processing your request.');
            }
        }
    },
    {
        name: 'interactionCreate',
        async execute(interaction) {
            if (!interaction.isButton()) return;

            if (interaction.customId === 'create_ai_thread') {
                try {
                    const thread = await interaction.channel.threads.create({
                        name: `AI Chat - ${interaction.user.username}`,
                        autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
                        reason: 'AI Chat Thread'
                    });

                    await db.collection('ai_threads').insertOne({
                        channel_id: thread.id,
                        user_id: interaction.user.id,
                        created_at: new Date()
                    });

                    const embed = new EmbedBuilder()
                        .setTitle('AI Chat Thread')
                        .setDescription(`Welcome ${interaction.user}!\nYou can now chat with the AI in this thread.`)
                        .setColor(0x0099FF);

                    await thread.send({ embeds: [embed] });
                    await interaction.reply({
                        content: `Created AI chat thread: ${thread}`,
                        ephemeral: true
                    });
                } catch (error) {
                    console.error('Error creating AI thread:', error);
                    await interaction.reply({
                        content: 'There was an error creating the AI thread. Please try again later.',
                        ephemeral: true
                    });
                }
            }
        }
    }
]; 