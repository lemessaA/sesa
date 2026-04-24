import { Router } from 'express';
import type { Request, Response } from 'express';
import { WebhookReceiver } from 'livekit-server-sdk';
import LiveSession from '../models/LiveSession.js';
import logger from '../../utils/logger.js';

const router = Router();
const receiver = new WebhookReceiver(process.env.LIVEKIT_API_KEY || '', process.env.LIVEKIT_API_SECRET || '');

router.post('/livekit', async (req: Request, res: Response) => {
    try {
        const event = await receiver.receive(req.body, req.get('Authorization') || '');
        logger.info(`[LiveKit-Webhook] Event: ${event.event}`, { room: event.room?.name });

        switch (event.event) {
            case 'room_finished':
                if (event.room?.name) {
                    await LiveSession.findOneAndUpdate({ livekitRoomName: event.room.name, status: 'live' }, { status: 'ended', endedAt: new Date() });
                }
                break;
            case 'egress_ended':
                if (event.egressInfo?.file?.location) {
                    await LiveSession.findOneAndUpdate({ recordingId: event.egressInfo.egressId }, { recordingUrl: event.egressInfo.file.location });
                }
                break;
        }
        res.json({ success: true });
    } catch (err: any) {
        logger.error(`[LiveKit-Webhook] Error: ${err.message}`);
        res.status(400).send('Invalid webhook request');
    }
});

export default router;
