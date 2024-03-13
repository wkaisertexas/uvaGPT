# UVA GPT
Providing 📕 course, 🧢 club, 🧪 research and 🎉 event information to UVA students.

---

The main script is the [index.ts](functions/src/index.ts) which contains the code to interface with the custom gpt model.

If you have a ChatGPT plus account, you can check it out here: [Cavalier Grounds Guide](https://chat.openai.com/g/g-VRCbAJpST-cavalier-grounds-guide)

## Design and Learnings

I had previously took an existing, complicated API with many required paramters. I had limited success as the model was always inconsistent to call this function with default values. So, wrapping API calls in streamlined cloud function can make them far more palleteable for the Custom GPT.

## Talking the Same Language

Custom GPTs use the [OpenAPI](https://www.openapis.org/) standard to describe inputs and outputs. GPT-4 was used to generate this standard and connect it with the custom gpt.

<img width="655" alt="Screenshot 2024-03-13 at 4 48 04 PM" src="https://github.com/wkaisertexas/uvaGPT/assets/27795014/b6508e4c-ed0a-498b-af2b-c1239ffe2c6c">
<img width="650" alt="Screenshot 2024-03-13 at 4 48 08 PM" src="https://github.com/wkaisertexas/uvaGPT/assets/27795014/838540d6-1d56-44b1-adb9-489b9532e2c2">
<img width="1280" alt="Screenshot 2024-03-13 at 4 47 58 PM" src="https://github.com/wkaisertexas/uvaGPT/assets/27795014/ebb6f8f1-cce8-430b-979c-eb27374ef6b8">

## Video Demo

Quick demo showing pinecone-powered semantic search of courses.

https://github.com/wkaisertexas/uvaGPT/assets/27795014/b88425dd-06a9-40b0-944f-1b3ad7e7c8f0

## Standard Reference

```yaml
openapi: "3.0.0"
info:
  title: UVA GPT API
  version: 1.0.0
  description: API for accessing domain-specific features for the University of Virginia (UVA) using GPT.
  license:
    name: MIT
servers:
  - url: https://us-central1-uvagpt.cloudfunctions.net

paths:
  /search_classes:
    post:
      summary: Search for classes
      description: |
        Allows searching for classes at the University of Virginia based on a query.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                query:
                  type: string
                  description: The search query.
      responses:
        '200':
          description: A list of classes matching the query.
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    title:
                      type: string
                      description: The title of the class.
                    description:
                      type: string
                      description: The description of the class.
                    score:
                      type: number
                      description: The score of the class match.
                    avg_rating:
                      type: number
                      description: The average rating of the class.
                    url:
                      type: string
                      format: uri
                      description: The URL of the class information.
                    ref:
                      type: string
                      description: The reference of the class.
  /search_clubs:
    post:
      summary: Search for clubs
      description: |
        Allows searching for clubs at the University of Virginia based on a query.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                query:
                  type: string
                  description: The search query.
      responses:
        '200':
          description: A list of clubs matching the query.
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                  memberCount:
                    type: integer
                    description: The number of members in the club.
                  regularMeetingLocation:
                    type: string
                    description: The regular meeting location of the club.
                  description:
                    type: string
                    description: The description of the club.
                  regularMeetingTime:
                    type: string
                    description: The regular meeting time of the club.
                   name:
                    type: string
                    description: The name of the club.
                  categories:
                    type: array
                    items:
                      type: string
                      description: The categories of the club.
                  cover:
                    type: string
                    description: The cover of the club.
                  photo:
                    type: string
                    description: The photo of the club.
                  url:
                    type: string
                    format: uri
                    description: The URL of the club information.
                  score:
                    type: number
                    description: The score of the club match.
  /find_professors:
    post:
      summary: Find professors
      description: |
        Allows finding professors at the University of Virginia based on a query.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                query:
                  type: string
                  description: The search query.
      responses:
        '200':
          description: A list of professors matching the query.
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    name:
                      type: string
                      description: The name of the professor.
                    credentials:
                      type: string
                      description: The credentials of the professor.
                    title:
                      type: string
                      description: The title of the professor.
                    headshot:
                      type: string
                      description: The URL of the professor's headshot.
                    bio:
                      type: string
                      description: The biography of the professor.
                    googleScholar:
                      type: string
                      description: The Google Scholar profile link of the professor.
                    email:
                      type: string
                      format: email
                      description: The email address of the professor.
                    score:
                      type: number
                      description: The score of the professor match.

  /get_upcoming_events:
    get:
      summary: Get upcoming events
      description: |
        Retrieve a list of upcoming events at the University of Virginia.
      responses:
        '200':
          description: A list of upcoming events.
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    name:
                      type: string
                      description: The name of the event.
                    date:
                      type: string
                      format: date-time
                      description: The date and time of the event.
                    organizationName:
                      type: string
                      description: The name of the organization hosting the event.
                    startDateTimeUtc:
                      type: string
                      format: date-time
                      description: The start date and time of the event in UTC.
                    endDateTimeUtc:
                      type: string
                      format: date-time
                      description: The end date and time of the event in UTC.
                    description:
                      type: string
                      description: The description of the event.
                    location:
                      type: string
                      description: The location of the event.
                    org_url:
                      type: string
                      format: uri
                      description: The URL of the organization hosting the event.
                    photo:
                      type: string
                      format: uri
                      description: The URL of the event photo.
```
