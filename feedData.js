const express = require("express");
const axios = require("axios");
const Bugsnag = require('@bugsnag/js')
const BugsnagPluginExpress = require('@bugsnag/plugin-express')

Bugsnag.start({

  apiKey: 'a737263a4c55aeaf0eb5944f057647f1',
  plugins: [BugsnagPluginExpress]

})


const app = express();
const middleware = Bugsnag.getPlugin('express');
app.use(middleware.requestHandler);
app.use(express.json());
app.use(middleware.errorHandler)




mainData = {}


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
    const response = await sendToPlRater(data);

    //console.log("Response from Vertafore:", response.data);
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error processing webhook:", error);
    Bugsnag.notify(error, {
      request: req,
      response: res,
      webhookData: req.body,
      lead_id: mainData.rico_id,
    });

    res.status(500).json({ error: "Failed to process webhook" });
  }
}

async function sendToPlRater(data) {
  const productId = "RATING-API";
  const tenantId = "3224063";
  const entityId = "3224063";
  const partnerId = "3224063-1";

  // Run getToken separately to get the access token
  const tokenEndpoint = "https://api.uat.titan.v4af.com/auth/v1/token";
    const user = "InsurTechAPI";
    const VID = "3224063";
    const SC = "86265d5ebb5946ddb2e427781369593f";

    const credentials = {
      username: user,
      password: SC,
    };

  const response = await axios.post(tokenEndpoint, credentials);
  console.log("Response from Vertafore:", response.data)
  const accessToken = response.data.content.accessToken;

  console.log("Access token:", accessToken)

  const vertaforeData = {
    "unRatedLead": {
      "applicationId": "VERTAFORE",
      "lineOfBusiness": "PERSONAL_AUTO",
      "partnerID": partnerId,
      "leadSource": "leadSource",
     " policy": {
        "policyLob": "PERSONAL_AUTO",
        "namedInsureds": [
          {
            "id": 1,
            "name": {
              "familyName": data.lastName,
              "givenName": data.firstName,
            },
            "relationshipToInsured": "SELF",
            "addresses": [
              {
                "streetAddress": data.address,
                "locality": data.city,
                "region": data.state,
                "postalCode": data.zip_code,
              },
            ],
          },
        ],
        "vehicles": [],
      },
      "state": data.state,
    },
  };

  

  const vertaforeEndpoint = `https://api.apps.vertafore.com/rating/v1/${productId}/${tenantId}/entities/${entityId}/submit/import`;
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
  };

  try {

    const response = await axios.post(vertaforeEndpoint, vertaforeData, { headers });
    console.log("Response from Vertafore:", response.data);

  
    if(response.status !== 200) {
      console.log("Vertafore data failed to send");

      Bugsnag.notify(error, {
        data: vertaforeData,
        headers: headers,
      });
      throw new Error("Failed to send data to Vertafore");
      
    }

    updateRicoLead();
  } catch (error) {
    console.error("Error sending data to Vertafore:", error);
    Bugsnag.notify(error, {
      data: vertaforeData,
      headers: headers,
    });
    throw new Error("Failed to send data to Vertafore", error);
  }
}

async function updateRicoLead() {
  const leadId = mainData.rico_id;
  const field = "pl_rater_link";
  const ricoToken = "7906ed0b1d70d1d0b2b3a03366aeb763bV247H6YBhzgO8YCiClakkhKJPIu";

  const ricoEndpoint = `https://r2.ricochet.me/api/v4/leads/externalupdate`;

  const ricoData = {
    'token':  `${ricoToken}`,
    'stc_id': leadId,
    'pl_rater_link': field,
  };

  console.log("Ricochet Data Sending:", ricoData)

  try {
    const response = await axios.post(ricoEndpoint, ricoData);
    console.log("Response from Ricochet:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error:", error.response.data);
    Bugsnag.notify(error, {
      data: ricoData,
      endpoint: ricoEndpoint,
    });
    throw error;
  }

}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
