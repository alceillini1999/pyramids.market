const router = require('express').Router();
const Sale = require('../models/Sale');
const auth = require('../middlewares/auth');

router.get('/', auth, async (req,res)=>{
  const { page=1, limit=20, q='' } = req.query;
  const sk = (page-1)*limit;
  const criteria = q ? {
    $or: [
      { invoiceNumber: new RegExp(q, 'i') },
      { clientName: new RegExp(q, 'i') }
    ]
  } : {};
  const [rows, count] = await Promise.all([
    Sale.find(criteria).sort({ createdAt:-1 }).skip(+sk).limit(+limit),
    Sale.countDocuments(criteria)
  ]);
  res.json({ rows, count });
});

router.get('/:id', auth, async (req,res)=>{
  const sale = await Sale.findById(req.params.id).populate('client').populate('items.product');
  if(!sale) return res.status(404).json({message:'Not found'});
  res.json(sale);
});

module.exports = router;
