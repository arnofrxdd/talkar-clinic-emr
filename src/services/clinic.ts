import { prisma } from '../lib/prisma.js';
import { generateOpdReference, sanitizePhone } from './reference.js';
import { clinicEventService } from './events.js';

export interface CreateAppointmentInput {
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  doctor_id?: string;
  appointment_date: string; // YYYY-MM-DD
  time_slot: string;        // e.g. "11:30 AM"
  chief_complaint: string;
  treatment_code?: string;
  type?: 'CONSULTATION' | 'PROCEDURE' | 'FOLLOW_UP';
  notes?: string;
  source?: string;
  call_run_id?: string;
}

export class ClinicService {
  /**
   * Get clinic by slug
   */
  async getClinic(slug: string) {
    return prisma.clinic.findUnique({
      where: { slug },
      include: {
        doctors: { where: { isActive: true } },
        treatments: { where: { isActive: true } },
        _count: {
          select: {
            appointments: true,
            doctors: true,
            treatments: true
          }
        }
      }
    });
  }

  /**
   * List all registered clinics
   */
  async listClinics() {
    return prisma.clinic.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            doctors: true,
            treatments: true,
            appointments: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * List doctors for a clinic
   */
  async listDoctors(slug: string) {
    const clinic = await prisma.clinic.findUnique({
      where: { slug },
      select: { id: true }
    });
    if (!clinic) return [];

    return prisma.doctor.findMany({
      where: { clinicId: clinic.id, isActive: true },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Get Doctor OPD schedule & live slot availability for a date
   */
  async getDoctorAvailability(slug: string, dateStr?: string, doctorIdOrName?: string) {
    const clinic = await prisma.clinic.findUnique({
      where: { slug },
      include: {
        doctors: { where: { isActive: true } }
      }
    });
    if (!clinic) throw new Error(`Clinic "${slug}" not found`);

    const queryDate = dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
      ? dateStr
      : new Date().toISOString().slice(0, 10);

    let targetDoctors = clinic.doctors;
    if (doctorIdOrName) {
      targetDoctors = clinic.doctors.filter(
        (d) =>
          d.id.toLowerCase() === doctorIdOrName.toLowerCase() ||
          d.name.toLowerCase().includes(doctorIdOrName.toLowerCase()) ||
          d.department.toLowerCase().includes(doctorIdOrName.toLowerCase())
      );
      if (targetDoctors.length === 0) {
        targetDoctors = clinic.doctors;
      }
    }

    // Default morning & evening OPD consultation slots
    const standardSlots = [
      '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
      '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM'
    ];

    // Fetch existing bookings for this clinic on queryDate
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        clinicId: clinic.id,
        date: queryDate,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] }
      },
      select: {
        doctorId: true,
        timeSlot: true,
        reference: true,
        status: true
      }
    });

    const doctorsAvailability = targetDoctors.map((doc) => {
      const bookedSlots = new Set(
        existingAppointments
          .filter((a) => a.doctorId === doc.id)
          .map((a) => a.timeSlot.trim().toUpperCase())
      );

      const slots = standardSlots.map((slot) => {
        const isBooked = bookedSlots.has(slot.toUpperCase());
        return {
          time: slot,
          available: !isBooked,
          status: isBooked ? 'BOOKED' : 'AVAILABLE'
        };
      });

      const freeSlots = slots.filter((s) => s.available).map((s) => s.time);

      return {
        doctor_id: doc.id,
        doctor_name: doc.name,
        designation: doc.designation,
        department: doc.department,
        qualification: doc.qualification,
        consultation_fee: doc.consultationFee,
        room_number: doc.roomNumber,
        available_days: doc.availableDays,
        available_hours: doc.availableHours,
        date: queryDate,
        total_slots: slots.length,
        available_slots_count: freeSlots.length,
        available_slots: freeSlots,
        slot_breakdown: slots
      };
    });

