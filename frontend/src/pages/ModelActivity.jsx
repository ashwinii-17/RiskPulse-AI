import { useEffect, useMemo, useState } from "react";
import { getRiskSummary, getTransactions } from "../services/api";

function ModelActivity() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadModelActivity() {
      try {
        setLoading(true);
        setError("");

        const [transactionData, summaryData] = await Promise.all([
          getTransactions(),
          getRiskSummary(),
        ]);

        setTransactions(
          Array.isArray(transactionData) ? transactionData : [],
        );

        setSummary(summaryData || null);
      } catch (err) {
        setError(
          err.message || "Unable to load model activity.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadModelActivity();
  }, []);

  const averageRiskScore = useMemo(() => {
    if (!transactions.length) return 0;

    const total = transactions.reduce(
      (sum, transaction) =>
        sum + Number(transaction.risk_score || 0),
      0,
    );

    return total / transactions.length;
  }, [transactions]);

  const averageProbability = useMemo(() => {
    if (!transactions.length) return 0;

    const total = transactions.reduce(
      (sum, transaction) =>
        sum + Number(transaction.fraud_probability || 0),
      0,
    );

    return (total / transactions.length) * 100;
  }, [transactions]);

  if (loading) {
    return (
      <div className="page-state">
        <div className="page-state-title">
          Loading model activity...
        </div>

        <div className="page-state-text">
          Retrieving model inference and risk statistics.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-state">
        <div className="page-state-title">
          Model activity unavailable
        </div>

        <div className="page-state-text">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="model-activity-page">
      <div className="page-heading-row">
        <div>
          <div className="section-eyebrow">
            MODEL MONITORING
          </div>

          <h1>Model Activity</h1>

          <p>
            Monitor RiskPulse AI model inference and
            transaction risk classification activity.
          </p>
        </div>

        <div className="analysis-status">
          <span className="status-dot" />
          Production inference active
        </div>
      </div>

      <div className="model-status-card">
        <div>
          <div className="section-eyebrow">
            ACTIVE MODEL
          </div>

          <h2>XGBoost Fraud Classifier</h2>

          <p>
            Native XGBoost inference engine used for
            transaction-level fraud probability scoring.
          </p>
        </div>

        <span className="model-active-badge">
          ACTIVE
        </span>
      </div>

      <div className="model-kpi-grid">
        <div className="model-kpi-card">
          <span className="metric-label">
            ANALYZED TRANSACTIONS
          </span>

          <strong>
            {summary?.total_transactions ?? transactions.length}
          </strong>

          <span>
            Stored model predictions
          </span>
        </div>

        <div className="model-kpi-card">
          <span className="metric-label">
            AVG RISK SCORE
          </span>

          <strong>
            {averageRiskScore.toFixed(2)}
          </strong>

          <span>
            Across analyzed transactions
          </span>
        </div>

        <div className="model-kpi-card">
          <span className="metric-label">
            AVG FRAUD PROBABILITY
          </span>

          <strong>
            {averageProbability.toFixed(2)}%
          </strong>

          <span>
            Model probability output
          </span>
        </div>

        <div className="model-kpi-card">
          <span className="metric-label">
            MODEL FEATURES
          </span>

          <strong>432</strong>

          <span>
            Input features expected
          </span>
        </div>
      </div>

      <div className="model-activity-grid">
        <section className="analysis-card">
          <div className="analysis-card-header">
            <div>
              <h2>Risk Classification</h2>

              <p>
                Current distribution of model-assigned
                risk levels.
              </p>
            </div>
          </div>

          <div className="risk-distribution-list">
            <div className="model-risk-row">
              <span>CRITICAL</span>
              <strong>
                {summary?.critical_count ?? 0}
              </strong>
            </div>

            <div className="model-risk-row">
              <span>HIGH</span>
              <strong>
                {summary?.high_count ?? 0}
              </strong>
            </div>

            <div className="model-risk-row">
              <span>MEDIUM</span>
              <strong>
                {summary?.medium_count ?? 0}
              </strong>
            </div>

            <div className="model-risk-row">
              <span>LOW</span>
              <strong>
                {summary?.low_count ?? 0}
              </strong>
            </div>
          </div>
        </section>

        <section className="analysis-card">
          <div className="analysis-card-header">
            <div>
              <h2>Inference Configuration</h2>

              <p>
                Runtime configuration used by the risk
                prediction engine.
              </p>
            </div>
          </div>

          <div className="model-config-list">
            <div>
              <span>Model</span>
              <strong>XGBoost</strong>
            </div>

            <div>
              <span>Feature Count</span>
              <strong>432</strong>
            </div>

            <div>
              <span>Output</span>
              <strong>Fraud Probability</strong>
            </div>

            <div>
              <span>Risk Score</span>
              <strong>0–100</strong>
            </div>

            <div>
              <span>Inference</span>
              <strong>Production</strong>
            </div>
          </div>
        </section>
      </div>

      <section className="analysis-card model-recent-activity">
        <div className="analysis-card-header">
          <div>
            <h2>Recent Model Activity</h2>

            <p>
              Latest transactions evaluated by the
              RiskPulse inference engine.
            </p>
          </div>
        </div>

        <div className="model-activity-table">
          {transactions.slice(0, 10).map((transaction) => (
            <div
              className="model-activity-row"
              key={transaction.id}
            >
              <strong>
                {transaction.transaction_id}
              </strong>

              <span>
                ₹
                {Number(
                  transaction.transaction_amount || 0,
                ).toFixed(2)}
              </span>

              <span>
                {(
                  Number(
                    transaction.fraud_probability || 0,
                  ) * 100
                ).toFixed(2)}
                %
              </span>

              <span
                className={`risk-${String(
                  transaction.risk_level || "LOW",
                ).toLowerCase()}`}
              >
                {transaction.risk_level}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ModelActivity;