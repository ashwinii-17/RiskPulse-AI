import { useEffect, useState } from "react";
import { getRiskAnalytics } from "../services/api";


function Icon({ type }) {
  if (type === "transactions") {
    return (
      <svg viewBox="0 0 24 24" className="statistics-icon">
        <ellipse cx="12" cy="6" rx="7" ry="3" />
        <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
        <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
      </svg>
    );
  }

  if (type === "fraud") {
    return (
      <svg viewBox="0 0 24 24" className="statistics-icon">
        <path d="M12 3 21 7v5c0 5.5-3.8 8.8-9 10-5.2-1.2-9-4.5-9-10V7l9-4Z" />
        <path d="M12 8v5" />
        <circle cx="12" cy="16.5" r=".7" />
      </svg>
    );
  }

  if (type === "legitimate") {
    return (
      <svg viewBox="0 0 24 24" className="statistics-icon">
        <path d="M12 3 21 7v5c0 5.5-3.8 8.8-9 10-5.2-1.2-9-4.5-9-10V7l9-4Z" />
        <path d="m8 12 2.5 2.5L16 9" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="statistics-icon">
      <path d="M5 19V10" />
      <path d="M12 19V5" />
      <path d="M19 19v-7" />
      <path d="M3 19h18" />
    </svg>
  );
}


function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}


