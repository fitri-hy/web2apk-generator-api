const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const generateRoute = require('./routes/generateRoute');

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.use('/generate', generateRoute);
app.use('/download', express.static(require('./config/paths').OUTPUT_DIR));
app.use(errorHandler);

app.listen(8800, () => {
    console.log('APK Generator running on http://localhost:8800');
});
