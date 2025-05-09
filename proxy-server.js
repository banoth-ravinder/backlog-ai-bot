import express from "express";
import axios from "axios";
import cors from "cors";
import https from "https";

const app = express();
const PORT = 3001; // Choose a port for the proxy server

const BASE_URL_COM = "https://nulab-exam.backlog.com/api/v2";
const BASE_URL_JP = "https://nulab-exam.backlog.jp/api/v2";

// Create an HTTPS agent that disables SSL verification
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // Disable SSL certificate verification
});

// Enable CORS for all routes
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Proxy route
app.use("/api", async (req, res) => {
  try {
    let response;

    const makeRequest = async (baseUrl) => {
      return await axios({
        method: req.method,
        url: `${baseUrl}${req.path}`,
        headers: {
          ...req.headers,
          host: new URL(baseUrl).host,
        },
        data: req.body,
        params: req.query,
        // httpsAgent, // Use the custom HTTPS agent
      });
    };

    try {
      response = await makeRequest(BASE_URL_COM);
      if (!response.data) {
        response = await makeRequest(BASE_URL_JP);
      }
    } catch (errorCom) {
      // console.error("Error with BASE_URL_COM:", errorCom.response?.data || errorCom.message);

      try {
        response = await makeRequest(BASE_URL_JP);
      } catch (errorJp) {
        // console.error("Error with BASE_URL_JP:", errorJp.response?.data || errorJp.message);
        throw new Error("Both BASE_URL_COM and BASE_URL_JP failed");
      }
    }
    res.json(response.data);
  } catch (error) {
    // console.error("Proxy error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Server error" });
  }
});

// Start the proxy server
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});