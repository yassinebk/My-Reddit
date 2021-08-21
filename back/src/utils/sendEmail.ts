import nodemailer from "nodemailer"


export async function sendEmail(to: string, html: string) {
    let testAccount = await nodemailer.createTestAccount();
    console.log('testAccount', testAccount);

    let transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
            user: "hvdd6652ybiigo5o@ethereal.email",
            pass: "eyTU4KfbfB8774Bame",
        }
    });
    let info = await transporter.sendMail({
        from: `"Fred Foo" <${"hvdd6652ybiigo5o@ethereal.email"}> `, to: to,
        subject: "Change password",
        html,
    })

    console.log("Message sent %s : ", info.messageId);
    console.log("Preview URL", nodemailer.getTestMessageUrl(info))
}