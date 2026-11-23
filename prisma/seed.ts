import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Talkar Clinic EMR multi-tenant database...');

  // 1. Clinic: Clove Dental - Indiranagar
  const cloveClinic = await prisma.clinic.upsert({
    where: { slug: 'clove-dental' },
    update: {
      name: 'Clove Dental - Indiranagar',
      brand: 'Clove Dental India',
      specialty: 'Dental & Oral Surgery',
      tagline: "India's Leading Dental Clinic Network",
      description: 'NABH certified clinic with 100% sterilization standards, painless rotary root canals, German titanium implants, and 3D digital smile aligners.',
      phone: '+91 80 4710 8820',
      email: 'indiranagar@clovedental.in',
      address: '100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038',
      city: 'Bengaluru',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      openHours: 'Monday - Saturday: 9:00 AM - 8:30 PM, Sunday: 10:00 AM - 2:00 PM',
      checkInNotes: 'Please arrive 10 minutes prior to your consultation time. Bring past dental records if available.'
    },
    create: {
      slug: 'clove-dental',
      name: 'Clove Dental - Indiranagar',
      brand: 'Clove Dental India',
      specialty: 'Dental & Oral Surgery',
      tagline: "India's Leading Dental Clinic Network",
      description: 'NABH certified clinic with 100% sterilization standards, painless rotary root canals, German titanium implants, and 3D digital smile aligners.',
      phone: '+91 80 4710 8820',
      email: 'indiranagar@clovedental.in',
      address: '100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038',
      city: 'Bengaluru',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      openHours: 'Monday - Saturday: 9:00 AM - 8:30 PM, Sunday: 10:00 AM - 2:00 PM',
      checkInNotes: 'Please arrive 10 minutes prior to your consultation time. Bring past dental records if available.'
    }
  });

  // 2. Doctors for Clove Dental
  const drPriya = await prisma.doctor.upsert({
    where: { id: 'doc-clove-priya-sharma' },
    update: {
      name: 'Dr. Priya Sharma',
      designation: 'Senior Endodontist & Microscopic RCT Specialist',
      department: 'Endodontics',
      qualification: 'MDS, BDS (AIIMS) - 12 Yrs Exp',
      consultationFee: 600,
      roomNumber: 'OPD-1',
      availableDays: 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
      availableHours: '10:00 AM - 1:30 PM, 4:30 PM - 8:00 PM',
      clinicId: cloveClinic.id
    },
    create: {
      id: 'doc-clove-priya-sharma',
      clinicId: cloveClinic.id,
      name: 'Dr. Priya Sharma',
      designation: 'Senior Endodontist & Microscopic RCT Specialist',
      department: 'Endodontics',
      qualification: 'MDS, BDS (AIIMS) - 12 Yrs Exp',
      consultationFee: 600,
      roomNumber: 'OPD-1',
      availableDays: 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
      availableHours: '10:00 AM - 1:30 PM, 4:30 PM - 8:00 PM'
    }
  });

  const drRajesh = await prisma.doctor.upsert({
    where: { id: 'doc-clove-rajesh-gupta' },
    update: {
      name: 'Dr. Rajesh Gupta',
      designation: 'Chief Oral & Maxillofacial Implantologist',
      department: 'Implantology & Surgery',
      qualification: 'MDS (Oral Surgery), Fellow ICOI (USA) - 16 Yrs Exp',
      consultationFee: 800,
      roomNumber: 'OPD-2',
      availableDays: 'Monday,Wednesday,Friday,Saturday',
      availableHours: '11:00 AM - 3:00 PM, 5:00 PM - 8:30 PM',
      clinicId: cloveClinic.id
    },
    create: {
      id: 'doc-clove-rajesh-gupta',
      clinicId: cloveClinic.id,
      name: 'Dr. Rajesh Gupta',
      designation: 'Chief Oral & Maxillofacial Implantologist',
      department: 'Implantology & Surgery',
      qualification: 'MDS (Oral Surgery), Fellow ICOI (USA) - 16 Yrs Exp',
      consultationFee: 800,
      roomNumber: 'OPD-2',
      availableDays: 'Monday,Wednesday,Friday,Saturday',
      availableHours: '11:00 AM - 3:00 PM, 5:00 PM - 8:30 PM'
    }
  });

  const drSneha = await prisma.doctor.upsert({
    where: { id: 'doc-clove-sneha-reddy' },
    update: {
      name: 'Dr. Sneha Reddy',
      designation: 'Consultant Orthodontist & Certified Invisalign Specialist',
      department: 'Orthodontics & Aligners',
      qualification: 'MDS (Orthodontics), Platinum Invisalign Provider - 9 Yrs Exp',
      consultationFee: 700,
      roomNumber: 'OPD-3',
      availableDays: 'Tuesday,Thursday,Saturday',
      availableHours: '10:30 AM - 2:00 PM, 4:00 PM - 7:30 PM',
      clinicId: cloveClinic.id
    },
    create: {
      id: 'doc-clove-sneha-reddy',
      clinicId: cloveClinic.id,
      name: 'Dr. Sneha Reddy',
      designation: 'Consultant Orthodontist & Certified Invisalign Specialist',
      department: 'Orthodontics & Aligners',
      qualification: 'MDS (Orthodontics), Platinum Invisalign Provider - 9 Yrs Exp',
      consultationFee: 700,
      roomNumber: 'OPD-3',
      availableDays: 'Tuesday,Thursday,Saturday',
      availableHours: '10:30 AM - 2:00 PM, 4:00 PM - 7:30 PM'
    }
  });

  // 3. Treatments for Clove Dental
  const cloveTreatments = [
    {
      code: 'CLOVE-IMPLANT',
      title: 'German Titanium Dental Implant',
      category: 'Implantology',
      description: 'Lifetime warranty Osstem/Nobel Biocare titanium post with custom CAD/CAM zirconia crown. Painless guided surgery under local anesthesia.',
      price: 38000,
      durationMinutes: 60,
      brochureUrl: 'https://clinic.talkar.in/brochures/dental-implants.pdf',
      prepNotes: 'Fast for 2 hours before the procedure; bring recent OPG X-ray if available.'
    },
    {
      code: 'CLOVE-ALIGNER',
      title: 'Clear Invisible Aligners (Complete Package)',
      category: 'Orthodontics',
      description: 'US FDA-approved removable clear trays for teeth straightening without wires. Includes 3D digital intraoral scan and all refinement sets.',
      price: 65000,
      durationMinutes: 45,
      brochureUrl: 'https://clinic.talkar.in/brochures/clear-aligners.pdf',
      prepNotes: 'Includes complimentary 3D intraoral digital smile preview and virtual scan.'
    },
    {
      code: 'CLOVE-RCT',
      title: 'Rotary Single-Sitting Root Canal Treatment (RCT)',
      category: 'Endodontics',
      description: 'Microscope-enhanced painless canal disinfection with digital apex locator and biocompatible seal. Crown restoration recommended afterwards.',
      price: 5500,
      durationMinutes: 45,
      brochureUrl: 'https://clinic.talkar.in/brochures/root-canal-care.pdf',
      prepNotes: 'Have a light meal before visit. Take prescribed pain relievers if acute pain.'
    },
    {
      code: 'CLOVE-CLEAN',
      title: 'Full Mouth Ultrasonic Scaling & Deep Polishing',
      category: 'Preventive Care',
      description: 'Gentle removal of tartar, calculus, and stains with ultrasonic cavitation, followed by diamond paste polishing and fluoride varnish.',
      price: 1500,
      durationMinutes: 30,
      brochureUrl: 'https://clinic.talkar.in/brochures/teeth-cleaning-guide.pdf',
      prepNotes: 'Routine preventative dental maintenance recommended every 6 months.'
    }
  ];

  for (const t of cloveTreatments) {
    await prisma.treatment.upsert({
      where: {
        clinicId_code: {
          clinicId: cloveClinic.id,
          code: t.code
        }
      },
      update: t,
      create: {
        ...t,
        clinicId: cloveClinic.id
      }
    });
  }

  // 4. Sample OPD Appointments for Clove Dental
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const cloveAppointments = [
    {
      reference: 'OPD-7821',
      clinicId: cloveClinic.id,
      doctorId: drPriya.id,
      doctorName: drPriya.name,
      department: drPriya.department,
      patientName: 'Rahul Verma',
      patientPhone: '9876543210',
      patientEmail: 'rahul.verma@example.com',
      date: today,
      timeSlot: '11:30 AM',
      type: 'CONSULTATION',
      status: 'SCHEDULED',
      symptoms: 'Persistent dull ache in lower right molar when biting',
      treatmentCode: 'CLOVE-RCT',
      fee: 600,
      paymentStatus: 'PAY_AT_CLINIC',
      source: 'VOICE_AI',
      notes: 'Patient asked for appointment during AI call with Aditi; WhatsApp confirmation dispatched.'
    },
    {
      reference: 'OPD-4012',
      clinicId: cloveClinic.id,
      doctorId: drRajesh.id,
      doctorName: drRajesh.name,
      department: drRajesh.department,
      patientName: 'Meera Iyer',
      patientPhone: '9811223344',
      patientEmail: 'meera.iyer@example.com',
      date: today,
      timeSlot: '12:00 PM',
      type: 'CONSULTATION',
      status: 'WAITING',
      symptoms: 'Consultation for full arch missing teeth implant restoration',
      treatmentCode: 'CLOVE-IMPLANT',
      fee: 800,
      paymentStatus: 'PAY_AT_CLINIC',
      source: 'VOICE_AI',
      notes: 'Patient arrived at reception and checked in. OPG X-ray loaded in system.'
    },
    {
      reference: 'OPD-3189',
      clinicId: cloveClinic.id,
      doctorId: drSneha.id,
      doctorName: drSneha.name,
      department: drSneha.department,
      patientName: 'Amit Patel',
      patientPhone: '9723456789',
      patientEmail: 'amit.patel@example.com',
      date: today,
      timeSlot: '10:30 AM',
      type: 'PROCEDURE',
      status: 'IN_CONSULTATION',
      symptoms: 'Crowding in front upper teeth - 3D aligner digital scan',
      treatmentCode: 'CLOVE-ALIGNER',
      fee: 700,
      paymentStatus: 'PAY_AT_CLINIC',
      source: 'WALK_IN',
      notes: 'In Chair 3 with Dr. Sneha for 3D digital iTero intraoral scan.'
    },
    {
      reference: 'OPD-2905',
      clinicId: cloveClinic.id,
      doctorId: drPriya.id,
      doctorName: drPriya.name,
      department: drPriya.department,
      patientName: 'Sunita Rao',
      patientPhone: '9654321098',
      patientEmail: 'sunita.rao@example.com',
      date: today,
      timeSlot: '10:00 AM',
      type: 'FOLLOW_UP',
      status: 'COMPLETED',
      symptoms: 'Follow-up post-RCT crown cementation',
      treatmentCode: 'CLOVE-RCT',
      fee: 0,
      paymentStatus: 'PAID',
      source: 'PHONE',
      notes: 'Permanent zirconia crown seated comfortably with dual-cure resin. Occlusion verified.',
      prescription: 'Tab. Amoxicillin 500mg TDS x 3 days, Tab. Zerodol-SP SOS.'
    },
    {
      reference: 'OPD-9541',
      clinicId: cloveClinic.id,
      doctorId: drRajesh.id,
      doctorName: drRajesh.name,
      department: drRajesh.department,
      patientName: 'Kavita Nair',
      patientPhone: '9845012345',
      patientEmail: 'kavita.nair@example.com',
      date: tomorrow,
      timeSlot: '04:30 PM',
      type: 'CONSULTATION',
      status: 'SCHEDULED',
      symptoms: 'Fractured premolar tooth from hard food, seeking implant evaluation',
      treatmentCode: 'CLOVE-IMPLANT',
      fee: 800,
      paymentStatus: 'PAY_AT_CLINIC',
      source: 'VOICE_AI',
      notes: 'Booked via Voice AI Concierge (Aditi).'
    }
  ];

  for (const appt of cloveAppointments) {
    await prisma.appointment.upsert({
      where: { reference: appt.reference },
      update: appt,
      create: appt
    });
  }

  // 5. Second Clinic: Apollo Clinic - Koramangala (Multi-Specialty)
  const apolloClinic = await prisma.clinic.upsert({
    where: { slug: 'apollo-clinic' },
    update: {
      name: 'Apollo Clinic - Koramangala',
      brand: 'Apollo Hospitals',
      specialty: 'Family Medicine & Multi-Specialty',
      tagline: 'Touched By A Billion Lives',
      phone: '+91 80 2553 4400',
      email: 'koramangala@apolloclinic.com',
      address: '80 Feet Road, 4th Block, Koramangala, Bengaluru, Karnataka 560034',
      city: 'Bengaluru',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      openHours: 'Monday - Sunday: 8:00 AM - 9:00 PM',
      checkInNotes: 'Please present your appointment confirmation SMS or reference at the reception.'
    },
    create: {
      slug: 'apollo-clinic',
      name: 'Apollo Clinic - Koramangala',
      brand: 'Apollo Hospitals',
      specialty: 'Family Medicine & Multi-Specialty',
      tagline: 'Touched By A Billion Lives',
      phone: '+91 80 2553 4400',
      email: 'koramangala@apolloclinic.com',
      address: '80 Feet Road, 4th Block, Koramangala, Bengaluru, Karnataka 560034',
      city: 'Bengaluru',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      openHours: 'Monday - Sunday: 8:00 AM - 9:00 PM',
      checkInNotes: 'Please present your appointment confirmation SMS or reference at the reception.'
    }
  });

  const drAnanya = await prisma.doctor.upsert({
    where: { id: 'doc-apollo-ananya-sen' },
    update: {
      name: 'Dr. Ananya Sen',
      designation: 'Senior Consultant Physician & Diabetologist',
      department: 'Internal Medicine',
      qualification: 'MD, MBBS (CMC Vellore) - 14 Yrs Exp',
      consultationFee: 750,
      roomNumber: 'OPD-1',
      availableDays: 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
      availableHours: '9:00 AM - 1:00 PM, 5:00 PM - 8:30 PM',
      clinicId: apolloClinic.id
    },
    create: {
      id: 'doc-apollo-ananya-sen',
      clinicId: apolloClinic.id,
      name: 'Dr. Ananya Sen',
      designation: 'Senior Consultant Physician & Diabetologist',
      department: 'Internal Medicine',
      qualification: 'MD, MBBS (CMC Vellore) - 14 Yrs Exp',
      consultationFee: 750,
      roomNumber: 'OPD-1',
      availableDays: 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
      availableHours: '9:00 AM - 1:00 PM, 5:00 PM - 8:30 PM'
    }
  });

  const drSrinivas = await prisma.doctor.upsert({
    where: { id: 'doc-apollo-k-srinivas' },
    update: {
      name: 'Dr. K. Srinivas',
      designation: 'Consultant Pediatrician & Neonatologist',
      department: 'Pediatrics',
      qualification: 'MD (Pediatrics), DCH - 11 Yrs Exp',
      consultationFee: 700,
      roomNumber: 'OPD-2',
      availableDays: 'Monday,Wednesday,Friday,Saturday',
      availableHours: '10:00 AM - 2:00 PM, 4:30 PM - 8:00 PM',
      clinicId: apolloClinic.id
    },
    create: {
      id: 'doc-apollo-k-srinivas',
      clinicId: apolloClinic.id,
      name: 'Dr. K. Srinivas',
      designation: 'Consultant Pediatrician & Neonatologist',
      department: 'Pediatrics',
      qualification: 'MD (Pediatrics), DCH - 11 Yrs Exp',
      consultationFee: 700,
      roomNumber: 'OPD-2',
      availableDays: 'Monday,Wednesday,Friday,Saturday',
      availableHours: '10:00 AM - 2:00 PM, 4:30 PM - 8:00 PM'
    }
  });

  // Apollo Treatments
  const apolloTreatments = [
    {
      code: 'APOLLO-HEALTH-CHECK',
      title: 'Comprehensive Master Health Checkup',
      category: 'Preventive Diagnostics',
      description: 'Includes Complete Blood Count, Liver & Kidney Function Tests, Lipid Profile, Fasting Blood Glucose, ECG, and Doctor Consultation.',
      price: 3500,
      durationMinutes: 90,
      brochureUrl: 'https://clinic.talkar.in/brochures/dental-implants.pdf',
      prepNotes: 'Fasting required for 10-12 hours prior to sample collection.'
    },
    {
      code: 'APOLLO-DIABETES-CARE',
      title: 'Annual Diabetes & Metabolic Management Plan',
      category: 'Chronic Care',
      description: 'Quarterly HbA1c tests, continuous glucose monitoring analysis, diet and lifestyle counseling with Diabetologist consultation.',
      price: 4800,
      durationMinutes: 45,
      brochureUrl: 'https://clinic.talkar.in/brochures/clear-aligners.pdf',
      prepNotes: 'Bring all past medical prescriptions and recent lab reports.'
    },
    {
      code: 'APOLLO-PEDIATRIC-WELLNESS',
      title: 'Child Growth & Vaccination Consultation',
      category: 'Pediatrics',
      description: 'Developmental milestones tracking, nutritional assessment, and IAP-recommended immunization review by Senior Pediatrician.',
      price: 700,
      durationMinutes: 30,
      brochureUrl: 'https://clinic.talkar.in/brochures/teeth-cleaning-guide.pdf',
      prepNotes: 'Bring child immunization book and previous vaccination records.'
    }
  ];

  for (const t of apolloTreatments) {
    await prisma.treatment.upsert({
      where: {
        clinicId_code: {
          clinicId: apolloClinic.id,
          code: t.code
        }
      },
      update: t,
      create: {
        ...t,
        clinicId: apolloClinic.id
      }
    });
  }

  // Apollo Appointments
  const apolloAppointments = [
    {
      reference: 'OPD-5102',
      clinicId: apolloClinic.id,
      doctorId: drAnanya.id,
      doctorName: drAnanya.name,
      department: drAnanya.department,
      patientName: 'Anita Desai',
      patientPhone: '9820011223',
      patientEmail: 'anita.desai@example.com',
      date: today,
      timeSlot: '11:00 AM',
      type: 'CONSULTATION',
      status: 'SCHEDULED',
      symptoms: 'Quarterly diabetes review and HbA1c test report discussion',
      treatmentCode: 'APOLLO-DIABETES-CARE',
      fee: 750,
      paymentStatus: 'PAY_AT_CLINIC',
      source: 'VOICE_AI',
      notes: 'Fasting report brought; requested prescription refill.'
    },
    {
      reference: 'OPD-6194',
      clinicId: apolloClinic.id,
      doctorId: drAnanya.id,
      doctorName: drAnanya.name,
      department: drAnanya.department,
      patientName: 'Vikram Mehta',
      patientPhone: '9845099887',
      patientEmail: 'vikram.mehta@example.com',
      date: today,
      timeSlot: '11:30 AM',
      type: 'CONSULTATION',
      status: 'WAITING',
      symptoms: 'Persistent fatigue, elevated blood pressure and post-lunch sugar spikes',
      treatmentCode: 'APOLLO-HEALTH-CHECK',
      fee: 750,
      paymentStatus: 'PAY_AT_CLINIC',
      source: 'WALK_IN',
      notes: 'Arrived at Koramangala clinic. Vitals recorded: BP 138/88 mmHg.'
    },
    {
      reference: 'OPD-4890',
      clinicId: apolloClinic.id,
      doctorId: drSrinivas.id,
      doctorName: drSrinivas.name,
      department: drSrinivas.department,
      patientName: 'Pooja Sharma',
      patientPhone: '9819876543',
      patientEmail: 'pooja.sharma@example.com',
      date: today,
      timeSlot: '10:30 AM',
      type: 'CONSULTATION',
      status: 'IN_CONSULTATION',
      symptoms: 'Routine 18-month pediatric immunization assessment and fever post vaccination',
      treatmentCode: 'APOLLO-PEDIATRIC-WELLNESS',
      fee: 700,
      paymentStatus: 'PAY_AT_CLINIC',
      source: 'VOICE_AI',
      notes: 'In Chamber 2 with Dr. Srinivas. Child weight 11.2 kg.'
    },
    {
      reference: 'OPD-3211',
      clinicId: apolloClinic.id,
      doctorId: drAnanya.id,
      doctorName: drAnanya.name,
      department: drAnanya.department,
      patientName: 'Rajesh Rao',
      patientPhone: '9741234567',
      patientEmail: 'rajesh.rao@example.com',
      date: today,
      timeSlot: '10:00 AM',
      type: 'FOLLOW_UP',
      status: 'COMPLETED',
      symptoms: 'Hypertension follow-up; BP recorded 122/80 mmHg',
      treatmentCode: 'APOLLO-DIABETES-CARE',
      fee: 750,
      paymentStatus: 'PAID',
      source: 'PHONE',
      notes: 'Blood pressure well controlled. Continued on Tab. Telmisartan 40mg OD.',
      prescription: 'Tab. Telmisartan 40mg OD in morning x 30 days.'
    }
  ];

  for (const appt of apolloAppointments) {
    await prisma.appointment.upsert({
      where: { reference: appt.reference },
      update: appt,
      create: appt
    });
  }

  console.log('✅ Seed completed successfully:');
  console.log(`   - 2 Clinics (clove-dental, apollo-clinic)`);
  console.log(`   - 5 Doctors`);
  console.log(`   - 7 Clinical Treatments`);
  console.log(`   - 9 Realistic OPD Appointments`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
