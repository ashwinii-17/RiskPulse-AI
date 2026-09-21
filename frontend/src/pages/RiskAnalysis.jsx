import { useEffect, useMemo, useState } from "react";
import {
  getTransactions,
  searchTransactions,
  predictRisk,
} from "../services/api";
import RiskLevelIcon from "../components/RiskLevelIcon";

function Icon({ name, size = 18 }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const icons = {
    chart: (
      <>
        <path d="M4 19V10" />
        <path d="M10 19V5" />
        <path d="M16 19v-7" />
        <path d="M22 19V3" />
      </>
    ),

    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),

    transaction: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
        <path d="M7 15h4" />
      </>
    ),

    percent: (
      <>
        <path d="m19 5-14 14" />
        <circle cx="7" cy="7" r="2" />
        <circle cx="17" cy="17" r="2" />
      </>
    ),

    warning: (
      <>
        <path d="M10.3 3.7 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4" />
        <path d="M12 16h.01" />
      </>
    ),

    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    ai: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M8 12h8" />
        <path d="M12 8v8" />
      </>
    ),

    arrow: (
      <>
        <path d="M5 12h13" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
  };

  return <svg {...props}>{icons[name]}</svg>;
}

function RiskAnalysis() {
  const [transactions, setTransactions] = useState([]);
  const [totalTransactionCount, setTotalTransactionCount] =
    useState(0);

  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [simulationAmount, setSimulationAmount] = useState("");
  const [simulationLoading, setSimulationLoading] =
    useState(false);
  const [simulationError, setSimulationError] = useState("");
  const [simulationResult, setSimulationResult] =
    useState(null);

  useEffect(() => {
    async function loadTransactions() {
      try {
        setLoading(true);
        setError("");

        const data = await getTransactions();

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.transactions)
            ? data.transactions
            : [];

        const total = Array.isArray(data)
          ? list.length
          : Number(data?.total || 0);

        setTransactions(list);
        setTotalTransactionCount(total);

        if (list.length > 0) {
          setSelectedId(list[0].id);
          setSimulationAmount(
            String(list[0].transaction_amount ?? ""),
          );
        }
      } catch (err) {
        setError(
          err.message ||
            "Unable to load transaction data.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, []);

  useEffect(() => {
    const query = search.trim();

    if (!query) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const results = await searchTransactions(query, 50);

        setTransactions(
          Array.isArray(results) ? results : [],
        );

        if (Array.isArray(results) && results.length > 0) {
          setSelectedId(results[0].id);
          setSimulationAmount(
            String(results[0].transaction_amount ?? ""),
          );
        } else {
          setSelectedId(null);
          setSimulationResult(null);
        }
      } catch (err) {
        setError(
          err.message ||
            "Unable to search transaction data.",
        );
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const selectedTransaction = useMemo(
    () =>
      transactions.find(
        (transaction) =>
          transaction.id === selectedId,
      ),
    [transactions, selectedId],
  );

  const filteredTransactions = search.trim()
    ? transactions
    : transactions;

  const featureCount =
    selectedTransaction?.model_features
      ? Object.keys(
          selectedTransaction.model_features,
        ).length
      : 0;

  const isNewTransaction =
    featureCount === 10;

  const isHistoricalTransaction =
    featureCount === 432;

  const modelName = isNewTransaction
    ? "XGBoost V2"
    : "XGBoost";

  const modelDescription = isNewTransaction
    ? "Dedicated 10-feature new-transaction fraud model"
    : "Original 432-feature fraud classification model";

  const analysisSource = isNewTransaction
    ? "New Transaction Analysis"
    : isHistoricalTransaction
      ? "IEEE-CIS Dataset"
      : "RiskPulse Analysis";

  const riskClass = (level) =>
    `risk-${String(
      level || "LOW",
    ).toLowerCase()}`;

  const selectTransaction = (transaction) => {
    setSelectedId(transaction.id);

    setSimulationAmount(
      String(
        transaction.transaction_amount ?? "",
      ),
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

    if (!selectedTransaction?.model_features) {
      setSimulationError(
        "Selected transaction model features are unavailable.",
      );
      return;
    }

    if (![10, 432].includes(featureCount)) {
      setSimulationError(
        `Unsupported model feature set: ${featureCount}.`,
      );
      return;
    }

    try {
      setSimulationLoading(true);
      setSimulationError("");
      setSimulationResult(null);

      const result = await predictRisk({
        transaction_id: `SIM-${Date.now()}`,
        transaction_amount: amount,
        features: {
          ...selectedTransaction.model_features,
          TransactionAmt: amount,
        },
        persist_result: false,
      });

      setSimulationResult({
        transaction_amount: amount,
        fraud_probability:
          result.fraud_probability,
        risk_score: result.risk_score,
        risk_level: result.risk_level,
      });
    } catch (err) {
      setSimulationError(
        err.message ||
          "Unable to analyze transaction risk.",
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
    <div className="risk-analysis-v2">

      {/* PAGE HEADER */}

      <div className="risk-analysis-v2-header">

        <div>

          <div className="risk-analysis-eyebrow">
            AI INVESTIGATION
          </div>

          <h1>Risk Analysis</h1>

          <p>
            Investigate transaction-level fraud risk generated by
            the RiskPulse XGBoost engine.
          </p>

        </div>

        <div className="risk-analysis-online">
          <span />
          Analysis engine active
        </div>

      </div>


      {/* MAIN TWO COLUMN AREA */}

      <div className="risk-analysis-workspace">

        {/* LEFT */}

        <section className="risk-analysis-panel transaction-panel">

          <div className="risk-panel-header">

            <div className="risk-panel-title">

              <div className="risk-panel-icon blue">
                <Icon name="chart" size={19} />
              </div>

              <div>

                <h2>Analyzed Transactions</h2>

                <p>
                  Select a transaction for detailed risk assessment.
                </p>

              </div>

            </div>

            <span className="risk-record-count">
              {totalTransactionCount.toLocaleString()} records
            </span>

          </div>


          {/* SEARCH */}

          <div className="risk-search-box">

            <Icon name="search" size={17} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by transaction ID..."
            />

          </div>


          {/* TRANSACTION LIST */}

          <div className="risk-transaction-list">

            {filteredTransactions.length === 0 ? (

              <div className="risk-empty-list">
                No matching transactions found.
              </div>

            ) : (

              filteredTransactions.map(
                (transaction) => {

                  const transactionFeatureCount =
                    transaction.model_features
                      ? Object.keys(
                          transaction.model_features,
                        ).length
                      : 0;

                  const selected =
                    selectedId === transaction.id;

                  return (
                    <button
                      key={transaction.id}
                      type="button"
                      className={
                        selected
                          ? "risk-transaction-row selected"
                          : "risk-transaction-row"
                      }
                      onClick={() =>
                        selectTransaction(transaction)
                      }
                    >

                      <div className="risk-transaction-main">

                        <strong>
                          {transaction.transaction_id}
                        </strong>

                        <span>
                          {(
                            Number(
                              transaction.fraud_probability ||
                                0,
                            ) * 100
                          ).toFixed(2)}
                          % probability
                        </span>

                        <small>
                          {transactionFeatureCount === 10
                            ? "V2 · 10 features"
                            : transactionFeatureCount === 432
                              ? "XGBoost · 432 features"
                              : `${transactionFeatureCount} features`}
                        </small>

                      </div>


                      <div className="risk-transaction-right">

                        <strong>
                          ₹
                          {Number(
                            transaction.transaction_amount ||
                              0,
                          ).toFixed(2)}
                        </strong>

                        <span
                          className={`risk-level-inline ${riskClass(
                            transaction.risk_level,
                          )}`}
                        >

                          <RiskLevelIcon
                            level={transaction.risk_level}
                            size={14}
                          />

                          <span>
                            {transaction.risk_level}
                          </span>

                        </span>

                      </div>


                      <Icon
                        name="arrow"
                        size={15}
                      />

                    </button>
                  );
                },
              )
            )}

          </div>

        </section>


        {/* RIGHT */}

        <section className="risk-analysis-panel assessment-panel">

          {!selectedTransaction ? (

            <div className="risk-empty-assessment">

              <Icon
                name="search"
                size={28}
              />

              <h3>Select a transaction</h3>

              <p>
                Select a transaction from the list to inspect
                its RiskPulse assessment.
              </p>

            </div>

          ) : (

            <>

              {/* ASSESSMENT HEADER */}

              <div className="risk-assessment-header">

                <div>

                  <div className="risk-analysis-eyebrow">
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

                  <RiskLevelIcon
                    level={
                      selectedTransaction.risk_level
                    }
                    size={17}
                  />

                  <span>
                    {selectedTransaction.risk_level}
                  </span>

                </span>

              </div>


              {/* SCORE */}

              <div className="risk-score-section">

                <span>RISK SCORE</span>

                <div className="risk-score-number">

                  {Number(
                    selectedTransaction.risk_score ||
                      0,
                  ).toFixed(2)}

                  <small>/100</small>

                </div>

                <div className="risk-score-progress">

                  <div
                    style={{
                      width: `${Math.min(
                        Math.max(
                          Number(
                            selectedTransaction.risk_score ||
                              0,
                          ),
                          0,
                        ),
                        100,
                      )}%`,
                    }}
                  />

                </div>

              </div>


              {/* SCENARIO */}

              <div className="risk-scenario-card">

                <div className="risk-scenario-heading">

                  <div className="risk-panel-icon blue">
                    <Icon
                      name="chart"
                      size={18}
                    />
                  </div>

                  <div>

                    <div className="risk-analysis-eyebrow">
                      SCENARIO ANALYSIS
                    </div>

                    <h3>
                      Counterfactual Risk Analysis
                    </h3>

                  </div>

                </div>

                <p>
                  Change the transaction amount and observe how
                  the selected model responds while all other
                  transaction features remain unchanged.
                </p>


                <div className="risk-simulation-row">

                  <div className="risk-amount-input">

                    <span>₹</span>

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={simulationAmount}
                      onChange={(event) =>
                        setSimulationAmount(
                          event.target.value,
                        )
                      }
                      disabled={
                        simulationLoading
                      }
                    />

                  </div>

                  <button
                    type="button"
                    className="risk-analyze-button"
                    onClick={handleSimulation}
                    disabled={
                      simulationLoading
                    }
                  >
                    {simulationLoading
                      ? "Analyzing..."
                      : "Analyze Risk"}
                  </button>

                </div>

                {simulationError && (
                  <div className="risk-simulation-error">
                    {simulationError}
                  </div>
                )}

              </div>


              {/* SIMULATION RESULT */}

              {simulationResult && (

                <div className="risk-simulation-result">

                  <div className="risk-simulation-result-main">

                    <div className="risk-simulation-result-item">

                      <span>
                        ORIGINAL AMOUNT
                      </span>

                      <strong>
                        ₹
                        {Number(
                          selectedTransaction.transaction_amount ||
                            0,
                        ).toFixed(2)}
                      </strong>

                    </div>

                    <div className="risk-simulation-arrow">
                      →
                    </div>

                    <div className="risk-simulation-result-item">

                      <span>
                        SIMULATED AMOUNT
                      </span>

                      <strong>
                        ₹
                        {Number(
                          simulationResult.transaction_amount ||
                            0,
                        ).toFixed(2)}
                      </strong>

                    </div>

                    <div className="risk-simulation-result-divider" />

                    <div className="risk-simulation-result-item">

                      <span>
                        SIMULATED RISK
                      </span>

                      <strong>
                        {Number(
                          simulationResult.risk_score ||
                            0,
                        ).toFixed(2)}
                        <small>/100</small>
                      </strong>

                    </div>

                  </div>

                  <span
                    className={`large-risk-badge ${riskClass(
                      simulationResult.risk_level,
                    )}`}
                  >

                    <RiskLevelIcon
                      level={
                        simulationResult.risk_level
                      }
                      size={17}
                    />

                    <span>
                      {simulationResult.risk_level}
                    </span>

                  </span>

                </div>
              )}


              {/* METRICS */}

              <div className="risk-detail-grid">

                <div className="risk-detail-card">

                  <div className="risk-detail-icon blue">
                    <Icon
                      name="transaction"
                      size={17}
                    />
                  </div>

                  <div>

                    <span>
                      TRANSACTION AMOUNT
                    </span>

                    <strong>
                      ₹
                      {Number(
                        selectedTransaction.transaction_amount ||
                          0,
                      ).toFixed(2)}
                    </strong>

                  </div>

                </div>


                <div className="risk-detail-card">

                  <div className="risk-detail-icon green">
                    <Icon
                      name="percent"
                      size={17}
                    />
                  </div>

                  <div>

                    <span>
                      FRAUD PROBABILITY
                    </span>

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

                </div>


                <div className="risk-detail-card">

                  <div className="risk-detail-icon amber">
                    <Icon
                      name="warning"
                      size={17}
                    />
                  </div>

                  <div>

                    <span>
                      RISK CLASSIFICATION
                    </span>

                    <strong>
                      {selectedTransaction.risk_level}
                    </strong>

                  </div>

                </div>


                <div className="risk-detail-card">

                  <div className="risk-detail-icon purple">
                    <Icon
                      name="clock"
                      size={17}
                    />
                  </div>

                  <div>

                    <span>
                      ANALYSIS SOURCE
                    </span>

                    <strong>
                      {analysisSource}
                    </strong>

                  </div>

                </div>

              </div>


              {/* AI ASSESSMENT */}

              <div className="risk-ai-box">

                <div className="risk-detail-icon blue">
                  <Icon
                    name="ai"
                    size={17}
                  />
                </div>

                <div>

                  <h3>
                    AI Risk Assessment
                  </h3>

                  <p>
                    The{" "}
                    <strong>{modelName}</strong>{" "}
                    assigned this transaction a risk score of{" "}
                    <strong>
                      {Number(
                        selectedTransaction.risk_score ||
                          0,
                      ).toFixed(2)}
                    </strong>{" "}
                    based on its{" "}
                    <strong>
                      {featureCount}-feature
                    </strong>{" "}
                    model input.
                  </p>

                </div>

              </div>


              {/* MODEL FOOTER */}

              <div className="risk-model-footer">

                <div>

                  <span>MODEL</span>

                  <strong>
                    {modelName}
                  </strong>

                  <small>
                    {modelDescription}
                  </small>

                </div>

                <div>

                  <span>FEATURES</span>

                  <strong>
                    {featureCount}
                  </strong>

                </div>

                <div>

                  <span>ENGINE</span>

                  <strong>
                    {isNewTransaction
                      ? "New Transaction Inference"
                      : "Production Inference"}
                  </strong>

                </div>

              </div>

            </>

          )}

        </section>

      </div>

    </div>
  );
}

export default RiskAnalysis;