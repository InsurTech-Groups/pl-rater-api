const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(express.json());
app.use(bodyParser.json());

//! STEP ONE: GETTING THE BEARER TOKEN FROM VERTAFORE




async function getToken(req, res) {
  try {

    //! TOKEN URL FOR PRODUCTION:
    //https://api.apps.vertafore.com/auth/v1/token
    
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
    console.table(data);
    res.status(200).json(data);
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
    }

    //! STEP THREE: SENDING DATA TO VERTAFORE
    const response = await sendToPlRater(webhookData);
    app.get("/get-token", getToken);

    //console.log("Response from Vertafore:", response.data);
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
}

//! STEP THREE: SENDING DATA TO VERTAFORE

async function sendToPlRater(webhookData) {
  const productId = "RATING-API";
  const tenantId = "3224063";
  const entityId = "3224063";

  const vertaforeEndpoint = `https://api.apps.vertafore.com/rating/v1/${productId}/${tenantId}/entities/${entityId}/submit/import`;

  const feedIntoVertafore = {
    "correlationId": "string",
    "product": "string",
    "unRatedLead": {
      "businessType": "New Business",
      "clientType": "Prospect",
      "creditCheckAuth": true,
      "isPreview": true,
      "lineOfBusiness": "ACCIDENT",
      "mockRating": {
        "enabled": true,
        "depth": "CarrierKnockout",
        "delaySeconds": 0
      },
      "partnerID": 0,
      "producer": {
        "agency": {
          "address": {
            "country": "US",
            "formattedAddress": "123 S Fake St, Nashville, TN, 12345",
            "isPreferred": true,
            "locality": "Nashville",
            "monthsAtAddress": 0,
            "postalCode": 12345,
            "preferred": true,
            "region": "TENNESSEE",
            "sameAsMailing": true,
            "skipVerification": true,
            "streetAddress": "123 Fake St",
            "streetAddress2": "Apt B",
            "streetAddress3": "string",
            "streetAddress4": "string",
            "subRegion": "string",
            "type": "MAILING",
            "verifiedAddress": true
          },
          "emailAddress": {
            "preferred": true,
            "type": "WORK",
            "value": "some@some.com"
          },
          "fax": {
            "canReceiveFax": true,
            "canReceiveText": true,
            "countryCode": "string",
            "extension": "string",
            "phoneNumber": "string",
            "preferred": true,
            "type": "HOME"
          },
          "name": "string",
          "phoneNumber": {
            "canReceiveFax": true,
            "canReceiveText": true,
            "countryCode": "string",
            "extension": "string",
            "phoneNumber": "string",
            "preferred": true,
            "type": "HOME"
          },
          "ratingAgencyId": 0,
          "webAddress": "http://www.someagency.com"
        },
        "emailAddress": {
          "preferred": true,
          "type": "WORK",
          "value": "some@some.com"
        },
        "name": {
          "familyName": "string",
          "formattedName": "Ms. Barbara Jane Jensen, III",
          "givenName": "string",
          "honorificPrefix": "string",
          "honorificSuffix": "string",
          "middleName": "string",
          "preferredName": "string"
        },
        "phoneNumbers": [
          {
            "canReceiveFax": true,
            "canReceiveText": true,
            "countryCode": "string",
            "extension": "string",
            "phoneNumber": "string",
            "preferred": true,
            "type": "HOME"
          }
        ]
      },
      "quoteDate": "2023-06-09",
      "quoteDescription": "string",
      "ratingUnits": [
        {
          "additionalInfo": "string",
          "personalPackageAdditionalInfo": [
            {
              "additionalInfo": "string",
              "agencyCode": "string",
              "lineOfBusiness": "PERSONAL_AUTO",
              "password": "string",
              "quoteNumber": "string",
              "ratingCompanyId": "string",
              "userId": "string"
            }
          ],
          "ratingUnitId": "string",
          "state": "ALABAMA",
          "ratingCompanyId": "string",
          "companyName": "string",
          "lineOfBusiness": "PERSONAL_AUTO",
          "userId": "string",
          "password": "string",
          "agencyCode": "string",
          "quoteNumber": "string"
        }
      ],
      "state": "ALABAMA"
    }
  }

  // Make a POST request to Vertafore API using axios
  const response = await axios.post(vertaforeEndpoint, webhookData);
  return response;
}

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
