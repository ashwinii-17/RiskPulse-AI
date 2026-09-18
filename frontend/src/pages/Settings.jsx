import { useCallback, useEffect, useState } from "react";

import {
  getHealth,
  getModelSchema,
  getRiskSummary,
} from "../services/api";


const Settings = () => {
  const [systemStatus, setSystemStatus] = useState({
    api: "checking",
    database: "checking",
    models: "checking",
  });

  const [modelSchema, setModelSchema] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);


  const checkSystemStatus = useCallback(async () => {
    setRefreshing(true);

    const nextStatus = {
      api: "offline",
      database: "offline",
      models: "offline",
    };

    try {
      await getHealth();
      nextStatus.api = "online";
    } catch {
      nextStatus.api = "offline";
    }

    try {
      await getRiskSummary();
      nextStatus.database = "online";
    } catch {
      nextStatus.database = "offline";
    }

    try {
      const schema = await getModelSchema();

      setModelSchema(schema);
      nextStatus.models = "online";
    } catch {
      nextStatus.models = "offline";
    }

    setSystemStatus(nextStatus);
    setLastChecked(new Date());
    setRefreshing(false);
  }, []);


  useEffect(() => {
    checkSystemStatus();
  }, [checkSystemStatus]);


  const getStatusLabel = (status) => {
    if (status === "checking") {
      return "Checking";
    }

    if (status === "online") {
      return "Online";
    }

    return "Offline";
  };


  const getStatusClass = (status) => {
    if (status === "online") {
      return "status-online";
    }

    if (status === "checking") {
      return "status-checking";
    }

    return "status-offline";
  };


  const historicalFeatureCount =
    modelSchema?.models?.historical?.feature_count ??
    modelSchema?.feature_count ??
    432;


  const newTransactionFeatureCount =
    modelSchema?.models?.new_transaction?.feature_count ??
    10;


  return (
    <div className="settings-page">

      <div className="page-header">

        <div>
          <h1>Settings</h1>

          <p>
            Manage your RiskPulse AI analyst profile and system configuration.
          </p>
        </div>

      </div>


      {/* Analyst Profile */}

      <section className="settings-section profile-section">

        <div className="section-header">

          <h2>Analyst Profile</h2>

          <p>
            Your RiskPulse AI analyst account information.
          </p>

        </div>


        <div className="profile-card">

          <div className="profile-avatar">
            A
          </div>


          <div className="profile-info">

            <h3>Ashwini</h3>

            <p>
              Transaction Risk Analyst
            </p>

            <div className="status-badge">

              <span className="status-dot" />

              Active

            </div>

          </div>

        </div>

      </section>


      {/* Risk Engine */}

      <section className="settings-section">

        <div className="section-header">

          <h2>Risk Engine</h2>

          <p>
            Current fraud detection model configuration.
          </p>

        </div>


        <div className="settings-grid">

          <div className="setting-card">

            <span className="setting-label">
              Historical Transactions
            </span>

            <strong>
              RiskPulse XGBoost
            </strong>

            <p>
              {historicalFeatureCount}-feature fraud classification
            </p>

          </div>


          <div className="setting-card">

            <span className="setting-label">
              New Transactions
            </span>

            <strong>
              RiskPulse V2 XGBoost
            </strong>

            <p>
              {newTransactionFeatureCount}-feature new-transaction model
            </p>

          </div>


          <div className="setting-card">

            <span className="setting-label">
              Inference Engine
            </span>

            <strong>
              Production Inference
            </strong>

            <p>
              FastAPI risk analysis service
            </p>

          </div>


          <div className="setting-card">

            <span className="setting-label">
              Model Status
            </span>

            <strong
              className={
                systemStatus.models === "online"
                  ? "online-text"
                  : "offline-text"
              }
            >
              {getStatusLabel(systemStatus.models)}
            </strong>

            <p>
              XGBoost models
            </p>

          </div>

        </div>

      </section>


      {/* Bottom Grid */}

      <div className="settings-bottom-grid">


        {/* Risk Classification */}

        <section className="settings-section">

          <div className="section-header">

            <h2>Risk Classification</h2>

            <p>
              Current transaction risk thresholds.
            </p>

          </div>


          <div className="risk-thresholds">

            <div className="threshold-row">
              <span>LOW</span>
              <strong>0 – 24.99</strong>
            </div>

            <div className="threshold-row">
              <span>MEDIUM</span>
              <strong>25 – 49.99</strong>
            </div>

            <div className="threshold-row">
              <span>HIGH</span>
              <strong>50 – 74.99</strong>
            </div>

            <div className="threshold-row">
              <span>CRITICAL</span>
              <strong>75 – 100</strong>
            </div>

          </div>

        </section>


        {/* System Status */}

        <section className="settings-section">

          <div className="section-header">

            <div className="system-status-heading">

              <div>
                <h2>System Status</h2>

                <p>
                  Current RiskPulse AI service status.
                </p>
              </div>


              <button
                className="refresh-status-button"
                onClick={checkSystemStatus}
                disabled={refreshing}
              >
                {refreshing ? "Checking..." : "Refresh"}
              </button>

            </div>

          </div>


          <div className="system-status">

            <div className="system-row">

              <div>
                <strong>RiskPulse API</strong>
                <span>FastAPI backend</span>
              </div>

              <div
                className={`service-status ${getStatusClass(
                  systemStatus.api
                )}`}
              >
                <span className="status-dot" />

                {getStatusLabel(systemStatus.api)}
              </div>

            </div>


            <div className="system-row">

              <div>
                <strong>PostgreSQL</strong>
                <span>Transaction database</span>
              </div>

              <div
                className={`service-status ${getStatusClass(
                  systemStatus.database
                )}`}
              >
                <span className="status-dot" />

                {getStatusLabel(systemStatus.database)}
              </div>

            </div>


            <div className="system-row">

              <div>
                <strong>Fraud Models</strong>
                <span>
                  {historicalFeatureCount} / {newTransactionFeatureCount} features
                </span>
              </div>

              <div
                className={`service-status ${getStatusClass(
                  systemStatus.models
                )}`}
              >
                <span className="status-dot" />

                {getStatusLabel(systemStatus.models)}
              </div>

            </div>

          </div>


          {lastChecked && (
            <div className="last-checked">
              Last checked{" "}
              {lastChecked.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
          )}

        </section>

      </div>

    </div>
  );
};


export default Settings;