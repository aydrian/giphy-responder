'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios')
const SparkPost = require('sparkpost')

const app = express()

app.set('port', process.env.PORT || 3000)
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send('Hello World')
})

/**
  Takes a Giphy API response and returns only the data
  we need in a format the template expects
**/
const processGiphyResults = function (response) {
  const data = response.data.data
  let gifs = []
  for (let i = 0; i < data.length; i++) {
    gifs.push({
      src: data[i].images.fixed_height_small.url,
      url: data[i].url
    })
  }
  return gifs
}

/**
  Takes data from the relay_message event and Giphy API response and sends
  an email response back to the sender
**/
const sendResponse = function (data) {
  // The API Key in the SPARKPOST_API_KEY enviroment variable will be used
  // to create the client
  const client = new SparkPost()
  client.transmissions.send({
    transmissionBody: {
      campaignId: 'giphy-responder',
      content: {
        template_id: 'giphy-responder'
      },
      substitution_data: {
        search: data.content.subject,
        gifs: data.gifs
      },
      recipients: [{ address: { email: data.msg_from } }]
    }
  }, function (err, res) {
    if (err) {
      console.log(err)
    } else {
      console.log('Giphy Response sent to: ', data.msg_from)
    }
  })
}

/**
  Process a single relay_message event
  The following support article describes the relay_message event object
  https://support.sparkpost.com/customer/portal/articles/2039614
**/
const processRelayMessage = function (data) {
  console.log('Email received from: ', data.msg_from)
  console.log('Searching for: ', data.content.subject)
  // We start by using the Giphy API to search for gifs based on the subject
  axios.get('http://api.giphy.com/v1/gifs/search', {
    params: {
      api_key: 'dc6zaTOxFJmzC',
      q: data.content.subject,
      rating: 'pg', // Let's keep it classy :)
      limit: 5 // This can be modified, the template can handle it
    }
  })
  .then(processGiphyResults)
  .then(gifs => {
    // Add the array of gifs to the data so it can be passed on to sendResponse
    data.gifs = gifs
    return data
  })
  .then(sendResponse)
  .catch(err => {
    console.log(err)
  })
}

/**
  Defines the endpoint that will accept batches from SparkPost
**/
app.post('/incoming', (req, res) => {
  // SparkPost expects a 200 response, send it before processing data
  // If you are storing data, do it before returning a response
  res.sendStatus(200)
  const batch = req.body
  // A batch could contain up to 10,000 events
  for (let i = 0; i < batch.length; i++) {
    // For this application, we can safely assume the batch will only
    // contain relay_message events
    processRelayMessage(batch[i].msys.relay_message)
  }
})

app.listen(app.get('port'), () => {
  console.log('Express server listening on port ' + app.get('port'))
})
