const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(express.json());
app.use(bodyParser.json());

// STEP ONE: GETTING THE BEARER TOKEN FROM VERTAFORE

app.get("/get-token", getToken);

async function getToken(req, res) {
  try {
    const tokenEndpoint = "https://api.uat.titan.v4af.com/auth/v1/token";
    const user = "InsurTechAPI";
    const VID = "3224063";
    const SC = "86265d5ebb5946ddb2e427781369593f";

    const credentials = {
      username: user,
      password: SC,
    };

    const response = await axios.post(tokenEndpoint, credentials);
    const data = {
      requestId: response.data.requestId,
      traceId: response.data.traceId,
      spanId: response.data.spanId,
      token: response.data.content.accessToken,
      tokenType: response.data.content.tokenType,
      expiresIn: response.data.content.expiresIn,
    };
    console.table(data);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error getting bearer token:", error);
    res.status(500).json({ error: "Failed to get bearer token" });
  }
}

// STEP TWO: SETTING UP THE WEBHOOK ENDPOINT

app.post("/webhook", handleWebhook);

async function handleWebhook(req, res) {
  try {
    const webhookData = req.body;

    console.log("Received webhook data:", webhookData);

    // const data = {
    //   first_name: webhookData.first_name,
    //   last_name: webhookData.last_name,
    //   address: webhookData.address,
    //   city: webhookData.city,
    //   state: webhookData.state,
    //   zip: webhookData.zipcode,
    // };

    // STEP THREE: SENDING DATA TO VERTAFORE
    //const response = await sendToPlRater(webhookData);

    //console.log("Response from Vertafore:", response.data);
    
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
}

// STEP THREE: SENDING DATA TO VERTAFORE

// async function sendToPlRater(webhookData) {
//   const productId = "";
//   const tenantId = "";
//   const entityId = "";

//   const vertaforeEndpoint = `https://api.apps.vertafore.com/rating/v1/${productId}/${tenantId}/entities/${entityId}/submit/import`;

//   // Make a POST request to Vertafore API using axios
//   const response = await axios.post(vertaforeEndpoint, webhookData);
//   return response;
// }

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