export default function RiskStatistics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        setError("");

        const data = await getRiskAnalytics();

        setAnalytics(data);
      } catch (err) {
        console.error("Risk statistics error:", err);
        setError(
          err?.message || "Failed to load statistics."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);


  if (loading) {
    return (
      <div className="risk-statistics-page">
        <div className="risk-statistics-loading">
          Loading risk statistics...
        </div>
      </div>
    );
  }


  if (error) {
    return (
      <div className="risk-statistics-page">
        <div className="risk-statistics-error">
          {error}
        </div>
      </div>
    );
  }


  const total =
    Number(
      analytics?.total_transactions
    ) || 0;

  const fraud =
    Number(
      analytics?.fraud_count
    ) || 0;

  const legitimate =
    Number(
      analytics?.legitimate_count
    ) || 0;

  const average =
    Number(
      analytics?.average_risk_score
    ) || 0;


  const distribution =
    analytics?.risk_distribution || {};


  const critical =
    Number(distribution.CRITICAL) || 0;

  const high =
    Number(distribution.HIGH) || 0;

  const medium =
    Number(distribution.MEDIUM) || 0;

  const low =
    Number(distribution.LOW) || 0;


  const fraudPercent =
    total > 0
      ? (fraud / total) * 100
      : 0;


  const criticalPercent =
    total > 0
      ? (critical / total) * 100
      : 0;

  const highPercent =
    total > 0
      ? (high / total) * 100
      : 0;

  const mediumPercent =
    total > 0
      ? (medium / total) * 100
      : 0;

  const lowPercent =
    total > 0
      ? (low / total) * 100
      : 0;


  const maxRisk =
    Math.max(
      critical,
      high,
      medium,
      low,
      1
    );


  return (
    <div className="risk-statistics-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="risk-statistics-header">

        <div>
          <div className="risk-statistics-eyebrow">
            ● DATA INSIGHTS
          </div>

          <h1 className="risk-statistics-title">
            Risk Statistics
          </h1>

          <p className="risk-statistics-subtitle">
            Visual analysis of transaction risk
            and fraud activity.
          </p>
        </div>

        <div className="risk-statistics-date">
          Database-wide statistics
        </div>

      </div>


      {/* =================================================
          KPI CARDS
      ================================================= */}

      <div className="risk-statistics-kpis">

        <div className="risk-statistics-kpi">
          <div className="statistics-kpi-icon blue">
            <Icon type="transactions" />
          </div>

          <div className="risk-statistics-kpi-label">
            Total Transactions
          </div>

          <div className="risk-statistics-kpi-value">
            {formatNumber(total)}
          </div>

          <div className="risk-statistics-kpi-change">
            Database-wide
          </div>
        </div>


        <div className="risk-statistics-kpi">
          <div className="statistics-kpi-icon red">
            <Icon type="fraud" />
          </div>

          <div className="risk-statistics-kpi-label">
            Fraudulent Transactions
          </div>

          <div className="risk-statistics-kpi-value">
            {formatNumber(fraud)}
          </div>

          <div className="risk-statistics-kpi-change red-text">
            {fraudPercent.toFixed(1)}% of total
          </div>
        </div>


        <div className="risk-statistics-kpi">
          <div className="statistics-kpi-icon green">
            <Icon type="legitimate" />
          </div>

          <div className="risk-statistics-kpi-label">
            Legitimate Transactions
          </div>

          <div className="risk-statistics-kpi-value">
            {formatNumber(legitimate)}
          </div>

          <div className="risk-statistics-kpi-change">
            {total > 0
              ? (
                  (legitimate / total) *
                  100
                ).toFixed(1)
              : "0.0"}
            % of total
          </div>
        </div>


        <div className="risk-statistics-kpi">
          <div className="statistics-kpi-icon yellow">
            <Icon type="score" />
          </div>

          <div className="risk-statistics-kpi-label">
            Average Risk Score
          </div>

          <div className="risk-statistics-kpi-value">
            {average.toFixed(2)}
          </div>

          <div className="risk-statistics-kpi-change yellow-text">
            Risk scale 0–100
          </div>
        </div>

      </div>


      {/* =================================================
          MAIN ANALYTICS
      ================================================= */}

      <div className="risk-statistics-grid">


        {/* ================================
            RISK DISTRIBUTION
        ================================= */}

        <div className="risk-statistics-card">

          <div className="risk-statistics-card-header">

            <div>
              <h2 className="risk-statistics-card-title">
                Risk Distribution
              </h2>

              <div className="risk-statistics-card-subtitle">
                Share of transactions by risk level
              </div>
            </div>

            <strong>
              {formatNumber(total)}
            </strong>

          </div>


          <div className="risk-distribution-list">

            <div className="risk-distribution-row">

              <span className="risk-distribution-label">
                Critical
              </span>

              <span className="risk-distribution-count">
                {formatNumber(critical)}
              </span>

              <div className="risk-distribution-track">
                <div
                  className="risk-distribution-bar risk-critical"
                  style={{
                    width: `${criticalPercent}%`,
                  }}
                />
              </div>

              <span className="risk-distribution-percent">
                {criticalPercent.toFixed(1)}%
              </span>

            </div>


            <div className="risk-distribution-row">

              <span className="risk-distribution-label">
                High
              </span>

              <span className="risk-distribution-count">
                {formatNumber(high)}
              </span>

              <div className="risk-distribution-track">
                <div
                  className="risk-distribution-bar risk-high"
                  style={{
                    width: `${highPercent}%`,
                  }}
                />
              </div>

              <span className="risk-distribution-percent">
                {highPercent.toFixed(1)}%
              </span>

            </div>


            <div className="risk-distribution-row">

              <span className="risk-distribution-label">
                Medium
              </span>

              <span className="risk-distribution-count">
                {formatNumber(medium)}
              </span>

              <div className="risk-distribution-track">
                <div
                  className="risk-distribution-bar risk-medium"
                  style={{
                    width: `${mediumPercent}%`,
                  }}
                />
              </div>

              <span className="risk-distribution-percent">
                {mediumPercent.toFixed(1)}%
              </span>

            </div>


            <div className="risk-distribution-row">

              <span className="risk-distribution-label">
                Low
              </span>

              <span className="risk-distribution-count">
                {formatNumber(low)}
              </span>

              <div className="risk-distribution-track">
                <div
                  className="risk-distribution-bar risk-low"
                  style={{
                    width: `${lowPercent}%`,
                  }}
                />
              </div>

              <span className="risk-distribution-percent">
                {lowPercent.toFixed(1)}%
              </span>

            </div>

          </div>

        </div>


        {/* ================================
            FRAUD VS LEGITIMATE
        ================================= */}

        <div className="risk-statistics-card">

          <div className="risk-statistics-card-header">

            <div>
              <h2 className="risk-statistics-card-title">
                Fraud vs Legitimate
              </h2>

              <div className="risk-statistics-card-subtitle">
                Transaction classification
              </div>
            </div>

          </div>


          <div className="fraud-chart">

            <div
              className="fraud-donut"
              style={{
                "--fraud-percent": `${fraudPercent}%`,
              }}
            >

              <div className="fraud-donut-content">

                <div className="fraud-donut-percent">
                  {fraudPercent.toFixed(1)}%
                </div>

                <div className="fraud-donut-label">
                  Fraud Rate
                </div>

              </div>

            </div>

          </div>


          <div className="fraud-legend">

            <div className="fraud-legend-item">

              <div className="fraud-legend-name">
                ● Fraud
              </div>

              <div className="fraud-legend-value">
                {formatNumber(fraud)}
              </div>

            </div>


            <div className="fraud-legend-item">

              <div className="fraud-legend-name">
                ● Legitimate
              </div>

              <div className="fraud-legend-value">
                {formatNumber(legitimate)}
              </div>

            </div>

          </div>

        </div>


        {/* ================================
            AVERAGE SCORE
        ================================= */}

        <div className="risk-statistics-card">

          <div className="risk-statistics-card-header">

            <div>
              <h2 className="risk-statistics-card-title">
                Average Risk Score
              </h2>

              <div className="risk-statistics-card-subtitle">
                Database-wide risk score
              </div>
            </div>

          </div>


          <div className="average-risk-score">

            <div className="average-risk-score-value">
              {average.toFixed(2)}
            </div>

            <div className="average-risk-score-label">
              Risk scale: 0 — 100
            </div>

            <div className="average-risk-track">

              <div
                className="average-risk-fill"
                style={{
                  width: `${Math.min(
                    Math.max(average, 0),
                    100
                  )}%`,
                }}
              />

            </div>

          </div>

        </div>


        {/* ================================
            RISK LEVEL COMPARISON
        ================================= */}

        <div className="risk-statistics-card">

          <div className="risk-statistics-card-header">

            <div>
              <h2 className="risk-statistics-card-title">
                Risk Level Comparison
              </h2>

              <div className="risk-statistics-card-subtitle">
                Relative transaction volume
              </div>
            </div>

          </div>


          <div className="risk-level-chart">

            <div className="risk-level-column">

              <span className="risk-level-value">
                {(critical / 1000).toFixed(1)}K
              </span>

              <div className="risk-level-bar-container">

                <div
                  className="risk-level-bar risk-critical"
                  style={{
                    height: `${Math.max(
                      (critical / maxRisk) * 100,
                      4
                    )}%`,
                  }}
                />

              </div>

              <span className="risk-level-name">
                Critical
              </span>

            </div>


            <div className="risk-level-column">

              <span className="risk-level-value">
                {(high / 1000).toFixed(1)}K
              </span>

              <div className="risk-level-bar-container">

                <div
                  className="risk-level-bar risk-high"
                  style={{
                    height: `${Math.max(
                      (high / maxRisk) * 100,
                      4
                    )}%`,
                  }}
                />

              </div>

              <span className="risk-level-name">
                High
              </span>

            </div>


            <div className="risk-level-column">

              <span className="risk-level-value">
                {(medium / 1000).toFixed(1)}K
              </span>

              <div className="risk-level-bar-container">

                <div
                  className="risk-level-bar risk-medium"
                  style={{
                    height: `${Math.max(
                      (medium / maxRisk) * 100,
                      4
                    )}%`,
                  }}
                />

              </div>

              <span className="risk-level-name">
                Medium
              </span>

            </div>


            <div className="risk-level-column">

              <span className="risk-level-value">
                {(low / 1000).toFixed(1)}K
              </span>

              <div className="risk-level-bar-container">

                <div
                  className="risk-level-bar risk-low"
                  style={{
                    height: `${Math.max(
                      (low / maxRisk) * 100,
                      4
                    )}%`,
                  }}
                />

              </div>

              <span className="risk-level-name">
                Low
              </span>

            </div>

          </div>

        </div>


      </div>

    </div>
  );
}