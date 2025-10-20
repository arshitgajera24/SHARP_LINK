import nodemailer from "nodemailer"

const sendEmail = async ({to, subject, body}) => {
    try {
    const transporter = nodemailer.createTransport({
        host: "smtp-relay.brevo.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    })

    const response = await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to,
        subject,
        html: body,
    });
    return response;
    }
    catch (error) {
        console.log(error);
    }
}

export default sendEmail;