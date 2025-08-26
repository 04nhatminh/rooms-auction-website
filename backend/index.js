require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const routes = require('./routes/index');
const path = require('path');

const app = express();
const PORT = process.env.APP_PORT || 3000;const CLIENT_ORIGIN = [
  process.env.CLIENT_ORIGIN || 'http://localhost:3001',
  'https://6ff11c645fba.ngrok-free.app'
];


// ✅ CORS cho cookie: URL nằm trong options, KHÔNG nằm ở path
const corsOptions = {
  origin: CLIENT_ORIGIN,
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
};
app.use(cors(corsOptions));
// app.options('*', cors(corsOptions));   // ✅ path là '*', không phải URL

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/', routes);                  // ✅ path là '/', không phải URL

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
