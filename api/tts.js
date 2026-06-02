console.log("REQ BODY:", req.body);

export default async function handler(req, res) {
  const AZURE_KEY = "TVUJ_NOVY_KEY";
  const ENDPOINT = "https://TVUJ-SPEECH-RESOURCE.cognitiveservices.azure.com";

  try {
    
const response = await fetch(`${ENDPOINT}/cognitiveservices/v1`, {
  method: "POST",
  headers: {
    "Ocp-Apim-Subscription-Key": AZURE_KEY,
    "Content-Type": "application/ssml+xml",
    "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3"
  },
  body: req.body
});

// ✅ TADY je ten error blok
if (!response.ok) {
  const txt = await response.text();
  console.error("AZURE ERROR:", response.status, txt);
  return res.status(500).send(txt);
}

// ✅ až potom pokračuješ
const buffer = await response.arrayBuffer();

res.setHeader("Content-Type", "audio/mpeg");
res.status(200).send(Buffer.from(buffer));

  } catch (e) {
    console.error(e);
    res.status(500).send("TTS error");
  }
}
