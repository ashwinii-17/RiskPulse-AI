import { useEffect, useState } from "react";
import { getTransactions } from "../services/api";

function RiskBadge({ level }) {
  return (
    <span className={`risk-badge risk-${level.toLowerCase()}`}>
      <span className="risk-dot" />
      {level}
    </span>
  );
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    async function loadTransactions() {
      try {
        const data = await getTransactions();
        setTransactions(data);
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, []);

  const filteredTransactions =
    filter === "ALL"
      ? transactions
      : transactions.filter(
          (transaction) => transaction.risk_level === filter
        );

  if (loading) {
    return (
      <div className="page-loading">
        Loading transaction intelligence...
      </div>
    );
  }

  return (
    <div className="transactions-page">

      <div className="transactions-page-header">
        <div>
          <div className="eyebrow">
            <span className="live-indicator" />
            TRANSACTION INTELLIGENCE
          </div>

          <h1>Transactions</h1>

          <p>
            Review and investigate transactions analyzed by RiskPulse AI.
          </p>
        </div>

        <div className="transaction-count">
          {transactions.length} TRANSACTIONS
        </div>
      </div>


      <div className="transaction-toolbar">

        <div className="filter-group">
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((level) => (
            <button
              key={level}
              className={filter === level ? "filter active" : "filter"}
              onClick={() => setFilter(level)}
            >
              {level}
            </button>
          ))}
        </div>

      </div>


      <div className="transaction-layout">

        <section className="panel transaction-list-panel">

          <div className="panel-heading">
            <div>
              <h2>Transaction Feed</h2>
              <p>Most recently analyzed activity</p>
            </div>
          </div>

          <div className="transaction-list">

            {filteredTransactions.map((transaction) => (

              <button
                key={transaction.id}
                className={
                  selected?.id === transaction.id
                    ? "transaction-row selected"
                    : "transaction-row"
                }
                onClick={() => setSelected(transaction)}
              >

                <div className="transaction-main">
                  <strong>{transaction.transaction_id}</strong>
                  <span>
                    {new Date(transaction.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="transaction-amount">
                  ₹{Number(transaction.transaction_amount).toFixed(2)}
                </div>

                <div className="transaction-score">
                  <span>Risk</span>
                  <strong>{Number(transaction.risk_score).toFixed(2)}</strong>
                </div>

                <RiskBadge level={transaction.risk_level} />

              </button>

            ))}

            {filteredTransactions.length === 0 && (
              <div className="empty-state">
                No transactions match this risk filter.
              </div>
            )}

          </div>

        </section>


        <section className="panel investigation-panel">

          {!selected ? (

            <div className="investigation-empty">
              <div className="investigation-icon">⌁</div>

              <h2>Select a transaction</h2>

              <p>
                Select a transaction from the feed to inspect its RiskPulse
                assessment.
              </p>
            </div>

          ) : (

            <div className="investigation-content">

              <div className="investigation-header">

                <div>
                  <span className="detail-label">
                    TRANSACTION ID
                  </span>

                  <h2>{selected.transaction_id}</h2>
                </div>

                <RiskBadge level={selected.risk_level} />

              </div>


              <div className="risk-score-display">

                <div>
                  <span className="detail-label">
                    RISK SCORE
                  </span>

                  <strong>
                    {Number(selected.risk_score).toFixed(2)}
                  </strong>

                  <span className="score-scale">
                    / 100
                  </span>
                </div>

                <div className="risk-score-bar">
                  <div
                    style={{
                      width: `${Number(selected.risk_score)}%`,
                    }}
                  />
                </div>

              </div>


              <div className="detail-grid">

                <div className="detail-card">
                  <span>TRANSACTION AMOUNT</span>
                  <strong>
                    ₹{Number(selected.transaction_amount).toFixed(2)}
                  </strong>
                </div>

                <div className="detail-card">
                  <span>FRAUD PROBABILITY</span>
                  <strong>
                    {(Number(selected.fraud_probability) * 100).toFixed(2)}%
                  </strong>
                </div>

                <div className="detail-card">
                  <span>RISK LEVEL</span>
                  <strong>{selected.risk_level}</strong>
                </div>

                <div className="detail-card">
                  <span>ANALYZED AT</span>
                  <strong>
                    {new Date(selected.created_at).toLocaleTimeString()}
                  </strong>
                </div>

              </div>


              <div className="assessment">

                <span className="detail-label">
                  AI ASSESSMENT
                </span>

                <h3>
                  {selected.risk_level === "CRITICAL"
                    ? "Immediate investigation recommended"
                    : selected.risk_level === "HIGH"
                    ? "Transaction requires analyst review"
                    : selected.risk_level === "MEDIUM"
                    ? "Transaction should be monitored"
                    : "Transaction appears within normal risk range"}
                </h3>

                <p>
                  RiskPulse XGBoost evaluated this transaction using the
                  production fraud detection model and generated a
                  probability-based risk assessment.
                </p>

              </div>


              <div className="investigation-meta">

                <div>
                  <span>MODEL</span>
                  <strong>XGBoost</strong>
                </div>

                <div>
                  <span>FEATURES</span>
                  <strong>432</strong>
                </div>

                <div>
                  <span>ENGINE</span>
                  <strong>RiskPulse AI</strong>
                </div>

              </div>

            </div>

          )}

        </section>

      </div>

    </div>
  );
}