# 📸 Discord-to-WordPress R2 Gallery System

A high-performance, automated image pipeline that takes images from **Discord**, processes them into multiple modern formats (**WebP**, **AVIF**), stores them in **Cloudflare R2**, and serves them via a **Cloudflare Worker API** to a custom **WordPress** gallery.

## 🏗️ System Architecture

1.  **Source (Discord):** Bot listens for images in a specific channel.
2.  **Processing (Koyeb):** Node.js bot processes images using `sharp` to create WebP and AVIF versions.
3.  **Storage (Cloudflare R2):** High-speed, S3-compatible object storage.
4.  **API Layer (Cloudflare Workers):** A serverless API that lists bucket contents as JSON.
5.  **Display (WordPress):** A custom PHP shortcode that fetches the JSON and renders a responsive grid.

---

## 🚀 1. The Discord Bot (Koyeb)
The bot is hosted on Koyeb and uses the AWS SDK v3 to communicate with R2.

### Environment Variables
Ensure these are set in your Koyeb dashboard:
* `R2_ACCOUNT_ID`: Your Cloudflare Account ID.
* `R2_ACCESS_KEY_ID`: Your R2 API Token Access Key.
* `R2_SECRET_ACCESS_KEY`: Your R2 API Token Secret Key.
* `R2_BUCKET_NAME`: `discord-media`
* `R2_ENDPOINT`: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

---

## ⚡ 2. The Gallery API (Cloudflare Workers)
The Worker provides a bridge between your private R2 bucket and your WordPress site.

### `wrangler.jsonc` Configuration
```jsonc
{
  "name": "r2-gallery-api",
  "main": "src/index.js",
  "compatibility_date": "2025-12-23",
  "r2_buckets": [
    {
      "binding": "MY_BUCKET",
      "bucket_name": "discord-media"
    }
  ]
}
