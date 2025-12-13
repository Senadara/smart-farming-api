require("dotenv").config();
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const express = require("express");
const cors = require("cors");
const passport = require("passport");
require("./src/config/passport");
const moment = require("moment-timezone");

const APP_TIMEZONE = "Asia/Jakarta";
moment.tz.setDefault(APP_TIMEZONE);

const app = express();

// Import routes
const indexRouter = require("./src/routes/indexRoute");
const storeRouter = require("./src/routes/store/storeIndex");
const { startScheduler } = require("./services/schedulerService");
const { startMqttClient } = require("./services/mqttService");

const apiRouter = express.Router();

// Use routes
apiRouter.use("/", indexRouter);
apiRouter.use("/store", storeRouter);

//middleware
app.use(passport.initialize());
app.use(
  cors({
    origin: true,
    credentials: true,
    preflightContinue: false,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);
app.options("*", cors());
app.use(express.json());

app.use("/api", apiRouter);
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource was not found on this server.",
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: err.message,
    message: "Internal Server Error",
  });
});
app.listen(PORT, () => console.log(`Server is running on ${BASE_URL}`));

startScheduler();

// Start MQTT client untuk monitoring realtime sensor data
startMqttClient();
