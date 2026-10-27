import * as resultsService from '../services/resultsService.js';

export async function getResultByUsn(req, res, next) {
  try {
    const usn = req.params.usn || req.query.usn;
    const result = await resultsService.getStudentResult(usn);
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ detail: error.message });
    }
    console.error('Results controller error:', error);
    return res.status(500).json({ detail: 'Internal Server Error' });
  }
}
