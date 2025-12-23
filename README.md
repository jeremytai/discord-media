# Discord to Cloudflare R2 Image Sync

A Node.js bot that monitors a specific Discord channel, intercepts image attachments, and automatically uploads them to a Cloudflare R2 bucket.

## 🚀 Features

* **Real-time Monitoring:** Uses Discord.js to listen for new messages.
* **Automatic Sync:** Specifically filters for image content types.
* **Stream-based Uploads:** Uses `axios` streams and AWS SDK `Upload` to handle files efficiently without filling up local disk space.
* **Secure:** Environment-variable driven configuration.

## 🛠️ Prerequisites

* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* A Discord Bot Token ([Discord Developer Portal](https://discord.com/developers/applications))
* A Cloudflare R2 Bucket and API Credentials

## 📦 Installation

1. **Clone the repository:**

   ```bash
   git clone [https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git)
   cd YOUR_REPO_NAME

2. **Install dependencies:**

   ```bash

3. **Configure Environment Variables: Create a .env file in the root directory (refer to .env.example):**

Code-Snippet

DISCORD_TOKEN=your_bot_token
CHANNEL_ID=target_channel_id
CF_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY=your_r2_access_key
R2_SECRET_KEY=your_r2_secret_key
R2_BUCKET_NAME=your_bucket_name

🤖 Discord Bot Setup
Enable Message Content Intent in the Discord Developer Portal under the Bot tab.

Invite the bot to your server with the following permissions:

View Channels

Read Message History

🚀 **Usage**
To start the bot:

```bash

node index.js
