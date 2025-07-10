const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

router.get('/:clientId', async (req, res) => {
  const { clientId } = req.params;

  // Get active subscription for this client
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*, plans(*)')
    .eq('client_id', clientId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!subscription) return res.status(404).json({ error: 'No active plan' });

  return res.json(subscription);
});
