export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Allow WordPress to access this data
    const headers = { 
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json" 
    };

    // List files in the 'uploads/' folder
    const options = {
      prefix: 'uploads/',
      delimiter: '/',
    };

    const objects = await env.MY_BUCKET.list(options);
    
    // Create a list of public URLs (Replace with your custom domain or R2.dev URL)
    const baseUrl = "https://your-public-r2-url.com/"; 
    
    const files = objects.objects.map(obj => ({
      key: obj.key,
      url: `${baseUrl}${obj.key}`,
      uploaded: obj.uploaded
    }));

    return new Response(JSON.stringify(files), { headers });
  },
};