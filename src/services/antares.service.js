// const { default: axios } = require("axios");
// require("dotenv").config();

// const baseUrl = process.env.ANTARES_BASE_URL;

// const headers = {
//     "X-M2M-Origin": process.env.ANTARES_ORIGIN,
//     "Content-Type": "application/json;ty=4",
//     "accept": "application/json",
// }

// async function getLatest(sensorName) {
//     try {
//         const url = `${baseUrl}/${sensorName}/la`;
//         const { data } = await axios.get(url, { headers });
//     }
// }