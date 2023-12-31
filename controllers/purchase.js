const Razorpay = require("razorpay");
const Order = require("../models/Order");

const purchasePremium = async (req, res, next) => {
  try {
    var rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const amount = 2500;
    rzp.orders.create({ amount, currency: "INR" }, async (err, order) => {
      if (err) {
        throw new Error(JSON.stringify(err));
      }
      await Order.create({
        paymentid: "NULL",
        orderid: order.id,
        status: "PENDING",
        userId: req.user._id,
      });
      return res.status(201).json({ order, key_id: rzp.key_id });
    });
  } catch (err) {
    res.status(403).json({ message: "Something went wrong", error: err });
  }
};

const updateTransactionStatus = async (req, res, next) => {
  try {
    const { payment_id, order_id } = req.body;
    console.log(payment_id, order_id);
    const order = await Order.findOne({ orderid: order_id });
    if (payment_id) {
      const promise1 = order.updateOne({
        paymentid: payment_id,
        status: "SUCCESSFUL",
      });
      const promise2 = req.user.updateOne({ ispremiumuser: true });

      Promise.all([promise1, promise2]).then(() => {
        return res
          .status(202)
          .json({ success: true, message: "Transaction Successful" });
      });
    } else {
      await order.updateOne({ paymentid: payment_id, status: "FAILED" });
    }
  } catch (err) {
    res.status(403).json({ message: "Something went wrong", error: err });
  }
};

module.exports = {
  purchasePremium,
  updateTransactionStatus,
};
