const { Client, GatewayIntentBits } = require('discord.js');
const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const axios = require('axios');
const sharp = require('sharp');
const express = require('express');
require('dotenv').config();

// --- 1. HEALTH CHECK SERVER ---
const app = express();
app.get('/health', (req, res) => res.status(200).send('OK'));
app.listen(process.env.PORT || 8000, '0.0.0.0');

// --- 2. CLOUDFLARE R2 CLIENT ---
const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY,
        secretAccessKey: process.env.R2_SECRET_KEY,
    },
});

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

// Generic Upload Helper
async function uploadToR2(buffer, fileName, contentType) {
    const upload = new Upload({
        client: r2Client,
        params: {
            Bucket: process.env.R2_BUCKET_NAME,
            Key: `uploads/${fileName}`,
            Body: buffer,
            ContentType: contentType,
        }
    });
    return upload.done();
}

client.on('messageCreate', async (message) => {
    if (message.channelId !== process.env.CHANNEL_ID || message.author.bot) return;

    for (const attachment of message.attachments.values()) {
        if (attachment.contentType?.startsWith('image/')) {
            try {
                const uploader = message.author.username;
                const serverName = message.guild?.name || "Private Message";
                
                console.log(`📸 Processing image from ${uploader} in ${serverName}...`);

                // 1. Download image
                const response = await axios({ url: attachment.url, responseType: 'arraybuffer' });
                const inputBuffer = Buffer.from(response.data);
                const baseName = `${Date.now()}_${attachment.name.split('.')[0]}`;

                // 2. Setup Sharp with Metadata preservation + Custom Tags
                const processor = sharp(inputBuffer)
                    .keepMetadata() // Crucial: Keeps original GPS and Exif
                    .withExifMerge({
                        IFD0: {
                            Artist: uploader,        // Injects Username into "Author"
                            Copyright: `Uploaded to ${serverName} by ${uploader}`
                        }
                    });

                // 3. Generate Formats (cloning keeps the settings above)
                const [webpBuffer, avifBuffer] = await Promise.all([
                    processor.clone().webp({ quality: 80 }).toBuffer(),
                    processor.clone().avif({ quality: 50 }).toBuffer()
                ]);

                // 4. Upload all 3 versions
                await Promise.all([
                    uploadToR2(inputBuffer, `${baseName}_original.${attachment.name.split('.').pop()}`, attachment.contentType),
                    uploadToR2(webpBuffer, `${baseName}.webp`, 'image/webp'),
                    uploadToR2(avifBuffer, `${baseName}.avif`, 'image/avif')
                ]);

                console.log(`✅ Success for: ${attachment.name}`);
                await message.react('🚀');
            } catch (err) {
                console.error('❌ Processing failed:', err.message);
                await message.react('⚠️');
            }
        }
    }
});

client.once('ready', () => console.log(`Logged in as ${client.user.tag}`));
client.login(process.env.DISCORD_TOKEN);