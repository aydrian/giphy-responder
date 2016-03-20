<a href="https://developers.sparkpost.com"><img src="https://www.sparkpost.com/sites/default/files/attachments/SparkPost_Logo_2-Color_Gray-Orange_RGB.svg" width="200px"/></a>

# Giphy Responder

This application will utilize [SparkPost][1] to respond
to an email with trending gifs using the [Giphy API](https://github.com/Giphy/GiphyAPI)
based on the subject line.

## Setup

Before you can use this application, you must have a SparkPost Account. You will also need to configure a Template, Sending Domain, Inbound Domain, and Relay Webhook. You will also need to have a domain name and access to modify it's TXT and MX DNS records.

### Sign up for a Free SparkPost Account.
[SparkPost][1] will allow you to send up to 100,000 emails a month for free. You can either [Sign-up Here][2] or use the [SparkPost Heroku Add-On][3]. If you are using Heroku, I recommend watching the [How To Use the SparkPost Heroku Add-On](https://developers.sparkpost.com/videos/heroku_addon.html) video.

### Create an API Key
In order to interact with the [SparkPost API](https://developers.sparkpost.com/api), we will need to create an API Key with the following access:
- Inbound Domain: Read/Write
- Relay Webhooks: Read/Write
- Templates: Read/Write
- Transmissions: Read/Write

Create an API Key by navigating to [Account/API Keys](https://app.sparkpost.com/account/credentials). Save your key somewhere safe, because that is the only time you'll be able to see it.

If you are using the [SparkPost Heroku Add-On][3], your API Key was created for you automatically. You can retreive it by running `heroku config:get SPARKPOST_API_KEY` in the [Heroku Toolbelt][4].

If you are using something like [autoenv](https://github.com/kennethreitz/autoenv), go ahead and add `export SPARKPOST_API_KEY=<YOUR_API_KEY>` to your `.env` file. The [SparkPost Client Libraries][5] are setup to use this environment variable. Storing your API Key in an enviroment variable helps to prevent you from exposing it in your github repo. Just make sure to add your `.env` file to your `.gitignore`.

### Configure your Sending Domain
Follow the instructions on first login to set up your sending domain. Alternately, you can access this in [Sending Domains](https://app.sparkpost.com/account/sending-domains).

If you are using the [SparkPost Heroku Add-On][3], you can access the SparkPost Dashboard by entering `heroku addons:open sparkpost` in the [Heroku Toolbelt][4] and then navigate to Account > Sending Domains.

For best inbox placement, it is recommended that you setup both SPF & DKIM by adding 2 TXT records to your domain's DNS. Once the SPF & DKIM are verified, your domain is ready for sending.

For more information, see the [SparkPost API Documentation for Sending Domains](https://developers.sparkpost.com/api/#/reference/sending-domains)

### Configure your Inbound Domain
Decide what your Inbound Domain will be. It should be a subdomain off your sending domain. For this application, I am going to use `sup.aydrian.me`. For the rest of this README, substitute your domain for it.

#### DNS Changes
Add the following MX records to your DNS

Name | Type | Data | Priority
---- | ---- | ---- | --------
`sup.aydrian.me` | MX | rx1.sparkpostmail.com | 10
`sup.aydrian.me` | MX | rx2.sparkpostmail.com | 10
`sup.aydrian.me` | MX | rx3.sparkpostmail.com | 10

_**Note:** Every DNS Provider is different, some only require the subdomain for the Name_

#### Add to SparkPost
Once the MX records have been added, you'll need to add the Inbound Domain. Currently, there is no UI to manage Inbound Domains so we'll have to use the [SparkPost API](https://developers.sparkpost.com/api/). Run the following cURL command in your terminal. Be sure to substitute your API Key and inbound domain.

```
curl --include \
     --request POST \
     --header "Content-Type: application/json" \
     --header "Authorization: <YOUR_API_KEY>" \
     --data-binary "{
  \"domain\": \"sup.aydrian.me\"
}" \
'https://api.sparkpost.com/api/v1/inbound-domains'
```

For more information, see the [SparkPost API Documentation for Inbound Domains](https://developers.sparkpost.com/api/#/reference/inbound-domains)

### Configure your Relay Webhook
When [SparkPost][1] receives an email sent to `{anything}@sup.aydrian.me`, it will parse the message and `POST` a JSON object to the endpoint specified in the Relay Webhook for the `sup.aydrian.me` Inbound Domain. Currently, there is no UI to manage Relay Webhooks so we'll have to use the [SparkPost API](https://developers.sparkpost.com/api/). Run the following cURL command in your terminal. Be sure to substitute your API Key, inbound domain, and target. Where you are running this app will determine the domain for the target. You may choose to use [ngrok](https://ngrok.com/) and just run it locally.

```
curl --include \
     --request POST \
     --header "Content-Type: application/json" \
     --header "Authorization: <YOUR_API_KEY>" \
     --data-binary "{
  \"name\": \"Giphy Responder Webhook\",
  \"target\": \"https://15778980.ngrok.io/incoming\",
  \"auth_token\": \"\",
  \"match\":
    {
      \"protocol\": \"SMTP\",
      \"domain\": \"sup.aydrian.me\"
    }
}" \
'https://api.sparkpost.com/api/v1/relay-webhooks'
```

For more information, see the [SparkPost API Documentation for Relay Webhooks](https://developers.sparkpost.com/api/#/reference/relay-webhooks)

### Configure the Template
To make our live easier, we are going to use a [SparkPost][1] Template when triggering the response email back to the sender. You can create/modify templates using the [SparkPost Template UI](https://app.sparkpost.com/templates).

If you are using the [SparkPost Heroku Add-On][3], you can access the SparkPost Dashboard by entering `heroku addons:open sparkpost` in the [Heroku Toolbelt][4] and then navigate to Templates.

I have provided the following cURL to get you started. Before running it in the terminal, make sure to substitute your API Key and modify the from address to use your verified Sending Domain.

```
curl --include \
     --request POST \
     --header "Content-Type: application/json" \
     --header "Authorization: <YOUR_API_KEY>" \
     --data-binary "{
    \"id\" : \"giphy-responder\",
    \"name\" : \"Giphy Responder\",
    \"content\": {
        \"from\": \"gifs@aydrian.me\",
        \"subject\": \"Your {{ search }} gifs!\",
        \"html\": \"<b>TODO Add Template</b>\"
    }
}" \
'https://api.sparkpost.com/api/v1/templates'
```

For more information, see the [SparkPost API Documentation for Templates](https://developers.sparkpost.com/api/#/reference/templates)

[1]: https://www.sparkpost.com/
[2]: https://app.sparkpost.com/sign-up?src=Dev-Website&sfdcid=701600000011daf&_ga=1.204138960.1347218848.1425988764
[3]: https://elements.heroku.com/addons/sparkpost
[4]: https://toolbelt.heroku.com/
[5]: https://developers.sparkpost.com/
