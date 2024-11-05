const express = require('express');
const app = express();
const PORT = 5000;

app.use(express.json());

// Sample API route
app.get('/api/message', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
