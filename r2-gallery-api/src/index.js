export default {
  async fetch(request, env) {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    };

    try {
      // List everything without a prefix to verify connection
      const objects = await env.MY_BUCKET.list();
      
      const baseUrl = "https://photos.kandiegang.com/"; 

      const files = objects.objects.map(obj => ({
        key: obj.key,
        // This handles cases where 'uploads/' is or isn't in the key
        url: `${baseUrl}${obj.key}`, 
        uploaded: obj.uploaded
      }));

      return new Response(JSON.stringify(files), { headers });

    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { 
        status: 500, 
        headers 
      });
    }
  },
};