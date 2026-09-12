import requests


BASE_URL = "http://127.0.0.1:8000"


def main() -> None:
    print("Fetching a real transaction from RiskPulse...")

    response = requests.get(
        f"{BASE_URL}/risk/transactions",
        timeout=10,
    )
    response.raise_for_status()

    transactions = response.json()

    if not transactions:
        raise RuntimeError("No transactions found in the database.")

    transaction = transactions[0]

    print(f"Using transaction: {transaction['transaction_id']}")
    print(f"Original amount: ₹{transaction['transaction_amount']}")
    print(f"Model features: {len(transaction['model_features'])}")

    payload = {
        "transaction_id": "LIVE-TEST-001",
        "transaction_amount": transaction["transaction_amount"],
        "features": transaction["model_features"],
    }

    print("\nSending transaction to /risk/predict...")

    prediction_response = requests.post(
        f"{BASE_URL}/risk/predict",
        json=payload,
        timeout=30,
    )

    print(f"Status code: {prediction_response.status_code}")
    print("Response:")
    print(prediction_response.text)

    prediction_response.raise_for_status()

    print("\nPrediction endpoint test PASSED.")


if __name__ == "__main__":
    main()