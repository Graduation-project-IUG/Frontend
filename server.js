const express = require('express');
const cors = require('cors');
const router = require('./router');


const app = express();

app.use(cors({
  origin: [
    'https://graduation-project-swart-beta.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true // Required if you are using cookies or sessions
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
