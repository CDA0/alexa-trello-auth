const path = require('path');
const express = require('express');
const session = require('express-session');
const OAuth = require('oauth').OAuth;

const requestURL = "https://trello.com/1/OAuthGetRequestToken";
const accessURL = "https://trello.com/1/OAuthGetAccessToken";
const authorizeURL = "https://trello.com/1/OAuthAuthorizeToken";
const appName = "Alexa Trello";
const key = process.env.TRELLO_KEY;
const secret = process.env.TRELLO_SECRET;

const loginCallback = "https://alexa-trello-auth.herokuapp.com/oauth/callback";

const oauth = new OAuth(requestURL, accessURL, key, secret, "1.0", loginCallback, "HMAC-SHA1");

const app = express();

app.set('port', process.env.PORT || 3000);

app.set('trust proxy', 1);
app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}));

app.get('/', (req, res) => res.sendFile(path.join(__dirname+'/public/app.html')));

app.get('/policy', (req, res) => res.sendFile(path.join(__dirname+'/public/privacy-policy.html')));

app.get('/oauth/request_token', (req, res) => {
  const sess = req.session;
  sess.state = req.query.state;
  sess.clientId = req.query.client_id;
  sess.redirectUri = req.query.redirect_uri;
  oauth.getOAuthRequestToken((error, token, tokenSecret, results) => {
    sess.token = token;
    sess.tokenSecret = tokenSecret;
    res.redirect(`${authorizeURL}?oauth_token=${token}&name=${appName}&expiration=never`)
  });
});

app.get('/oauth/callback', (req, res) => {
  const sess = req.session;
  const { oauth_token: token, oauth_verifier: verifier } = req.query;
  oauth.getOAuthAccessToken(token,
                            sess.tokenSecret,
                            verifier,
                            (error, accessToken, accessTokenSecret, results) => {
    let url = `${sess.redirectUri}`;
    url += `#state=${sess.state}`;
    url += `&access_token=${accessToken}`;
    url += `&token_type=Bearer`;
    res.redirect(url);
  });
});

app.listen(app.get('port'), () => {
  console.log(`Example app listening on port ${app.get('port')}!`)
});