const nodemailer = require("nodemailer");
const uuid = require("uuid");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Forgotpassword = require("../models/ForgotPassword");

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email });
    // const id = uuid.v4();
    if (user) {
      const resetReq = await Forgotpassword.create({
        isactive: true,
        userId: user._id,
      });

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASS,
        },
      });

      let info = await transporter.sendMail({
        from: process.env.EMAIL, // sender address
        to: email, // list of receivers
        subject: "Donty worry we will help you get a new password", // Subject line
        text: "Hello world?", // plain text body
        html: `<a href="http://localhost:3000/password/resetpassword/${resetReq._id}">Reset Password</a>`, // html body
      });
      console.log("Message sent: %s", info.messageId);
      res.json(info);
    } else {
      throw new Error("User doesnt exist");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ err });
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const id = req.params.id;
    const findreq = await Forgotpassword.findById(id);
    if (findreq) {
      await findreq.updateOne({ isactive: false });
      res.status(200).send(`<html>
                                    <script>
                                        function formsubmitted(e){
                                            e.preventDefault();
                                            console.log('called')
                                        }
                                    </script>

                                    <form action="/password/updatepassword/${findreq._id}" method="get">
                                        <label for="newpassword">Enter New password</label>
                                        <input name="newpassword" type="password" required></input>
                                        <button>reset password</button>
                                    </form>
                            </html>`);
      res.end();
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ err });
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const { newpassword } = req.query;
    const { resetpasswordid } = req.params;
    const resetreq = await Forgotpassword.findById(resetpasswordid);
    const user = await User.findById(resetreq.userId);
    if (user) {
      const saltRounds = 10;
      bcrypt.hash(newpassword, saltRounds, async (err, hash) => {
        if (err) {
          console.log(err);
          throw new Error(err);
        }
        await user.updateOne({ password: hash });
        res
          .status(201)
          .json({ message: "Successfuly update the new password" });
      });
    } else {
      throw new Error("User doesnt exist");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ err });
  }
};

module.exports = {
  forgotPassword,
  resetPassword,
  updatePassword,
};
