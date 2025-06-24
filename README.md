# DrawMeTwitchReward
This is a fun project for Twitch streamers. This is a reward where viewers can draw on your stream for 3 minutes. You will need node.js, python 3.10 and up, streamer.bot and Lioranboard.

First, you will need to create the reward on Twitch, then you will need to setup the action to put an overlay to draw in your stream, this overlay on your stream is where viewers will draw. 
In my case, to handle this I use OBS and Lioranboard. Since this is only to share the code, I am not going to explain how to handle change scene, or adding overlay with OBS and Lioranboard, but you 
can use this Youtube video as reference on how to do it (I used this video) https://www.youtube.com/watch?v=yNQHXqCJYtQ&list=WL&index=87

Now, on your server you will need to install some dependencies. Just run through terminal in the server:

npm init -y

npm install express socket.io axios express-session dotenv


Then Create a Twitch Developer App

Go to: https://dev.twitch.tv/console/apps

Name: anything

OAuth Redirect URL: http://localhost:3000/auth/twitch/callback (or your domain)

Category: Website Integration

Copy your Client ID and Client Secret, and then paste those values in process.env file

in file server.js you will need to modify:

  key: fs.readFileSync('/etc/letsencrypt/live/YOURWEBPAGEPATHFORSSLCERT/privkey.pem'), //PUT THE LOCATION OF THE PRIVKEY OF YOUR SSL
  
  cert: fs.readFileSync('/etc/letsencrypt/live/YOURWEBPAGEPATHFORSSLCERT/fullchain.pem') //PUT THE LOCATION OF THE FULLCHAIN OF YOUR SSL

  const REDIRECT_URI = 'https://YOURWEBPAGE.COM:3000/auth/twitch/callback'; //PUT THE ROOT OF YOUR WEBPAGE AND KEEP :3000/auth/twitch/callback

  NOW; on streamer.bot you will need to create an action as channel reward, where the trigger is the twitch channel redemption related with DrawMe Twitch reward.
  Then, add a subaction as "Run a Program" with the following parameters:
  
  Target: node

  Working Directory: C:\Streamer.bot\data\scripts

  Arguments: fetch.js
  
  Wait maximum: 1 seconds for exit

  Environment variables:
Name      Value

URL       https://yourdomain:3000/authorize

METHOD    PUT

DATA     {"userName": "%userName%"}

For Working Directory, usually that's the path, check your path if also located Streamer.bot in C:\

Once you have everything setup, from terminal in your web server, go where is located server.js and run: node server.js

Also remember to keep open in the machine where you stream while streaming, obs, Lioranboard and Streamer.bot

The viewer will need to claim the Twitch "Draw me" reward and then in a web browser navigate to yourwebpagewhereisthisprojectlocated:3000 

