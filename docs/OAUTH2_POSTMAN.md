# OAuth2 test with Google and Postman

Goal of the TP (section 8): get an access token from an OAuth2 provider, send it to a
protected endpoint, and check that a valid token is accepted and a missing or invalid one
returns 401. The provider here is Google, flow = OpenID Connect, Authorization Code with PKCE.

How the API accepts it: `middleware/auth.js` first tries to verify the token as our own JWT.
If that fails, it asks `https://oauth2.googleapis.com/tokeninfo` whether it is a Google access
token whose audience is our `GOOGLE_CLIENT_ID`. This only works when `GOOGLE_CLIENT_ID` is set in `.env`.

## 1. Get Google credentials (Google Cloud Console)

Menu names change from time to time; the ideas stay the same.

1. Go to console.cloud.google.com and create a project (for example `dix-maillots`).
2. Configure the OAuth consent screen (called "Google Auth Platform" in the newer console):
   app name, your email, audience **External**. While the app is in Testing mode, add your own
   Google account as a **test user**, otherwise Google blocks the login.
3. Create an OAuth client: type **Web application**.
4. Under **Authorized redirect URIs** add exactly: `https://oauth.pstmn.io/v1/browser-callback`
   (the URL used by Postman desktop with "Authorize using browser").
5. Copy the **Client ID** and **Client secret**.
6. Put the Client ID in `.env` as `GOOGLE_CLIENT_ID=...` and restart the API.

## 2. Configure Postman

Create a request `POST http://localhost:3000/api/products` with a JSON body (see README), then open
the **Authorization** tab, choose **OAuth 2.0**, and fill **Configure New Token**:

| Field | Value |
| --- | --- |
| Grant type | Authorization Code (With PKCE) |
| Authorize using browser | checked (Postman desktop app only) |
| Callback URL | `https://oauth.pstmn.io/v1/browser-callback` (must match Google exactly) |
| Auth URL | `https://accounts.google.com/o/oauth2/v2/auth` |
| Access Token URL | `https://oauth2.googleapis.com/token` |
| Client ID | your Client ID |
| Client Secret | your Client secret (Google web clients still require it) |
| Code Challenge Method | SHA-256 |
| Scope | `openid email profile` |
| Client Authentication | Send client credentials in body |

Click **Get New Access Token**, log in with the Google test account, accept, then **Use Token**.
Postman sends `Authorization: Bearer <ACCESS_TOKEN>`.

## 3. What to screenshot

1. The OAuth 2.0 configuration and the received token (hide the client secret).
2. `POST /api/products` with the Google token: **201 Created**.
3. Same request with no token: **401**.
4. Same request with a modified token (change a few characters): **401**.

Thunder Client also has an OAuth 2 tab (callback `https://www.thunderclient.com/oauth/callback`,
which must also be registered in Google), but its documentation does not mention PKCE, so Postman
is the safer choice for this part.

## Do not commit

The Client secret and tokens are secrets: keep them out of GitHub and out of screenshots.
