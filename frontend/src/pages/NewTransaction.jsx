import { useState } from "react";
import { analyzeNewTransaction } from "../services/api";

const initialForm = {
  transaction_id: "",
  transaction_amount: "",
  TransactionDT: "",
  card1: "",
  card2: "",
  card3: "",
  card5: "",
  addr1: "",
  addr2: "",
  dist1: "",
  dist2: "",
};

function SectionIcon({ type }) {
  const paths = {
    transaction: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 9h8M8 13h5M8 17h7" />
      </>
    ),
    card: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 9h18M7 14h4" />
      </>
    ),
    location: (
      <>
        <path d="M12 21s6-6.1 6-11a6 6 0 1 0-12 0c0 4.9 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
  };

  return (
    <svg
      className="new-section-icon"
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
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setResult(null);
  }

  function buildPayload() {
    return {
      transaction_id: form.transaction_id.trim() || null,
      transaction_amount: Number(form.transaction_amount),
      TransactionDT: Number(form.TransactionDT),
      card1: Number(form.card1),
      card2: Number(form.card2),
      card3: Number(form.card3),
      card5: Number(form.card5),
      addr1: Number(form.addr1),
      addr2: Number(form.addr2),
      dist1: Number(form.dist1),
      dist2: Number(form.dist2),
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const amount = Number(form.transaction_amount);

    const requiredFields = [
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

    const missingField = requiredFields.find(
      (field) => form[field] === "",
    );

    if (missingField) {
      setError(
        `Please enter ${missingField} before running the analysis.`,
      );
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError(
        "Enter a valid transaction amount greater than zero.",
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const prediction = await analyzeNewTransaction(
        buildPayload(),
      );

      setResult({
        ...prediction,
        transaction_amount: amount,
      });
    } catch (err) {
      setError(
        err.message ||
          "Unable to analyze the transaction.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setForm(initialForm);
    setResult(null);
    setError("");
  }

  const riskLevel = result?.risk_level
    ? String(result.risk_level).toLowerCase()
    : "";

  const riskMessage = {
    low:
      "The model predicts a low fraud risk for this transaction based on learned patterns from historical data.",

    medium:
      "The model predicts a medium fraud risk. Review the transaction details and monitor for unusual activity.",

    high:
      "The model predicts a high fraud risk for this transaction based on learned patterns from historical data. Please review additional transaction details before proceeding.",

    critical:
      "The model predicts a critical fraud risk. This transaction requires immediate investigation and manual review.",
  };

  return (
    <div className="new-transaction-page">
      <div className="page-heading-row">
        <div>
          <div className="section-eyebrow">
            TRANSACTION ANALYSIS
          </div>

          <h1>New Transaction Risk Check</h1>

          <p>
            Analyze a transaction using the RiskPulse
            10-feature XGBoost fraud model.
          </p>
        </div>

        <div className="analysis-status">
          <span className="status-dot" />
          Model ready
        </div>
      </div>

      <div className="new-transaction-grid">
        <section className="analysis-card transaction-input-card">
          <div className="analysis-card-header">
            <div className="header-icon-box">
              <SectionIcon type="transaction" />
            </div>

            <div>
              <h2>Transaction Input</h2>

              <p>
                Provide transaction attributes
                for risk assessment.
              </p>
            </div>

            <button
              type="button"
              className="header-reset-button"
              onClick={handleReset}
              disabled={loading}
            >
              ↻
              <span>Reset Form</span>
            </button>
          </div>

          <form
            className="new-transaction-form"
            onSubmit={handleSubmit}
          >
            <div className="form-section">
              <div className="form-section-title">
                <SectionIcon type="transaction" />
                <span>Transaction Details</span>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="transaction_id">
                    Transaction ID
                  </label>

                  <input
                    id="transaction_id"
                    name="transaction_id"
                    type="text"
                    value={form.transaction_id}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Auto-generated if empty"
                  />

                  <span className="field-help">
                    Optional
                  </span>
                </div>

                <div className="form-field">
                  <label htmlFor="transaction_amount">
                    Transaction Amount
                    <span className="required-star">
                      *
                    </span>
                  </label>

                  <div className="amount-field">
                    <span>₹</span>

                    <input
                      id="transaction_amount"
                      name="transaction_amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.transaction_amount}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Enter amount"
                      required
                    />
                  </div>

                  <span className="field-help">
                    Enter transaction amount
                  </span>
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="TransactionDT">
                    Transaction Time Value
                    <span className="required-star">
                      *
                    </span>
                  </label>

                  <input
                    id="TransactionDT"
                    name="TransactionDT"
                    type="number"
                    min="0"
                    value={form.TransactionDT}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Enter transaction time"
                    required
                  />

                  <span className="field-help">
                    Numeric transaction time used by
                    the risk model.
                  </span>
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">
                <SectionIcon type="card" />
                <span>Card Information</span>
              </div>

              <div className="form-row three-columns">
                {[
                  "card1",
                  "card2",
                  "card3",
                ].map((field) => (
                  <div
                    className="form-field"
                    key={field}
                  >
                    <label htmlFor={field}>
                      {field.toUpperCase()}
                      <span className="required-star">
                        *
                      </span>
                    </label>

                    <input
                      id={field}
                      name={field}
                      type="number"
                      min="0"
                      step="0.01"
                      value={form[field]}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Required"
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="card5">
                    CARD5
                    <span className="required-star">
                      *
                    </span>
                  </label>

                  <input
                    id="card5"
                    name="card5"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.card5}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Required"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">
                <SectionIcon type="location" />
                <span>Location &amp; Distance</span>
              </div>

              <div className="form-row four-columns">
                {[
                  "addr1",
                  "addr2",
                  "dist1",
                  "dist2",
                ].map((field) => (
                  <div
                    className="form-field"
                    key={field}
                  >
                    <label htmlFor={field}>
                      {field.toUpperCase()}
                      <span className="required-star">
                        *
                      </span>
                    </label>

                    <input
                      id={field}
                      name={field}
                      type="number"
                      min="0"
                      step="0.01"
                      value={form[field]}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Required"
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="feature-contract">
              <div className="contract-icon">
                ◉
              </div>

              <div className="contract-main">
                <span className="contract-label">
                  MODEL INPUT
                </span>

                <strong>10 features</strong>
              </div>

              <div className="contract-divider" />

              <span>
                Transaction attributes are analyzed
                using the dedicated 10-feature
                XGBoost model.
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
                <span>RESET</span>
              </button>

              <button
                type="submit"
                className="primary-action-button"
                disabled={
                  !form.transaction_amount ||
                  loading
                }
              >
                <span className="run-icon">
                  ▶
                </span>

                {loading
                  ? "ANALYZING..."
                  : "RUN RISK ANALYSIS"}
              </button>
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
                Prediction generated by the dedicated
                10-feature RiskPulse XGBoost model.
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
                Enter transaction details and run
                the risk analysis to generate a
                prediction.
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
                    <span>FRAUD PROBABILITY</span>

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
                        Verify customer identity
                      </li>

                      <li>
                        Check for unusual activity
                        patterns
                      </li>

                      <li>
                        Review additional
                        transaction details
                      </li>

                      <li>
                        Consider manual review
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