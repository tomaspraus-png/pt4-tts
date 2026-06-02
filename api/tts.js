
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const AZURE_KEY = "TVUJ_KEY";
  const ENDPOINT = "https://TVUJ-SPEECH-RESOURCE.cognitiveservices.azure.com";

  // ✅ načtení body správně
  const body = await new Promise((resolve) => {
    let data = "";
    req.on("data", chunk => data += chunk);
    req.on("end", () => resolve(data));
  });

  try {
    const response = await fetch(`${ENDPOINT}/cognitiveservices/v1`, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": AZURE_KEY,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3"
      },
      body: body
    });

    // ✅ debug
    if (!response.ok) {
      const txt = await response.text();
      console.error("AZURE ERROR:", response.status, txt);
      return res.status(500).send(txt);
    }

    const buffer = await response.arrayBuffer();

    res.setHeader("Content-Type", "audio/mpeg");
    res.status(200).send(Buffer.from(buffer));

  } catch (e) {
    console.error("SERVER ERROR:", e);
    res.status(500).send("TTS error");
  }
}
