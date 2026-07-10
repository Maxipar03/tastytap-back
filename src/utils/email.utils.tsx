import { Resend } from 'resend';
import { render } from '@react-email/render';
import VerificationEmail from '../emails/VerificationEmail.js';
import ReceiptEmail from '../emails/RecipeEmail.js';
import { OrderDB } from '../types/order.types.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendReceiptEmail = async (email: string, order: OrderDB): Promise<void> => {
    const emailHtml = await render(
        <ReceiptEmail
            orderId={ order._id.toString() }
            items = { order.items }
            pricing = { order.pricing }
            createdAt = {order.createdAt}
        />
    );

    await resend.emails.send({
        from: `onboarding@resend.dev`,
        to: email,
        subject: `Recibo de Orden #${order._id}`,
        html: emailHtml
    });
};

// export const sendOnboardingEmail = async (
//     email: string,
//     token: string
// ): Promise<void> => {

//     const onboardingUrl = `${process.env.FRONT_ENDPOINT}/access/create/${token}`

//     await resend.emails.send({
//         from: `onboarding@resend.dev`,
//         to: email,
//         subject: "Creá tu restaurante en TastyTap",
//         html: `
//         <div style="background-color:#0f0f0f;padding:40px 0;font-family:Arial,Helvetica,sans-serif;">
//             <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#18181b;border-radius:12px;overflow:hidden;">
                
//                 <!-- Header -->
//                 <tr>
//                     <td style="padding:24px 32px;background:#09090b;">
//                         <h1 style="margin:0;color:#f97316;font-size:22px;">
//                             TastyTap
//                         </h1>
//                         <p style="margin:4px 0 0;color:#a1a1aa;font-size:14px;">
//                             Gestión inteligente para restaurantes
//                         </p>
//                     </td>
//                 </tr>

//                 <!-- Body -->
//                 <tr>
//                     <td style="padding:32px;">
//                         <h2 style="color:#ffffff;font-size:20px;margin-bottom:12px;">
//                             ¡Estás a un paso de crear tu restaurante! 🍽️
//                         </h2>

//                         <p style="color:#d4d4d8;font-size:15px;line-height:1.6;margin-bottom:24px;">
//                             Fuiste invitado a crear tu restaurante en <strong>TastyTap</strong>.
//                             Desde la plataforma vas a poder:
//                         </p>

//                         <ul style="color:#d4d4d8;font-size:14px;line-height:1.6;padding-left:20px;margin-bottom:28px;">
//                             <li>📋 Gestionar tu menú</li>
//                             <li>📲 Recibir pedidos por QR</li>
//                             <li>💳 Cobrar pagos online con Stripe</li>
//                             <li>📊 Ver estadísticas en tiempo real</li>
//                         </ul>

//                         <!-- CTA -->
//                         <div style="text-align:center;margin-bottom:32px;">
//                             <a href="${onboardingUrl}"
//                                style="
//                                display:inline-block;
//                                padding:14px 28px;
//                                background:#f97316;
//                                color:#ffffff;
//                                text-decoration:none;
//                                font-size:15px;
//                                font-weight:bold;
//                                border-radius:10px;">
//                                 Crear mi restaurante
//                             </a>
//                         </div>

//                         <!-- Fallback -->
//                         <p style="color:#a1a1aa;font-size:12px;line-height:1.5;">
//                             Si el botón no funciona, copiá y pegá este enlace en tu navegador:
//                         </p>

//                         <p style="word-break:break-all;color:#f97316;font-size:12px;">
//                             ${onboardingUrl}
//                         </p>

//                         <p style="color:#71717a;font-size:12px;margin-top:24px;">
//                             ⏰ Este enlace expira en <strong>7 días</strong>.
//                         </p>
//                     </td>
//                 </tr>

//                 <!-- Footer -->
//                 <tr>
//                     <td style="padding:20px 32px;background:#09090b;color:#71717a;font-size:11px;text-align:center;">
//                         <p style="margin:0;">
//                             Si no solicitaste esta invitación, podés ignorar este correo.
//                         </p>
//                         <p style="margin:8px 0 0;">
//                             © ${new Date().getFullYear()} TastyTap
//                         </p>
//                     </td>
//                 </tr>

//             </table>
//         </div>
//         `
//     })
// }

export const sendVerificationEmail = async (
    email: string,
    code: string
): Promise<void> => {

    const emailHtml = await render(<VerificationEmail code={code} />);

    await resend.emails.send({
        from: 'TastyTap <notificaciones@tastytap.net>',
        to: [email],
        subject: "Verifica tu cuenta en TastyTap",
        html: emailHtml,
    });
};

