import { useEffect, useState } from "react";
import { getTransactions } from "../services/api";
import RiskLevelIcon from "../components/RiskLevelIcon";

/* =========================================================
   ICONS
========================================================= */

function AllIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </svg>
  );
}

function CriticalIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 21 20H3L12 3Z" />
      <path d="M12 9v5" />
      <circle cx="12" cy="17" r="1" />
    </svg>
  );
}

function HighIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 19 6v5c0 4.4-2.8 7.9-7 10-4.2-2.1-7-5.6-7-10V6l7-3Z" />
      <path d="M12 8v5" />
      <circle cx="12" cy="16.5" r="1" />
    </svg>
  );
}

function MediumIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function LowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 19 6v5c0 4.4-2.8 7.9-7 10-4.2-2.1-7-5.6-7-10V6l7-3Z" />
      <path d="m8.5 12 2.3 2.3 4.8-5" />
    </svg>
  );
}

function RiskBadge({ level }) {
  return (
    <span className={`risk-badge risk-${level.toLowerCase()}`}>
      <RiskLevelIcon level={level} size={13} />
      <span>{level}</span>
    </span>
  );
}


/* =========================================================
   FILTERS
========================================================= */

const FILTERS = [
  {
    key: "ALL",
    label: "All",
    className: "all",
    icon: AllIcon,
  },
  {
    key: "CRITICAL",
    label: "Critical",
    className: "critical",
    icon: CriticalIcon,
  },
  {
    key: "HIGH",
    label: "High",
    className: "high",
    icon: HighIcon,
  },
  {
    key: "MEDIUM",
    label: "Medium",
    className: "medium",
    icon: MediumIcon,
  },
  {
    key: "LOW",
    label: "Low",
    className: "low",
    icon: LowIcon,
  },
];


/* =========================================================
   TRANSACTIONS PAGE
========================================================= */

