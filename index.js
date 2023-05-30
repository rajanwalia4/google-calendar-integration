const express = require('express');
const { google } = require('googleapis');
const dotenv = require('dotenv');
dotenv.config();
const app = express();
const PORT = 3000; 

// Google OAuth2 credentials
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

// Create an OAuth2 client
const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

app.get('/', (req, res) => {
    res.send('<a href="/rest/v1/calendar/init/">Connect to Google Calendar</a>');
});

// Step 1: GoogleCalendarInitView
app.get('/rest/v1/calendar/init/', (req, res) => {
  // Generate the URL for user authorization
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly'],
  });

  res.redirect(authUrl);
});

// Step 2: GoogleCalendarRedirectView
app.get('/rest/v1/calendar/redirect/', async (req, res) => {
  const code = req.query.code;

  try {
    // Exchange authorization code for access token
    const { tokens } = await oAuth2Client.getToken(code);
    let MAX_RESULTS = 20;
    console.log(tokens);
    oAuth2Client.setCredentials(tokens);

    // Create a Calendar API client
    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    // Retrieve a list of events from the user's calendar
    const { data } = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: MAX_RESULTS,
      singleEvents: true,
      orderBy: 'startTime',
    });
    console.log(data)
    // Process the list of events
    const events = data.items.map((event) => ({
      summary: event.summary,
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
    }));

    // Display the events
    res.json(events);
  } catch (error) {
    console.error('Error retrieving events:', error);
    res.status(500).send('Error retrieving events');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
