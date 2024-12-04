const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send verification email
const sendVerificationEmail = async (email, token) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
    
    const mailOptions = {
        from: `"HiTech Store" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Vérification de votre compte HiTech Store',
        html: `
            <h1>Bienvenue sur HiTech Store!</h1>
            <p>Merci de vous être inscrit. Pour activer votre compte, veuillez cliquer sur le lien ci-dessous :</p>
            <a href="${verificationUrl}" style="
                display: inline-block;
                padding: 10px 20px;
                background-color: #007bff;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
            ">Vérifier mon email</a>
            <p>Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :</p>
            <p>${verificationUrl}</p>
            <p>Ce lien expirera dans 24 heures.</p>
            <p>Si vous n'avez pas créé de compte sur HiTech Store, vous pouvez ignorer cet email.</p>
        `
    };

    await transporter.sendMail(mailOptions);
};

// Send reset password email
const sendResetPasswordEmail = async (email, token) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    
    const mailOptions = {
        from: `"HiTech Store" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Réinitialisation de votre mot de passe HiTech Store',
        html: `
            <h1>Réinitialisation de mot de passe</h1>
            <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
            <a href="${resetUrl}" style="
                display: inline-block;
                padding: 10px 20px;
                background-color: #007bff;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
            ">Réinitialiser mon mot de passe</a>
            <p>Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :</p>
            <p>${resetUrl}</p>
            <p>Ce lien expirera dans 1 heure.</p>
            <p>Si vous n'avez pas demandé la réinitialisation de votre mot de passe, vous pouvez ignorer cet email.</p>
        `
    };

    await transporter.sendMail(mailOptions);
};

// Send order confirmation email
const sendOrderConfirmationEmail = async (email, order) => {
    const mailOptions = {
        from: `"HiTech Store" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Confirmation de votre commande HiTech Store',
        html: `
            <h1>Merci pour votre commande!</h1>
            <p>Votre commande #${order.referenceNumber} a été confirmée.</p>
            <h2>Détails de la commande :</h2>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background-color: #f8f9fa;">
                    <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Produit</th>
                    <th style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">Prix</th>
                </tr>
                ${order.items.map(item => `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #dee2e6;">${item.product.name}</td>
                        <td style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">${item.price.toFixed(2)} TND</td>
                    </tr>
                `).join('')}
                <tr>
                    <td style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">Sous-total:</td>
                    <td style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">${order.subtotal.toFixed(2)} TND</td>
                </tr>
                <tr>
                    <td style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">Commission (15%):</td>
                    <td style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">${order.commission.toFixed(2)} TND</td>
                </tr>
                <tr style="font-weight: bold;">
                    <td style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">Total:</td>
                    <td style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">${order.total.toFixed(2)} TND</td>
                </tr>
            </table>
            ${order.activationCodes ? `
                <h2>Vos codes d'activation :</h2>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr style="background-color: #f8f9fa;">
                        <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Service</th>
                        <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Code</th>
                    </tr>
                    ${order.activationCodes.map(code => `
                        <tr>
                            <td style="padding: 10px; border: 1px solid #dee2e6;">${code.service}</td>
                            <td style="padding: 10px; border: 1px solid #dee2e6;">${code.code}</td>
                        </tr>
                    `).join('')}
                </table>
            ` : ''}
            <p>Vous pouvez suivre l'état de votre commande en vous connectant à votre compte.</p>
        `
    };

    await transporter.sendMail(mailOptions);
};

module.exports = {
    sendVerificationEmail,
    sendResetPasswordEmail,
    sendOrderConfirmationEmail
};
