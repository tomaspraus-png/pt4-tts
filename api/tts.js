
export default async function handler(req, res) {
  // ✅ CORS (důležité)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const AZURE_KEY = "TVUJ_KEY";
  const ENDPOINT = "https://TVUJ-SPEECH-RESOURCE.cognitiveservices.azure.com";

  try {
    // ✅ VERCEL už body parsuje sám
    const body = req.body;

    const response = await fetch(`${ENDPOINT}/cognitiveservices/v1`, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": AZURE_KEY,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3"
      },
      body: body
    });

    const text = await response.text();
    console.log("Azure response:", text);

    if (!response.ok) {
      return res.status(500).send(text);
    }

    // ✅ znovu fetch kvůli blobu
    const response2 = await fetch(`${ENDPOINT}/cognitiveservices/v1`, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": AZURE_KEY,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3"
      },
      body: body
    });

    const buffer = await response2.arrayBuffer();

    res.setHeader("Content-Type", "audio/mpeg");
    res.status(200).send(Buffer.from(buffer));

  } catch (e) {
    console.error("SERVER ERROR:", e);
    res.status(500).send(String(e));
  }
}
