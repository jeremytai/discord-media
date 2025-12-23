const { Client, GatewayIntentBits } = require('discord.js');
const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const axios = require('axios');
require('dotenv').config();

// 1. Setup Cloudflare R2 Client
const r2Client = new S3Client({
    region: 'auto', 
    endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY,
        secretAccessKey: process.env.R2_SECRET_KEY,
    },
});

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] 
});

client.on('messageCreate', async (message) => {
    // Only monitor your specific channel
    if (message.channelId !== process.env.CHANNEL_ID || message.author.bot) return;

    for (const attachment of message.attachments.values()) {
        if (attachment.contentType?.startsWith('image/')) {
            try {
                // Stream the image from Discord
                const response = await axios({ method: 'get', url: attachment.url, responseType: 'stream' });

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
                console.log(`✅ Synced to R2: ${attachment.name}`);
            } catch (err) {
                console.error('❌ Upload failed:', err);
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);