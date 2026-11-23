import { Router, Request, Response } from 'express';
import { clinicService } from '../services/clinic.js';

export const webhooksRouter = Router();

// POST /api/webhooks/call-completed - Talkar Post-Call intelligence receiver
webhooksRouter.post('/call-completed', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    console.log(`📞 Post-Call Webhook received for call ${payload.call_id || 'unknown'}`);

    const result = await clinicService.processCallWebhook(payload);

    res.json({
      success: true,
      message: 'Post-call intelligence processed successfully',
      result
    });
  } catch (error: any) {
    console.error('❌ Post-call webhook error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});
