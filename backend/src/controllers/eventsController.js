import * as eventsService from '../services/eventsService.js';

export async function getEvents(req, res, next) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const events = await eventsService.getAllEvents();
    return res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return res.status(500).json({ detail: 'Internal Server Error' });
  }
}

export function headEvents(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
  return res.status(200).end();
}

export async function postEvent(req, res, next) {
  try {
    if (req.body && req.body.action === 'resync_gcal') {
      const result = await eventsService.resyncGoogleCalendar();
      return res.status(200).json(result);
    }

    const result = await eventsService.createEvent(req.body);
    return res.status(201).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ detail: error.message });
    }
    console.error('Database error creating event:', error);
    return res.status(500).json({ detail: 'Internal Server Error' });
  }
}

export async function putEvent(req, res, next) {
  try {
    const result = await eventsService.updateEvent(req.body);
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ detail: error.message });
    }
    console.error('Database error updating event:', error);
    return res.status(500).json({ detail: 'Internal Server Error' });
  }
}

export async function deleteEvent(req, res, next) {
  try {
    const { id } = req.body || {};
    const result = await eventsService.deleteEvent(id);
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ detail: error.message });
    }
    console.error('Database error deleting event:', error);
    return res.status(500).json({ detail: 'Internal Server Error' });
  }
}
