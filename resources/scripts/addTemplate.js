var SparkPost = require('sparkpost');
var fs = require('fs');
var TEMPLATE_HTML = fs.readFileSync(require.resolve('../template.html'), "utf8");

/***
  Update the following variables with your values
***/

var API_KEY = '';
var SENDING_DOMAIN = '' //e.g. aydrian.me

/***
  -----------------------------------------------
***/

var client = new SparkPost(API_KEY)
  , options = {
    template: {
      id: 'giphy-responder'
      , name: 'Giphy Responder'
      , description: 'Use with the giphy-responder application'
      , options: {
        open_tracking: true
        , click_tracking: true
        , transactional: true
      }
      , content: {
        from: 'giphy-responder@' + SENDING_DOMAIN
        , subject: 'Your {{ search }} gifs!'
        , html: TEMPLATE_HTML
      }
    }
  };

if (API_KEY && SENDING_DOMAIN) {
  client.templates.create(options, function(err, res) {
    if (err) {
      console.log(err);
    } else {
      console.log('Your Giphy Responder template has been successfully created.');
    }
  });
} else {
  console.log('Please update the API_KEY and SENDING_DOMAIN variables and try again.')
}
