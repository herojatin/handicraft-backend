import transporter from "../config/mail.js";

export const sendAdminNotification = async (dealer) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,

    subject: "New Dealer Registration",

    html: `
      <h2>New Dealer Registration Request</h2>

      <table border="1" cellpadding="8">
        <tr><td><b>Name</b></td><td>${dealer.firstName} ${dealer.lastName}</td></tr>
        <tr><td><b>Company</b></td><td>${dealer.companyName}</td></tr>
        <tr><td><b>Email</b></td><td>${dealer.email}</td></tr>
        <tr><td><b>Mobile</b></td><td>${dealer.mobile}</td></tr>
        <tr><td><b>Country</b></td><td>${dealer.country}</td></tr>
        <tr><td><b>State</b></td><td>${dealer.state}</td></tr>
        <tr><td><b>City</b></td><td>${dealer.city}</td></tr>
        <tr><td><b>Address</b></td><td>${dealer.address}</td></tr>
      </table>

      <br/>

      Please login to the Admin Panel to review this request.
    `,
  });
};

export const sendApprovalEmail = async (dealer) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: dealer.email,

    subject: "Dealer Registration Approved",

    html: `
      <h2>Congratulations!</h2>

      <p>Dear ${dealer.firstName},</p>

      <p>Your dealer registration request has been approved.</p>

      <p>You can now login using your registered email and password.</p>

      <br/>

      <p>Thank you for joining Haswani Handicrafts.</p>

      <br/>

      <p>Regards</p>

      <b>Haswani Handicrafts</b>
    `,
  });
};

export const sendRejectionEmail = async (dealer) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: dealer.email,

    subject: "Dealer Registration Update",

    html: `
      <p>Dear ${dealer.firstName},</p>

      <p>
      Thank you for registering with Haswani Handicrafts.
      </p>

      <p>
      After reviewing your application,
      we are unable to approve your dealership request at this time.
      </p>

      <p>
      Regards<br/>
      Haswani Handicrafts
      </p>
    `,
  });
};