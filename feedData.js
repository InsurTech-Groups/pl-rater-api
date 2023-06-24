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

    // add data into mainData object
    mainData.requestId = data.requestId;
    mainData.traceId = data.traceId;
    mainData.spanId = data.spanId;
    mainData.token = data.token;
    mainData.tokenType = data.tokenType;
    mainData.expiresIn = data.expiresIn;

    res.status(200).json(response.data);

    //return the token to the sendToPlRater function
    return response.data;
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
      firstName: webhookData.first_name,
      lastName: webhookData.last_name,
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
    const response = await sendToPlRater(data, req, res);
    //const response = await updateRicoLead(data);

    //console.log("Response from Vertafore:", response.data);
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
}

async function sendToPlRater(data, req, res) {
  const productId = "RATING-API";
  const tenantId = "3224063";
  const entityId = "3224063";

  //run get token and get the return data
  const token = await getToken(req, res);

  const mainData = {
    "unRatedLead": {
      "applicationId": "VERTAFORE",
      "lineOfBusiness": "PERSONAL_AUTO",
      "partnerID": 3224063-1,
      "leadSource": "leadSource",
      "policy": {
          "policyLob": "PERSONAL_AUTO",
          "namedInsureds": [
              {
                  "id": 1,
                  "name": {
                      "familyName": data.lastName,
                      "givenName": data.firstName
                  },
                  "relationshipToInsured": "SELF",
                  "addresses": [
                      {
                          "streetAddress": data.address,
                          "locality": data.city,
                          "region": data.state,
                          "postalCode": data.zip_code
                      }
                  ]
              }
          ],
          "vehicles": []
      },
      "state": data.state
  }
  };

  const accessToken = token.data.content.accessToken;


  const vertaforeEndpoint = `https://api.apps.vertafore.com/rating/v1/${productId}/${tenantId}/entities/${entityId}/submit/import`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
  }
  
  try {

    const response = await axios.post(vertaforeEndpoint, mainData, { headers });
    console.log("Response from Vertafore:", response.data);
    return response.data;
    
  } catch (error) {
    console.error("Error sending data to Vertafore:", error);
    throw new Error("Failed to send data to Vertafore");
  }
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


/*

git add -A

git commit -m "updates"

git push origin main

git push heroku main


*/ 