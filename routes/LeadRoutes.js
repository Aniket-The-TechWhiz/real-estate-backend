const express = require('express');
const router = express.Router();
const {
  submitLead,
  getAllLeads,
  getLeadById,
  updateLeadStatus,
  downloadLeadsExcel,
  deleteLead
} = require('../controller/LeadController');

// Lead routes
router.post('/submit', submitLead);
router.get('/', getAllLeads);
router.get('/download-excel', downloadLeadsExcel);
router.get('/:id', getLeadById);
router.put('/:id/status', updateLeadStatus);
router.delete('/:id', deleteLead);

module.exports = router;
