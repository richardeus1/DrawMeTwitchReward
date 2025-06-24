const express = require('express');
const https = require('https');
const fs = require('fs');
const socketIO = require('socket.io');
const app = express();

const loggedInUsers = [];

require('dotenv').config();
const session = require('express-session');
const axios = require('axios');


const sslOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/YOURWEBPAGEPATHFORSSLCERT/privkey.pem'), //PUT THE LOCATION OF THE PRIVKEY OF YOUR SSL
  cert: fs.readFileSync('/etc/letsencrypt/live/YOURWEBPAGEPATHFORSSLCERT/fullchain.pem') //PUT THE LOCATION OF THE FULLCHAIN OF YOUR SSL
};

const server = https.createServer(sslOptions, app);
const io = socketIO(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('draw', (data) => {
    socket.broadcast.emit('draw', data);
  });

  socket.on('syncHistory', (data) => {
    socket.broadcast.emit('syncHistory', data);
  });

  socket.on('clear', () => {
    io.emit('clear');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));





// Environment variables
const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const REDIRECT_URI = 'https://YOURWEBPAGE.COM:3000/auth/twitch/callback'; //PUT THE ROOT OF YOUR WEBPAGE AND KEEP :3000/auth/twitch/callback
//const CHANNEL_ID = ''; // Your Twitch user ID (not name)

app.use(session({ secret: 'drawsecret', resave: false, saveUninitialized: true }));
app.use(express.static('public'));

// OAuth start
app.get('/auth/twitch', (req, res) => {
  const scope = 'user:read:follows';
  const redirect = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scope}`;
  res.redirect(redirect);
});

// OAuth callback
app.get('/auth/twitch/callback', async (req, res) => {
  const code = req.query.code;

  try {
      const tokenRes = await axios.post(`https://id.twitch.tv/oauth2/token`, null, {
        params: {
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: REDIRECT_URI
        }
      });

        const access_token = tokenRes.data.access_token;
        const userRes = await axios.get('https://api.twitch.tv/helix/users', {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Client-Id': CLIENT_ID
          }
        });
        
        const user = userRes.data.data[0];
        
        // Prevent duplicate users
        const alreadyLogged = loggedInUsers.find(u => u.id === user.id);
        if (!alreadyLogged && loggedInUsers.length >= 2) {
          return res.send('❌ Limit reached: Solo se admite 1 usuario conectado.');
        }


        req.session.user = user;
        // Track user in global array
        if (!alreadyLogged) {
          loggedInUsers.push({ id: user.id, login: user.login });
          // Auto-remove user after 3 minutes (180000 ms)
          setTimeout(() => {
            const index = loggedInUsers.findIndex(u => u.id === user.id);
            if (index > -1) {
              loggedInUsers.splice(index, 1);
              console.log(`🕒 Session expired for ${user.login}`);
            }
          }, 180000);
        }

        res.redirect('/');




  } catch (err) {
    console.error("OAuth error:", err.response?.data || err.message);
    res.send("Authentication failed.");
  }

  // Check if they follow your channel
  
});

// API endpoint to check user status
/*app.get('/auth/status', (req, res) => {
  if (!req.session.user) return res.json({ authenticated: false });
  res.json({ authenticated: true, isFollower: req.session.isFollower });
});*/

/*app.get('/auth/status', (req, res) => {
  const user = req.session.user;

  if (!user) {
    return res.json({ authenticated: false });
  }

  const stillLogged = loggedInUsers.some(u => u.id === user.id);

  if (!stillLogged) {
    req.session.destroy(() => {});  // Auto-remove expired session
    return res.json({ authenticated: false });
  }

  res.json({ authenticated: true, isFollower: req.session.isFollower });
}); */

app.get('/auth/status', (req, res) => {
  if (!req.session.user) {
    return res.json({ authenticated: false });
  }

  res.json({
    authenticated: true,
    isFollower: req.session.isFollower,
    user: req.session.user  // Includes 'login', 'id', etc.
  });
});



app.get("/logged-in", (req, res) => {
  res.json({ users: loggedInUsers });
});



app.get('/logout', (req, res) => {
  if (req.session.user) {
    const userId = req.session.user.id;
    const index = loggedInUsers.findIndex(u => u.id === userId);
    if (index > -1) loggedInUsers.splice(index, 1);
  }
  req.session.destroy(() => res.redirect('/'));
});

app.get('/logout-all', (req, res) => {

  
  if (req.query.key !== process.env.ADMIN_KEY) {
    return res.status(403).send('❌ Unauthorized');
  }

  // Clear logged in users
  loggedInUsers.length = 0;

  // Optionally clear this user's session too
  if (req.session) {
    req.session.destroy(() => {
      res.send('✅ All users have been logged out.');
    });
  } else {
    res.send('✅ All users have been logged out.');
  }
});

app.use(express.json()); // Ensure this is present for JSON parsing

//let loggedInUsers = [];

app.put("/authorize", (req, res) => {
  const userName = req.body.userName;

  if (!userName) {
    return res.status(400).json({ error: "Missing userName" });
  }

  loggedInUsers.push(userName);

  console.log(`✅ Authorized: ${userName}`);
  res.sendStatus(200);
});

app.get("/user-status/:userName", (req, res) => {
  const { userName } = req.params;
  const isLoggedIn = loggedInUsers.includes(userName);
  res.json({ userName, isLoggedIn });
});




