#!/usr/bin/env python3
# MALINDRA PHASE 4
# scripts/ai-synthesis.py
# Build-time AI-assisted signal synthesis & scenario modeling.
# Reads enriched articles from ./data/enriched/
# Outputs ./data/predictions/[slug].json with:
#   Signal → Context → Implication → Action + confidence scores
# Uses Monte Carlo sampling + trend extrapolation (no external GPU/model deps).
# All outputs labeled [MODEL v1.0] + [ANALYSIS].

import json
import math
import os
import random
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).parent.parent
ENRICHED_DIR = ROOT / "data" / "enriched"
PREDICTIONS_DIR = ROOT / "data" / "predictions"
PREDICTIONS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_VERSION = "v1.0"
RANDOM_SEED = 42
random.seed(RANDOM_SEED)

# ── Topic signal profiles ─────────────────────────────────────────────────────

TOPIC_SIGNALS = {
    "debt": {
        "baseline_risk": 0.72,
        "volatility": 0.18,
        "trend_direction": -0.04,
        "keywords": ["debt", "imf", "restructuring", "bonds", "fiscal", "gdp"],
    },
    "digital": {
        "baseline_risk": 0.38,
        "volatility": 0.12,
        "trend_direction": 0.06,
        "keywords": ["digital", "technology", "cyber", "platform", "data", "ai"],
    },
    "tourism": {
        "baseline_risk": 0.45,
        "volatility": 0.22,
        "trend_direction": 0.08,
        "keywords": ["tourism", "arrivals", "revenue", "hospitality", "travel"],
    },
    "geopolitics": {
        "baseline_risk": 0.61,
        "volatility": 0.25,
        "trend_direction": -0.02,
        "keywords": ["china", "india", "us", "geopolit", "strategic", "military", "port"],
    },
    "energy": {
        "baseline_risk": 0.55,
        "volatility": 0.15,
        "trend_direction": 0.09,
        "keywords": ["energy", "renewable", "solar", "power", "electricity", "grid"],
    },
}

# ── SIGINT scenario templates ─────────────────────────────────────────────────

SCENARIO_TEMPLATES = {
    "debt": [
        {
            "signal": "Sri Lanka's external debt service ratio remains elevated relative to foreign exchange reserves.",
            "context": "Post-2022 default recovery continues; IMF Extended Fund Facility tranches are contingent on structural benchmarks including SOE reform and revenue measures.",
            "implication": "Delayed tranche disbursement heightens rollover risk in 2025–2026 window. Bilateral creditor negotiations with China and India remain the critical path.",
            "action": "Monitor monthly CBSL reserve publications and IMF Article IV consultations. Flag any deviation from fiscal primary balance targets as early warning signal.",
        },
        {
            "signal": "International sovereign bond yield spreads indicate persistent market skepticism about Sri Lanka's debt sustainability.",
            "context": "ISB holders accepted haircuts under the restructuring; residual litigation risk from holdout creditors creates uncertainty in secondary markets.",
            "implication": "Constrained market access limits the government's ability to refinance maturing obligations without IMF support.",
            "action": "Track EMBI+ spread movements and rating agency outlook changes (Fitch, Moody's) as leading indicators of market confidence.",
        },
    ],
    "digital": [
        {
            "signal": "Sri Lanka's Digital Economy Act and Data Protection Act are creating new regulatory frameworks for platform operators.",
            "context": "Legislative alignment with GDPR-adjacent standards positions Sri Lanka for potential EU adequacy conversations; however, enforcement capacity remains nascent.",
            "implication": "Firms operating data-intensive services face compliance ambiguity. First-mover advantage for organizations building compliant infrastructure now.",
            "action": "Engage Data Protection Authority guidance as it emerges. Build data minimization and consent architecture ahead of enforcement readiness.",
        },
    ],
    "tourism": [
        {
            "signal": "Tourist arrivals are recovering toward pre-2022 crisis levels with Indian and Russian visitor segments driving volume.",
            "context": "Structural dependence on a narrow source market mix creates vulnerability to bilateral diplomatic frictions and airspace/visa policy changes.",
            "implication": "Revenue recovery is real but fragile. Diversification into higher-yield segments (MICE, medical, cultural) is the strategic imperative.",
            "action": "Track SLTDA monthly arrival statistics by source market. Flag >15% single-market share concentration as diversification signal.",
        },
    ],
    "geopolitics": [
        {
            "signal": "Competing infrastructure financing offers from China, India, and Japan are creating parallel dependency tracks.",
            "context": "Hambantota Port's 99-year lease to CMPORT remains the defining case study for debt-for-equity risk calculus in South Asia.",
            "implication": "Each new bilateral project creates sovereign commitment that constrains future strategic optionality. Multi-vector balancing requires active management.",
            "action": "Map bilateral project commitments by sector and counterparty. Model contingent liability exposure under stress scenarios.",
        },
    ],
    "energy": [
        {
            "signal": "Renewable energy capacity additions are accelerating under the National Energy Policy 2022 targets.",
            "context": "Grid integration challenges and transmission infrastructure investment lag behind generation capacity growth, creating curtailment risk.",
            "implication": "Without grid modernization investment, new renewable capacity will be underutilized. Storage infrastructure is the binding constraint.",
            "action": "Monitor CEB capital expenditure plans and ADB/World Bank energy portfolio lending. Transmission investment is the leading indicator of grid readiness.",
        },
    ],
}

# ── Monte Carlo scenario engine ───────────────────────────────────────────────


