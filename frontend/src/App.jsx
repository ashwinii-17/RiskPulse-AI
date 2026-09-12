import { useEffect, useMemo, useState } from "react";
import "./App.css";
import Transactions from "./pages/Transactions";
import RiskAnalysis from "./pages/RiskAnalysis";
import ModelActivity from "./pages/ModelActivity";
import NewTransaction from "./pages/NewTransaction";

import {
  getRiskSummary,
  getTransactions,
} from "./services/api";


function ShieldLogo() {
  return (
    <div className="logo-mark">
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M24 4L40 10V21.5C40 31.7 33.5 40.3 24 44C14.5 40.3 8 31.7 8 21.5V10L24 4Z"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M16 24.5L21.5 30L33 18"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}


function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}


function TransactionIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h10" />
      <circle cx="18" cy="17" r="2" />
    </svg>
  );
}


function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.8-3 8.4-7 10-4-1.6-7-5.2-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}


function ActivityIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12h4l2.5-6 5 12 2.5-6H21" />
    </svg>
  );
}


function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20h-2.6v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.5-1H6v-2.6h.5A1.7 1.7 0 0 0 8 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V5H15v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1V14h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}


function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l5 5" />
    </svg>
  );
}


function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}


function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 15l7-7 7 7" />
    </svg>
  );
}


function RiskBadge({ level }) {
  return (
    <span className={`risk-badge risk-${level.toLowerCase()}`}>
      <span className="risk-dot" />
      {level}
    </span>
  );
}


