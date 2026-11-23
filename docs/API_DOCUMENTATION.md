# Talkar Clinic EMR & Doctor OPD Queue — API & Architecture Manual

Comprehensive developer, telephony, and systems reference manual for **`talkar-clinic-emr`**, the multi-tenant Clinic Electronic Medical Records (EMR) and Doctor Outpatient Department (OPD) Queue platform powered by **Talkar Autonomous Voice AI (Aditi)**.

Served locally on **Port `7577`** and configured for production at **`https://clinic.talkar.in`** (Target Server IP: `80.225.241.81`).

---

## Table of Contents
1. [Architecture & System Design](#1-architecture--system-design)
2. [Multi-Tenant Database Schema](#2-multi-tenant-database-schema)
3. [REST API Specifications](#3-rest-api-specifications)
4. [Live Server-Sent Events (SSE) Stream](#4-live-server-sent-events-sse-stream)
5. [Decoupled WhatsApp & n8n Architecture](#5-decoupled-whatsapp--n8n-architecture)
6. [Talkar Voice AI Agent & Tool Mappings](#6-talkar-voice-ai-agent--tool-mappings)
7. [Database Access & Clinic Replication Playbook](#7-database-access--clinic-replication-playbook)
8. [Automated Verification & Test Suite](#8-automated-verification--test-suite)

---

## 1. Architecture & System Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PATIENT & VOICE AI INTERFACES                         │
│   • Inbound/Outbound Telephony (Voice AI Concierge Aditi - Workflow 126)    │
│   • Modern Medical OPD Reception Board (clinic.talkar.in - Port 7577)       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 TALKAR CLINIC EMR BACKEND (Port 7577)                       │
│   • Express / TypeScript Modular Micro-Engine                               │
│   • Prisma ORM / SQLite Persistence (Zero secret storage)                   │
│   • Real-Time Server-Sent Events (SSE) Engine (/api/events/appointments)    │
│   • Post-Call Intelligence Receiver (/api/webhooks/call-completed)          │
└──────────────┬──────────────────────────────────────────────┬───────────────┘
               │                                              │
               ▼                                              ▼
┌──────────────────────────────────────┐       ┌──────────────────────────────┐
│  Universal Production n8n Gateways   │       │  Static Clinical Collateral  │
│  • send-clinic-appointment-conf.     │       │  • Dental Implants PDF       │
│  • send-clinic-treatment-brochure    │       │  • Clear Aligners PDF        │
│  Meta Cloud API Graph v23.0          │       │  • Root Canal (RCT) Guide    │
└──────────────────────────────────────┘       └──────────────────────────────┘
```

---

## 2. Multi-Tenant Database Schema

The database model is defined in `prisma/schema.prisma` and persisted to SQLite (`prisma/dev.db`).

### Core Entities:
1. **`Clinic`**: Represents an independent healthcare facility, dental practice, or hospital branch.
   - Fields: `id`, `slug` (unique), `name`, `brand`, `specialty`, `tagline`, `description`, `phone`, `email`, `address`, `city`, `currency`, `timezone`, `openHours`, `checkInNotes`, `isActive`.
2. **`Doctor`**: Specialist consultants attached to a clinic.
   - Fields: `id`, `clinicId`, `name`, `designation`, `department`, `qualification`, `consultationFee`, `roomNumber`, `availableDays`, `availableHours`, `photoUrl`, `isActive`.
3. **`Treatment`**: Medical/dental procedures with standard pricing and brochure URLs.
   - Fields: `id`, `clinicId`, `code` (e.g. `CLOVE-IMPLANT`), `title`, `category`, `description`, `price`, `currency`, `durationMinutes`, `brochureUrl`, `prepNotes`, `isActive`.
4. **`Appointment`**: OPD consultation and procedure bookings.
   - Fields: `id`, `clinicId`, `doctorId`, `doctorName`, `department`, `reference` (`OPD-XXXX`), `patientName`, `patientPhone`, `patientEmail`, `date` (YYYY-MM-DD), `timeSlot` (e.g. "11:30 AM"), `type` (`CONSULTATION`, `PROCEDURE`, `FOLLOW_UP`), `status` (`SCHEDULED`, `WAITING`, `IN_CONSULTATION`, `COMPLETED`, `CANCELLED`, `NO_SHOW`), `symptoms`, `treatmentCode`, `fee`, `paymentStatus`, `notes`, `prescription`, `source` (`VOICE_AI`, `WALK_IN`, `WEBSITE`, `PHONE`), `callRunId`, `recordingUrl`, `callSummary`.

---

## 3. REST API Specifications

### Base URL:
- Local: `http://localhost:7577`
- Production: `https://clinic.talkar.in`

---

### 3.1 Health & Status Check
- **Endpoint:** `GET /api/health`
- **Response:**
```json
{
  "status": "ok",
  "service": "talkar-clinic-emr",
  "version": "1.0.0",
  "port": 7577,
  "timestamp": "2026-11-24T00:03:40.000Z"
}
```

---

### 3.2 List All Clinics
- **Endpoint:** `GET /api/clinics`
- **Response:**
```json
{
  "success": true,
  "count": 2,
  "clinics": [
    {
      "id": "uuid",
      "slug": "clove-dental",
      "name": "Clove Dental - Indiranagar",
      "specialty": "Multi-Specialty Dental & Oral Surgery Clinic",
      "phone": "+91 80 4710 8820",
      "_count": { "doctors": 3, "treatments": 4, "appointments": 5 }
    }
  ]
}
```

---

### 3.3 Get Clinic Profile
- **Endpoint:** `GET /api/clinics/:slug`
- **Example:** `GET /api/clinics/clove-dental`
- **Response:** Returns clinic metadata, active doctors, treatments, and operational hours.

---

### 3.4 Doctor OPD Availability & Consulting Slots
- **Endpoint:** `GET /api/clinics/:slug/availability`
- **Query Parameters:**
  - `date`: Optional date in `YYYY-MM-DD` format (default: today).
  - `doctor_id`: Optional doctor ID or name filter.
- **Example:** `GET /api/clinics/clove-dental/availability?date=2026-11-28`
- **Response:**
```json
{
  "success": true,
  "clinic": {
    "slug": "clove-dental",
    "name": "Clove Dental - Indiranagar",
    "open_hours": "Monday - Saturday: 9:00 AM - 8:30 PM"
  },
  "date": "2026-11-28",
  "doctors": [
    {
      "doctor_id": "doc-clove-priya-sharma",
      "doctor_name": "Dr. Priya Sharma",
      "designation": "Senior Endodontist & Microscopic RCT Specialist",
      "room_number": "OPD-1",
      "consultation_fee": 600,
      "total_slots": 13,
      "available_slots_count": 12,
      "available_slots": [
        "10:00 AM", "10:30 AM", "11:00 AM", "12:00 PM", "12:30 PM", "04:30 PM", "05:00 PM"
      ]
    }
  ]
}
```

---

### 3.5 List Treatments & Brochures
- **Endpoint:** `GET /api/clinics/:slug/treatments`
- **Example:** `GET /api/clinics/clove-dental/treatments`
- **Response:**
```json
{
  "success": true,
  "count": 4,
  "treatments": [
    {
      "code": "CLOVE-IMPLANT",
      "title": "German Titanium Dental Implant",
      "price": 38000,
      "durationMinutes": 60,
      "brochureUrl": "https://clinic.talkar.in/brochures/dental-implants.pdf",
      "prepNotes": "Fast for 2 hours before the procedure; bring recent OPG X-ray if available."
    }
  ]
}
```

---

### 3.6 Book Doctor OPD Appointment
- **Endpoint:** `POST /api/clinics/:slug/appointments`
- **Request Body:**
```json
{
  "patient_name": "Rohan Deshmukh",
  "patient_phone": "9876543210",
  "doctor_id": "doc-clove-priya-sharma",
  "appointment_date": "2026-11-28",
  "time_slot": "11:30 AM",
  "chief_complaint": "Acute tooth pain in upper premolar",
  "treatment_code": "CLOVE-RCT",
  "notes": "Prefers morning appointment. Pre-existing sensitivity to cold water."
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "OPD Appointment confirmed successfully",
  "reference": "OPD-9591",
  "appointment": {
    "reference": "OPD-9591",
    "patientName": "Rohan Deshmukh",
    "patientPhone": "+919876543210",
    "doctorName": "Dr. Priya Sharma",
    "date": "2026-11-28",
    "timeSlot": "11:30 AM",
    "fee": 5500,
    "status": "SCHEDULED"
  }
}
```
*Note: Automatically pushes a real-time event to the reception dashboard via SSE and asynchronously dispatches a digital WhatsApp confirmation pass to the patient.*

---

### 3.7 Lookup Appointment by Reference or Phone
- **Endpoint:** `GET /api/clinics/:slug/appointments/lookup`
- **Query Parameter:** `?query=OPD-9591` or `?query=9876543210`
- **Response:** Returns the full appointment record with doctor room and clinical status.

---

### 3.8 Update Appointment Status & Clinical Notes
- **Endpoint:** `PATCH /api/clinics/:slug/appointments/:reference/status`
- **Request Body:**
```json
{
  "status": "WAITING",
  "notes": "Patient checked in at reception lounge",
  "prescription": "Tab. Zerodol-SP SOS after meals"
}
```
- **Allowed Statuses:** `SCHEDULED`, `WAITING`, `IN_CONSULTATION`, `COMPLETED`, `CANCELLED`, `NO_SHOW`.

---

### 3.9 Hard Delete Appointment
- **Endpoint:** `DELETE /api/clinics/:slug/appointments/:reference`
- **Response:**
```json
{
  "success": true,
  "message": "Appointment OPD-9591 permanently deleted",
  "result": { "success": true, "reference": "OPD-9591" }
}
```

---

### 3.10 Post-Call Webhook Receiver (Talkar Voice AI)
- **Endpoint:** `POST /api/webhooks/call-completed`
- **Request Body:**
```json
{
  "call_id": "call-prod-8821",
  "customer_number": "9876543210",
  "booking_ref": "OPD-9591",
  "clinic_slug": "clove-dental",
  "summary": "Patient called with lower jaw toothache. Scheduled consultation with Dr. Priya Sharma for Saturday 11:30 AM. WhatsApp pass dispatched.",
  "recording_url": "https://storage.talkar.in/recordings/call-prod-8821.mp3"
}
```

---

## 4. Live Server-Sent Events (SSE) Stream

- **Endpoint:** `GET /api/events/appointments?clinic=:slug`
- **Header:** `Accept: text/event-stream`
- **Events Emitted:**
  - `appointment_created`: Emitted when new appointment is booked.
  - `appointment_status_changed`: Emitted when patient transitions columns (e.g. `SCHEDULED` $\rightarrow$ `WAITING` $\rightarrow$ `IN_CONSULTATION`).
  - `appointment_deleted`: Emitted when an appointment is removed.
  - `appointment_call_synced`: Emitted when post-call summary is attached.

---

## 5. Decoupled WhatsApp & n8n Architecture

The system operates with a **Zero-Secret Backend Architecture**: all Meta WhatsApp Cloud API credentials live safely in production n8n workflows (`https://n8n.talkar.in`), using permanent System User Token credentials (`A4TlqRpKEb5a6CGY`).

### Webhook 1: OPD Appointment Confirmation Pass
- **Production URL:** `POST https://n8n.talkar.in/webhook/send-clinic-appointment-confirmation`
- **Meta Approved Template:** `sales_appointment_confirmed` (Category: `UTILITY`, Status: `APPROVED`)
- **Payload:**
```json
{
  "clinic_name": "Clove Dental - Indiranagar",
  "patient_name": "Rohan Deshmukh",
  "phone_number": "9876543210",
  "appointment_type": "Dental OPD Consultation",
  "booking_ref": "OPD-9591",
  "doctor_name": "Dr. Priya Sharma",
  "slot_date": "2026-11-28",
  "slot_time": "11:30 AM",
  "notes": "With Dr. Priya Sharma in OPD-1. Please arrive 10 minutes prior to your consultation."
}
```

### Webhook 2: Treatment Brochure & Care Guide Dispatch
- **Production URL:** `POST https://n8n.talkar.in/webhook/send-clinic-treatment-brochure`
- **Meta Approved Template:** `sales_collateral_share` (Category: `UTILITY`, Status: `APPROVED`)
- **Payload:**
```json
{
  "clinic_name": "Clove Dental - Indiranagar",
  "patient_name": "Rohan Deshmukh",
  "phone_number": "9876543210",
  "treatment_name": "German Titanium Dental Implant Guide",
  "brochure_url": "https://clinic.talkar.in/brochures/dental-implants.pdf"
}
```

---

## 6. Talkar Voice AI Agent & Tool Mappings

The Voice AI Medical Concierge **Aditi** is published on Talkar as **Workflow `126`**:
- **Workflow Name:** `Clove Dental - Aditi Medical Receptionist (Sarvam 105B)`
- **AI Brain (LLM):** Sarvam 105B Conversations (`sarvam-105b-conversations`), temperature `0.3`
- **Voice (TTS):** Smallest AI `lightning_v3.1_pro` (`voice: mishka`), warm Indian medical tone
- **Speech-to-Text (STT):** Sarvam Saaras v4 (`saaras:v4`)
- **Extraction Model:** OpenAI `gpt-4.1-mini`, temperature `0.5`
- **Telephony Tuning:** `turn_silence_timeout_secs: 0.75`, `smart_turn_stop_secs: 1.7`, `ambient_noise: 0.4`.

### Registered Talkar Tools:
| Tool Name | Tool UUID | Method & Target URL | Purpose |
| :--- | :--- | :--- | :--- |
| **`clinic_emr_check_doctor_availability`** | `08f40b24-5a87-4def-8058-81601da34b5c` | `GET https://clinic.talkar.in/api/clinics/clove-dental/availability` | Queries doctor OPD consulting hours & free slots |
| **`clinic_emr_list_treatments`** | `243dce1f-e0ae-4f28-8d95-b90a20fd3d0d` | `GET https://clinic.talkar.in/api/clinics/clove-dental/treatments` | Lists dental & medical treatments and prices |
| **`clinic_emr_book_appointment`** | `b6214f82-542b-41f5-b802-aef855df76b2` | `POST https://clinic.talkar.in/api/clinics/clove-dental/appointments` | Confirms OPD booking and returns `OPD-XXXX` ref |
| **`clinic_emr_lookup_appointment`** | `f382942f-4f3d-4a14-a51a-b117bf17b4c3` | `GET https://clinic.talkar.in/api/clinics/clove-dental/appointments/lookup` | Looks up existing appointment by ref or phone |
| **`clinic_send_appointment_confirmation_whatsapp`** | `aa3d79ff-0b4e-4ee6-b2aa-163a25f5644f` | `POST https://n8n.talkar.in/webhook/send-clinic-appointment-confirmation` | Sends WhatsApp appointment pass via n8n & Meta |
| **`clinic_send_treatment_brochure_whatsapp`** | `36a71ac4-4525-46e9-8ba9-5a9090768332` | `POST https://n8n.talkar.in/webhook/send-clinic-treatment-brochure` | Dispatches PDF care guide / brochure via n8n |

---

## 7. Database Access & Clinic Replication Playbook

### Accessing the Database Directly:
```bash
# 1. Open Prisma Studio GUI
cd /Users/arnav/Internship/talkar-clinic-emr
npx prisma studio --port 5557

# 2. Query via SQLite CLI
sqlite3 prisma/dev.db "SELECT reference, patientName, doctorName, date, timeSlot, status FROM Appointment;"

# 3. Quick Node/Prisma query script
npx tsx -e "
import { prisma } from './src/lib/prisma.js';
const appts = await prisma.appointment.findMany({ where: { status: 'SCHEDULED' } });
console.table(appts.map(a => ({ ref: a.reference, patient: a.patientName, doctor: a.doctorName })));
"
```

### Adding a New Hospital or Specialty:
To onboard another clinic (e.g. `manipal-hospital`):
1. Insert the clinic record into `prisma/seed.ts` (or via REST API/Prisma):
   ```typescript
   await prisma.clinic.create({
     data: {
       slug: 'manipal-hospital',
       name: 'Manipal Hospital - Whitefield',
       specialty: 'Multi-Specialty Tertiary Care',
       phone: '+91 80 2841 8888',
       city: 'Bengaluru'
     }
   });
   ```
2. Add doctors and treatments under that `clinicId`.
3. The dashboard is instantly accessible at `https://clinic.talkar.in/manipal-hospital`.
4. Point a Voice Agent's tools to `https://clinic.talkar.in/api/clinics/manipal-hospital/...`.

---

## 8. Automated Verification & Test Suite

Run the automated test suite anytime to verify all 12 endpoints:
```bash
cd /Users/arnav/Internship/talkar-clinic-emr
npm run build
bash scripts/test_api.sh
```
All tests verify health, multi-tenancy, availability, appointments, status transitions, webhooks, and cleanup.
