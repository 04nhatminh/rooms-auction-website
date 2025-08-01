require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes/index');
const path = require('path');

const app = express();
const port = process.env.APP_PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
  const filePath = path.join(__dirname, '..', 'frontend', 'home.html');
  console.log("Serving:", filePath);
  res.sendFile(filePath);
});

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use('/api', routes);

app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});