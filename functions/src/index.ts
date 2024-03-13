/*
 * GUIDES
 * https://firebase.google.com/docs/functions/typescript
 * PARAMETERIZED CONFIG IS HOW TO DO THINGS: https://firebase.google.com/docs/functions/config-env?gen=2nd#params
 */

import * as functions from "firebase-functions";

import { OpenAI } from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

import { getFirestore } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";

initializeApp();

import satori from "satori";

const db = getFirestore();

const OPENAI_KEY = functions.params.defineSecret("OPENAI_KEY");
const PINECONE_KEY = functions.params.defineSecret("PINECONE_KEY");
const MODEL = functions.params.defineString("MODEL", {
  default: "text-embedding-ada-002",
});
const TOPK = functions.params.defineInt("TOPK", { default: 3 });

export const search_classes = functions
  .runWith({ secrets: [OPENAI_KEY, PINECONE_KEY] })
  .https.onRequest(async (request, response) => {
    if (request.method !== "POST") {
      response.status(400).send("Invalid method");
      return;
    }

    if (request.body.query === undefined) {
      response.status(400).send("No query provided");
      return;
    }

    let query = request.body.query as string;

    functions.logger.info("Query", OPENAI_KEY.value(), {
      structuredData: true,
    });

    const openai = new OpenAI({ apiKey: OPENAI_KEY.value() });
    const { data } = await openai.embeddings.create({
      input: query,
      model: MODEL.value(),
    });

    const embedding = data[0].embedding;

    const pc = new Pinecone({ apiKey: PINECONE_KEY.value() });
    const classIndex = pc.index("courses");

    const results = await classIndex.query({
      topK: TOPK.value(),
      vector: embedding,
    });

    // getting the database information
    const classData = await Promise.all(
      results.matches.map(async (match: any) => {
        let classRef = db.collection("courses").doc(match.id);
        let classData = await classRef.get();

        let data = classData.data();

        if (data === undefined) {
          return null;
        }

        const return_data = {} as any;

        return_data.title = data.title;
        return_data.description = data.description;
        return_data.score = match.score;
        return_data.avg_rating = data.avg_rating;
        return_data.url = `https://thecourseforum.com/course/${data.mnemonic}/${data.number}`;
        return_data.ref = `${data.mnemonic} ${data.number}`;
        return_data.avg_rating = data.avg_rating;

        return return_data;
      })
    );

    // sending the response
    response.setHeader("Content-Type", "application/json");
    response.status(200).send(classData);
  });

const CLUB_KEYS = [
  "memberCount",
  "regularMeetingLocation",
  "description",
  "regularMeetingTime",
  "name",
  "categories",
];

export const search_clubs = functions
  .runWith({ secrets: [OPENAI_KEY, PINECONE_KEY] })
  .https.onRequest(async (request, response) => {
    if (request.method !== "POST") {
      response.status(400).send("Invalid method");
      return;
    }

    if (request.body.query === undefined) {
      response.status(400).send("No query provided");
      return;
    }

    let query = request.body.query as string;

    functions.logger.info("Query", OPENAI_KEY.value(), {
      structuredData: true,
    });

    const openai = new OpenAI({ apiKey: OPENAI_KEY.value() });
    const { data } = await openai.embeddings.create({
      input: query,
      model: MODEL.value(),
    });

    const embedding = data[0].embedding;

    const pc = new Pinecone({ apiKey: PINECONE_KEY.value() });
    const classIndex = pc.index("clubs");

    const results = await classIndex.query({
      topK: TOPK.value(),
      vector: embedding,
    });

    const clubData = await Promise.all(
      results.matches.map(async (match: any) => {
        let clubRef = db.collection("clubs").doc(match.id);
        let club = await clubRef.get();

        let data = club.data();

        if (data === undefined) {
          return null;
        }

        const return_data = {} as any;

        for (const elem of CLUB_KEYS) {
          return_data[elem] = data[elem];
        }

        // adding the cover data to the return data
        if (data.cover !== undefined) {
          return_data.cover = data.cover;
        }

        return_data.photo = `https://virginia-cdn.presence.io/organization-photos/cea28f2b-baa9-4c47-8879-da8d675e4471/${
          data.photoUri as string
        }`;
        return_data.url = `https://virginia.presence.io/organization/${
          data.uri as string
        }`;

        return_data.score = match.score;

        return return_data;
      })
    );

    // sending the response
    response.setHeader("Content-Type", "application/json");
    response.status(200).send(clubData);
  });


// schedule to get events every hour
const EVENT_KEYS = [
  "eventNoSqlId",
  "campusName",
  "eventName",
  "organizationName",
  "organizationUri",
  "description",
  "location",
  "isVirtualEventLink",
  "hasVirtualEventIntegration",
  "photoUri",
  "startDateTimeUtc",
  "endDateTimeUtc",
];
// "every hour",

