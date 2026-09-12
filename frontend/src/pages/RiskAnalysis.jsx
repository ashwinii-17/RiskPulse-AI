import { useEffect, useMemo, useState } from "react";
import { getTransactions, predictRisk } from "../services/api";

function RiskAnalysis() {
  const [transactions, setTransactions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [simulationAmount, setSimulationAmount] = useState("");
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationError, setSimulationError] = useState("");
  const [simulationResult, setSimulationResult] = useState(null);

  useEffect(() => {
    async function loadTransactions() {
      try {
        setLoading(true);
        setError("");

        const data = await getTransactions();

        setTransactions(Array.isArray(data) ? data : []);

        if (Array.isArray(data) && data.length > 0) {
          setSelectedId(data[0].id);
          setSimulationAmount(
            String(data[0].transaction_amount),
          );
        }
      } catch (err) {
        setError(
          err.message || "Unable to load transaction data.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, []);

  const selectedTransaction = useMemo(
    () =>
      transactions.find(
        (transaction) => transaction.id === selectedId,
      ),
    [transactions, selectedId],
  );

  const riskClass = (level) => {
    if (!level) return "risk-low";

    return `risk-${level.toLowerCase()}`;
  };

  const getRiskInterpretation = (level, score) => {
    const numericScore = Number(score || 0);

    switch (level) {
      case "CRITICAL":
        return {
          title: "CRITICAL MODEL RISK",
          message: `The risk score of ${numericScore.toFixed(
            2,
          )} exceeds the critical-risk threshold. Immediate transaction review is recommended.`,
        };

      case "HIGH":
        return {
          title: "HIGH MODEL RISK",
          message: `The risk score of ${numericScore.toFixed(
            2,
          )} exceeds the high-risk threshold. Further transaction review is recommended.`,
        };

      case "MEDIUM":
        return {
          title: "MEDIUM MODEL RISK",
          message: `The risk score of ${numericScore.toFixed(
            2,
          )} falls within the medium-risk range. Additional monitoring may be appropriate.`,
        };

      case "LOW":
      default:
        return {
          title: "LOW MODEL RISK",
          message: `The risk score of ${numericScore.toFixed(
            2,
          )} falls within the low-risk range based on the current transaction profile.`,
        };
    }
  };

  const handleTransactionSelect = (transaction) => {
    setSelectedId(transaction.id);

    setSimulationAmount(
      String(transaction.transaction_amount),
    );

    setSimulationResult(null);
    setSimulationError("");
  };

  const handleSimulation = async () => {
    const amount = Number(simulationAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setSimulationError(
        "Enter a valid transaction amount greater than zero.",
      );
      return;
    }

    if (
      !selectedTransaction.model_features ||
      Object.keys(selectedTransaction.model_features).length !== 432
    ) {
      setSimulationError(
        "The selected transaction does not contain the required 432 model features.",
      );
      return;
    }

    try {
      setSimulationLoading(true);
      setSimulationError("");
      setSimulationResult(null);

      const simulationFeatures = {
        ...selectedTransaction.model_features,
        TransactionAmt: amount,
      };

      const result = await predictRisk({
        transaction_id: `SIM-${Date.now()}`,
        transaction_amount: amount,
        features: simulationFeatures,
        persist_result: false,
      });

      setSimulationResult({
        transaction_id: result.transaction_id,
        transaction_amount: amount,
        fraud_probability: result.fraud_probability,
        risk_score: result.risk_score,
        risk_level: result.risk_level,
      });

      setSimulationAmount(String(amount));
    } catch (err) {
      setSimulationError(
        err.message || "Unable to analyze transaction risk.",
      );
    } finally {
      setSimulationLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-state">
        <div className="page-state-title">
          Loading risk intelligence...
        </div>

        <div className="page-state-text">
          Retrieving analyzed transactions from RiskPulse AI.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-state">
        <div className="page-state-title">
          Risk analysis unavailable
        </div>

        <div className="page-state-text">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="risk-analysis-page">
      {/* PAGE HEADER */}

      <div className="page-heading-row">
        <div>
          <div className="section-eyebrow">
            AI INVESTIGATION
          </div>

          <h1>Risk Analysis</h1>

          <p>
            Investigate transaction-level fraud risk generated by
            the RiskPulse XGBoost engine.
          </p>
        </div>

        <div className="analysis-status">
          <span className="status-dot" />
          Analysis engine active
        </div>
      </div>

      <div className="analysis-grid">
        {/* LEFT — ANALYZED TRANSACTIONS */}

        <section className="analysis-card transaction-selector">
          <div className="analysis-card-header">
            <div>
              <h2>Analyzed Transactions</h2>

              <p>
                Select a transaction for detailed risk assessment.
              </p>
            </div>

            <span className="record-count">
              {transactions.length} records
            </span>
          </div>

          <div className="analysis-transaction-list">
            {transactions.map((transaction) => (
              <button
                key={transaction.id}
                type="button"
                className={`analysis-transaction ${
                  selectedId === transaction.id
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  handleTransactionSelect(transaction)
                }
              >
                <div className="analysis-transaction-main">
                  <strong>
                    {transaction.transaction_id}
                  </strong>

                  <span>
                    ₹
                    {Number(
                      transaction.transaction_amount || 0,
                    ).toFixed(2)}
                  </span>
                </div>

                <div className="analysis-transaction-meta">
                  <span>
                    {(
                      Number(
                        transaction.fraud_probability || 0,
                      ) * 100
                    ).toFixed(2)}
                    % probability
                  </span>

                  <span
                    className={riskClass(
                      transaction.risk_level,
                    )}
                  >
                    {transaction.risk_level}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* RIGHT — INVESTIGATION */}

        <section className="analysis-card investigation-card">
          {selectedTransaction ? (
            <>
              {/* TRANSACTION HEADER */}

              <div className="analysis-card-header">
                <div>
                  <div className="section-eyebrow">
                    TRANSACTION ASSESSMENT
                  </div>

                  <h2>
                    {selectedTransaction.transaction_id}
                  </h2>
                </div>

                <span
                  className={`large-risk-badge ${riskClass(
                    selectedTransaction.risk_level,
                  )}`}
                >
                  {selectedTransaction.risk_level}
                </span>
              </div>

              {/* ORIGINAL RISK SCORE */}

              <div className="risk-score-panel">
                <div>
                  <span className="metric-label">
                    RISK SCORE
                  </span>

                  <div className="risk-score-value">
                    {Number(
                      selectedTransaction.risk_score || 0,
                    ).toFixed(2)}

                    <span>/100</span>
                  </div>
                </div>

                <div className="risk-score-bar">
                  <div
                    className="risk-score-fill"
                    style={{
                      width: `${Math.min(
                        Math.max(
                          Number(
                            selectedTransaction.risk_score || 0,
                          ),
                          0,
                        ),
                        100,
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* COUNTERFACTUAL ANALYSIS */}

              <div className="risk-simulator">
                <div className="risk-simulator-header">
                  <div>
                    <div className="section-eyebrow">
                      SCENARIO ANALYSIS
                    </div>

                    <h3>
                      Counterfactual Risk Analysis
                    </h3>

                    <p>
                      Change the transaction amount and observe
                      how the trained model responds while all
                      other transaction features remain
                      unchanged.
                    </p>
                  </div>
                </div>

                <div className="risk-simulator-form">
                  <div className="simulator-input-group">
                    <label htmlFor="simulation-amount">
                      Transaction Amount
                    </label>

                    <div className="amount-input-wrapper">
                      <span>₹</span>

                      <input
                        id="simulation-amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={simulationAmount}
                        onChange={(event) => {
                          setSimulationAmount(
                            event.target.value,
                          );
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="simulate-risk-button"
                    disabled={simulationLoading}
                    onClick={handleSimulation}
                  >
                    {simulationLoading
                      ? "Analyzing..."
                      : "Analyze Risk"}
                  </button>
                </div>

                {simulationError && (
                  <div className="simulation-error">
                    {simulationError}
                  </div>
                )}
              </div>

              {/* SIMULATION RESULT */}

              {simulationResult && (
                <div className="simulation-result">
                  <div className="simulation-result-header">
                    <div>
                      <div className="section-eyebrow">
                        SIMULATION RESULT
                      </div>

                      <h3>
                        Counterfactual Model Response
                      </h3>
                    </div>

                    <span
                      className={`large-risk-badge ${riskClass(
                        simulationResult.risk_level,
                      )}`}
                    >
                      {simulationResult.risk_level}
                    </span>
                  </div>

                  <div className="simulation-result-metrics">
                    <div className="simulation-result-metric">
                      <span>SIMULATED AMOUNT</span>

                      <strong>
                        ₹
                        {Number(
                          simulationResult.transaction_amount ||
                            0,
                        ).toFixed(2)}
                      </strong>
                    </div>

                    <div className="simulation-result-metric">
                      <span>FRAUD PROBABILITY</span>

                      <strong>
                        {(
                          Number(
                            simulationResult.fraud_probability ||
                              0,
                          ) * 100
                        ).toFixed(2)}
                        %
                      </strong>
                    </div>

                    <div className="simulation-result-metric">
                      <span>RISK SCORE</span>

                      <strong>
                        {Number(
                          simulationResult.risk_score || 0,
                        ).toFixed(2)}
                        /100
                      </strong>
                    </div>

                    <div className="simulation-result-metric">
                      <span>RISK CHANGE</span>

                      <strong
                        className={
                          Number(
                            simulationResult.risk_score || 0,
                          ) -
                            Number(
                              selectedTransaction.risk_score ||
                                0,
                            ) >
                          0
                            ? "risk-change-positive"
                            : Number(
                                  simulationResult.risk_score ||
                                    0,
                                ) -
                                  Number(
                                    selectedTransaction.risk_score ||
                                      0,
                                  ) <
                              0
                            ? "risk-change-negative"
                            : "risk-change-neutral"
                        }
                      >
                        {Number(
                          simulationResult.risk_score || 0,
                        ) -
                          Number(
                            selectedTransaction.risk_score || 0,
                          ) >
                        0
                          ? "+"
                          : ""}
                        {(
                          Number(
                            simulationResult.risk_score || 0,
                          ) -
                          Number(
                            selectedTransaction.risk_score || 0,
                          )
                        ).toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  <div className="simulation-result-bar">
                    <div
                      className="simulation-result-bar-fill"
                      style={{
                        width: `${Math.min(
                          Math.max(
                            Number(
                              simulationResult.risk_score || 0,
                            ),
                            0,
                          ),
                          100,
                        )}%`,
                      }}
                    />
                  </div>

                  {/* DYNAMIC RISK INTERPRETATION */}

                  <div
                    className={`simulation-interpretation ${riskClass(
                      simulationResult.risk_level,
                    )}`}
                  >
                    {(() => {
                      const interpretation =
                        getRiskInterpretation(
                          simulationResult.risk_level,
                          simulationResult.risk_score,
                        );

                      return (
                        <>
                          <strong>
                            {interpretation.title}
                          </strong>

                          <p>
                            {interpretation.message}
                          </p>
                        </>
                      );
                    })()}
                  </div>

                  {/* COUNTERFACTUAL EXPLANATION */}

                  <div className="simulation-result-message">
                    This is a counterfactual scenario: the XGBoost
                    model evaluated the selected transaction
                    profile after changing only the transaction
                    amount. The displayed risk level represents
                    the model's predicted fraud risk for this
                    modified feature profile.
                  </div>
                </div>
              )}

              {/* ORIGINAL TRANSACTION METRICS */}

              <div className="investigation-metrics">
                <div className="investigation-metric">
                  <span>Transaction Amount</span>

                  <strong>
                    ₹
                    {Number(
                      selectedTransaction.transaction_amount ||
                        0,
                    ).toFixed(2)}
                  </strong>
                </div>

                <div className="investigation-metric">
                  <span>Fraud Probability</span>

                  <strong>
                    {(
                      Number(
                        selectedTransaction.fraud_probability ||
                          0,
                      ) * 100
                    ).toFixed(2)}
                    %
                  </strong>
                </div>

                <div className="investigation-metric">
                  <span>Risk Classification</span>

                  <strong>
                    {selectedTransaction.risk_level}
                  </strong>
                </div>

                <div className="investigation-metric">
                  <span>Analysis Source</span>

                  <strong>
                    {selectedTransaction.transaction_id.startsWith(
                      "SIM-",
                    )
                      ? "Scenario Simulation"
                      : selectedTransaction.transaction_id.startsWith(
                            "LIVE-",
                          )
                        ? "Live Risk Analysis"
                        : "IEEE-CIS Dataset"}
                  </strong>
                </div>
              </div>

              {/* AI ASSESSMENT */}

              <div className="assessment-box">
                <div className="assessment-icon">
                  AI
                </div>

                <div>
                  <h3>AI Risk Assessment</h3>

                  <p>
                    The trained XGBoost fraud classification
                    engine assigned this transaction a risk score
                    of{" "}
                    <strong>
                      {Number(
                        selectedTransaction.risk_score || 0,
                      ).toFixed(2)}
                    </strong>{" "}
                    based on the transaction's model features.
                  </p>
                </div>
              </div>

              {/* MODEL INFORMATION */}

              <div className="model-information">
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
                  <strong>Production Inference</strong>
                </div>
              </div>
            </>
          ) : (
            <div className="page-state">
              <div className="page-state-title">
                No transaction selected
              </div>

              <div className="page-state-text">
                Select an analyzed transaction to begin
                investigation.
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default RiskAnalysis;