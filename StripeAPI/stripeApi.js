const express = require('express')
const bodyParser = require('body-parser')
const stripe = require('stripe')('private_key')
const app = express()
const cors = require('cors')
app.use(cors())

app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (req, res)  => { 
    res.json({'text':'Hello api payment'})
})

app.post('/charge', async (req, res) => {
    try {
        let customerId;

        //GET the customer who's email id maches the one sent by the client
        await stripe.customers.list({
            email: req.body.email,
            limit: 1

        }).then(async response => {
            //checks if the customer exists, if not create a new customer
            if (response.data != ''){
                customerId = response.data[0].id;
            }
            else{
                await stripe.customers.create({
                    name : req.body.name,
                    email: req.body.email
                }).then(response => {
                    customerId = response.id
                });
            }
        });

        const ephemeralKey = await stripe.ephemeralKeys.create(
            { customer: customerId },
            { apiVersion: "2020-08-27" }
        );

        const paymentIntent = await stripe.paymentIntents.create({
            amount: parseInt(req.body.amount),
            currency: 'eur',
            customer: customerId,
            description : 'vod-mada subscription',
        });

        res.status(200).send({
            paymentIntent: paymentIntent.client_secret,
            ephemeralKey: ephemeralKey.secret,
            customer : customerId,
            success: true,
        })

    }
    catch (error){
        res.status(404).send({ success: false, error: error.message })
    }
})

const port = process.env.PORT || 3000

app.listen(port, () => console.log('Server is running on http://localhost:3000...'))