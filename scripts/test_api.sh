#!/usr/bin/env bash
set -e

PORT=7577
BASE_URL="http://127.0.0.1:${PORT}"

echo "=========================================================="
echo "🧪 Running Talkar Clinic EMR Automated REST API Test Suite"
echo "=========================================================="

# 1. Health check
echo -n "1. Testing GET /api/health ... "
HEALTH=$(curl -s "${BASE_URL}/api/health")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  echo "✅ PASSED"
else
  echo "❌ FAILED: $HEALTH"
  exit 1
fi

# 2. List Clinics
echo -n "2. Testing GET /api/clinics ... "
CLINICS=$(curl -s "${BASE_URL}/api/clinics")
if echo "$CLINICS" | grep -q '"clove-dental"'; then
  echo "✅ PASSED (clove-dental found)"
else
  echo "❌ FAILED: $CLINICS"
  exit 1
fi

# 3. Get Clinic Profile
echo -n "3. Testing GET /api/clinics/clove-dental ... "
PROFILE=$(curl -s "${BASE_URL}/api/clinics/clove-dental")
if echo "$PROFILE" | grep -q 'Clove Dental - Indiranagar'; then
  echo "✅ PASSED"
else
  echo "❌ FAILED: $PROFILE"
  exit 1
fi

# 4. List Doctors
echo -n "4. Testing GET /api/clinics/clove-dental/doctors ... "
DOCTORS=$(curl -s "${BASE_URL}/api/clinics/clove-dental/doctors")
if echo "$DOCTORS" | grep -q 'Dr. Priya Sharma'; then
  echo "✅ PASSED"
else
  echo "❌ FAILED: $DOCTORS"
  exit 1
fi

# 5. Doctor OPD Availability
echo -n "5. Testing GET /api/clinics/clove-dental/availability ... "
AVAIL=$(curl -s "${BASE_URL}/api/clinics/clove-dental/availability?date=2026-11-28")
if echo "$AVAIL" | grep -q '"total_slots"'; then
  echo "✅ PASSED"
else
  echo "❌ FAILED: $AVAIL"
  exit 1
fi

# 6. Treatments & Brochures
echo -n "6. Testing GET /api/clinics/clove-dental/treatments ... "
TREATMENTS=$(curl -s "${BASE_URL}/api/clinics/clove-dental/treatments")
if echo "$TREATMENTS" | grep -q 'CLOVE-IMPLANT'; then
  echo "✅ PASSED"
else
  echo "❌ FAILED: $TREATMENTS"
  exit 1
fi

# 7. List Appointments
echo -n "7. Testing GET /api/clinics/clove-dental/appointments ... "
APPOINTMENTS=$(curl -s "${BASE_URL}/api/clinics/clove-dental/appointments")
if echo "$APPOINTMENTS" | grep -q '"appointments"'; then
  echo "✅ PASSED"
else
  echo "❌ FAILED: $APPOINTMENTS"
  exit 1
fi

# 8. Create OPD Appointment
echo -n "8. Testing POST /api/clinics/clove-dental/appointments ... "
CREATE_RESP=$(curl -s -X POST "${BASE_URL}/api/clinics/clove-dental/appointments" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_name": "Test Patient Rohan",
    "patient_phone": "9876543210",
    "doctor_id": "doc-clove-priya-sharma",
    "appointment_date": "2026-11-28",
    "time_slot": "11:30 AM",
    "chief_complaint": "Acute tooth pain in upper premolar",
    "treatment_code": "CLOVE-RCT",
    "notes": "Automated API Test Booking"
  }')

TEST_REF=$(echo "$CREATE_RESP" | grep -o '"reference":"[^"]*' | head -n 1 | cut -d'"' -f4)
if [ -n "$TEST_REF" ]; then
  echo "✅ PASSED (Created Reference: $TEST_REF)"
else
  echo "❌ FAILED: $CREATE_RESP"
  exit 1
fi

# 9. Lookup Appointment
echo -n "9. Testing GET /api/clinics/clove-dental/appointments/lookup ... "
LOOKUP=$(curl -s "${BASE_URL}/api/clinics/clove-dental/appointments/lookup?query=${TEST_REF}")
if echo "$LOOKUP" | grep -q "$TEST_REF"; then
  echo "✅ PASSED"
else
  echo "❌ FAILED: $LOOKUP"
  exit 1
fi

# 10. Update Status
echo -n "10. Testing PATCH /api/clinics/clove-dental/appointments/${TEST_REF}/status ... "
STATUS_RESP=$(curl -s -X PATCH "${BASE_URL}/api/clinics/clove-dental/appointments/${TEST_REF}/status" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "WAITING",
    "notes": "Patient arrived at reception"
  }')
if echo "$STATUS_RESP" | grep -q '"status":"WAITING"'; then
  echo "✅ PASSED"
else
  echo "❌ FAILED: $STATUS_RESP"
  exit 1
fi

# 11. Post-Call Webhook Sync
echo -n "11. Testing POST /api/webhooks/call-completed ... "
HOOK_RESP=$(curl -s -X POST "${BASE_URL}/api/webhooks/call-completed" \
  -H "Content-Type: application/json" \
  -d "{
    \"call_id\": \"call-test-9999\",
    \"customer_number\": \"9876543210\",
    \"booking_ref\": \"${TEST_REF}\",
    \"clinic_slug\": \"clove-dental\",
    \"summary\": \"Patient confirmed appointment for root canal treatment with Dr. Priya Sharma.\"
  }")
if echo "$HOOK_RESP" | grep -q '"success":true'; then
  echo "✅ PASSED"
else
  echo "❌ FAILED: $HOOK_RESP"
  exit 1
fi

# 12. Delete Test Appointment
echo -n "12. Testing DELETE /api/clinics/clove-dental/appointments/${TEST_REF} ... "
DEL_RESP=$(curl -s -X DELETE "${BASE_URL}/api/clinics/clove-dental/appointments/${TEST_REF}")
if echo "$DEL_RESP" | grep -q '"success":true'; then
  echo "✅ PASSED"
else
  echo "❌ FAILED: $DEL_RESP"
  exit 1
fi

echo "=========================================================="
echo "🎉 ALL 12 API ENDPOINT TESTS PASSED WITH 100% SUCCESS!"
echo "=========================================================="
