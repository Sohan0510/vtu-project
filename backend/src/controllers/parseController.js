import * as aiService from '../services/aiService.js';

export async function parsePlacementNotice(req, res, next) {
  try {
    const { text } = req.body || {};
    const sanitizedEvents = await aiService.parseTextWithAI(text);
    return res.status(200).json(sanitizedEvents);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ detail: error.message });
    }
    console.error('Error parsing events with AI:', error);
    return res.status(500).json({ detail: 'Failed to parse AI response' });
  }
}
