const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://riskpulse-ai-risk-intelligence.onrender.com";

function clearSession() {
  localStorage.removeItem("riskpulse_access_token");
  localStorage.removeItem("riskpulse_user");
}
async function request(endpoint, options = {}) {
  const token = localStorage.getItem("riskpulse_access_token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({}));

    if (response.status === 401) {
      clearSession();

      window.dispatchEvent(
        new Event("riskpulse-auth-expired")
      );
    }

    throw new Error(
      error.detail ||
        `Request failed with status ${response.status}`
    );
  }

  return response.json();
}


/* =========================
   HEALTH
========================= */

export async function getHealth() {
  return request("/health");
}


/* =========================
   RISK SUMMARY
========================= */

export async function getRiskSummary() {
  return request("/risk/summary");
}


/* =========================
   TRANSACTIONS
========================= */

export async function getTransactions(
  page = 1,
  limit = 50
) {
  return request(
    `/risk/transactions?page=${page}&limit=${limit}`
  );
}


/* =========================
   TRANSACTION SEARCH
========================= */

export async function searchTransactions(
  query,
  limit = 50
) {
  return request(
    `/risk/transactions/search?query=${encodeURIComponent(
      query
    )}&limit=${limit}`
  );
}


/* =========================
   RISK ALERTS
========================= */

export async function getRiskAlerts(
  page = 1,
  limit = 50
) {
  return request(
    `/risk/transactions/alerts?page=${page}&limit=${limit}`
  );
}


/* =========================
   RISK PREDICTION
========================= */

export async function predictRisk(transaction) {
  return request("/risk/predict", {
    method: "POST",
    body: JSON.stringify(transaction),
  });
}


/* =========================
   NEW TRANSACTION ANALYSIS
========================= */

export async function analyzeNewTransaction(
  transaction
) {
  return request("/risk/new-transaction", {
    method: "POST",
    body: JSON.stringify(transaction),
  });
}


/* =========================
   MODEL SCHEMA
========================= */

export async function getModelSchema() {
  return request("/risk/model-schema");
}


/* =========================
   RISK ANALYTICS
========================= */

export async function getRiskAnalytics() {
  return request("/risk/analytics");
}


/* =========================
   AVERAGE RISK SCORE
========================= */

export async function getAverageRiskScore() {
  return request("/risk/average-risk-score");
}


/* =========================
   RISK SCORE DISTRIBUTION
========================= */

export async function getRiskScoreDistribution() {
  return request(
    "/risk/risk-score-distribution"
  );
}