export const get_upcoming_events = functions.https.onRequest(
  async (request, response) => {
    let eventsRef = db.collection("events");
    let events = await eventsRef
      .where("startDateTimeUtc", ">", new Date().toISOString())
      .limit(TOPK.value())
      .get();

    // get the first 5 events stored by date after today

    let data = events.docs.map((doc) => {
      const data = doc.data();

      const return_data = {} as any;

      return_data.eventName = data.eventName;
      return_data.organizationName = data.organizationName;
      return_data.startDateTimeUtc = data.startDateTimeUtc;
      return_data.endDateTimeUtc = data.endDateTimeUtc;
      return_data.description = data.description;
      return_data.location = data.location;

      return_data.org_url = `https://virginia.presence.io/organization/${data.organizationUri}`;
      return_data.photo = `https://virginia-cdn.presence.io/event-photos/cea28f2b-baa9-4c47-8879-da8d675e4471/${data.photoUri}`;

      return return_data;
    });

    response.setHeader("Content-Type", "application/json");
    response.status(200).send(data);
  }
);

export const find_professors = functions
  .runWith({ secrets: [OPENAI_KEY, PINECONE_KEY] })
  .https.onRequest(async (request, response) => {
    if (request.method !== "POST") {
      response.status(400).send("Invalid method");
      return;
    }

    if (request.body.query === undefined) {
      response.status(400).send("No query provided");
      return;
    }

    let query = request.body.query as string;

    functions.logger.info("Query", OPENAI_KEY.value(), {
      structuredData: true,
    });

    const openai = new OpenAI({ apiKey: OPENAI_KEY.value() });
    const { data } = await openai.embeddings.create({
      input: query,
      model: MODEL.value(),
    });

    const embedding = data[0].embedding;

    const pc = new Pinecone({ apiKey: PINECONE_KEY.value() });
    const classIndex = pc.index("professors");

    const results = await classIndex.query({
      topK: TOPK.value(),
      vector: embedding,
    });

    // getting the database information
    const professorData = await Promise.all(
      results.matches.map(async (match: any) => {
        let professorRef = db.collection("professors").doc(match.id);
        let professor = await professorRef.get();

        let data = professor.data();

        if (data === undefined) {
          return null;
        }

        const return_data = {} as any;

        return_data.name = data.name;
        return_data.credentials = data.credentials;
        return_data.title = data.title;

        if (data.headshot !== undefined) {
          return_data.headshot = data.headshot;
        }

        return_data.bio = data.bio;

        if (data.googleScholar !== undefined) {
          return_data.googleScholar = data.googleScholar;
        }

        if (data.email !== undefined) {
          return_data.email = data.email;
        }

        return_data.score = match.score;
        return return_data;
      })
    );

    // sending the response
    response.setHeader("Content-Type", "application/json");
    response.status(200).send(professorData);
  });

export const getevents = functions.pubsub
  .schedule("every 1 hours")
  .onRun(async (event) => {
    let eventFetch = await fetch(
      "https://api.presence.io/virginia/v1/dashboard/events"
    );

    let data = await eventFetch.json();

    functions.logger.info("Data:", data, { structuredData: true });

    let events = [];
    data.upcomingEvents && events.push(...data.upcomingEvents);
    data.currentEvents && events.push(...data.currentEvents);

    // make a db connection
    let batch = db.batch();
    let eventsRef = db.collection("events");
    for (let event of events) {
      let eventRef = eventsRef.doc(event.eventNoSqlId);

      let cleaned = {};
      for (let key of EVENT_KEYS) {
        cleaned[key] = event[key];
      }

      batch.set(eventRef, cleaned);
    }

    await batch.commit();
  });

export const render_event = functions.https.onRequest(
  async (request, response) => {
    functions.logger.info("Fetching event", { structuredData: true });
    functions.logger.log(request.body);
    functions.logger.log(request.query);
    functions.logger.write(request.body);
    console.log(request.body);

    // Renders and image of the event

    // gets the event id

    // does this using sharp if neccessary

    // gets the event data

    // renders the image using satori
  }
);

export const img = functions.https.onRequest(async (request, response) => {
  const fontFile = await fetch(
    "https://og-playground.vercel.app/inter-latin-ext-700-normal.woff"
  );
  const fontData: ArrayBuffer = await fontFile.arrayBuffer();

  functions.logger.info("Fetched log information", { structuredData: true });
  const options = {
    width: 200,
    height: 500,
    embedFont: false,
    fonts: [
      {
        name: "Inter Latin",
        style: "normal",
        data: fontData,
      },
    ],
  };

  const svg = await satori(
    {
      type: "div",
      props: {
        children: [
          "hello, world",
          {
            type: "img",
            props: {
              src: "https://raw.githubusercontent.com/vercel/satori/main/.github/card.png",
              width: 200,
              height: 500,
            },
          },
        ],
        style: { color: "black", display: "flex" },
      },
    },
    options as any
  );

  response.send(svg);
});
