const express = require('express');
const cors = require('cors');
const membersRoute = require('./routes/members');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/members', membersRoute);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
