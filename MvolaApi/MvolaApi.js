require('dotenv').config();
const { Client, SANDBOX_URL, TransactionRequest } = require("mvola");
const { v4 } = require("uuid");
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const cors = require('cors')
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/',(req, res)=> {
    res.send('Hello api mvola ' + process.env.CONSUMER_KEY);
})

app.post('/charge', async (req, res) =>  {
    const consumerKey = process.env.CONSUMER_KEY;
    const consumerSecret = process.env.CONSUMER_SECRET;
    const mvola = new Client(SANDBOX_URL);
    const data = await mvola.auth.generateToken(consumerKey, consumerSecret);
    const phone = req.body.phoneNumber;

    mvola.transaction.setAccessToken(data.access_token);
    mvola.transaction.setOptions({
        version: "1.0",
        correlationId: v4(),
        userLanguage: "FR",
        userAccountIdentifier: "msisdn;0343500003",
        partnerName: "vod-mada",
    });

    const transactionRef = v4();

    const tx = {
        amount: 300000,
        currency: "Ar",
        descriptionText: "vod-mada subscription",
        requestDate: new Date().toISOString(),
        debitParty: [
            {
                key: "msisdn",
                value: "0343500003",
            },
        ],
        creditParty: [
            {
                key: "msisdn",
                value: phone,
            },
        ],
        metadata: [
            {
                key: "partnerName",
                value: "TestMVola",
            },
            {
                key: "fc",
                value: "USD",
            },
            {
                key: "amountFc",
                value: "1",
            },
        ],
        requestingOrganisationTransactionReference: transactionRef,
        originalTransactionReference: transactionRef,
    };

    try{
        const response = await mvola.transaction.sendPayment(tx);
        res.status(200).send({
            'success': true,
            response
        })
    }
    catch(e){
        res.status(404).send({
            'success': false,
            'error':e
        })
    }

})

const port = process.env.PORT || 3000

app.listen(port,()=> {console.log('server start on http//localhost:3000')})