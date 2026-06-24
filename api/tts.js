
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { text, lang = "cs-CZ" } = req.body || {};

    if (!text) {
      res.status(400).json({ error: "Missing text" });
      return;
    }

    const speechKey = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION || "swedencentral";
    const voiceName =
      process.env.AZURE_VOICE_NAME || "it-IT-MarcelloMultilingualNeural";

    if (!speechKey) {
      res.status(500).json({ error: "Missing AZURE_SPEECH_KEY" });
      return;
    }

    const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

    const ssml = `
<speak version="1.0" xml:lang="${escapeXml(lang)}">
  <voice name="${escapeXml(voiceName)}">
    ${escapeXml(text)}
  </voice>
</speak>`.trim();

    const azureRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": speechKey,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
        "User-Agent": "PT4-Tournament-Announcer"
      },
      body: ssml
    });

    if (!azureRes.ok) {
      const errText = await azureRes.text().catch(() => "");
      res.status(azureRes.status).json({
        error: "Azure TTS failed",
        status: azureRes.status,
        detail: errText
      });
      return;
    }

    const audioBuffer = Buffer.from(await azureRes.arrayBuffer());

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(audioBuffer);
  } catch (e) {
    res.status(500).json({
      error: "TTS proxy error",
      detail: String(e?.message || e)
    });
  }
}

function escapeXml(v) {
  return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
