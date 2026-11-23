import { Router, Request, Response } from 'express';
import { clinicService } from '../services/clinic.js';

export const appointmentsRouter = Router({ mergeParams: true });

// GET /api/clinics/:slug/appointments/lookup - Search by reference or phone
appointmentsRouter.get('/lookup', async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    const query = req.query.query ? String(req.query.query) : req.query.reference ? String(req.query.reference) : '';
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Missing search query (e.g. ?query=OPD-7821 or ?query=9876543210)'
      });
    }

    const appointment = await clinicService.lookupAppointment(slug, query);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: `No appointment found matching "${query}"`
      });
    }

    res.json({ success: true, appointment });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/clinics/:slug/appointments - List clinic appointments
appointmentsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    const date = req.query.date ? String(req.query.date) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;
    const doctorId = req.query.doctor_id ? String(req.query.doctor_id) : undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 100;

    const appointments = await clinicService.listAppointments(slug, {
      date,
      status,
      doctorId,
      limit
    });

    res.json({
      success: true,
      count: appointments.length,
      appointments
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/clinics/:slug/appointments - Book a new OPD appointment
appointmentsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    const {
      patient_name,
      patient_phone,
      patient_email,
      doctor_id,
      appointment_date,
      time_slot,
      chief_complaint,
      treatment_code,
      type,
      notes,
      source,
      call_run_id
    } = req.body;

    const appointment = await clinicService.createAppointment(slug, {
      patient_name,
      patient_phone,
      patient_email,
      doctor_id,
      appointment_date,
      time_slot,
      chief_complaint,
      treatment_code,
      type,
      notes,
      source,
      call_run_id
    });

    res.status(201).json({
      success: true,
      message: 'OPD Appointment confirmed successfully',
      reference: appointment.reference,
      appointment
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PATCH /api/clinics/:slug/appointments/:reference/status - Update appointment status
appointmentsRouter.patch('/:reference/status', async (req: Request, res: Response) => {
  try {
    const { slug, reference } = req.params;
    const { status, notes, prescription } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field "status" (SCHEDULED, WAITING, IN_CONSULTATION, COMPLETED, CANCELLED, NO_SHOW)'
      });
    }

    const appointment = await clinicService.updateAppointmentStatus(
      slug,
      reference,
      status,
      notes,
      prescription
    );

    res.json({
      success: true,
      message: `Appointment ${reference} updated to ${appointment.status}`,
      appointment
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE /api/clinics/:slug/appointments/:reference - Hard delete appointment
appointmentsRouter.delete('/:reference', async (req: Request, res: Response) => {
  try {
    const { slug, reference } = req.params;
    const result = await clinicService.deleteAppointment(slug, reference);
    res.json({
      success: true,
      message: `Appointment ${reference} permanently deleted`,
      result
    });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});
