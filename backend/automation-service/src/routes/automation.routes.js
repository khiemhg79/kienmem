const router = require('express').Router()
const { getRules, createRule, updateRule, deleteRule, triggerRule } = require('../controllers/automation.controller')

router.get   ('/',          getRules)
router.post  ('/',          createRule)
router.put   ('/:id',       updateRule)
router.delete('/:id',       deleteRule)
router.post  ('/:id/trigger', triggerRule)

module.exports = router