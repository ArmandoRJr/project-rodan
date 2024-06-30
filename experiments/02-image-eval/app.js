import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import "dotenv/config";
import fs from "fs";

import { v1 } from "@google-cloud/vision";

import prompts from "./prompts.js";

const VISION_API_SETTINGS = JSON.parse(process.env.VISION_API_SETTINGS);

const client = new v1.ImageAnnotatorClient({
  credentials: VISION_API_SETTINGS,
});

const PORT = 3000;
export const app = express();
app.use(bodyParser.json());

const upload = multer({ dest: "uploads/" });

app.post("/submit", upload.single("picture"), async (req, res) => {
  const time = req.body.time;
  const promptId = req.body.promptId;
  const file = req.file;

  const fileBuffer = fs.readFileSync(file.path);
  const base64File = fileBuffer.toString("base64");

  const request = {
    image: { content: base64File },
  };
  const [result] = await client.objectLocalization(request);
  const objects = result.localizedObjectAnnotations;

  const objectNames = [...new Set(objects.map((object) => object.name))];
  console.log(objectNames.toString());

  const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `
              I have a list of objects [${objectNames.toString()}]
              and this prompt (${prompts[promptId]}).
              Respond to me with a JSON object where each key is an
              object in the list and the value (in terms of a confidence
              score between 0 and 1) of how related
              the object is to the prompt.
              `,
        },
      ],
    }),
  });
  const data = await response.json();
  const content = data.choices[0].message.content;
  const contentJSON = JSON.parse(content);
  console.log(contentJSON, Object.values(contentJSON));

  const maxCloseness = Math.max(...Object.values(contentJSON));
  console.log(maxCloseness);

  // Doesn't have time nor Vision AI confidence in the score
  // Someone else can fix that
  res.json({ objects: contentJSON, score: maxCloseness });
});

app.listen(PORT, (err) => {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
});
