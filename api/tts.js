
export default async function handler(req, res) {
  // ===============================
  // CORS
  // ===============================
  const allowedOrigins = [
    "http://maplepoolclub.cz",
    "https://maplepoolclub.cz"
  ];

  const origin = req.headers.origin;
  const allowOrigin = allowedOrigins.includes(origin)
    ? origin
    : "http://maplepoolclub.cz";

  res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // preflight požadavek z browseru
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text, lang = "cs-CZ" } = req.body || {};

    if (!text) {
      return res.status(400).json({ error: "Missing text" });
    }

    const speechKey = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION || "swedencentral";
    const voiceName = voiceForLang(lang);

    if (!speechKey) {
      return res.status(500).json({ error: "Missing AZURE_SPEECH_KEY" });
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
      return res.status(azureRes.status).json({
        error: "Azure TTS failed",
        status: azureRes.status,
        detail: errText
      });
    }

    const audioBuffer = Buffer.from(await azureRes.arrayBuffer());

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");

    return res.status(200).send(audioBuffer);
  } catch (e) {
    return res.status(500).json({
      error: "TTS proxy error",
      detail: String(e?.message || e)
    });
  }
}

function voiceForLang(lang) {
  if (lang === "cs-CZ") {
    return process.env.AZURE_VOICE_CS || "cs-CZ-AntoninNeural";
  }

  if (lang === "pl-PL") {
    return process.env.AZURE_VOICE_PL || "pl-PL-MarekNeural";
  }

  if (lang === "en-US" || lang === "en-GB") {
    return process.env.AZURE_VOICE_EN || "en-GB-OllieMultilingualNeural";
  }

  return process.env.AZURE_VOICE_EN || "en-GB-OllieMultilingualNeural";
}

function escapeXml(v) {
  return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
