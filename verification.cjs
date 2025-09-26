// Email verification endpoints for MR.ING API Server
const express = require("express");
const nodemailer = require("nodemailer");

const router = express.Router();

// In-memory storage for verification codes (in production, use Redis or database)
const verificationCodes = new Map();

// Generate 6-digit verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create email transporter
function createTransporter() {
  const DEFAULT_EMAIL_USER = process.env.EMAIL_USER || "hamzateagle@gmail.com";
  const DEFAULT_EMAIL_PASS = process.env.EMAIL_PASS || "mwzs mbig ntof idoz";

  return nodemailer.createTransporter({
    service: "gmail",
    auth: { user: DEFAULT_EMAIL_USER, pass: DEFAULT_EMAIL_PASS },
  });
}

// Send verification code via email
router.post("/send-verification", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: "Email адрес обязателен" 
      });
    }

    // Generate verification code
    const code = generateVerificationCode();
    
    // Store code with expiration (5 minutes)
    verificationCodes.set(email, {
      code,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
      attempts: 0
    });

    // Send email with verification code
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"MR.ING" <${process.env.EMAIL_USER || "hamzateagle@gmail.com"}>`,
      to: email,
      subject: "🔐 Подтверждение email - MR.ING",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 28px;">🔐 Подтверждение email</h1>
            <p style="margin: 15px 0 0 0; font-size: 18px;">MR.ING - Индивидуальная одежда с принтами</p>
          </div>
          
          <div style="background-color: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Ваш код подтверждения:</h2>
            <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${code}
              </div>
            </div>
            <p style="color: #666; margin: 20px 0;">
              Введите этот код в форме подтверждения для завершения заказа.
            </p>
            <div style="background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px;">
                ⏰ Код действителен в течение 5 минут<br>
                🔒 Не передавайте код третьим лицам
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 14px;">
            <p>Если вы не запрашивали подтверждение, проигнорируйте это письмо.</p>
            <p style="margin-top: 15px;">
              <strong>© 2025 MR.ING</strong><br>
              Индивидуальная одежда с уникальными принтами
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "Код подтверждения отправлен на email"
    });

  } catch (error) {
    console.error("Ошибка при отправке кода подтверждения:", error);
    res.status(500).json({
      success: false,
      error: "Ошибка при отправке кода подтверждения"
    });
  }
});

// Verify email code
router.post("/verify-email", async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: "Email и код обязательны"
      });
    }

    const storedData = verificationCodes.get(email);

    if (!storedData) {
      return res.status(400).json({
        success: false,
        error: "Код не найден или истек. Запросите новый код."
      });
    }

    // Check if code expired
    if (Date.now() > storedData.expires) {
      verificationCodes.delete(email);
      return res.status(400).json({
        success: false,
        error: "Код истек. Запросите новый код."
      });
    }

    // Check attempts limit
    if (storedData.attempts >= 3) {
      verificationCodes.delete(email);
      return res.status(400).json({
        success: false,
        error: "Превышено количество попыток. Запросите новый код."
      });
    }

    // Verify code
    if (storedData.code !== code) {
      storedData.attempts++;
      verificationCodes.set(email, storedData);
      
      return res.status(400).json({
        success: false,
        error: "Неверный код подтверждения"
      });
    }

    // Code is correct, remove from storage
    verificationCodes.delete(email);

    res.json({
      success: true,
      message: "Email успешно подтвержден"
    });

  } catch (error) {
    console.error("Ошибка при проверке кода:", error);
    res.status(500).json({
      success: false,
      error: "Ошибка при проверке кода"
    });
  }
});

module.exports = router;
