const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

//! STEP ONE: GETTING THE BEARER TOKEN FROM VERTAFORE

app.get("/get-token", getToken);

const mainData = {};

async function getToken(req, res) {
  try {
    //! Token URL for DEV
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
    console.log(data);
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error getting bearer token:", error);
    res.status(500).json({ error: "Failed to get bearer token" });
  }
}

//! STEP TWO: SETTING UP THE WEBHOOK ENDPOINT

app.post("/webhook", handleWebhook);

async function handleWebhook(req, res) {
  try {
    const webhookData = req.body;

    console.log("Received webhook data:", webhookData);

    const data = {
      firstName: webhookData.firstName,
      lastName: webhookData.lastName,
      email: webhookData.email,
      phone: webhookData.phone,
      address: webhookData.address,
      city: webhookData.city,
      state: webhookData.state,
      dob: webhookData.dob,
      zip_code: webhookData.zip_code,
      lead_id: webhookData.lead_id,
    };

    mainData.rico_id = webhookData.lead_id;

    //! STEP THREE: SENDING DATA TO VERTAFORE
    //const response = await sendToPlRater(data);
    const response = await updateRicoLead(data);

    //console.log("Response from Vertafore:", response.data);
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
}


//! Step Four: Sending Data to RICO with updated Data

async function updateRicoLead() {
  const leadId = mainData.rico_id;
  const field = "pl_rater_link";
  const ricoToken = "ea527c772f0fe84238e916ff02f32ae8";

  const ricoEndpoint = `https://private-anon-4aa20412a2-ricochet.apiary-mock.com/api/v4/leads/externalupdate`;

  const ricoData = {
    token: ricoToken,
    stc_id: leadId,
    pl_rater_link: field,
  };

  console.log("Ricochet Data Sending:", ricoData)

  try {
    const response = await axios.post(ricoEndpoint, ricoData);
    console.log("Response from Ricochet:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error:", error.response.data);
    throw error;
  }


  console.log("Response from Ricochet:", response.data);
  return response;
}

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
