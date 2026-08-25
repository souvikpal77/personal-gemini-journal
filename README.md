# Personal Gemini Journal

A production-ready, privacy-first personal reflection and journaling web application powered by **Gemini 3.7 Flash**, **Firebase Authentication with Google Sign-In**, and **Cloud Firestore** with strict owner-bound data isolation.

---

## 🏛️ System Architecture

```
                               ┌────────────────────────────────────────────────┐
                               │             Client (Browser / React)           │
                               │  - Google Sign-In (Firebase Auth)              │
                               │  - Markdown Conversation Workspace             │
                               │  - Searchable History Archive & Sentiment Tags │
                               └──────────────┬───────────────────┬─────────────┘
                                              │                   │
                  1. Direct Authenticated Read/Write              │ 2. Chat & Synthesis Requests
                  (Secured by Firestore Security Rules)           │ (Proxied with Secret Protection)
                                              │                   │
                                              ▼                   ▼
                     ┌────────────────────────────────┐  ┌────────────────────────────────┐
                     │         Cloud Firestore        │  │     Node.js / Express Server   │
                     │  users/{uid}/interactions/{}   │  │           (Cloud Run)          │
                     │  Strict request.auth.uid check │  └───────────────┬────────────────┘
                     └────────────────────────────────┘                  │
                                                                         │ 3. Server-Side Model Invocations
                                                                         ▼
                                                         ┌────────────────────────────────┐
                                                         │       Google Gemini API        │
                                                         │     (gemini-3.7-flash)         │
                                                         │  Secret Manager Injection      │
                                                         └────────────────────────────────┘
```

---

## 🔒 Threat Summary & Security Controls

| Threat Zone | Specific Threat / Vector | Risk Level | Countermeasure & Security Invariant |
| :--- | :--- | :--- | :--- |
| **Authentication** | Spoofed client UID, unauthorized access | **Critical** | Firebase Authentication with Google Sign-In. The user identity is verified via auth token state. |
| **Authorization & Isolation** | Cross-user data leakage, orphan writes | **Critical** | Path structure `users/{userId}/interactions/{interactionId}` governed by Firestore Security Rules enforcing `request.auth.uid == userId`. |
| **Secret Management** | Exposure of Gemini API credentials | **Critical** | Zero client-side exposure. `GEMINI_API_KEY` is kept strictly server-side on Express / Cloud Run and injected via Google Cloud Secret Manager. |
| **API & Backend Security** | SSRF, unvalidated JSON payloads | **High** | Express request body boundary limits, explicit message schema validation, and structured error responses that do not leak internal stack traces. |
| **Prompt Injection** | LLM instruction hijacking via journal input | **High** | Multi-turn transcript structure with strict system instructions that frame user content as reflective dialogue, not executable instructions. |
| **Data Privacy** | Journal exposure through logs or errors | **High** | Sensitive reflections are never logged to console or URL query parameters. Graceful error handling preserves user drafts locally upon any network failure. |

---

## 🛡️ Cloud Firestore Security Rules

Deployed to Cloud Firestore:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null
        && request.auth.uid == userId;
    }
  }
}
```

---

## 🔑 Secret Manager Setup

To store the `GEMINI_API_KEY` securely in Google Cloud Secret Manager:

```bash
# 1. Create the secret in Secret Manager
gcloud secrets create GEMINI_API_KEY \
  --replication-policy="automatic"

# 2. Add your secret version
echo -n "YOUR_GEMINI_API_KEY" | \
  gcloud secrets versions add GEMINI_API_KEY \
  --data-file=-

# 3. Grant Secret Accessor role to the Cloud Run runtime service account
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 🚀 Cloud Run Deployment

Deploy the full-stack container to Google Cloud Run:

```bash
# 1. Build and submit image to Google Cloud Artifact Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/personal-gemini-journal

# 2. Deploy to Cloud Run with Secret Manager environment injection
gcloud run deploy personal-gemini-journal \
  --image gcr.io/YOUR_PROJECT_ID/personal-gemini-journal \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets=GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --set-env-vars=NODE_ENV=production

# 3. Apply required Cloud Run AI Challenge label
gcloud run services update personal-gemini-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region us-central1
```

---

## 🧪 Comprehensive Manual Test Plan

| # | Test Scenario | Steps | Expected Result |
|---|---------------|-------|-----------------|
| 1 | **Google Sign-In** | Click "Continue with Google Sign-In" from landing page. | Firebase popup opens; upon authorization, user is navigated directly to the private journal workspace with profile avatar visible. |
| 2 | **Multi-turn Reflection** | Type a message or click a guided template (e.g. "Daily Retrospective") and send. | Gemini 3.7 Flash responds with empathetic, structured insights and prompts; thinking indicator displays during processing. |
| 3 | **Automatic Summarization** | After 2 or more conversational turns, click "Synthesize Reflection". | Generates an executive summary, key breakthrough, emotional resonance, and actionable next steps rendered in a synthesis card. |
| 4 | **Firestore Persistence** | Send messages and refresh the browser tab. | Conversation state, timestamps, mood tags, and synthesis are preserved and reloaded from `users/{userId}/interactions/{interactionId}`. |
| 5 | **History & Search** | Click "History" in the top navigation; search by keyword or filter by mood pill. | Filtered list of past sessions renders; clicking an entry loads it immediately into the active workspace. |
| 6 | **Cross-User Data Isolation** | Sign in with User A, create an entry; sign out and sign in with User B. | User B sees an empty archive and cannot view, edit, or query User A's Firestore records. |
| 7 | **Network & API Resilience** | Trigger reflection during network disconnect or simulate API outage. | Error notice appears with a "Retry" button without clearing the user's typed draft text. |
| 8 | **Sign Out** | Click the Sign Out icon in the top navigation bar. | User session is terminated, local state is purged, and user is returned to the landing page. |
