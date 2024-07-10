import { Router } from "express";
import "dotenv/config";
import fs from "fs";
import fetch from "node-fetch";
import multer from "multer";
import { v1 } from "@google-cloud/vision";
import prompts from "../prompts.js";

const ENVIRONMENT = process.env.NODE_ENV;
const VISION_API_SETTINGS = JSON.parse(process.env.VISION_API_SETTINGS);
const OPENAI_KEY = process.env.OPENAI_KEY;

export const testsRouter = Router();

const client = new v1.ImageAnnotatorClient({
  credentials: VISION_API_SETTINGS,
});

const upload = multer({ dest: "uploads/" });

testsRouter.post("/submit", upload.single("picture"), async (req, res) => {
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
      Authorization: `Bearer ${OPENAI_KEY}`,
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

testsRouter.get("/test", async (req, res) => {
  res.json({
    message: `This is a test. We are on ${ENVIRONMENT}; ${
      ENVIRONMENT === "production"
    }`,
  });
});
