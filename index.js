var express = require('express');
var bodyParser = require('body-parser');
var axios = require('axios');
var SparkPost = require('sparkpost');

var app = express();

app.set('port', process.env.PORT || 3000);
app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.send('Hello World');
});

var processRelayMessage = function(data) {
  console.log('Email received from: ', data.msg_from);
  console.log('Searching for: ', data.content.subject);
  axios.get('http://api.giphy.com/v1/gifs/search', {
    params: {
      api_key: 'dc6zaTOxFJmzC',
      q: data.content.subject,
      rating: 'pg',
      limit: 5
    }
  }).then(function(response) {
    return response.data.data;
  }).then(function(data) {
    var gifs = []
    for(var i=0; i<data.length; i++) {
      gifs.push({
        src: data[i].images.fixed_height_small.url,
        url: data[i].url
      });
    }
    return gifs;
  }).then(function(gifs) {
    var client = new SparkPost();
    client.transmissions.send({
      transmissionBody: {
        campaignId: 'giphy-responder',
        content: {
          template_id: 'giphy-responder'
        },
        substitution_data: {
          search: data.content.subject,
          gifs: gifs
        },
        recipients: [{ address: { email: data.msg_from } }]
      }
    }, function(err, res) {
      if (err) {
        console.log(err);
      } else {
        console.log('Giphy Response sent to: ', data.msg_from);
      }
    });
  }).catch(function(err) {
    console.log(err);
  });
};

app.post('/incoming', function(req, res) {
  res.sendStatus(200);
  var batch = req.body;
  for(var i=0; i<batch.length; i++) {
    processRelayMessage(batch[i].msys.relay_message);
  }
});

app.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
