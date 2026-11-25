import { Router, Request, Response } from 'express';
import { clinicService } from '../services/clinic.js';
import { prisma } from '../lib/prisma.js';

export const clinicsRouter = Router();

// GET /api/clinics - List all registered clinics
clinicsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const clinics = await clinicService.listClinics();
    res.json({
      success: true,
      count: clinics.length,
      clinics
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/clinics/:slug - Get clinic profile with doctors and treatments
clinicsRouter.get('/:slug', async (req: Request, res: Response) => {
  try {
    const clinic = await clinicService.getClinic(req.params.slug);
    if (!clinic) {
      return res.status(404).json({ success: false, error: 'Clinic not found' });
    }
    res.json({ success: true, clinic });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/clinics/:slug/doctors - List doctors for a clinic
clinicsRouter.get('/:slug/doctors', async (req: Request, res: Response) => {
  try {
    const doctors = await clinicService.listDoctors(req.params.slug);
    res.json({
      success: true,
      count: doctors.length,
      doctors
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/clinics/:slug/availability - Check Doctor OPD availability and slots
clinicsRouter.get('/:slug/availability', async (req: Request, res: Response) => {
  try {
    const date = req.query.date ? String(req.query.date) : undefined;
    const doctorId = req.query.doctor_id ? String(req.query.doctor_id) : undefined;
    const availability = await clinicService.getDoctorAvailability(req.params.slug, date, doctorId);
    res.json({ success: true, ...availability });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/clinics/:slug/treatments - List medical & dental treatments with brochures
clinicsRouter.get('/:slug/treatments', async (req: Request, res: Response) => {
  try {
    const treatments = await clinicService.listTreatments(req.params.slug);
    res.json({
      success: true,
      count: treatments.length,
      treatments
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/clinics/:slug/call-patient - Dispatch Talkar Voice AI call
clinicsRouter.post('/:slug/call-patient', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { phone, patient_name } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }
    const result = await clinicService.triggerAiCall(slug, phone, patient_name);
    res.json({ success: true, message: `Call initiated to ${phone}`, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/clinics/cleanup/keep-clove-only - Admin cleanup endpoint to purge all non-Clove clinics
clinicsRouter.post('/cleanup/keep-clove-only', async (_req: Request, res: Response) => {
  try {
    const deleted = await prisma.clinic.deleteMany({
      where: {
        slug: { not: 'clove-dental' }
      }
    });
    res.json({ success: true, message: 'Cleaned up clinics. Kept only Clove Dental.', deletedCount: deleted.count });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/clinics/:slug - Delete clinic and cascade associations
clinicsRouter.delete('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const deleted = await prisma.clinic.delete({
      where: { slug }
    });
    res.json({ success: true, message: `Clinic ${slug} deleted successfully`, deleted });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
