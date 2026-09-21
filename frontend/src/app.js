const API_BASE_URL = "http://127.0.0.1:8000";

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    throw new Error(
      error.detail || `Request failed with status ${response.status}`
    );
  }

  return response.json();
}

export async function getHealth() {
  return request("/health");
}

export async function getRiskSummary() {
  return request("/risk/summary");
}

export async function searchTransactions(
  query,
  limit = 50
) {
  return request(
    `/risk/transactions/search?query=${encodeURIComponent(query)}&limit=${limit}`
  );
}

export async function predictRisk(transaction) {
  return request("/risk/predict", {
    method: "POST",
    body: JSON.stringify(transaction),
  });
}