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
Worker Logic (index.js)
export default {
  async fetch(request, env) {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate"
    };

    try {
      const objects = await env.MY_BUCKET.list();
      const baseUrl = "[https://photos.kandiegang.com/](https://photos.kandiegang.com/)"; 

      const files = objects.objects.map(obj => ({
        key: obj.key,
        url: `${baseUrl}${obj.key}`,
        uploaded: obj.uploaded
      }));

      return new Response(JSON.stringify(files), { headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
  }
};
``
---

## 🎨 3. WordPress Integration
Add this to your theme's functions.php. It handles the grid and the lightbox.

Features
Duplicate Filtering: Only displays .webp to avoid showing triplicate versions of one photo.

Lightbox: Native JS/CSS lightbox for full-screen viewing on click.

`function r2_discord_gallery() {
    $api_url = '[https://r2-gallery-api.abbett-labs.workers.dev](https://r2-gallery-api.abbett-labs.workers.dev)';
    $response = wp_remote_get($api_url);
    if (is_wp_error($response)) return 'Gallery unavailable.';
    $images = json_decode(wp_remote_retrieve_body($response));

    $output = '<style>
        .r2-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .r2-card { border-radius: 12px; overflow: hidden; background: #000; aspect-ratio: 1/1; cursor: pointer; }
        .r2-card img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
        .r2-card:hover img { transform: scale(1.05); }
        #r2-lightbox { display: none; position: fixed; z-index: 999; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); align-items: center; justify-content: center; }
        #r2-lightbox img { max-width: 90%; max-height: 90%; }
    </style>';

    $output .= '<div class="r2-grid">';
    foreach ($images as $img) {
        if (strpos($img->url, '.webp') !== false) {
            $output .= '<div class="r2-card" onclick="openR2Lightbox(\'' . esc_url($img->url) . '\')">';
            $output .= '<img src="' . esc_url($img->url) . '" loading="lazy">';
            $output .= '</div>';
        }
    }
    $output .= '</div>';
    
    $output .= '<div id="r2-lightbox" onclick="this.style.display=\'none\'"><img id="r2-lb-img"></div>
    <script>function openR2Lightbox(u){document.getElementById("r2-lb-img").src=u;document.getElementById("r2-lightbox").style.display="flex";}</script>';

    return $output;
}
add_shortcode('discord_r2_gallery', 'r2_discord_gallery');
`
---

## 🛠️ Maintenance

Task | Command / Action
Update API | npx wrangler deploy
Check Files | Go to Cloudflare Dashboard > R2 > discord-media
Clear Cache | Hard refresh (Ctrl+F5) on Worker URL
