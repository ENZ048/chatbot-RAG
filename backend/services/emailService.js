const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendOtpEmail = async (email, otp) => {
  await resend.emails.send({
    from: process.env.RESEND_FROM,
    to: email,
    subject: "Your OTP Code - Troika",
    html: `<p>Your OTP is <strong>${otp}</strong>. It will expire in 10 minutes.</p>`,
  });
};
