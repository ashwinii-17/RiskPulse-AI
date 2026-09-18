from typing import Any


class OODValidator:
    # Training-data boundaries derived from the V2 training dataset.
    RANGES = {
        "TransactionAmt": (0.251, 31937.39),
        "TransactionDT": (86400, 13919220),
        "card1": (1000, 18396),
        "card2": (100, 600),
        "card3": (100, 231),
        "card5": (100, 237),
        "addr1": (100, 540),
        "addr2": (10, 102),
        "dist1": (0, 10286),
        "dist2": (0, 11623),
    }

    @classmethod
    def validate(cls, features: dict[str, Any]) -> dict[str, Any]:
        warnings = []

        for feature, (minimum, maximum) in cls.RANGES.items():
            value = float(features[feature])

            if value < minimum or value > maximum:
                warnings.append(
                    f"{feature}={value:g} is outside the observed "
                    f"training range [{minimum:g}, {maximum:g}]."
                )

        return {
            "is_ood": bool(warnings),
            "warnings": warnings,
        }


ood_validator = OODValidator()