# Talkar Clinic EMR & Doctor OPD Queue (`talkar-clinic-emr`)

A modern, multi-tenant Clinic Electronic Medical Records (EMR) and Doctor Outpatient Department (OPD) Queue platform powered by **Talkar Autonomous Voice AI (Aditi)**.

Served locally on **Port `7577`** and configured for production at **`https://clinic.talkar.in`** (Target Server IP: `80.225.241.81`).

> 📖 **Comprehensive Developer Reference:** For complete REST API specs, Voice Agent Tools, Meta WhatsApp Templates, n8n Gateways, and Database Management, see the [API & Architecture Manual](docs/API_DOCUMENTATION.md).

---

## 1. System Overview

```
[Patient Inbound / Outbound Call]
           │
           ▼
[Voice AI Concierge Aditi (Workflow 126)]  ──► Checks doctor OPD hours & slot availability
           │
           ▼
[Confirmed OPD Consultation Booking]       ──► Generates unique OPD-XXXX reference code
           │
           ▼
[Instant WhatsApp Confirmation Pass]       ──► Dispatches digital pass via n8n & Meta Cloud API
           │
           ▼
[Live OPD Flowboard (Port 7577)]           ──► Auto-updates Doctor OPD Queue in real time via SSE
```

### Key Capabilities:
- **Clean, Business-Grade Medical Dashboard:** Non-technical, doctor-friendly OPD board (`Upcoming`, `Checked In / Waiting`, `In Cabin`, `Completed`, `Cancelled`).
- **Doctor Consultation Filtering:** One-click filtering by doctor (`Dr. Priya Sharma`, `Dr. Rajesh Gupta`, `Dr. Sneha Reddy`).
- **Zero-Secret WhatsApp Architecture:** Backend contains zero Meta tokens; dispatches route via universal production n8n webhooks.
- **Puri Hotel Voice AI Architecture:** Configured with Sarvam 105B LLM, Smallest AI Mishka voice, and Sarvam Saaras v4 STT.

---

## 2. Talkar Voice AI Telephony & Tool UUIDs

The clinical receptionist voice agent **Aditi** is published on Talkar as **Workflow `126`**:

| Tool Name | Tool UUID | Target Endpoint | Function |
| :--- | :--- | :--- | :--- |
| **`clinic_emr_check_doctor_availability`** | `08f40b24-5a87-4def-8058-81601da34b5c` | `GET https://clinic.talkar.in/api/clinics/clove-dental/availability` | Checks available consultation slots |
| **`clinic_emr_list_treatments`** | `243dce1f-e0ae-4f28-8d95-b90a20fd3d0d` | `GET https://clinic.talkar.in/api/clinics/clove-dental/treatments` | Lists procedures, pricing, and duration |
| **`clinic_emr_book_appointment`** | `b6214f82-542b-41f5-b802-aef855df76b2` | `POST https://clinic.talkar.in/api/clinics/clove-dental/appointments` | Confirms OPD booking with `OPD-XXXX` code |
| **`clinic_emr_lookup_appointment`** | `f382942f-4f3d-4a14-a51a-b117bf17b4c3` | `GET https://clinic.talkar.in/api/clinics/clove-dental/appointments/lookup` | Looks up booking by ref code or phone |
| **`clinic_send_appointment_confirmation_whatsapp`** | `aa3d79ff-0b4e-4ee6-b2aa-163a25f5644f` | `POST https://n8n.talkar.in/webhook/send-clinic-appointment-confirmation` | Dispatches WhatsApp pass to patient |
| **`clinic_send_treatment_brochure_whatsapp`** | `36a71ac4-4525-46e9-8ba9-5a9090768332` | `POST https://n8n.talkar.in/webhook/send-clinic-treatment-brochure` | Dispatches procedure guide / brochure |

---

## 3. Universal Production n8n Webhooks

The two dedicated n8n workflows live on `https://n8n.talkar.in`:
1. **Appointment Confirmation Pass:**
   - URL: `POST https://n8n.talkar.in/webhook/send-clinic-appointment-confirmation`
   - Meta Template: `sales_appointment_confirmed` (Category: `UTILITY`, Status: `APPROVED`)
2. **Treatment Brochure & Care Guide:**
   - URL: `POST https://n8n.talkar.in/webhook/send-clinic-treatment-brochure`
   - Meta Template: `sales_collateral_share` (Category: `UTILITY`, Status: `APPROVED`)

---

## 4. Quick Start (Local Development)

```bash
cd /Users/arnav/Internship/talkar-clinic-emr

# Install dependencies
npm install

# Setup database & seed
npx prisma db push
npx tsx prisma/seed.ts

# Build TypeScript
npm run build

# Start server on Port 7577
npm start

# In another terminal: Run automated API test suite
bash scripts/test_api.sh
```

---

## 5. Live Dashboard URLs

- **Clove Dental OPD Board:** `http://localhost:7577/clove-dental` or `https://clinic.talkar.in/clove-dental`
- **Apollo Clinic OPD Board:** `http://localhost:7577/apollo-clinic` or `https://clinic.talkar.in/apollo-clinic`
- **Live SSE Event Stream:** `http://localhost:7577/api/events/appointments?clinic=clove-dental`
