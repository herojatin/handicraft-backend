import nodemailer from "nodemailer";

export const sendContactMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    // Gmail Transport
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email to Admin
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "info@haswanihandicrafts.com", // Admin email
      subject: "📩 New Contact Form Message",
      html: `
        <div style="font-family:Arial,sans-serif">
          <h2>New Contact Form Submission</h2>

          <table cellpadding="8">
            <tr>
              <td><strong>Name</strong></td>
              <td>${name}</td>
            </tr>

            <tr>
              <td><strong>Email</strong></td>
              <td>${email}</td>
            </tr>
          </table>

          <h3>Message</h3>

          <p>${message}</p>
        </div>
      `,
    });

    res.status(200).json({
      success: true,
      message: "Message sent successfully.",
    });
  } catch (err) {
   console.error("Nodemailer Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to send message.",
    });
  }
};