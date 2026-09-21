import { useState } from "react";
import { analyzeNewTransaction } from "../services/api";

const REQUIRED_FEATURES = [
  "TransactionAmt",
  "TransactionDT",
  "card1",
  "card2",
  "card3",
  "card5",
  "addr1",
  "addr2",
  "dist1",
  "dist2",
];

const EXAMPLE_PAYLOAD = {
  transaction_id: `TXN-${Date.now()}`,
  transaction_amount: 68.5,
  TransactionDT: 86400,
  card1: 13926,
  card2: 361,
  card3: 150,
  card5: 142,
  addr1: 315,
  addr2: 87,
  dist1: 19,
  dist2: 37,
};

function ResultIcon({ type }) {
  const paths = {
    probability: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 4a8 8 0 0 1 7.2 4.5" />
        <path d="M12 12 16.5 7" />
      </>
    ),
    amount: (
      <>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18M7 15h4" />
      </>
    ),
    id: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
  };

  return (
    <svg
      className="result-icon-svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[type]}
    </svg>
  );
}

function NewTransaction({ onNavigate }) {
  const [payloadText, setPayloadText] = useState(
    JSON.stringify(EXAMPLE_PAYLOAD, null, 2),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  function validatePayload(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error("Payload must be a JSON object.");
    }

    if (
      payload.transaction_amount === undefined ||
      payload.transaction_amount === null
    ) {
      throw new Error("Missing transaction_amount.");
    }

    const amount = Number(payload.transaction_amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(
        "transaction_amount must be a number greater than zero.",
      );
    }

    const missingFeatures = REQUIRED_FEATURES.filter(
      (feature) =>
        feature !== "TransactionAmt" &&
        (payload[feature] === undefined || payload[feature] === null),
    );

    if (missingFeatures.length > 0) {
      throw new Error(
        `Missing required model features: ${missingFeatures.join(", ")}`,
      );
    }

    const numericFields = [
      "transaction_amount",
      ...REQUIRED_FEATURES,
    ];

    for (const field of numericFields) {
      if (field === "transaction_id") {
        continue;
      }

      if (payload[field] === undefined || payload[field] === null) {
        continue;
      }

      const numericValue = Number(payload[field]);

      if (!Number.isFinite(numericValue)) {
        throw new Error(`${field} must be numeric.`);
      }
    }

    return payload;
  }

  function normalizePayload(payload) {
    return {
      transaction_id:
        typeof payload.transaction_id === "string"
          ? payload.transaction_id.trim() || null
          : null,

      transaction_amount: Number(payload.transaction_amount),

      TransactionDT: Number(payload.TransactionDT),
      card1: Number(payload.card1),
      card2: Number(payload.card2),
      card3: Number(payload.card3),
      card5: Number(payload.card5),
      addr1: Number(payload.addr1),
      addr2: Number(payload.addr2),
      dist1: Number(payload.dist1),
      dist2: Number(payload.dist2),
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      setResult(null);

      let parsed;

      try {
        parsed = JSON.parse(payloadText);
      } catch {
        throw new Error(
          "Invalid JSON. Check commas, quotes, braces, and numeric values.",
        );
      }

      validatePayload(parsed);

      const normalizedPayload = normalizePayload(parsed);

      const prediction = await analyzeNewTransaction(
        normalizedPayload,
      );

      setResult({
        ...prediction,
        transaction_amount:
          normalizedPayload.transaction_amount,
      });
    } catch (err) {
      setError(
        err.message || "Unable to analyze the transaction.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setPayloadText("");
    setResult(null);
    setError("");
  }

  function loadExample() {
    setPayloadText(
      JSON.stringify(EXAMPLE_PAYLOAD, null, 2),
    );
    setResult(null);
    setError("");
  }

  const riskLevel = result?.risk_level
    ? String(result.risk_level).toLowerCase()
    : "";

  const riskMessage = {
    low:
      "The model predicts a low fraud risk based on the learned patterns available to the V2 model.",

    medium:
      "The model predicts a medium fraud risk. Review the transaction and supporting context.",

    high:
      "The model predicts a high fraud risk. Additional transaction review is recommended.",

    critical:
      "The model predicts a critical fraud risk and should be escalated for immediate manual investigation.",
  };

  return (
    <div className="new-transaction-page">
      <div className="page-heading-row">
        <div>
          <div className="section-eyebrow">
            TRANSACTION INGESTION
          </div>

          <h1>New Transaction Risk Check</h1>

          <p>
            Submit a preprocessed transaction payload to
            the RiskPulse V2 fraud-scoring pipeline.
          </p>
        </div>

        <div className="analysis-status">
          <span className="status-dot" />
          V2 model ready
        </div>
      </div>

      <div className="new-transaction-grid">
        <section className="analysis-card transaction-input-card">
          <div className="analysis-card-header">
            <div className="header-icon-box">
              <ResultIcon type="id" />
            </div>

            <div>
              <h2>Transaction Payload</h2>

              <p>
                RiskPulse expects the exact preprocessed
                feature contract used by the dedicated
                10-feature XGBoost model.
              </p>
            </div>

            <button
              type="button"
              className="header-reset-button"
              onClick={handleReset}
              disabled={loading}
            >
              ↻
              <span>Clear</span>
            </button>
          </div>

          <form
            className="new-transaction-form"
            onSubmit={handleSubmit}
          >
            <div className="form-section">
              <div className="form-section-title">
                <ResultIcon type="id" />
                <span>Preprocessed Input</span>
              </div>

              <div className="payload-helper">
                <div>
                  <strong>
                    Upstream ingestion contract
                  </strong>

                  <p>
                    The preprocessing and encoding stage
                    happens before this API boundary. RiskPulse
                    validates the contract and performs
                    inference; it does not invent missing
                    feature values.
                  </p>
                </div>

                <button
                  type="button"
                  className="secondary-action-button small-action"
                  onClick={loadExample}
                  disabled={loading}
                >
                  LOAD EXAMPLE
                </button>
              </div>

              <div className="json-editor-wrapper">
                <textarea
                  className="json-editor"
                  value={payloadText}
                  onChange={(event) => {
                    setPayloadText(event.target.value);
                    setError("");
                    setResult(null);
                  }}
                  disabled={loading}
                  spellCheck="false"
                  aria-label="Preprocessed transaction JSON payload"
                />
              </div>

              <div className="feature-contract">
                <div className="contract-icon">
                  ✓
                </div>

                <div className="contract-main">
                  <span className="contract-label">
                    MODEL CONTRACT
                  </span>

                  <strong>10 features</strong>
                </div>

                <div className="contract-divider" />

                <span>
                  TransactionAmt · TransactionDT · card1 ·
                  card2 · card3 · card5 · addr1 · addr2 ·
                  dist1 · dist2
                </span>
              </div>

              {error && (
                <div className="new-transaction-error">
                  {error}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-action-button"
                  onClick={handleReset}
                  disabled={loading}
                >
                  ↻
                  <span>CLEAR</span>
                </button>

                <button
                  type="submit"
                  className="primary-action-button"
                  disabled={!payloadText.trim() || loading}
                >
                  <span className="run-icon">
                    ▶
                  </span>

                  {loading
                    ? "ANALYZING..."
                    : "RUN RISK ANALYSIS"}
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="analysis-card prediction-result-card">
          <div className="analysis-card-header">
            <div className="header-icon-box result-header-icon">
              <ResultIcon type="probability" />
            </div>

            <div>
              <h2>Risk Result</h2>

              <p>
                Prediction generated by the RiskPulse V2
                XGBoost fraud model.
              </p>
            </div>
          </div>

          {!result ? (
            <div className="empty-result-state">
              <div className="empty-result-icon">
                <ResultIcon type="probability" />
              </div>

              <h3>No analysis yet</h3>

              <p>
                Submit a valid preprocessed transaction
                payload to generate a risk assessment.
              </p>
            </div>
          ) : (
            <div className="new-prediction-result">
              <div
                className={`risk-summary risk-summary-${riskLevel}`}
              >
                <div className="risk-warning-icon">
                  !
                </div>

                <div className="risk-level-block">
                  <span>RISK LEVEL</span>

                  <strong>
                    {result.risk_level}
                  </strong>
                </div>

                <div className="risk-summary-divider" />

                <div className="risk-score-block">
                  <span>RISK SCORE</span>

                  <strong>
                    {Number(
                      result.risk_score,
                    ).toFixed(2)}

                    <small>/ 100</small>
                  </strong>

                  <div className="result-score-bar">
                    <div
                      className="result-score-fill"
                      style={{
                        width: `${Math.min(
                          Math.max(
                            Number(
                              result.risk_score,
                            ),
                            0,
                          ),
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="new-result-metrics">
                <div className="result-metric-card">
                  <div className="result-metric-icon">
                    <ResultIcon type="probability" />
                  </div>

                  <div>
                    <span>
                      FRAUD PROBABILITY
                    </span>

                    <strong>
                      {(
                        Number(
                          result.fraud_probability,
                        ) * 100
                      ).toFixed(2)}
                      %
                    </strong>
                  </div>
                </div>

                <div className="result-metric-card">
                  <div className="result-metric-icon">
                    <ResultIcon type="amount" />
                  </div>

                  <div>
                    <span>
                      TRANSACTION AMOUNT
                    </span>

                    <strong>
                      ₹
                      {Number(
                        result.transaction_amount,
                      ).toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="result-transaction-id">
                <div className="result-metric-icon">
                  <ResultIcon type="id" />
                </div>

                <div>
                  <span>TRANSACTION ID</span>

                  <strong>
                    {result.transaction_id}
                  </strong>
                </div>
              </div>

              <div className="saved-analysis-status">
                <div className="saved-check">
                  ✓
                </div>

                <div>
                  <strong>
                    Analysis saved to transaction
                    history
                  </strong>

                  <span>
                    This result has been stored in
                    the database.
                  </span>
                </div>
              </div>

              <div className="result-interpretation">
                <div className="interpretation-header">
                  <div className="info-icon">
                    i
                  </div>

                  <h3>What does this mean?</h3>
                </div>

                <p>
                  {riskMessage[riskLevel] ||
                    "The model has generated a fraud-risk prediction for this transaction."}
                </p>

                {(riskLevel === "high" ||
                  riskLevel === "critical") && (
                  <div className="recommended-box">
                    <strong>
                      Recommended Next Steps
                    </strong>

                    <ul>
                      <li>
                        Verify the transaction context
                      </li>

                      <li>
                        Review supporting customer
                        information
                      </li>

                      <li>
                        Check for unusual activity
                        patterns
                      </li>

                      <li>
                        Escalate for manual review
                        when required
                      </li>
                    </ul>
                  </div>
                )}

                {onNavigate && (
                  <button
                    type="button"
                    className="view-transactions-button"
                    onClick={() =>
                      onNavigate("transactions")
                    }
                  >
                    View in Transactions

                    <span>→</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default NewTransaction;