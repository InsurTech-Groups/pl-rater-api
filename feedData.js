/*
 API A (ITG Custom API):

API A should be set up to accept JSON requests.
Extract the necessary data from the JSON payload received by API A.
Prepare the data to be sent to API B (Vertafore API) for further processing.
Make a POST request to API B with the extracted data.
Handle the response received from API B, which will contain a URL if the data is correct.

*/

/*
API B (Vertafore API):

Before interacting with API B, you need to obtain a bearer token from the Auth Service token endpoint using your Titan credentials.
Send a POST request to the Auth Service token endpoint with your Titan credentials to retrieve the bearer token.
Include the bearer token in the authorization header of subsequent requests to API B.
Use the retrieved bearer token to send a POST request to API B's import endpoint with the required data extracted from API A.
API B will process the data and respond with a correlationId.
API C (Ricochete API):

*/

/*
After receiving the response from API B, extract the URL and other required data.
Make a POST request to API C with the extracted data to feed it into Ricochete.
*/

const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(express.json());
app.use(bodyParser.json());

//! STEP ONE:  GETTING THE BEARER TOKEN FROM VERTAFORE SO WE HAVE THAT SET UP INITIALLY BEFORE CODE RUNS

app.get("/get-token", getToken);

function getToken(req, res) {
  const tokenEndpoint = "https://api.uat.titan.v4af.com/auth/v1/token";
  const user = "InsurTechAPI";
  const VID = "3224063";
  const SC = "86265d5ebb5946ddb2e427781369593f";

  const credentials = {
    username: user,
    password: SC,
  };

  axios.post(tokenEndpoint, credentials).then((response) => {
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
  });
}

getToken();

//! End of STEP ONE, we now have the bearer token

//! STEP TWO: this is setting up an endpoint for the webjook to handle incoming requests

app.post("/webhook", handleWebhook);

function handleWebhook(req, res) {
  const webhookData = req.query;

  console.log("i got it", webhookData);

  const data = {
    first_name: webhookData.first_name,
    last_name: webhookData.last_name,
    address: webhookData.address,
    city: webhookData.city,
    state: webhookData.state,
    zip: webhookData.zipcode,
  };

  //! STEP THREE:  this is where we are going to call the function to send the data to Vertafore
  sendToPlRater(webhookData)
    .then((response) => {
      console.log("response from Vertafore", response);
      res.status(200).json(response);
    })
    .catch((error) => {
      console.log("error from Vertafore", error);
      res.status(500).json(error);
    });

}
//! End of STEP TWO

//! STEP THREE:  this is where we are going to make the POST request to Vertafore
function sendToPlRater(webhookData) {

  const productId = '';
  const tenantId = '';
  const entityId = '';

  const vertaforeEndpoint = `https://api.apps.vertafore.com/rating/v1/${productId}/${tenantId}/entities/${entityId}/submit/import`;


}

const port = 4000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
