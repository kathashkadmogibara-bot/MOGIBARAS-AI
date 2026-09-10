const {
  onRequest
} = require("firebase-functions/v2/https");


const {
  defineSecret
} = require("firebase-functions/params");


const admin =
  require("firebase-admin");


const {
  GoogleGenAI
} =
  require("@google/genai");



/* =====================================================
   FIREBASE ADMIN
===================================================== */

admin.initializeApp();



/* =====================================================
   GEMINI SECRET
===================================================== */

/*
   The Gemini API key is stored in
   Firebase / Google Secret Manager.

   It is NEVER placed in app.js.
*/

const geminiApiKey =
  defineSecret(
    "GEMINI_API_KEY"
  );



/* =====================================================
   PRO AI
===================================================== */

exports.proChat =
  onRequest(

    {
      region:
        "us-central1",

      secrets:
        [geminiApiKey],

      timeoutSeconds:
        60,

      memory:
        "256MiB"
    },


    async (
      req,
      res
    ) => {

      /* ================================================
         CORS
      ================================================ */

      res.set(
        "Access-Control-Allow-Origin",
        "*"
      );


      res.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );


      res.set(
        "Access-Control-Allow-Methods",
        "POST, OPTIONS"
      );


      if (
        req.method ===
        "OPTIONS"
      ) {

        res.status(204).send("");

        return;
      }



      /* ================================================
         ONLY POST
      ================================================ */

      if (
        req.method !==
        "POST"
      ) {

        res.status(405).json({

          error:
            "Only POST requests are allowed."

        });

        return;
      }



      /* ================================================
         FIREBASE AUTH TOKEN
      ================================================ */

      try {

        const authorization =
          req.headers.authorization;


        if (
          !authorization ||
          !authorization.startsWith(
            "Bearer "
          )
        ) {

          res.status(401).json({

            error:
              "Login required."

          });

          return;
        }


        const idToken =
          authorization.substring(
            7
          );


        /*
           Verify the Firebase user.

           This prevents unauthenticated visitors
           from directly using your Gemini backend.
        */

        const decodedToken =
          await admin
            .auth()
            .verifyIdToken(
              idToken
            );


        console.log(
          "PRO AI request from:",
          decodedToken.uid
        );


      } catch (error) {

        console.error(
          "Authentication error:",
          error
        );


        res.status(401).json({

          error:
            "Invalid or expired login."

        });

        return;
      }



      /* ================================================
         REQUEST DATA
      ================================================ */

      const body =
        req.body || {};


      const message =
        typeof body.message ===
        "string"
          ? body.message.trim()
          : "";


      const history =
        Array.isArray(
          body.history
        )
          ? body.history
          : [];


      if (!message) {

        res.status(400).json({

          error:
            "Message is required."

        });

        return;
      }



      /*
         Limit message size.

         This prevents huge requests.
      */

      if (
        message.length >
        4000
      ) {

        res.status(400).json({

          error:
            "Message is too long."

        });

        return;
      }



      /* ================================================
         CLEAN HISTORY
      ================================================ */

      const cleanHistory =
        history
          .slice(-20)
          .filter(
            item => {

              return (
                item &&
                (
                  item.role ===
                  "user" ||

                  item.role ===
                  "model"
                ) &&

                typeof item.text ===
                "string"
              );

            }
          )
          .map(
            item => {

              return {

                role:
                  item.role,

                parts: [

                  {
                    text:
                      item.text
                  }

                ]

              };

            }
          );



      /*
         Remove duplicate final user message.

         The frontend sends the current message
         both in history and as message.
      */

      if (
        cleanHistory.length > 0
      ) {

        const last =
          cleanHistory[
            cleanHistory.length - 1
          ];


        if (
          last.role === "user" &&
          last.parts[0].text === message
        ) {

          cleanHistory.pop();

        }

      }



      /* ================================================
         GEMINI
      ================================================ */

      try {

        const ai =
          new GoogleGenAI({

            apiKey:
              geminiApiKey.value()

          });


        /*
           Gemini model.

           The Gemini API uses generateContent
           for text generation and multi-turn
           conversation content.
        */

        const response =
          await ai.models.generateContent({

            model:
              "gemini-3.7-flash",


            contents:
              [

                ...cleanHistory,

                {

                  role:
                    "user",

                  parts: [

                    {
                      text:
                        message
                    }

                  ]

                }

              ],


            config: {

              systemInstruction: {

                parts: [

                  {

                    text:
`You are Mogibara-AI PRO.

You are a helpful, friendly AI assistant.

Give clear and useful answers.

Keep explanations understandable.

Do not pretend to have access to information
you do not actually have.

If the user asks about programming,
help them with safe and educational coding.

The website is called Mogibara-AI.`

                  }

                ]

              },


              temperature:
                0.7,


              maxOutputTokens:
                2048

            }

          });


        const reply =
          response.text ||
          "I could not generate a response.";


        console.log(
          "Gemini response generated."
        );


        res.status(200).json({

          reply:
            reply

        });


      } catch (error) {

        console.error(
          "Gemini API error:",
          error
        );


        res.status(500).json({

          error:
            "Gemini AI failed to generate a response."

        });

      }

    }

  );