def detect_topics(text: str) -> list[str]:
    """Detect relevant topics from article text/slug."""
    text_lower = text.lower()
    matched = []
    for topic, profile in TOPIC_SIGNALS.items():
        score = sum(1 for kw in profile["keywords"] if kw in text_lower)
        if score > 0:
            matched.append((topic, score))
    matched.sort(key=lambda x: x[1], reverse=True)
    return [t for t, _ in matched[:3]]


def monte_carlo_confidence(baseline: float, volatility: float, n: int = 1000) -> dict:
    """Run Monte Carlo sampling to compute confidence intervals."""
    samples = [
        max(0.0, min(1.0, baseline + random.gauss(0, volatility)))
        for _ in range(n)
    ]
    samples.sort()
    p10 = samples[int(n * 0.10)]
    p50 = samples[int(n * 0.50)]
    p90 = samples[int(n * 0.90)]
    mean = sum(samples) / n
    std = math.sqrt(sum((s - mean) ** 2 for s in samples) / n)
    return {
        "mean": round(mean, 3),
        "p10": round(p10, 3),
        "p50": round(p50, 3),
        "p90": round(p90, 3),
        "std": round(std, 3),
        "ci_width": round(p90 - p10, 3),
    }


def trend_extrapolation(baseline: float, direction: float, periods: int = 4) -> list[float]:
    """Simple linear trend extrapolation with noise."""
    result = []
    val = baseline
    for _ in range(periods):
        val = max(0.0, min(1.0, val + direction + random.gauss(0, 0.02)))
        result.append(round(val, 3))
    return result


def synthesize_article(slug: str, enriched: dict) -> dict:
    """Generate scenario predictions for a single article."""
    combined_text = slug + " " + " ".join(
        str(v) for v in [
            enriched.get("category", ""),
            *[str(dp) for dp in enriched.get("dataPoints", [])],
        ]
    )

    topics = detect_topics(combined_text)
    if not topics:
        topics = ["geopolitics"]

    scenarios = []
    for topic in topics:
        profile = TOPIC_SIGNALS[topic]
        templates = SCENARIO_TEMPLATES.get(topic, SCENARIO_TEMPLATES["geopolitics"])
        template = templates[hash(slug + topic) % len(templates)]

        confidence = monte_carlo_confidence(
            profile["baseline_risk"],
            profile["volatility"],
        )
        forecast = trend_extrapolation(
            profile["baseline_risk"],
            profile["trend_direction"],
        )

        scenarios.append({
            "topic": topic,
            "signal": template["signal"],
            "context": template["context"],
            "implication": template["implication"],
            "action": template["action"],
            "confidence": confidence,
            "forecast_quarters": forecast,
            "risk_direction": "increasing" if profile["trend_direction"] > 0 else "decreasing",
        })

    # Aggregate cross-signal score
    if scenarios:
        agg_mean = sum(s["confidence"]["mean"] for s in scenarios) / len(scenarios)
        agg_p50 = sum(s["confidence"]["p50"] for s in scenarios) / len(scenarios)
    else:
        agg_mean = 0.5
        agg_p50 = 0.5

    confidence_label = (
        "HIGH" if agg_mean > 0.65
        else "MEDIUM" if agg_mean > 0.40
        else "LOW"
    )

    return {
        "slug": slug,
        "model_version": MODEL_VERSION,
        "model_label": f"[MODEL {MODEL_VERSION}]",
        "analysis_label": "[ANALYSIS]",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "topics_detected": topics,
        "aggregate_confidence": {
            "mean": round(agg_mean, 3),
            "p50": round(agg_p50, 3),
            "label": confidence_label,
        },
        "scenarios": scenarios,
        "meta": {
            "monte_carlo_iterations": 1000,
            "seed": RANDOM_SEED,
            "forecast_horizon_quarters": 4,
            "methodology": "Monte Carlo sampling + linear trend extrapolation",
            "disclaimer": "Pre-computed at build time. Not financial or investment advice.",
        },
    }


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    if not ENRICHED_DIR.exists():
        print("[ai-synthesis] No enriched data directory found — skipping", file=sys.stderr)
        sys.exit(0)

    files = [f for f in ENRICHED_DIR.iterdir() if f.suffix == ".json"]
    if not files:
        print("[ai-synthesis] No enriched JSON files found", file=sys.stderr)
        sys.exit(0)

    generated = 0
    errors = 0

    for f in files:
        try:
            enriched = json.loads(f.read_text(encoding="utf-8"))
            slug = enriched.get("slug") or f.stem
            prediction = synthesize_article(slug, enriched)
            out_path = PREDICTIONS_DIR / f"{slug}.json"
            out_path.write_text(json.dumps(prediction, indent=2, ensure_ascii=False), encoding="utf-8")
            generated += 1
        except Exception as e:
            print(f"[ai-synthesis] ERROR {f.name}: {e}", file=sys.stderr)
            errors += 1

    # Write aggregate index
    index_entries = []
    for p in sorted(PREDICTIONS_DIR.glob("*.json")):
        if p.name == "index.json":
            continue
        try:
            d = json.loads(p.read_text(encoding="utf-8"))
            index_entries.append({
                "slug": d["slug"],
                "model_version": d["model_version"],
                "topics": d["topics_detected"],
                "confidence_label": d["aggregate_confidence"]["label"],
                "confidence_mean": d["aggregate_confidence"]["mean"],
                "generated_at": d["generated_at"],
            })
        except Exception:
            pass

    index = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "model_version": MODEL_VERSION,
        "total": len(index_entries),
        "entries": index_entries,
    }
    (PREDICTIONS_DIR / "index.json").write_text(
        json.dumps(index, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    print(f"[ai-synthesis] Done: {generated} predictions generated, {errors} errors")


if __name__ == "__main__":
    main()
