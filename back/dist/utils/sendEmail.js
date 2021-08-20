"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
async function sendEmail(to, html) {
    let transporter = nodemailer_1.default.createTransport({
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
    });
    console.log("Message sent %s : ", info.messageId);
    console.log("Preview URL", nodemailer_1.default.getTestMessageUrl(info));
}
exports.sendEmail = sendEmail;
//# sourceMappingURL=sendEmail.js.map