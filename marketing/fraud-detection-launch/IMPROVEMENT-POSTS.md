# Fraud Detection System — Improvement Posts (alternate angles)

---

## A. The "per-category baseline" angle

> The single biggest lever on false-positive rate in fraud detection:
>
> Per-(user, category) baselines.
>
> A $600 airline ticket is normal for someone who flies monthly. It's fraud for someone who only buys $5 subscriptions.
>
> If you compare the $600 to the user's global mean, every large-but-legitimate purchase looks like an outlier.
>
> Our Z-Score and IQR detectors compute baselines per (user, category). This one change cut our FPR from 12% to 1.37%.
>
> [link]

---

## B. The "explainability is non-negotiable" angle

> If your fraud model can't answer "why was this card blocked?" in one sentence, you can't deploy it in the EU.
>
> GDPR Article 22 gives users the right to an explanation for solely-automated decisions. Black-box ML can't do this.
>
> Our system ships every score with a `reasons` array:
>
> "amount 9000.00 is 1201.38σ above user mean 33.80 for category 'shopping'"
> "transaction in RU is 7820 km from user home country US"
> "merchant 'CryptoExchange-X' is flagged as high-risk"
>
> Regulators love this. Risk-ops loves this. Customers love this.
>
> [link]

---

## C. The "Go vs Python for fraud" angle

> Why Go for a fraud detection engine?
>
> 1. **Latency.** 33 µs per score. Python can't get close without PyPy or Cython gymnastics.
> 2. **Concurrency.** 100k+ TPS with goroutines. Python's GIL forces multiprocessing overhead.
> 3. **GC.** Go's GC pauses are < 1 ms. Python's can be 100+ ms under load.
> 4. **Deploy.** Single static binary, ~15 MB distroless image. Python needs a runtime + deps + venv.
> 5. **Memory.** 50–150 MB per replica. Python fraud services often need 500 MB+.
>
> Python is great for model training. Go is better for model serving.
>
> [link]

---

## D. The "for risk-ops teams" angle (LinkedIn pulse article)

> **Stop accepting fraud alerts you can't explain.**
>
> If your fraud tool gives you a score but no reasons, your risk-ops team is flying blind. When a customer complains, you're stuck saying "the model flagged it" — which regulators no longer accept.
>
> Our open-source fraud engine ships every score with:
> - The exact detectors that fired
> - Human-readable reasons
> - A case ID for the analyst queue
>
> No black boxes. No "the model said so."
>
> [link]

---

## E. Repurpose for dev.to / Hacker News

- **Wednesday's detector deep-dive** → dev.to: "7 fraud detectors, explained — with the math"
- **Thursday's compliance post** → Hacker News: "GDPR Article 22 requires explainable AI. Here's how to build it."
- **Friday's benchmark post** → dev.to: "33µs per fraud score in Go: how and why"

---

## F. Short-form video scripts

### 60-second script: "$485 billion"

> (Hook) $485 billion. That's what the world loses to fraud every year.
> (Setup) Banks, fintechs, payment processors. And the tools they use are either black-box ML (no explainability) or static rules (too noisy).
> (Reveal) I open-sourced a third way: 7 transparent detectors, weighted ensemble, sub-millisecond latency, full case management.
> (Numbers) 84% recall. 1.37% false-positive rate. 33 microseconds per score.
> (CTA) Link in bio. github.com/gadda00/fraud-detection-system.

### 60-second script: "33 microseconds"

> (Hook) How fast can you score a transaction for fraud?
> (Setup) Stripe Radar: 100–300 ms. Sift: 200–500 ms.
> (Reveal) Ours: 33 microseconds.
> (How) Go. 7 detectors. Weighted ensemble. 10 allocations per score.
> (Scale) 30,000 transactions per second on one core. Visa's peak is 65,000. You have headroom.
> (CTA) github.com/gadda00/fraud-detection-system.

### 60-second script: "Why was my card blocked?"

> (Hook) "Why was my card blocked?" — the question every risk-ops team hates.
> (Setup) Black-box ML can't answer it. "The model said so" isn't good enough for regulators anymore.
> (Reveal) Our fraud engine ships every score with human-readable reasons.
> (Example) "Amount $9,000 is 1,201σ above your user mean for shopping." "Transaction in Russia is 7,820 km from your home country."
> (CTA) Explainable AI isn't a nice-to-have. It's the law. github.com/gadda00/fraud-detection-system.
