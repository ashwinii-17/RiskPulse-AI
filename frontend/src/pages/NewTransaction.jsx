import { useState } from "react";
import { analyzeNewTransaction } from "../services/api";

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
  const [formData, setFormData] = useState({
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
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setResult(null);
  }

  function validateForm() {
    const requiredFields = [
      ["transaction_amount", "Transaction amount"],
      ["TransactionDT", "Transaction time"],
      ["card1", "Card 1"],
      ["card2", "Card 2"],
      ["card3", "Card 3"],
      ["card5", "Card 5"],
      ["addr1", "Address 1"],
      ["addr2", "Address 2"],
      ["dist1", "Distance 1"],
      ["dist2", "Distance 2"],
    ];

    for (const [field, label] of requiredFields) {
      if (
        formData[field] === "" ||
        formData[field] === null ||
        formData[field] === undefined
      ) {
        throw new Error(`${label} is required.`);
      }

      const value = Number(formData[field]);

      if (!Number.isFinite(value)) {
        throw new Error(`${label} must be a valid number.`);
      }
    }

    if (Number(formData.transaction_amount) <= 0) {
      throw new Error("Transaction amount must be greater than zero.");
    }

    return true;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      setResult(null);

      validateForm();

      const transaction = {
        transaction_id: `NEW-${Date.now()}`,

        transaction_amount: Number(
          formData.transaction_amount,
        ),

        TransactionDT: Number(
          formData.TransactionDT,
        ),

        card1: Number(formData.card1),
        card2: Number(formData.card2),
        card3: Number(formData.card3),
        card5: Number(formData.card5),

        addr1: Number(formData.addr1),
        addr2: Number(formData.addr2),

        dist1: Number(formData.dist1),
        dist2: Number(formData.dist2),
      };

      const prediction =
        await analyzeNewTransaction(transaction);

      setResult({
        ...prediction,
        transaction_amount:
          transaction.transaction_amount,
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
    setFormData({
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
    });

    setResult(null);
    setError("");
  }

  const riskLevel = result?.risk_level
    ? String(result.risk_level).toLowerCase()
    : "";

  const riskMessage = {
    low:
      "The model predicts a low fraud risk based on the transaction features provided.",

    medium:
      "The model predicts a medium fraud risk. Review the transaction and supporting context.",

    high:
      "The model predicts a high fraud risk. Additional transaction review is recommended.",

    critical:
      "The model predicts a critical fraud risk and should be escalated for manual investigation.",
  };

  return (
    <div className="new-transaction-page">
      <div className="page-heading-row">
        <div>
          <div className="section-eyebrow">
            TRANSACTION ASSESSMENT
          </div>

          <h1>New Transaction Risk Check</h1>

          <p>
            Enter the transaction details below to assess
            its fraud risk using the RiskPulse V2 model.
          </p>
        </div>

        <div className="analysis-status">
          <span className="status-dot" />
          V2 model ready
        </div>
      </div>

      <div className="new-transaction-grid">
        {/* LEFT SIDE */}
        <section className="analysis-card transaction-input-card">
          <div className="analysis-card-header">
            <div className="header-icon-box">
              <ResultIcon type="id" />
            </div>

            <div>
              <h2>Transaction Details</h2>

              <p>
                Enter the required transaction information
                for fraud-risk assessment.
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
            {/* TRANSACTION DETAILS */}

            <div className="form-section">
              <div className="form-section-title">
                <ResultIcon type="amount" />
                <span>Transaction Information</span>
              </div>

              <div className="transaction-form-grid">
                <div className="transaction-field">
                  <label htmlFor="transaction_amount">
                    Transaction Amount
                  </label>

                  <div className="input-with-prefix">
                    <span>₹</span>

                    <input
                      id="transaction_amount"
                      name="transaction_amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="Enter amount"
                      value={formData.transaction_amount}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="transaction-field">
                  <label htmlFor="TransactionDT">
                    Transaction Time
                  </label>

                  <input
                    id="TransactionDT"
                    name="TransactionDT"
                    type="number"
                    min="0"
                    placeholder="Enter transaction time"
                    value={formData.TransactionDT}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />

                  <small>
                    Dataset transaction-time value
                  </small>
                </div>
              </div>
            </div>

            {/* CARD DETAILS */}

            <div className="form-section">
              <div className="form-section-title">
                <ResultIcon type="id" />
                <span>Card Information</span>
              </div>

              <div className="transaction-form-grid">
                <div className="transaction-field">
                  <label htmlFor="card1">Card 1</label>

                  <input
                    id="card1"
                    name="card1"
                    type="number"
                    min="0"
                    placeholder="Enter card1"
                    value={formData.card1}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="transaction-field">
                  <label htmlFor="card2">Card 2</label>

                  <input
                    id="card2"
                    name="card2"
                    type="number"
                    min="0"
                    placeholder="Enter card2"
                    value={formData.card2}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="transaction-field">
                  <label htmlFor="card3">Card 3</label>

                  <input
                    id="card3"
                    name="card3"
                    type="number"
                    min="0"
                    placeholder="Enter card3"
                    value={formData.card3}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="transaction-field">
                  <label htmlFor="card5">Card 5</label>

                  <input
                    id="card5"
                    name="card5"
                    type="number"
                    min="0"
                    placeholder="Enter card5"
                    value={formData.card5}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </div>

            {/* ADDRESS DETAILS */}

            <div className="form-section">
              <div className="form-section-title">
                <ResultIcon type="id" />
                <span>Address Information</span>
              </div>

              <div className="transaction-form-grid">
                <div className="transaction-field">
                  <label htmlFor="addr1">
                    Address 1
                  </label>

                  <input
                    id="addr1"
                    name="addr1"
                    type="number"
                    min="0"
                    placeholder="Enter address 1"
                    value={formData.addr1}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="transaction-field">
                  <label htmlFor="addr2">
                    Address 2
                  </label>

                  <input
                    id="addr2"
                    name="addr2"
                    type="number"
                    min="0"
                    placeholder="Enter address 2"
                    value={formData.addr2}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </div>

            {/* DISTANCE DETAILS */}

            <div className="form-section">
              <div className="form-section-title">
                <ResultIcon type="probability" />
                <span>Transaction Distance</span>
              </div>

              <div className="transaction-form-grid">
                <div className="transaction-field">
                  <label htmlFor="dist1">
                    Distance 1
                  </label>

                  <input
                    id="dist1"
                    name="dist1"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter distance 1"
                    value={formData.dist1}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="transaction-field">
                  <label htmlFor="dist2">
                    Distance 2
                  </label>

                  <input
                    id="dist2"
                    name="dist2"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter distance 2"
                    value={formData.dist2}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
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
                disabled={loading}
              >
                <span className="run-icon">
                  ▶
                </span>

                {loading
                  ? "ANALYZING..."
                  : "ASSESS TRANSACTION RISK"}
              </button>
            </div>
          </form>
        </section>

        {/* RIGHT SIDE */}

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
                Enter the transaction details and click
                "Assess Transaction Risk" to generate the
                fraud-risk assessment.
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