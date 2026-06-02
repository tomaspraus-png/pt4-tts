
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // ✅ CORS HEADERS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  // ✅ preflight (VELMI důležité)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const AZURE_KEY = "TVUJ_KEY";
  const ENDPOINT = "https://TVUJ-SPEECH-RESOURCE.cognitiveservices.azure.com";

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

// 🔥 KRITICKÉ LOGY
console.log("Azure response status:", response.status);

const text = await response.text();
console.log("Azure raw response:", text);

// ✅ pokud není OK → pošli zpět klientovi
if (response.status !== 200) {
  return res.status(500).send(text);
}

// ✅ pokud OK → musíš znovu zavolat (blob už nejde použít po text())
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

   
if (!response.ok) {
  const txt = await response.text();
  console.error("AZURE ERROR DETAIL:", txt);
  return res

    }

    const buffer = await response.arrayBuffer();

    res.setHeader("Content-Type", "audio/mpeg");
    res.status(200).send(Buffer.from(buffer));

  } catch (e) {
    console.error("SERVER ERROR:", e);
   
const txt = await response.text();
console.error("AZURE ERROR DETAIL:", txt);
return res.status(500).send(txt);
``

  }
}
