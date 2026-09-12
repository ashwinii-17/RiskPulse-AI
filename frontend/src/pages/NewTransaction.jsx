import { useState } from "react";
import { getModelSchema, predictRisk } from "../services/api";

function NewTransaction() {
  const [jsonInput, setJsonInput] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function handleValidate() {
    try {
      setSchemaLoading(true);
      setError("");

      const parsed = JSON.parse(jsonInput);

      if (
        !parsed ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        throw new Error(
          "Transaction input must be a JSON object.",
        );
      }

      const schema = await getModelSchema();

      const featureNames = schema.features;

      const missingFeatures = featureNames.filter(
        (feature) => !(feature in parsed),
      );

      const extraFeatures = Object.keys(parsed).filter(
        (feature) => !featureNames.includes(feature),
      );

      if (missingFeatures.length > 0) {
        throw new Error(
          `Missing ${missingFeatures.length} model features.`,
        );
      }

      if (extraFeatures.length > 0) {
        throw new Error(
          `Unexpected feature: ${extraFeatures[0]}`,
        );
      }

      if (Object.keys(parsed).length !== 432) {
        throw new Error(
          `Expected exactly 432 features, received ${Object.keys(parsed).length}.`,
        );
      }

      if (
        parsed.TransactionAmt === undefined ||
        parsed.TransactionAmt === null
      ) {
        throw new Error(
          "TransactionAmt is required.",
        );
      }

      setAmount(
        Number(parsed.TransactionAmt).toFixed(2),
      );

      setError("");
    } catch (err) {
      setError(
        err.message || "Unable to validate transaction.",
      );
    } finally {
      setSchemaLoading(false);
    }
  }

  async function handlePredict(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const features = JSON.parse(jsonInput);

      const numericAmount = Number(amount);

      if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
      ) {
        throw new Error(
          "Enter a valid transaction amount.",
        );
      }

      features.TransactionAmt = numericAmount;

      const prediction = await predictRisk({
        transaction_id: `LIVE-${Date.now()}`,
        transaction_amount: numericAmount,
        features,
        persist_result: true,
      });

      setResult({
        ...prediction,
        transaction_amount: numericAmount,
      });
    } catch (err) {
      setError(
        err.message ||
          "Transaction risk analysis failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="new-transaction-page">
      <div className="page-heading-row">
        <div>
          <div className="section-eyebrow">
            TRANSACTION ANALYSIS
          </div>

          <h1>New Transaction Risk Check</h1>

          <p>
            Submit a new transaction using the
            production XGBoost model.
          </p>
        </div>

        <div className="analysis-status">
          <span className="status-dot" />
          Model ready
        </div>
      </div>

      <div className="new-transaction-grid">
        <section className="analysis-card">
          <div className="analysis-card-header">
            <div>
              <h2>Transaction Input</h2>

              <p>
                Provide a transaction record matching the
                model's 432-feature input contract.
              </p>
            </div>
          </div>

          <form
            className="new-transaction-form"
            onSubmit={handlePredict}
          >
            <div className="form-field">
                <label htmlFor="transaction-file">
                    TRANSACTION FEATURE FILE
                </label>

                <input
                    id="transaction-file"
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    disabled={loading}
                />

                <span className="field-help">
                    Upload a JSON transaction containing the model's
                    432 required features.
                </span>
                </div>

            <button
              type="button"
              className="secondary-action-button"
              onClick={handleValidate}
              disabled={
                !jsonInput ||
                loading ||
                schemaLoading
              }
            >
              {schemaLoading
                ? "VALIDATING..."
                : "VALIDATE 432 FEATURES"}
            </button>

            <div className="form-field">
              <label htmlFor="transaction-amount">
                TRANSACTION AMOUNT
              </label>

              <div className="amount-field">
                <span>₹</span>

                <input
                  id="transaction-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(event) =>
                    setAmount(event.target.value)
                  }
                  disabled={loading}
                  placeholder="Enter transaction amount"
                />
              </div>
            </div>

            <div className="feature-contract">
              <div>
                <span className="contract-label">
                  MODEL INPUT
                </span>

                <strong>432 features</strong>
              </div>

              <span>
                Input is validated against the exact
                XGBoost feature contract.
              </span>
            </div>

            {error && (
              <div className="new-transaction-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="primary-action-button"
              disabled={
                !jsonInput ||
                !amount ||
                loading
              }
            >
              {loading
                ? "ANALYZING TRANSACTION..."
                : "RUN RISK ANALYSIS"}
            </button>
          </form>
        </section>

        <section className="analysis-card prediction-result-card">
          <div className="analysis-card-header">
            <div>
              <h2>Risk Result</h2>

              <p>
                Prediction generated by the production
                fraud model.
              </p>
            </div>
          </div>

          {!result ? (
            <div className="empty-result-state">
              <div className="empty-result-icon">
                AI
              </div>

              <h3>No analysis yet</h3>

              <p>
                Provide a valid 432-feature transaction
                record and run the risk analysis.
              </p>
            </div>
          ) : (
            <div className="new-prediction-result">
              <div className="new-result-level">
                <span>RISK LEVEL</span>

                <strong
                  className={`risk-${String(
                    result.risk_level,
                  ).toLowerCase()}`}
                >
                  {result.risk_level}
                </strong>
              </div>

              <div className="new-result-score">
                <span>RISK SCORE</span>

                <strong>
                  {Number(result.risk_score).toFixed(2)}
                </strong>
              </div>

              <div className="new-result-metrics">
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

                <div>
                  <span>TRANSACTION AMOUNT</span>

                  <strong>
                    ₹
                    {Number(
                      result.transaction_amount,
                    ).toFixed(2)}
                  </strong>
                </div>
              </div>

              <div className="saved-analysis-status">
                <span className="status-dot" />
                Analysis saved to transaction history
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
function handleFileUpload(event) {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);

      if (
        !parsed ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        throw new Error(
          "The uploaded JSON must contain a single transaction object.",
        );
      }

      setJsonInput(JSON.stringify(parsed, null, 2));
      setResult(null);
      setError("");

      if (
        parsed.TransactionAmt !== undefined &&
        parsed.TransactionAmt !== null
      ) {
        setAmount(
          Number(parsed.TransactionAmt).toFixed(2),
        );
      }
    } catch {
      setError(
        "Invalid JSON file. Upload a valid transaction feature file.",
      );
      setJsonInput("");
      setAmount("");
    }
  };

  reader.readAsText(file);
}
export default NewTransaction;