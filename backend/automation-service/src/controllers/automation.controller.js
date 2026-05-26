const { Rule } = require('../models/automation.model')
const { executeRule } = require('../services/automation.service')

// GET /api/rules
async function getRules(req, res) {
  try {
    const rules = await Rule.findAll({ order: [['createdAt', 'DESC']] })
    res.json(rules)
  } catch (e) { res.status(500).json({ error: e.message }) }
}

// POST /api/rules
async function createRule(req, res) {
  try {
    const { name, description, trigger_type, condition, action, notify, notify_message, is_active } = req.body
    if (!name || !condition || !action) return res.status(400).json({ error: 'name, condition, action là bắt buộc' })
    if (!action.device_id) return res.status(400).json({ error: 'action.device_id là bắt buộc' })

    const rule = await Rule.create({ name, description, trigger_type, condition, action, notify, notify_message, is_active })
    res.status(201).json(rule)
  } catch (e) { res.status(500).json({ error: e.message }) }
}

// PUT /api/rules/:id
async function updateRule(req, res) {
  try {
    const rule = await Rule.findByPk(req.params.id)
    if (!rule) return res.status(404).json({ error: 'Không tìm thấy rule' })
    await rule.update(req.body)
    res.json(rule)
  } catch (e) { res.status(500).json({ error: e.message }) }
}

// DELETE /api/rules/:id
async function deleteRule(req, res) {
  try {
    const rule = await Rule.findByPk(req.params.id)
    if (!rule) return res.status(404).json({ error: 'Không tìm thấy rule' })
    await rule.destroy()
    res.json({ message: 'Đã xóa' })
  } catch (e) { res.status(500).json({ error: e.message }) }
}

// POST /api/rules/:id/trigger — thực thi thủ công
async function triggerRule(req, res) {
  try {
    const rule = await Rule.findByPk(req.params.id)
    if (!rule) return res.status(404).json({ error: 'Không tìm thấy rule' })
    await executeRule(rule, { value: 'manual' })
    res.json({ message: `Đã thực thi kịch bản "${rule.name}"`, rule })
  } catch (e) { res.status(500).json({ error: e.message }) }
}

module.exports = { getRules, createRule, updateRule, deleteRule, triggerRule }