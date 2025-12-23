const { Client, GatewayIntentBits } = require('discord.js');
const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const axios = require('axios');
const express = require('express');
require('dotenv').config();

// --- 1. HEALTH CHECK SERVER (For Koyeb) ---
const app = express();
const PORT = process.env.PORT || 8000;

app.get('/health', (req, res) => {
    res.status(200).send('Bot is healthy');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Health check server running on port ${PORT}`);
});

// --- 2. CLOUDFLARE R2 CLIENT ---
const r2Client = new S3Client({
    region: 'auto', 
    endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY,
        secretAccessKey: process.env.R2_SECRET_KEY,
    },
});

// --- 3. DISCORD BOT CLIENT ---
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent // Ensure this is enabled in Dev Portal!
    ] 
});

client.once('ready', () => {
    console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    // Ignore messages from other channels or other bots
    if (message.channelId !== process.env.CHANNEL_ID || message.author.bot) return;

    // Check if message has attachments
    if (message.attachments.size === 0) return;

    for (const attachment of message.attachments.values()) {
        // Only process images
        if (attachment.contentType?.startsWith('image/')) {
            console.log(`📸 New image detected: ${attachment.name}`);

            try {
                // Download image stream from Discord
                const response = await axios({
                    method: 'get',
                    url: attachment.url,
                    responseType: 'stream'
                });

                // Upload to Cloudflare R2
                const upload = new Upload({
                    client: r2Client,
                    params: {
                        Bucket: process.env.R2_BUCKET_NAME,
                        Key: `uploads/${Date.now()}_${attachment.name}`,
                        Body: response.data,
                        ContentType: attachment.contentType,
                    }
                });

                await upload.done();
                console.log(`✅ Successfully synced to R2: ${attachment.name}`);
                
                // Optional: React to the message to show success
                await message.react('✅');
            } catch (err) {
                console.error('❌ Sync failed:', err.message);
                await message.react('❌');
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);