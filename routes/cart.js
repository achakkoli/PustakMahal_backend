
const express = require('express');
const router = express.Router();

let cart = [];

router.post('/add', (req, res) => {
    const { bookId, quantity } = req.body;
    cart.push({ bookId, quantity });
    res.json({ message: 'Item added to cart', cart });
});

router.get('/', (req, res) => {
    res.json(cart);
});

module.exports = router;