    return {
      clinic: {
        slug: clinic.slug,
        name: clinic.name,
        address: clinic.address,
        phone: clinic.phone,
        open_hours: clinic.openHours
      },
      date: queryDate,
      doctors: doctorsAvailability
    };
  }

  /**
   * List medical & dental treatments with brochures
   */
  async listTreatments(slug: string) {
    const clinic = await prisma.clinic.findUnique({
      where: { slug },
      select: { id: true }
    });
    if (!clinic) return [];

    return prisma.treatment.findMany({
      where: { clinicId: clinic.id, isActive: true },
      orderBy: { price: 'desc' }
    });
  }

  /**
   * Book a confirmed Doctor OPD Appointment
   */
  async createAppointment(slug: string, input: CreateAppointmentInput) {
    const clinic = await prisma.clinic.findUnique({
      where: { slug },
      include: {
        doctors: { where: { isActive: true } }
      }
    });
    if (!clinic) throw new Error(`Clinic "${slug}" not found`);

    if (!input.patient_name || !input.patient_name.trim()) {
      throw new Error('Patient name is required');
    }
    if (!input.patient_phone || !input.patient_phone.trim()) {
      throw new Error('Patient phone number is required');
    }

    const cleanPhone = sanitizePhone(input.patient_phone);

    // Resolve Doctor
    let doctor = clinic.doctors[0]; // fallback to first doctor
    if (input.doctor_id) {
      const matched = clinic.doctors.find(
        (d) =>
          d.id.toLowerCase() === input.doctor_id?.toLowerCase() ||
          d.name.toLowerCase().includes(input.doctor_id?.toLowerCase() || '') ||
          d.department.toLowerCase().includes(input.doctor_id?.toLowerCase() || '')
      );
      if (matched) doctor = matched;
    }

    // Resolve Treatment details if code provided
    let fee = doctor ? doctor.consultationFee : 500;
    if (input.treatment_code) {
      const treatment = await prisma.treatment.findUnique({
        where: {
          clinicId_code: {
            clinicId: clinic.id,
            code: input.treatment_code
          }
        }
      });
      if (treatment) {
        fee = treatment.price;
      }
    }

    const reference = generateOpdReference('OPD');
    const appointmentDate = input.appointment_date || new Date().toISOString().slice(0, 10);
    const timeSlot = input.time_slot || '11:00 AM';

    const appointment = await prisma.appointment.create({
      data: {
        clinicId: clinic.id,
        doctorId: doctor ? doctor.id : null,
        doctorName: doctor ? doctor.name : 'Attending Consultant',
        department: doctor ? doctor.department : 'General OPD',
        reference,
        patientName: input.patient_name.trim(),
        patientPhone: cleanPhone,
        patientEmail: input.patient_email?.trim() || null,
        date: appointmentDate,
        timeSlot: timeSlot.trim(),
        type: input.type || 'CONSULTATION',
        status: 'SCHEDULED',
        symptoms: input.chief_complaint?.trim() || 'General Consultation',
        treatmentCode: input.treatment_code || null,
        fee,
        paymentStatus: 'PAY_AT_CLINIC',
        source: input.source || 'VOICE_AI',
        callRunId: input.call_run_id || null,
        notes: input.notes?.trim() || null
      },
      include: {
        doctor: true
      }
    });

    // ⚡ Real-Time SSE Broadcast to Medical Dashboard
    clinicEventService.broadcast(
      'appointment_created',
      {
        action: 'CREATED',
        appointment
      },
      clinic.slug
    );

    // Dispatch WhatsApp confirmation pass asynchronously via n8n
    this.dispatchWhatsAppConfirmation({
      clinic_name: clinic.name,
      patient_name: appointment.patientName,
      phone_number: appointment.patientPhone,
      appointment_type: appointment.treatmentCode || 'Doctor OPD Consultation',
      booking_ref: appointment.reference,
      doctor_name: appointment.doctorName || 'Attending Consultant',
      slot_date: appointment.date,
      slot_time: appointment.timeSlot,
      notes: `With ${appointment.doctorName} in ${doctor?.roomNumber || 'OPD-1'}. ${clinic.checkInNotes}`
    }).catch((err) => {
      console.warn('⚠️ WhatsApp confirmation dispatch failed:', err?.message || err);
    });

    return appointment;
  }

  /**
   * Dispatch WhatsApp Confirmation Pass to n8n Webhook
   */
  private async dispatchWhatsAppConfirmation(payload: {
    clinic_name: string;
    patient_name: string;
    phone_number: string;
    appointment_type: string;
    booking_ref: string;
    doctor_name: string;
    slot_date: string;
    slot_time: string;
    notes?: string;
  }) {
    const webhookUrl = 'https://n8n.talkar.in/webhook/send-clinic-appointment-confirmation';
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        console.warn(`n8n webhook returned status ${res.status}`);
      }
    } catch (e: any) {
      console.warn(`Failed to post to n8n webhook: ${e.message}`);
    }
  }

  /**
   * Update appointment status (e.g. SCHEDULED -> WAITING -> IN_CONSULTATION -> COMPLETED)
   */
  async updateAppointmentStatus(
    slug: string,
    reference: string,
    status: string,
    notes?: string,
    prescription?: string
  ) {
    const clinic = await prisma.clinic.findUnique({
      where: { slug },
      select: { id: true, slug: true }
    });
    if (!clinic) throw new Error(`Clinic "${slug}" not found`);

    const validStatuses = ['SCHEDULED', 'WAITING', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
    const upperStatus = status.toUpperCase();
    if (!validStatuses.includes(upperStatus)) {
      throw new Error(`Invalid status "${status}". Allowed: ${validStatuses.join(', ')}`);
    }

    const existing = await prisma.appointment.findFirst({
      where: {
        clinicId: clinic.id,
        reference: reference.toUpperCase()
      }
    });
    if (!existing) {
      throw new Error(`Appointment with reference "${reference}" not found in clinic "${slug}"`);
    }

    const updated = await prisma.appointment.update({
      where: { id: existing.id },
      data: {
        status: upperStatus,
        notes: notes ? (existing.notes ? `${existing.notes} | ${notes}` : notes) : existing.notes,
        prescription: prescription ? prescription : existing.prescription
      },
      include: {
        doctor: true
      }
    });

    clinicEventService.broadcast(
      'appointment_status_changed',
      {
        action: 'STATUS_UPDATED',
        previousStatus: existing.status,
        newStatus: upperStatus,
        appointment: updated
      },
      clinic.slug
    );

    return updated;
  }

  /**
   * Search appointment by reference (OPD-XXXX) or patient phone
   */
  async lookupAppointment(slug: string, query: string) {
    const clinic = await prisma.clinic.findUnique({
      where: { slug },
      select: { id: true }
    });
    if (!clinic) throw new Error(`Clinic "${slug}" not found`);

    const cleanQuery = query.trim();
    const cleanPhone = sanitizePhone(cleanQuery);

    const appointment = await prisma.appointment.findFirst({
      where: {
        clinicId: clinic.id,
        OR: [
          { reference: { equals: cleanQuery.toUpperCase() } },
          { patientPhone: { contains: cleanPhone.replace(/^\+/, '') } },
          { patientPhone: { equals: cleanPhone } }
        ]
      },
      include: {
        doctor: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return appointment;
  }

  /**
   * List appointments with optional filters
   */
  async listAppointments(
    slug: string,
    filters?: {
      date?: string;
      status?: string;
      doctorId?: string;
      limit?: number;
    }
  ) {
    const clinic = await prisma.clinic.findUnique({
      where: { slug },
      select: { id: true }
    });
    if (!clinic) throw new Error(`Clinic "${slug}" not found`);

    const where: any = { clinicId: clinic.id };
    if (filters?.date) where.date = filters.date;
    if (filters?.status) where.status = filters.status.toUpperCase();
    if (filters?.doctorId) where.doctorId = filters.doctorId;

    return prisma.appointment.findMany({
      where,
      include: {
        doctor: true
      },
      orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }],
      take: filters?.limit || 100
    });
  }

  /**
   * Hard delete appointment by reference
   */
  async deleteAppointment(slug: string, reference: string) {
    const clinic = await prisma.clinic.findUnique({
      where: { slug },
      select: { id: true, slug: true }
    });
    if (!clinic) throw new Error(`Clinic "${slug}" not found`);

    const existing = await prisma.appointment.findFirst({
      where: {
        clinicId: clinic.id,
        reference: reference.toUpperCase()
      }
    });
    if (!existing) {
      throw new Error(`Appointment "${reference}" not found`);
    }

    await prisma.appointment.delete({
      where: { id: existing.id }
    });

    clinicEventService.broadcast(
      'appointment_deleted',
      {
        action: 'DELETED',
        reference: existing.reference
      },
      clinic.slug
    );

    return { success: true, reference: existing.reference };
  }

  /**
   * Process post-call webhook from Talkar Voice AI
   */
  async processCallWebhook(payload: any) {
    const {
      call_id,
      customer_number,
      summary,
      booking_ref,
      company_slug,
      clinic_slug,
      recording_url
    } = payload;

    const targetSlug = clinic_slug || company_slug || 'clove-dental';
    const clinic = await prisma.clinic.findUnique({
      where: { slug: targetSlug }
    });

    if (!clinic) {
      throw new Error(`Clinic "${targetSlug}" not found for post-call webhook`);
    }

    let appointment = null;
    if (booking_ref) {
      appointment = await prisma.appointment.findFirst({
        where: {
          clinicId: clinic.id,
          reference: String(booking_ref).toUpperCase()
        }
      });
    }

    if (!appointment && customer_number) {
      const clean = sanitizePhone(customer_number);
      appointment = await prisma.appointment.findFirst({
        where: {
          clinicId: clinic.id,
          patientPhone: { contains: clean.replace(/^\+/, '') }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (appointment) {
      const updated = await prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          callRunId: call_id || appointment.callRunId,
          callSummary: summary || appointment.callSummary,
          recordingUrl: recording_url || appointment.recordingUrl
        }
      });

      clinicEventService.broadcast(
        'appointment_call_synced',
        {
          action: 'CALL_SYNCED',
          appointment: updated
        },
        clinic.slug
      );

      return { matched: true, appointment: updated };
    }

    return { matched: false, message: 'No matching appointment found to enrich' };
  }

  /**
   * Trigger outbound Voice AI Call via Talkar Telephony MCP
   */
  async triggerAiCall(slug: string, phone: string, patientName: string = 'Patient') {
    const clinic = await prisma.clinic.findUnique({ where: { slug } });
    if (!clinic) throw new Error(`Clinic "${slug}" not found`);

    const cleanPhone = sanitizePhone(phone);
    const apiKey = process.env.TALKAR_API_KEY || 'dgr_mhbjuBQqjlZS1AWJ12_SjWd9d_YmmOvGYJtSwQ_UCtY';
    const workflowId = 126; // Clove Dental - Aditi Medical Receptionist (Sarvam 105B)
    const fromPhoneNumberId = 14;

    const payload = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'initiate_call',
        arguments: {
          workflow_id: workflowId,
          phone_number: cleanPhone,
          from_phone_number_id: fromPhoneNumberId,
          initial_context: {
            clinic_slug: slug,
            clinic_name: clinic.name,
            patient_name: patientName,
            phone: cleanPhone,
          }
        }
      }
    };

    const resp = await fetch('https://talkar.in/api/v1/mcp/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();
    return { success: true, response: data };
  }
}

export const clinicService = new ClinicService();
