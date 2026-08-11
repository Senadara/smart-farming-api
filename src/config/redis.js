const { createClient } = require("redis");

function envValue(name) {
  const value = process.env[name];

  if (!value || value === "null") {
    return undefined;
  }

  return value;
}

const redisOptions = {
  socket: {
    host: envValue("REDIS_HOST") || "127.0.0.1",
    port: Number(envValue("REDIS_PORT") || 6379),
    connectTimeout: Number(envValue("REDIS_CONNECT_TIMEOUT_MS") || 30000),
  },
};

const username = envValue("REDIS_USERNAME");
const password = envValue("REDIS_PASSWORD");

if (username) {
  redisOptions.username = username;
}

if (password) {
  redisOptions.password = password;
}

const client = createClient(redisOptions);

client.on("error", (err) => console.log("Redis Client Error", err));
client.connect().catch((err) => console.log("Redis Client Error", err));

module.exports = {
  client,
};