function App() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState("overview");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [summaryData, transactionData] = await Promise.all([
          getRiskSummary(),
          getTransactions(),
        ]);

        setSummary(summaryData);
        setTransactions(transactionData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);


  const riskDistribution = useMemo(() => {
    if (!summary) {
      return [];
    }

    const total = summary.total_transactions || 1;

    return [
      {
        label: "Critical",
        count: summary.critical_count,
        percentage: Math.round((summary.critical_count / total) * 100),
        className: "critical",
      },
      {
        label: "High",
        count: summary.high_count,
        percentage: Math.round((summary.high_count / total) * 100),
        className: "high",
      },
      {
        label: "Medium",
        count: summary.medium_count,
        percentage: Math.round((summary.medium_count / total) * 100),
        className: "medium",
      },
      {
        label: "Low",
        count: summary.low_count,
        percentage: Math.round((summary.low_count / total) * 100),
        className: "low",
      },
    ];
  }, [summary]);


  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">
          <ShieldLogo />
        </div>
        <span>Initializing RiskPulse...</span>
      </div>
    );
  }


  if (error) {
    return (
      <div className="error-screen">
        <ShieldLogo />
        <h1>RiskPulse unavailable</h1>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Retry connection
        </button>
      </div>
    );
  }


  return (
    <div className="app-shell">

      <aside className="sidebar">

        <div className="brand">
          <ShieldLogo />

          <div>
            <div className="brand-name">
              Risk<span>Pulse</span>
            </div>
            <div className="brand-caption">
              AI RISK INTELLIGENCE
            </div>
          </div>
        </div>


        <nav className="navigation">

          <div className="nav-section-label">
            MONITORING
          </div>

          <button
            className={currentPage === "overview" ? "nav-item active" : "nav-item"}
            onClick={() => setCurrentPage("overview")}
          >
            <DashboardIcon />
            <span>Overview</span>
          </button>

          <button
            className={currentPage === "transactions" ? "nav-item active" : "nav-item"}
            onClick={() => setCurrentPage("transactions")}
          >
            <TransactionIcon />
            <span>Transactions</span>
          </button>

          <button
            className={`nav-item ${
              currentPage === "risk-analysis" ? "active" : ""
            }`}
            onClick={() => setCurrentPage("risk-analysis")}
          >
            <span className="nav-icon">
              {/* keep your existing Risk Analysis icon here */}
            </span>
            <span>Risk Analysis</span>
          </button>

          <button
            className={
              currentPage === "model-activity"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setCurrentPage("model-activity")}
          >
            <ActivityIcon />
            <span>Model Activity</span>
          </button>

          <button
            className={
              currentPage === "new-transaction"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setCurrentPage("new-transaction")}
          >
            <TransactionIcon />
            <span>New Risk Check</span>
          </button>


          <div className="nav-section-label second">
            SYSTEM
          </div>

          <button className="nav-item">
            <SettingsIcon />
            <span>Settings</span>
          </button>

        </nav>


        <div className="sidebar-bottom">

          <div className="model-status">
            <div className="status-icon">
              <span />
            </div>

            <div>
              <strong>AI Model Online</strong>
              <small>XGBoost · 432 features</small>
            </div>
          </div>

          <div className="sidebar-version">
            RiskPulse AI v1.0.0
          </div>

        </div>

      </aside>


      <main className="main-content">

        <header className="topbar">

          <div className="breadcrumb">
            <span>Risk Intelligence</span>
            <strong>/</strong>
            <b>Overview</b>
          </div>


          <div className="topbar-actions">

            <button className="icon-button" aria-label="Search">
              <SearchIcon />
            </button>

            <button className="icon-button notification" aria-label="Notifications">
              <BellIcon />
              <span />
            </button>

            <div className="user-profile">
              <div className="avatar">RA</div>
              <div className="user-info">
                <strong>Risk Analyst</strong>
                <span>Analyst Console</span>
              </div>
            </div>

          </div>

        </header>


        <div className="content">
          {currentPage === "transactions" ? (
            <Transactions />
          ) : currentPage === "risk-analysis" ? (
            <RiskAnalysis />
          ) : currentPage === "model-activity" ? (
            <ModelActivity />
          ) : currentPage === "new-transaction" ? (
            <NewTransaction />
          ) : (
            <>
            {/* overview content */}
            
          <section className="page-heading">

            <div>
              <div className="eyebrow">
                <span className="live-indicator" />
                LIVE MONITORING
              </div>

              <h1>Risk Overview</h1>

              <p>
                Monitor transaction risk and identify potentially fraudulent
                activity in real time.
              </p>
            </div>

            <div className="system-status">
              <span className="status-pulse" />
              Systems operational
            </div>

          </section>


          <section className="kpi-grid">

            <article className="kpi-card primary">
              <div className="kpi-top">
                <span className="kpi-label">TOTAL TRANSACTIONS</span>
                <div className="kpi-icon">
                  <TransactionIcon />
                </div>
              </div>

              <div className="kpi-value">
                {summary?.total_transactions ?? 0}
              </div>

              <div className="kpi-footer">
                <span className="trend positive">
                  <ArrowUpIcon />
                  Live
                </span>
                <span>Analyzed transactions</span>
              </div>
            </article>


            <article className="kpi-card critical-card">
              <div className="kpi-top">
                <span className="kpi-label">CRITICAL RISK</span>
                <div className="kpi-icon">
                  <ShieldIcon />
                </div>
              </div>

              <div className="kpi-value">
                {summary?.critical_count ?? 0}
              </div>

              <div className="kpi-footer">
                <span className="metric-label critical-text">
                  Immediate attention
                </span>
              </div>
            </article>


            <article className="kpi-card high-card">
              <div className="kpi-top">
                <span className="kpi-label">HIGH RISK</span>
                <div className="kpi-icon">
                  <ActivityIcon />
                </div>
              </div>

              <div className="kpi-value">
                {summary?.high_count ?? 0}
              </div>

              <div className="kpi-footer">
                <span className="metric-label high-text">
                  Review required
                </span>
              </div>
            </article>


            <article className="kpi-card medium-card">
              <div className="kpi-top">
                <span className="kpi-label">MEDIUM RISK</span>
                <div className="kpi-icon">
                  <ActivityIcon />
                </div>
              </div>

              <div className="kpi-value">
                {summary?.medium_count ?? 0}
              </div>

              <div className="kpi-footer">
                <span className="metric-label medium-text">
                  Monitor activity
                </span>
              </div>
            </article>


            <article className="kpi-card low-card">
              <div className="kpi-top">
                <span className="kpi-label">LOW RISK</span>
                <div className="kpi-icon">
                  <ShieldIcon />
                </div>
              </div>

              <div className="kpi-value">
                {summary?.low_count ?? 0}
              </div>

              <div className="kpi-footer">
                <span className="metric-label low-text">
                  Normal activity
                </span>
              </div>
            </article>

          </section>


          <section className="analytics-grid">

            <article className="panel distribution-panel">

              <div className="panel-heading">
                <div>
                  <h2>Risk Distribution</h2>
                  <p>Current transaction risk classification</p>
                </div>

                <div className="panel-badge">
                  {summary?.total_transactions ?? 0} TOTAL
                </div>
              </div>


              <div className="distribution-content">

                <div className="distribution-bars">

                  {riskDistribution.map((item) => (
                    <div className="distribution-row" key={item.label}>

                      <div className="distribution-label">
                        <span className={`legend-dot ${item.className}`} />
                        <span>{item.label}</span>
                        <strong>{item.count}</strong>
                      </div>

                      <div className="bar-track">
                        <div
                          className={`bar-fill ${item.className}`}
                          style={{ width: `${Math.max(item.percentage, item.count ? 8 : 0)}%` }}
                        />
                      </div>

                      <span className="percentage">
                        {item.percentage}%
                      </span>

                    </div>
                  ))}

                </div>

              </div>

            </article>


            <article className="panel model-panel">

              <div className="panel-heading">
                <div>
                  <h2>Model Status</h2>
                  <p>Production inference engine</p>
                </div>

                <span className="online-badge">
                  ONLINE
                </span>
              </div>


              <div className="model-body">

                <div className="model-visual">
                  <div className="model-ring">
                    <ShieldLogo />
                  </div>

                  <div>
                    <strong>XGBoost</strong>
                    <span>Fraud Classification Engine</span>
                  </div>
                </div>


                <div className="model-stats">

                  <div>
                    <span>Features</span>
                    <strong>432</strong>
                  </div>

                  <div>
                    <span>Risk Scale</span>
                    <strong>0 — 100</strong>
                  </div>

                  <div>
                    <span>Inference</span>
                    <strong>Active</strong>
                  </div>

                </div>

              </div>

            </article>

          </section>


          <section className="panel transactions-panel">

            <div className="panel-heading transaction-heading">

              <div>
                <h2>Recent Transactions</h2>
                <p>Latest transactions analyzed by RiskPulse AI</p>
              </div>

              <button className="view-all">
                View all
                <span>→</span>
              </button>

            </div>


            <div className="table-wrapper">

              <table>

                <thead>
                  <tr>
                    <th>TRANSACTION</th>
                    <th>AMOUNT</th>
                    <th>FRAUD PROBABILITY</th>
                    <th>RISK SCORE</th>
                    <th>RISK LEVEL</th>
                    <th>TIME</th>
                  </tr>
                </thead>

                <tbody>

                  {transactions.map((transaction) => (

                    <tr key={transaction.id}>

                      <td>
                        <div className="transaction-cell">
                          <div className="transaction-symbol">
                            <TransactionIcon />
                          </div>

                          <div>
                            <strong>{transaction.transaction_id}</strong>
                            <span>ID #{transaction.id}</span>
                          </div>
                        </div>
                      </td>


                      <td>
                        <strong className="amount">
                          {Number(transaction.transaction_amount).toFixed(2)}
                        </strong>
                      </td>


                      <td>
                        <div className="probability-cell">
                          <span>
                            {(Number(transaction.fraud_probability) * 100).toFixed(2)}%
                          </span>

                          <div className="mini-track">
                            <div
                              className="mini-fill"
                              style={{
                                width: `${Number(transaction.fraud_probability) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>


                      <td>
                        <strong className="score">
                          {Number(transaction.risk_score).toFixed(2)}
                        </strong>
                      </td>


                      <td>
                        <RiskBadge level={transaction.risk_level} />
                      </td>


                      <td>
                        <span className="timestamp">
                          {new Date(transaction.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

              {transactions.length === 0 && (
                <div className="empty-state">
                  No transactions have been analyzed yet.
                </div>
              )}

            </div>

          </section>


          <footer className="dashboard-footer">
            <span>RiskPulse AI</span>
            <span>AI-powered fraud risk intelligence platform</span>
          </footer>

              </>
            )}

          </div>

      </main>

    </div>
  );
}

export default App;