import nodemailer from "nodemailer";
import config from "config";
import jwt from "jsonwebtoken";
import cloudinary from "cloudinary";
import apiError from "./apiError";
import userModel from "../models/user";
import qrcode from "qrcode";
import productModel from "../models/product"
cloudinary.config({
  cloud_name: "df2ckvd8a",
  api_key: "395198921416824",
  api_secret: "-K7wMPMFG_W2XJH0EunJLbcSVTc",
});

module.exports = {
  getOTP() {
    const otp = Math.floor(10000 + Math.random() * 90000);
    return otp;
  },
  async sendMail(email, subject, html) {
    try {
      var transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: config.get("nodemailer.email"),
          pass: config.get("nodemailer.password"),
        },
      });

      var mailOptions = {
        from: "abhijeet.rai@indicchain.com",
        to: email,
        subject: subject,
        html: html,
      };
      let send = await transporter.sendMail(mailOptions);
      return send;
    } catch (error) {
      return error;
    }
  },
  getToken: async (payload) => {
    try {
      const token = jwt.sign(payload, config.get("jwtsecret"), {
        expiresIn: "24h",
      });
      return token;
    } catch (error) {
      return error;
    }
  },
  base64encoded: async (data) => {
    try {
      return await qrcode.toDataURL(data);
    } catch (error) {
      return error;
    }
  },
  getSecureUrl: async (base64) => {
    try {
      const data = await cloudinary.v2.uploader.upload(base64);
      return data.secure_url;
    } catch (error) {
      return error;
    }
  },





};
