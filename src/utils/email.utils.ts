import nodemailer from 'nodemailer';
import { OrderDB } from '../types/order.types.js';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

export const sendReceiptEmail = async (email: string, order: OrderDB): Promise<void> => {
    const itemsList = order.items
        .map(item => `<li>${item.foodName} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</li>`)
        .join('');

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Recibo de Orden #${order._id}`,
        html: `
            <h2>Gracias por tu compra</h2>
            <p><strong>Orden ID:</strong> ${order._id}</p>
            <p><strong>Fecha:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
            <h3>Items:</h3>
            <ul>${itemsList}</ul>
            <p><strong>Subtotal:</strong> $${order.pricing.subtotal.toFixed(2)}</p>
            <p><strong>Impuestos:</strong> $${order.pricing.tax.toFixed(2)}</p>
            <h3><strong>Total:</strong> $${order.pricing.total.toFixed(2)}</h3>
            <p><strong>Método de pago:</strong> ${order.paymentMethod}</p>
        `
    };

    await transporter.sendMail(mailOptions);
};

export const sendOnboardingEmail = async (
    email: string,
    token: string
): Promise<void> => {

    const onboardingUrl = `${process.env.FRONT_ENDPOINT}/access/create/${token}`

    const mailOptions = {
        from: `"TastyTap 🍽️" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Creá tu restaurante en TastyTap",
        html: `
        <div style="background-color:#0f0f0f;padding:40px 0;font-family:Arial,Helvetica,sans-serif;">
            <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#18181b;border-radius:12px;overflow:hidden;">
                
                <!-- Header -->
                <tr>
                    <td style="padding:24px 32px;background:#09090b;">
                        <h1 style="margin:0;color:#f97316;font-size:22px;">
                            TastyTap
                        </h1>
                        <p style="margin:4px 0 0;color:#a1a1aa;font-size:14px;">
                            Gestión inteligente para restaurantes
                        </p>
                    </td>
                </tr>

                <!-- Body -->
                <tr>
                    <td style="padding:32px;">
                        <h2 style="color:#ffffff;font-size:20px;margin-bottom:12px;">
                            ¡Estás a un paso de crear tu restaurante! 🍽️
                        </h2>

                        <p style="color:#d4d4d8;font-size:15px;line-height:1.6;margin-bottom:24px;">
                            Fuiste invitado a crear tu restaurante en <strong>TastyTap</strong>.
                            Desde la plataforma vas a poder:
                        </p>

                        <ul style="color:#d4d4d8;font-size:14px;line-height:1.6;padding-left:20px;margin-bottom:28px;">
                            <li>📋 Gestionar tu menú</li>
                            <li>📲 Recibir pedidos por QR</li>
                            <li>💳 Cobrar pagos online con Stripe</li>
                            <li>📊 Ver estadísticas en tiempo real</li>
                        </ul>

                        <!-- CTA -->
                        <div style="text-align:center;margin-bottom:32px;">
                            <a href="${onboardingUrl}"
                               style="
                               display:inline-block;
                               padding:14px 28px;
                               background:#f97316;
                               color:#ffffff;
                               text-decoration:none;
                               font-size:15px;
                               font-weight:bold;
                               border-radius:10px;">
                                Crear mi restaurante
                            </a>
                        </div>

                        <!-- Fallback -->
                        <p style="color:#a1a1aa;font-size:12px;line-height:1.5;">
                            Si el botón no funciona, copiá y pegá este enlace en tu navegador:
                        </p>

                        <p style="word-break:break-all;color:#f97316;font-size:12px;">
                            ${onboardingUrl}
                        </p>

                        <p style="color:#71717a;font-size:12px;margin-top:24px;">
                            ⏰ Este enlace expira en <strong>7 días</strong>.
                        </p>
                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="padding:20px 32px;background:#09090b;color:#71717a;font-size:11px;text-align:center;">
                        <p style="margin:0;">
                            Si no solicitaste esta invitación, podés ignorar este correo.
                        </p>
                        <p style="margin:8px 0 0;">
                            © ${new Date().getFullYear()} TastyTap
                        </p>
                    </td>
                </tr>

            </table>
        </div>
        `
    }

    await transporter.sendMail(mailOptions)
}

export const sendVerificationEmail = async (
    email: string,
    code: string
): Promise<void> => {
    const mailOptions = {
        from: `"TastyTap 🍽️" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Verifica tu cuenta en TastyTap",
        html: `
      <h2>Verificá tu cuenta</h2>
      <p>Tu código es:</p>
      <h1 style="letter-spacing: 8px; font-size: 40px;">${code}</h1>
      <p>Expira en 10 minutos.</p>
    `
    };

    await transporter.sendMail(mailOptions);
};

