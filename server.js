require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.WEATHER_API_KEY;

app.use(cors());

function getUVCategory(uvIndex) {
  if (uvIndex <= 2)
    return {
      level: "Low",
      color: "Green",
      warning: "Aman untuk aktivitas luar ruangan.",
    };
  if (uvIndex <= 5)
    return {
      level: "Moderate",
      color: "Yellow",
      warning: "Gunakan kacamata hitam dan kemeja lengan panjang.",
    };
  if (uvIndex <= 7)
    return {
      level: "High",
      color: "Orange",
      warning: "Gunakan sunscreen SPF 30+ dan topi.",
    };
  if (uvIndex <= 10)
    return {
      level: "Very High",
      color: "Red",
      warning: "Minimalkan paparan sinar matahari jam 10:00 - 16:00!",
    };
  return {
    level: "Extreme",
    color: "Purple",
    warning: "BAHAYA! Hindari keluar ruangan jika tidak mendesak.",
  };
}

app.get("/api/v1/weather/live", async (req, res) => {
  try {
    const city = req.query.city || "Palu";
    const response = await axios.get(
      `http://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${city}&aqi=no`,
    );

    const data = response.data;
    const uvIndex = data.current.uv;
    const uvMeta = getUVCategory(uvIndex);

    const payload = {
      status: "success",
      data: {
        location: {
          name: data.location.name,
          region: data.location.region,
          country: data.location.country,
          lat: data.location.lat,
          lon: data.location.lon,
          timestamp: data.location.localtime,
        },
        metrics: {
          uv_index: uvIndex,
          uv_category: uvMeta.level,
          uv_color: uvMeta.color,
          temperature_c: data.current.temp_c,
          humidity_pct: data.current.humidity,
          heat_index_c: data.current.feelslike_c,
        },
        advisory: {
          warning_message: uvMeta.warning,
          needs_alert: uvIndex >= 8 || data.current.feelslike_c >= 40,
        },
      },
    };

    res.json(payload);
  } catch (error) {
    console.error("Error fetching weather data:", error.message);
    res
      .status(500)
      .json({ status: "error", message: "Gagal mengambil data cuaca." });
  }
});

app.listen(PORT, () => {
  console.log(`Server EcoUV berjalan di http://localhost:${PORT}`);
});