export default function Transactions({
  initialFilter = "ALL",
  initialTransactionId = null,
}) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const [filter, setFilter] = useState(
    initialFilter
  );

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const pageSize = 50;


  /* =========================================================
     LOAD TRANSACTIONS
  ========================================================= */

  useEffect(() => {
    async function loadTransactions() {
      try {
        setLoading(true);

        const data = await getTransactions(
          page,
          pageSize
        );

        const list = Array.isArray(
          data?.transactions
        )
          ? data.transactions
          : [];

        setTransactions(list);
        setTotal(
          Number(data?.total || 0)
        );
        setTotalPages(
          Number(data?.total_pages || 0)
        );

        if (initialTransactionId) {
          const matchedTransaction =
            list.find(
              (transaction) =>
                String(transaction.id) ===
                String(initialTransactionId)
            );

          if (matchedTransaction) {
            setSelected(
              matchedTransaction
            );
          }
        }
      } catch (error) {
        console.error(
          "Failed to load transactions:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, [
    page,
    initialTransactionId,
  ]);


  /* =========================================================
     FILTER TRANSACTIONS
  ========================================================= */

  const filteredTransactions =
    filter === "ALL"
      ? transactions
      : transactions.filter(
          (transaction) =>
            transaction.risk_level === filter
        );


  /* =========================================================
     PAGE RANGE
  ========================================================= */

  const firstTransaction =
    total === 0
      ? 0
      : (page - 1) * pageSize + 1;

  const lastTransaction =
    Math.min(
      page * pageSize,
      total
    );


  /* =========================================================
     PAGE CHANGE
  ========================================================= */

  function goToPage(nextPage) {
    if (
      nextPage < 1 ||
      nextPage > totalPages ||
      loading
    ) {
      return;
    }

    setSelected(null);
    setPage(nextPage);
  }


  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="page-loading">
        Loading transaction intelligence...
      </div>
    );
  }


  return (
    <div className="transactions-page">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="transactions-page-header">

        <div>

          <div className="eyebrow">
            <span className="live-indicator" />
            TRANSACTION INTELLIGENCE
          </div>

          <h1>
            Transactions
          </h1>

          <p>
            Review and investigate transactions
            analyzed by RiskPulse AI.
          </p>

        </div>


        <div className="transaction-count">

          <span className="count-icon">
            <AllIcon />
          </span>

          <div>

            <strong>
              {total.toLocaleString()}
            </strong>

            <span>
              TRANSACTIONS
            </span>

          </div>

        </div>

      </div>


      {/* =====================================================
          RISK FILTERS
      ===================================================== */}

      <div className="transaction-toolbar">

        <div className="filter-group">

          {FILTERS.map(
            ({
              key,
              label,
              className,
              icon: FilterIcon,
            }) => (
              <button
                key={key}
                type="button"
                className={
                  filter === key
                    ? `filter active filter-${className}`
                    : `filter filter-${className}`
                }
                onClick={() => {
                  setFilter(key);
                  setSelected(null);
                }}
              >

                <FilterIcon />

                <span>
                  {label}
                </span>

              </button>
            )
          )}

        </div>

      </div>


      {/* =====================================================
          MAIN TRANSACTION AREA
      ===================================================== */}

      <div className="transaction-layout">


        {/* ===================================================
            TRANSACTION FEED
        =================================================== */}

        <section className="panel transaction-list-panel">

          <div className="panel-heading">

            <div className="feed-heading-icon">
              <AllIcon />
            </div>

            <div>

              <h2>
                Transaction Feed
              </h2>

              <p>
                Showing page {page} of {totalPages}
              </p>

            </div>

          </div>


          <div className="transaction-list">

            {filteredTransactions.map(
              (transaction) => (

                <button
                  key={transaction.id}
                  type="button"
                  className={
                    selected?.id ===
                    transaction.id
                      ? "transaction-row selected"
                      : "transaction-row"
                  }
                  onClick={() =>
                    setSelected(
                      transaction
                    )
                  }
                >

                  <div className="transaction-main">

                    <strong>
                      {transaction.transaction_id}
                    </strong>

                    <span>
                      {transaction.created_at
                        ? new Date(
                            transaction.created_at
                          ).toLocaleString()
                        : "--"}
                    </span>

                  </div>


                  <div className="transaction-amount">

                    ₹
                    {Number(
                      transaction.transaction_amount ||
                        0
                    ).toFixed(2)}

                  </div>


                  <div className="transaction-score">

                    <span>
                      Risk
                    </span>

                    <strong>
                      {Number(
                        transaction.risk_score ||
                          0
                      ).toFixed(2)}
                    </strong>

                  </div>


                  <RiskBadge
                    level={
                      transaction.risk_level
                    }
                  />

                </button>
              )
            )}


            {filteredTransactions.length === 0 && (

              <div className="empty-state">
                No transactions match this risk filter.
              </div>

            )}


            {/* =================================================
                PAGINATION
            ================================================= */}

            {totalPages > 0 && (

              <div className="transaction-pagination">

                <button
                  type="button"
                  disabled={
                    page <= 1
                  }
                  onClick={() =>
                    goToPage(
                      page - 1
                    )
                  }
                >
                  ← Previous
                </button>


                <span>

                  Page {page} of {totalPages}

                  {" · "}

                  Showing{" "}
                  {firstTransaction}
                  –
                  {lastTransaction}
                  {" of "}
                  {total.toLocaleString()}

                </span>


                <button
                  type="button"
                  disabled={
                    page >= totalPages
                  }
                  onClick={() =>
                    goToPage(
                      page + 1
                    )
                  }
                >
                  Next →

                </button>

              </div>

            )}

          </div>

        </section>


        {/* ===================================================
            INVESTIGATION
        =================================================== */}

        <section className="panel investigation-panel">

          {!selected ? (

            <div className="investigation-empty">

              <div className="investigation-icon">
                ⌁
              </div>

              <h2>
                Select a transaction
              </h2>

              <p>
                Select a transaction from the feed
                to inspect its RiskPulse assessment.
              </p>

            </div>

          ) : (

            <div className="investigation-content">


              {/* HEADER */}

              <div className="investigation-header">

                <div>

                  <span className="detail-label">
                    TRANSACTION ID
                  </span>

                  <h2>
                    {selected.transaction_id}
                  </h2>

                </div>

                <RiskBadge
                  level={
                    selected.risk_level
                  }
                />

              </div>


              {/* RISK SCORE */}

              <div className="risk-score-display">

                <div>

                  <span className="detail-label">
                    RISK SCORE
                  </span>

                  <strong>
                    {Number(
                      selected.risk_score ||
                        0
                    ).toFixed(2)}
                  </strong>

                  <span className="score-scale">
                    / 100
                  </span>

                </div>


                <div className="risk-score-bar">

                  <div
                    style={{
                      width: `${Math.min(
                        Math.max(
                          Number(
                            selected.risk_score ||
                              0
                          ),
                          0
                        ),
                        100
                      )}%`,
                    }}
                  />

                </div>

              </div>


              {/* DETAILS */}

              <div className="detail-grid">


                {/* TRANSACTION AMOUNT */}

                <div className="detail-card amount-card">

                  <div className="detail-card-icon blue">

                    <svg viewBox="0 0 24 24">

                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="14"
                        rx="2"
                      />

                      <path d="M3 9h18" />

                      <path d="M7 15h4" />

                    </svg>

                  </div>

                  <div className="detail-card-content">

                    <span>
                      TRANSACTION AMOUNT
                    </span>

                    <strong>
                      ₹
                      {Number(
                        selected.transaction_amount ||
                          0
                      ).toFixed(2)}
                    </strong>

                  </div>

                </div>


                {/* FRAUD PROBABILITY */}

                <div className="detail-card probability-card">

                  <div className="detail-card-icon green">

                    <svg viewBox="0 0 24 24">

                      <path d="M7 17 17 7" />

                      <circle
                        cx="7"
                        cy="7"
                        r="2.5"
                      />

                      <circle
                        cx="17"
                        cy="17"
                        r="2.5"
                      />

                    </svg>

                  </div>

                  <div className="detail-card-content">

                    <span>
                      FRAUD PROBABILITY
                    </span>

                    <strong>
                      {(
                        Number(
                          selected.fraud_probability ||
                            0
                        ) * 100
                      ).toFixed(2)}
                      %
                    </strong>

                  </div>

                </div>


                {/* RISK LEVEL */}

                <div className="detail-card risk-level-card">

                  <div className="detail-card-icon amber">

                    <svg viewBox="0 0 24 24">

                      <path d="M12 3 20 7v5c0 4.5-3 7.9-8 10-5-2.1-8-5.5-8-10V7l8-4Z" />

                      <path d="M12 8v5" />

                      <circle
                        cx="12"
                        cy="16"
                        r="1"
                      />

                    </svg>

                  </div>

                  <div className="detail-card-content">

                    <span>
                      RISK LEVEL
                    </span>

                    <strong
                      className={`risk-value-${selected.risk_level.toLowerCase()}`}
                    >
                      {selected.risk_level}
                    </strong>

                  </div>

                </div>


                {/* ANALYZED AT */}

                <div className="detail-card analyzed-card">

                  <div className="detail-card-icon purple">

                    <svg viewBox="0 0 24 24">

                      <circle
                        cx="12"
                        cy="12"
                        r="8"
                      />

                      <path d="M12 7v5l3 2" />

                    </svg>

                  </div>

                  <div className="detail-card-content">

                    <span>
                      ANALYZED AT
                    </span>

                    <strong>
                      {selected.created_at
                        ? new Date(
                            selected.created_at
                          ).toLocaleTimeString(
                            [],
                            {
                              hour: "numeric",
                              minute: "2-digit",
                              second: "2-digit",
                            }
                          )
                        : "--"}
                    </strong>

                  </div>

                </div>

              </div>


              {/* AI ASSESSMENT */}

              <div className="assessment">

                <span className="detail-label">
                  AI ASSESSMENT
                </span>

                <h3>

                  {selected.risk_level ===
                  "CRITICAL"
                    ? "Immediate investigation recommended"
                    : selected.risk_level ===
                      "HIGH"
                    ? "Transaction requires analyst review"
                    : selected.risk_level ===
                      "MEDIUM"
                    ? "Transaction should be monitored"
                    : "Transaction appears within normal risk range"}

                </h3>

                <p>
                  RiskPulse XGBoost evaluated
                  this transaction using the
                  production fraud detection model
                  and generated a probability-based
                  risk assessment.
                </p>

              </div>


              {/* MODEL */}

              <div className="investigation-meta">

                <div>
                  <span>
                    MODEL
                  </span>

                  <strong>
                    XGBoost
                  </strong>
                </div>

                <div>
                  <span>
                    FEATURES
                  </span>

                  <strong>
                    432
                  </strong>
                </div>

                <div>
                  <span>
                    ENGINE
                  </span>

                  <strong>
                    RiskPulse AI
                  </strong>
                </div>

              </div>

            </div>

          )}

        </section>

      </div>

    </div>
  );
}