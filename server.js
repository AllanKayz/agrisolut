const express = require('express');
const app = express();
const port = 3000;

app.use(express.static(__dirname));
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: __dirname });
});

app.post('/classify', async (req, res) => {
  try {
    const { image, mimeType } = req.body;
    const result = await run(image, mimeType);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error classifying image');
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

function fileToGenerativePart(base64, mimeType) {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
}

async function run(image, mimeType) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

  const prompt = "Identify the plant disease from the image. Provide the top 3 predictions with their confidence levels in a JSON format. Example: [{\"disease\": \"Late Blight\", \"confidence\": 0.9}, {\"disease\": \"Early Blight\", \"confidence\": 0.05}, {\"disease\": \"Healthy\", \"confidence\": 0.05}]";

  const imageParts = [
    fileToGenerativePart(image, mimeType),
  ];

  const result = await model.generateContent([prompt, ...imageParts]);
  const response = await result.response;
  const text = response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Error parsing JSON from Gemini API:", text);
    throw new Error("Invalid response from Gemini API");
  }
}
