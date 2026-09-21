import { useEffect, useMemo, useState } from "react";
import {
  getRiskSummary,
  getTransactions,
  getRiskAlerts,
  getAverageRiskScore,
} from "../services/api";
import RiskLevelIcon from "../components/RiskLevelIcon";


/* =========================================================
   ICONS
   ========================================================= */

function Icon({ name, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const icons = {
    alerts: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),

    critical: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6" />
        <path d="M12 16h.01" />
      </>
    ),

    warning: (
      <>
        <path d="M10.3 3.7 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4" />
        <path d="M12 16h.01" />
      </>
    ),

    analytics: (
      <>
        <path d="M4 19V9" />
        <path d="M10 19V5" />
        <path d="M16 19v-7" />
        <path d="M22 19v-11" />
      </>
    ),

    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),

    card: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 9h18" />
        <path d="M7 14h4" />
      </>
    ),

    percent: (
      <>
        <path d="m19 5-14 14" />
        <circle cx="7" cy="7" r="2" />
        <circle cx="17" cy="17" r="2" />
      </>
    ),

    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    document: (
      <>
        <path d="M6 3h9l4 4v14H6z" />
        <path d="M14 3v5h5" />
        <path d="M9 13h6" />
        <path d="M9 17h6" />
      </>
    ),

    database: (
      <>
        <ellipse cx="12" cy="5" rx="7" ry="3" />
        <path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5" />
        <path d="M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
      </>
    ),

    arrow: (
      <>
        <path d="M5 12h13" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),

    close: (
      <>
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
      </>
    ),
  };

  return <svg {...common}>{icons[name]}</svg>;
}


/* =========================================================
   RISK BADGE
   ========================================================= */

function RiskBadge({ level }) {
  return (
    <span className={`risk-badge risk-${level.toLowerCase()}`}>
      <RiskLevelIcon level={level} size={14} />
      <span>{level}</span>
    </span>
  );
}


/* =========================================================
   MAIN PAGE
   ========================================================= */

