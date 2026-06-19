require('dotenv').config();
const app = require('./app');
const { initializeSchedulers } = require('./schedulers');

const PORT = process.env.PORT || 3000;

initializeSchedulers();

app.listen(PORT, () => {
  console.log(`🚀 SocGen backend running on http://localhost:${PORT}`);
});
