/* eslint-disable no-console */
require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const verificationRouter = require("./verification.cjs");

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
  origin: [
    'https://mringg.vercel.app',
    'https://mring-style-shop.vercel.app',
    'http://localhost:8080',
    'http://localhost:5173'
  ],
  credentials: true
}));

app.use(express.json());

// Basic healthcheck
app.get("/healthz", (_req, res) => {
  res.status(200).json({ ok: true, timestamp: new Date().toISOString() });
});

// Defaults to your Gmail app-password if env not provided
const DEFAULT_EMAIL_USER = process.env.EMAIL_USER || "hamzateagle@gmail.com";
const DEFAULT_EMAIL_PASS = process.env.EMAIL_PASS || "mwzs mbig ntof idoz";
const DEFAULT_EMAIL_TO = process.env.EMAIL_TO || DEFAULT_EMAIL_USER;

function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE } = process.env;

  if (SMTP_HOST && DEFAULT_EMAIL_USER && DEFAULT_EMAIL_PASS) {
    return nodemailer.createTransporter({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: String(SMTP_SECURE || "false").toLowerCase() === "true",
      auth: { user: DEFAULT_EMAIL_USER, pass: DEFAULT_EMAIL_PASS },
    });
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: DEFAULT_EMAIL_USER, pass: DEFAULT_EMAIL_PASS },
  });
}

function ownerNotificationHtml(orderData) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 24px;">📱 Новая заявка (MR.ING)</h2>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Оформлен новый заказ</p>
      </div>
      <div style="background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h3 style="color: #333; margin-top: 0;">📦 Информация о заказе:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Товар:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; color: #333;">${orderData.productName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Цена:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; color: #333;">${orderData.productPrice}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Покупатель:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; color: #333;">${orderData.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Телефон:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; color: #333;">${orderData.phone}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; color: #555;">Email покупателя:</td>
            <td style="padding: 8px; color: #333;">${orderData.email}</td>
          </tr>
        </table>
        <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
          <strong style="color: #555;">Адрес доставки:</strong><br>
          <span style="color: #333;">${orderData.address}</span>
        </div>
        <div style="margin-top: 15px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
          <strong style="color: #555;">Дополнительные детали:</strong><br>
          <span style="color: #333;">${orderData.orderDetails}</span>
        </div>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
        <p>Время заказа: ${new Date().toLocaleString("ru-RU")}</p>
        <p>© 2025 MR.ING - Индивидуальная одежда с принтами</p>
      </div>
    </div>
  `;
}

function customerConfirmationHtml(orderData) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
      <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 28px;">✅ Заказ принят!</h1>
        <p style="margin: 15px 0 0 0; font-size: 18px;">Спасибо за ваш заказ, ${orderData.name}!</p>
      </div>
      <div style="background-color: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0; border-bottom: 2px solid #28a745; padding-bottom: 10px;">📋 Детали вашего заказа</h2>
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #495057; margin: 0 0 15px 0;">🛍️ Заказанный товар:</h3>
          <div style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 10px;">${orderData.productName}</div>
          <div style="font-size: 20px; color: #28a745; font-weight: bold;">${orderData.productPrice}</div>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057; width: 30%;">📧 Email:</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6; color: #333;">${orderData.email}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">📱 Телефон:</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6; color: #333;">${orderData.phone}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">🏠 Адрес доставки:</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6; color: #333;">${orderData.address}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold; color: #495057;">📝 Детали заказа:</td>
            <td style="padding: 12px; color: #333;">${orderData.orderDetails}</td>
          </tr>
        </table>
      </div>
      <div style="background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px 0;">🚀 Что дальше?</h3>
        <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
          <li>Ваш заказ передан в обработку</li>
          <li>Мы свяжемся с вами в течение 24 часов</li>
          <li>Изготовление займет 3-5 рабочих дней</li>
          <li>Доставка по России 1-3 дня</li>
        </ul>
      </div>
      <div style="background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center;">
        <h3 style="color: #333; margin-top: 0;">📞 Контакты</h3>
        <p style="margin: 10px 0; color: #666;">
          <strong>Телефон:</strong> +7 (928) 920 91 04<br>
          <strong>Telegram:</strong> <a href="https://t.me/mringshop" style="color: #007bff; text-decoration: none;">@mringshop</a><br>
          <strong>Instagram:</strong> <a href="https://www.instagram.com/glok_c23" style="color: #007bff; text-decoration: none;">@glok_c23</a>
        </p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 14px;">
        <p>Время заказа: ${new Date().toLocaleString("ru-RU")}</p>
        <p style="margin-top: 15px;">
          <strong>© 2025 MR.ING</strong><br>
          Индивидуальная одежда с уникальными принтами<br>
          Каждый принт наносится вручную для высочайшего качества
        </p>
      </div>
    </div>
  `;
}

async function handleSubmitOrder(req, res) {
  try {
    const { productName, productPrice, name, email, phone, address, orderDetails } = req.body || {};

    if (!productName || !productPrice || !name || !email || !phone || !address) {
      return res.status(400).json({ success: false, error: "Пожалуйста, заполните все обязательные поля" });
    }

    const orderData = {
      productName,
      productPrice,
      name,
      email,
      phone,
      address,
      orderDetails: orderDetails || "Нет дополнительных комментариев",
    };

    const transporter = createTransporter();

    const ownerEmail = DEFAULT_EMAIL_TO;
    if (!ownerEmail) {
      throw new Error("EMAIL_TO или EMAIL_USER не указаны в переменных окружения");
    }

    const [ownerResult, customerResult] = await Promise.all([
      transporter.sendMail({
        from: `"MR.ING" <${DEFAULT_EMAIL_USER}>`,
        to: ownerEmail,
        subject: "Новый заказ MR.ING",
        html: ownerNotificationHtml(orderData),
      }),
      transporter.sendMail({
        from: `"MR.ING" <${DEFAULT_EMAIL_USER}>`,
        to: orderData.email,
        subject: "✅ Ваш заказ в обработке - MR.ING",
        html: customerConfirmationHtml(orderData),
      }),
    ]);

    if (ownerResult.accepted.length === 0) {
      console.warn("Owner email not accepted by SMTP server");
    }
    if (customerResult.accepted.length === 0) {
      console.warn("Customer email not accepted by SMTP server");
    }

    return res.status(200).json({
      success: true,
      message: "Заказ успешно оформлен! Письма отправлены.",
    });
  } catch (error) {
    console.error("Ошибка при обработке заказа:", error);
    return res.status(500).json({ success: false, error: "Произошла ошибка при обработке заказа. Попробуйте еще раз." });
  }
}

// API endpoints
app.post("/submit-order", handleSubmitOrder);
app.post("/api/submit-order", handleSubmitOrder);

// Email verification endpoints
app.use("/api", verificationRouter);

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "MR.ING API Server", 
    version: "1.0.0",
    endpoints: [
      "/submit-order", 
      "/api/submit-order", 
      "/api/send-verification", 
      "/api/verify-email", 
      "/healthz"
    ]
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 MR.ING API Server is running on port ${port}`);
  console.log(`📧 Email configured: ${DEFAULT_EMAIL_USER}`);
  console.log(`🌐 CORS enabled for: https://mringg.vercel.app`);
});