function ModelActivity() {
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [alertTotal, setAlertTotal] = useState(0);

  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [allAlerts, setAllAlerts] = useState([]);
  const [allAlertPage, setAllAlertPage] = useState(1);
  const [allAlertTotal, setAllAlertTotal] = useState(0);
  const [allAlertTotalPages, setAllAlertTotalPages] = useState(0);
  const [allAlertsLoading, setAllAlertsLoading] = useState(false);

  const [summary, setSummary] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  /* =========================================================
     LOAD RISK MONITOR
     ========================================================= */

  useEffect(() => {
    async function loadRiskMonitor() {
      try {
        setLoading(true);
        setError("");

        const [
          transactionData,
          summaryData,
          alertData,
          averageRiskData,
        ] = await Promise.all([
          getTransactions(),
          getRiskSummary(),
          getRiskAlerts(),
          getAverageRiskScore(),
        ]);

        const transactionList = Array.isArray(transactionData)
          ? transactionData
          : Array.isArray(transactionData?.transactions)
            ? transactionData.transactions
            : [];

        const alertList = Array.isArray(alertData?.transactions)
          ? alertData.transactions
          : [];

        setAlerts(alertList);
        setAlertTotal(
          Number(alertData?.total || 0)
        );

        setTransactions(transactionList);
        setSummary(summaryData || null);
        setAverageRiskScore(
          Number(
            averageRiskData?.average_risk_score || 0
          )
        );

        if (alertList.length > 0) {
          setSelected(alertList[0]);
        }
      } catch (err) {
        setError(
          err.message || "Unable to load Risk Monitor."
        );
      } finally {
        setLoading(false);
      }
    }

    loadRiskMonitor();
  }, []);


  /* =========================================================
     AVERAGE RISK SCORE
     ========================================================= */

  const [averageRiskScore, setAverageRiskScore] = useState(0);


  /* =========================================================
     LOAD ALL ALERTS
     ========================================================= */

  async function loadAllAlerts(page = 1) {
    try {
      setAllAlertsLoading(true);

      const data = await getRiskAlerts(
        page,
        50,
      );

      const list = Array.isArray(data?.transactions)
        ? data.transactions
        : [];

      setAllAlerts(list);
      setAllAlertPage(
        Number(data?.page || page)
      );
      setAllAlertTotal(
        Number(data?.total || 0)
      );
      setAllAlertTotalPages(
        Number(data?.total_pages || 0)
      );
    } catch (err) {
      setError(
        err.message || "Unable to load all risk alerts."
      );
    } finally {
      setAllAlertsLoading(false);
    }
  }


  /* =========================================================
     VIEW ALL ALERTS
     ========================================================= */

  async function handleViewAllAlerts() {
    setShowAllAlerts(true);
    await loadAllAlerts(1);
  }


  /* =========================================================
     CLOSE ALL ALERTS
     ========================================================= */

  function handleCloseAllAlerts() {
    setShowAllAlerts(false);
  }


  /* =========================================================
     CHANGE ALERT PAGE
     ========================================================= */

  async function handleAlertPageChange(page) {
    if (
      page < 1 ||
      page > allAlertTotalPages ||
      allAlertsLoading
    ) {
      return;
    }

    await loadAllAlerts(page);
  }


  /* =========================================================
     LOADING STATE
     ========================================================= */

  if (loading) {
    return (
      <div className="risk-monitor-state">
        Loading Risk Monitor...
      </div>
    );
  }


  /* =========================================================
     ERROR STATE
     ========================================================= */

  if (error && !showAllAlerts) {
    return (
      <div className="risk-monitor-state">
        <strong>Risk Monitor unavailable</strong>
        <span>{error}</span>
      </div>
    );
  }


  return (
    <div className="risk-monitor-page">


      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div className="risk-monitor-header">

        <div>
          <div className="risk-monitor-eyebrow">
            RISK OPERATIONS
          </div>

          <h1>Risk Monitor</h1>

          <p>
            Monitor transaction risk and identify activity
            requiring analyst attention.
          </p>
        </div>

        <div className="risk-engine-online">
          <span />
          Risk engine online
        </div>

      </div>


      {/* =====================================================
          KPI CARDS
          ===================================================== */}

      <div className="risk-monitor-kpis">

        <div className="risk-kpi-card">

          <div className="risk-kpi-icon blue">
            <Icon name="alerts" size={20} />
          </div>

          <div className="risk-kpi-content">
            <span>OPEN ALERTS</span>

            <strong>
              {alertTotal.toLocaleString()}
            </strong>

            <small>
              High and critical risk transactions
            </small>
          </div>

        </div>


        <div className="risk-kpi-card">

          <div className="risk-kpi-icon red">
            <RiskLevelIcon
              level="CRITICAL"
              size={20}
            />
          </div>

          <div className="risk-kpi-content">
            <span>CRITICAL</span>

            <strong>
              {summary?.critical_count ?? 0}
            </strong>

            <small>
              Immediate attention
            </small>
          </div>

        </div>


        <div className="risk-kpi-card">

          <div className="risk-kpi-icon amber">
            <RiskLevelIcon
              level="HIGH"
              size={20}
            />
          </div>

          <div className="risk-kpi-content">
            <span>HIGH RISK</span>

            <strong>
              {summary?.high_count ?? 0}
            </strong>

            <small>
              Analyst review required
            </small>
          </div>

        </div>


        <div className="risk-kpi-card">

          <div className="risk-kpi-icon purple">
            <Icon
              name="analytics"
              size={20}
            />
          </div>

          <div className="risk-kpi-content">
            <span>AVG RISK SCORE</span>

            <strong>
              {averageRiskScore.toFixed(2)}
            </strong>

            <small>
              Across all transactions            
            </small>
          </div>

        </div>

      </div>


      {/* =====================================================
          MAIN CONTENT
          ===================================================== */}

      <div className="risk-monitor-main">


        {/* ===================================================
            RISK ALERTS
            =================================================== */}

        <section className="risk-monitor-card alerts-card">

          <div className="risk-monitor-card-header">

            <div className="risk-card-title">

              <div className="risk-section-icon blue-icon">
                <Icon
                  name="alerts"
                  size={19}
                />
              </div>

              <div>
                <h2>Risk Alerts</h2>

                <p>
                  Transactions currently requiring analyst attention.
                </p>
              </div>

            </div>

            <div className="risk-card-actions">

              <span className="live-pill">
                <span />
                LIVE
              </span>

              <button
                type="button"
                className="view-all-button"
                onClick={handleViewAllAlerts}
              >
                View All
                <Icon
                  name="arrow"
                  size={14}
                />
              </button>

            </div>

          </div>


          <div className="risk-alert-table">

            <div className="risk-alert-head">
              <span>TRANSACTION ID</span>
              <span>AMOUNT</span>
              <span>RISK SCORE</span>
              <span>RISK LEVEL</span>
              <span>TIME</span>
              <span />
            </div>


            {alerts.length === 0 ? (
              <div className="risk-monitor-empty">
                No high-risk transactions currently require attention.
              </div>
            ) : (
              alerts.slice(0, 8).map(
                (transaction) => (
                  <button
                    key={transaction.id}
                    type="button"
                    className={
                      selected?.id === transaction.id
                        ? "risk-alert-row selected"
                        : "risk-alert-row"
                    }
                    onClick={() =>
                      setSelected(transaction)
                    }
                  >

                    <span className="alert-transaction-id">
                      {transaction.transaction_id}
                    </span>

                    <span>
                      ₹
                      {Number(
                        transaction.transaction_amount || 0,
                      ).toFixed(2)}
                    </span>

                    <strong>
                      {Number(
                        transaction.risk_score || 0,
                      ).toFixed(2)}
                    </strong>

                    <span>
                      <RiskBadge
                        level={transaction.risk_level}
                      />
                    </span>

                    <span className="alert-time">
                      {transaction.created_at
                        ? new Date(
                            transaction.created_at,
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                        : "--:--:--"}
                    </span>

                    <span className="alert-arrow">
                      <Icon
                        name="arrow"
                        size={15}
                      />
                    </span>

                  </button>
                )
              )
            )}

          </div>

        </section>


        {/* ===================================================
            INVESTIGATION
            =================================================== */}

        <section className="risk-monitor-card investigation-card">

          <div className="risk-monitor-card-header">

            <div className="risk-card-title">

              <div className="risk-section-icon search-icon">
                <Icon
                  name="search"
                  size={19}
                />
              </div>

              <div>
                <h2>
                  Transaction Investigation
                </h2>

                <p>
                  Inspect the RiskPulse assessment for the selected alert.
                </p>
              </div>

            </div>

          </div>


          {!selected ? (
            <div className="risk-investigation-empty">

              <div className="empty-search-icon">
                <Icon
                  name="search"
                  size={25}
                />
              </div>

              <h3>Select an alert</h3>

              <p>
                Select a high-risk transaction from the alert
                feed to inspect its risk assessment.
              </p>

            </div>
          ) : (
            <div className="risk-investigation-content">

              <div className="investigation-top">

                <div>
                  <span>TRANSACTION ID</span>

                  <h3>
                    {selected.transaction_id}
                  </h3>
                </div>

                <RiskBadge
                  level={selected.risk_level}
                />

              </div>


              <div className="risk-score-section">

                <span>RISK SCORE</span>

                <div className="risk-score-number">
                  {Number(
                    selected.risk_score || 0,
                  ).toFixed(2)}

                  <small>/ 100</small>
                </div>

                <div className="risk-progress">
                  <div
                    style={{
                      width: `${Math.min(
                        Math.max(
                          Number(
                            selected.risk_score || 0,
                          ),
                          0,
                        ),
                        100,
                      )}%`,
                    }}
                  />
                </div>

              </div>


              <div className="investigation-details">

                <div className="investigation-detail-card">

                  <div className="detail-icon blue-icon">
                    <Icon
                      name="card"
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
                        selected.transaction_amount || 0,
                      ).toFixed(2)}
                    </strong>
                  </div>

                </div>


                <div className="investigation-detail-card">

                  <div className="detail-icon green-icon">
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
                          selected.fraud_probability || 0,
                        ) * 100
                      ).toFixed(2)}
                      %
                    </strong>
                  </div>

                </div>


                <div className="investigation-detail-card">

                  <div className="detail-icon amber-icon">
                    <RiskLevelIcon
                      level={selected.risk_level}
                      size={17}
                    />
                  </div>

                  <div>
                    <span>
                      RISK LEVEL
                    </span>

                    <strong>
                      {selected.risk_level}
                    </strong>
                  </div>

                </div>


                <div className="investigation-detail-card">

                  <div className="detail-icon purple-icon">
                    <Icon
                      name="clock"
                      size={17}
                    />
                  </div>

                  <div>
                    <span>
                      ANALYZED AT
                    </span>

                    <strong>
                      {selected.created_at
                        ? new Date(
                            selected.created_at,
                          ).toLocaleTimeString()
                        : "--"}
                    </strong>
                  </div>

                </div>

              </div>


              <div className="risk-assessment-box">

                <div className="assessment-icon">
                  <Icon
                    name="document"
                    size={18}
                  />
                </div>

                <div>

                  <span>
                    RISK ASSESSMENT
                  </span>

                  <strong>
                    {selected.risk_level === "CRITICAL"
                      ? "Critical transaction requires immediate investigation"
                      : "High-risk transaction requires analyst review"}
                  </strong>

                  <p>
                    RiskPulse assigned this transaction a{" "}
                    {Number(
                      selected.risk_score || 0,
                    ).toFixed(2)}
                    /100 risk score with a fraud probability of{" "}
                    {(
                      Number(
                        selected.fraud_probability || 0,
                      ) * 100
                    ).toFixed(2)}
                    %.
                  </p>

                </div>

              </div>

            </div>
          )}

        </section>

      </div>


      {/* =====================================================
          RISK ENGINE STATUS
          ===================================================== */}

      <section className="risk-engine-card">

        <div className="risk-engine-header">

          <div className="risk-engine-title">

            <div className="risk-section-icon green-icon">
              <Icon
                name="database"
                size={19}
              />
            </div>

            <div>
              <h2>
                Risk Engine Status
              </h2>

              <p>
                Current production inference configuration.
              </p>
            </div>

          </div>

          <span className="engine-online-badge">
            ONLINE
          </span>

        </div>


        <div className="risk-engine-config">

          <div>
            <span>MODEL</span>
            <strong>XGBoost</strong>
          </div>

          <div>
            <span>FEATURE COUNT</span>
            <strong>432</strong>
          </div>

          <div>
            <span>OUTPUT</span>
            <strong>Fraud Probability</strong>
          </div>

          <div>
            <span>RISK SCORE</span>
            <strong>0 – 100</strong>
          </div>

          <div>
            <span>INFERENCE</span>
            <strong>Production</strong>
          </div>

        </div>

      </section>


      {/* =====================================================
          VIEW ALL ALERTS MODAL
          ===================================================== */}

      {showAllAlerts && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0, 0, 0, 0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "30px",
          }}
          onClick={handleCloseAllAlerts}
        >

          <div
            style={{
              width: "min(1100px, 95vw)",
              maxHeight: "90vh",
              background: "#0b1421",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: "14px",
              overflow: "hidden",
              boxShadow: "0 25px 80px rgba(0,0,0,0.55)",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "18px 22px",
                borderBottom:
                  "1px solid rgba(255,255,255,0.08)",
              }}
            >

              <div>
                <div
                  style={{
                    fontSize: "11px",
                    letterSpacing: "1.4px",
                    color: "#6ea8ff",
                    fontWeight: 700,
                    marginBottom: "5px",
                  }}
                >
                  RISK OPERATIONS
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontSize: "20px",
                  }}
                >
                  All Risk Alerts
                </h2>

                <p
                  style={{
                    margin: "5px 0 0",
                    color: "#71809a",
                    fontSize: "12px",
                  }}
                >
                  {allAlertTotal.toLocaleString()} high and critical
                  transactions
                </p>
              </div>


              <button
                type="button"
                onClick={handleCloseAllAlerts}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  border:
                    "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#aebbd0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <Icon
                  name="close"
                  size={18}
                />
              </button>

            </div>


            {/* MODAL CONTENT */}

            <div
              style={{
                overflowY: "auto",
                padding: "0",
              }}
            >

              {allAlertsLoading ? (
                <div
                  style={{
                    padding: "60px 20px",
                    textAlign: "center",
                    color: "#71809a",
                  }}
                >
                  Loading risk alerts...
                </div>
              ) : allAlerts.length === 0 ? (
                <div
                  style={{
                    padding: "60px 20px",
                    textAlign: "center",
                    color: "#71809a",
                  }}
                >
                  No risk alerts found.
                </div>
              ) : (
                <div className="risk-alert-table">

                  <div className="risk-alert-head">
                    <span>TRANSACTION ID</span>
                    <span>AMOUNT</span>
                    <span>RISK SCORE</span>
                    <span>RISK LEVEL</span>
                    <span>TIME</span>
                    <span />
                  </div>


                  {allAlerts.map(
                    (transaction) => (
                      <button
                        key={transaction.id}
                        type="button"
                        className={
                          selected?.id === transaction.id
                            ? "risk-alert-row selected"
                            : "risk-alert-row"
                        }
                        onClick={() => {
                          setSelected(transaction);
                          setShowAllAlerts(false);
                        }}
                      >

                        <span className="alert-transaction-id">
                          {transaction.transaction_id}
                        </span>

                        <span>
                          ₹
                          {Number(
                            transaction.transaction_amount || 0,
                          ).toFixed(2)}
                        </span>

                        <strong>
                          {Number(
                            transaction.risk_score || 0,
                          ).toFixed(2)}
                        </strong>

                        <span>
                          <RiskBadge
                            level={
                              transaction.risk_level
                            }
                          />
                        </span>

                        <span className="alert-time">
                          {transaction.created_at
                            ? new Date(
                                transaction.created_at,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })
                            : "--:--:--"}
                        </span>

                        <span className="alert-arrow">
                          <Icon
                            name="arrow"
                            size={15}
                          />
                        </span>

                      </button>
                    )
                  )}

                </div>
              )}

            </div>


            {/* MODAL FOOTER / PAGINATION */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "15px",
                padding: "14px 20px",
                borderTop:
                  "1px solid rgba(255,255,255,0.08)",
              }}
            >

              <span
                style={{
                  color: "#71809a",
                  fontSize: "12px",
                }}
              >
                {allAlertTotal > 0
                  ? `Page ${allAlertPage} of ${allAlertTotalPages}`
                  : "No alerts"}
              </span>


              <div
                style={{
                  display: "flex",
                  gap: "8px",
                }}
              >

                <button
                  type="button"
                  disabled={
                    allAlertPage <= 1 ||
                    allAlertsLoading
                  }
                  onClick={() =>
                    handleAlertPageChange(
                      allAlertPage - 1
                    )
                  }
                  style={{
                    padding: "8px 14px",
                    borderRadius: "7px",
                    border:
                      "1px solid rgba(255,255,255,0.10)",
                    background:
                      "rgba(255,255,255,0.04)",
                    color: "#b7c3d6",
                    cursor:
                      allAlertPage <= 1 ||
                      allAlertsLoading
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      allAlertPage <= 1 ||
                      allAlertsLoading
                        ? 0.45
                        : 1,
                  }}
                >
                  Previous
                </button>


                <button
                  type="button"
                  disabled={
                    allAlertPage >=
                      allAlertTotalPages ||
                    allAlertsLoading
                  }
                  onClick={() =>
                    handleAlertPageChange(
                      allAlertPage + 1
                    )
                  }
                  style={{
                    padding: "8px 14px",
                    borderRadius: "7px",
                    border:
                      "1px solid rgba(255,255,255,0.10)",
                    background:
                      "rgba(255,255,255,0.04)",
                    color: "#b7c3d6",
                    cursor:
                      allAlertPage >=
                        allAlertTotalPages ||
                      allAlertsLoading
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      allAlertPage >=
                        allAlertTotalPages ||
                      allAlertsLoading
                        ? 0.45
                        : 1,
                  }}
                >
                  Next
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default ModelActivity;