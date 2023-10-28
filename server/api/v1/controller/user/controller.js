import userServices from "../../../v1/services/user";
import apiError from "../../../../helper/apiError";
import responseMessages from "../../../../../assets/responseMessages";
import Joi from "joi";
import commonFunction from "../../../../helper/utils";
import bcrypt from "bcrypt";
import successResponse from "../../../../../assets/response";
import status from "../../../../enums/status";
import userType from "../../../../enums/userType";
import config from "config";
import qr from "qrcode";
import speakeasy from "speakeasy";
import cron from "node-cron";
const {
  checkUserExists,
  createUser,
  findUser,
  updateUserById,
  findAll,
  findUserById,
} = userServices;

export class userController {
  /**
     * @swagger
     * /api/v1/user/userSignup:
     *   post:
     *     tags:
     *       - USER
     *     description: userSignup
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: firstName
     *         description: firstName
     *         in: formData
     *         required: true
     *       - name: lastName
     *         description: lastName
     *         in: formData
     *         required: true
     *       - name: countryCode
     *         description: countryCode
     *         in: formData
     *         required: true
     *       - name: address
     *         description: address
     *         in: formData
     *         required: true
     *       - name: mobileNumber
     *         description: mobileNumber
     *         in: formData
     *         required: true
     *       - name: dateOfBirth
     *         description: dateOfBirth
     *         in: formData
     *         required: true
     *       - name: email
     *         description: email
     *         in: formData
     *         required: true
     *       - name: password
     *         description: password
     *         in: formData
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
  async userSignup(req, res, next) {
    const schema = Joi.object({
      firstName: Joi.string().min(2).max(30).required(),
      lastName: Joi.string().min(3).max(10).required(),
      email: Joi.string().required(),
      password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")),
      mobileNumber: Joi.string()
        .length(10)
        .pattern(/^[0-9]+$/)
        .required(),
      address: Joi.string().alphanum().required(),
      dateOfBirth: Joi.string().required(),
      countryCode: Joi.string().required(),
    });
    try {
      const validatedBody = await schema.validateAsync(req.body);
      const {
        firstName,
        lastName,
        email,
        password,
        mobileNumber,
        address,
        countryCode,
        dateOfBirth,
        otp,
        otpExpireTime,
      } = validatedBody;
      validatedBody.otp = commonFunction.getOTP();
      validatedBody.otpExpireTime = Date.now() + 180000;
      validatedBody.password = bcrypt.hashSync(validatedBody.password, 10);

      const user = await checkUserExists(email, mobileNumber);

      if (user) {
        if (user.status === "BLOCKED") {
          return res.json(apiError.forbidden(responseMessages.UNAUTHORIZED));
        } else if (user.isVerified === true) {
          if (user.mobileNumber === mobileNumber) {
            return res.json(
              apiError.conflict(responseMessages.MOBILE_ALREADY_EXIST)
            );
          } else if (user.email === email) {
            return res.json(
              apiError.conflict(responseMessages.EMAIL_ALREADY_EXIST)
            );
          }
        } else if (user.isVerified === false) {
          await commonFunction.sendMail(email, validatedBody.otp);
          return res.json(new successResponse(responseMessages.VERIFY_OTP));
        } else {
          return res.json(
            apiError.conflict(responseMessages.USER_ALREADY_EXIST)
          );
        }
      }
      await commonFunction.sendMail(email, validatedBody.otp);
      const result = await createUser(validatedBody);
      return res.json(
        new successResponse(result, responseMessages.USER_CREATED)
      );
    } catch (error) {
      console.log("Error", error);
      return next(error);
    }
  }

  async otpVerification(req, res, next) {
    const fields = Joi.object({
      email: Joi.string().required(),
      otp: Joi.string().required(),
    });

    try {
      const validate = await fields.validateAsync(req.body);
      const { email, otp } = validate;
      const userResult = await findUser(email);

      if (!userResult) {
        throw apiError.notFound(responseMessages.USER_NOT_FOUND);
      } else {
        if (userResult.isVerified == true) {
          throw apiError.conflict(responseMessages.OTP_ALREADY_VERIFIED);
        }
        if (userResult.otpExpireTime < Date.now()) {
          throw apiError.badRequest(responseMessages.OTP_EXPIRED);
        }
        if (userResult.otp != otp) {
          throw apiError.badRequest(responseMessages.INCORRECT_OTP);
        }

        const updateOtp = await updateUserById(
          { _id: userResult._id },
          { $set: { isVerified: true, otp: "" } }
        );

        return res.json(
          new successResponse(updateOtp, responseMessages.OTP_VERIFY)
        );
      }
    } catch (error) {
      console.log("Error", error);
      return next(error);
    }
  }

  async resendOtp(req, res, next) {
    const fields = Joi.object({
      email: Joi.string().required(),
    });
    try {
      const validate = await fields.validateAsync(req.body);
      const userResult = await findUser(validate.email);
      console.log(userResult);
      if (!userResult) {
        throw apiError.notFound(responseMessages.NOT_FOUND);
      } else {
        if (userResult.isVerified == true) {
          throw apiError.conflict(responseMessages.OTP_ALREADY_VERIFIED);
        }

        const otp = await commonFunction.getOTP();
        const otpExpireTime = Date.now() + 180000;
        await commonFunction.sendMail(validate.email, `otp is ${otp}`);
        await updateUserById(
          { _id: userResult._id },
          { $set: { otp: otp, otpExpireTime: otpExpireTime } }
        );

        res.json(new successResponse(responseMessages.OTP_RESEND));
      }
    } catch (error) {
      console.log("Error", error);
      return next(error);
    }
  }

  async userLogin(req, res, next) {
    const fields = Joi.object({
      email: Joi.string().required(),
      password: Joi.string()
        .pattern(new RegExp("^[a-zA-Z0-9]{3,30}$"))
        .required(),
    });
    try {
      const validate = await fields.validateAsync(req.body);
      const userResult = await findUser(validate.email);
      if (!userResult) {
        throw apiError.notFound(responseMessages.NOT_FOUND);
      } else {
        if (userResult.isVerified != true) {
          throw apiError.notverify(responseMessages.OTP_NOT_VERIFY);
        }
        const compare = bcrypt.compareSync(
          validate.password,
          userResult.password
        );
        if (compare == false) {
          throw apiError.invalid(responseMessages.INVALID_PASSWORD);
        }
        const token = await commonFunction.getToken({ _id: userResult._id });
        return res.json(
          new successResponse(token, responseMessages.LOGIN_SUCCESS)
        );
      }
    } catch (error) {
      console.log("Error", error);
      return next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const userDetail = await findUser({ _id: req.userId });
      if (!userDetail) {
        throw apiError.notFound(responseMessages.USER_NOT_FOUND);
      }
      return res.json(
        new successResponse(userDetail, responseMessages.USER_DETAILS)
      );
    } catch (error) {
      console.log("Error", error);
      return next(error);
    }
  }

  async userEditProfile(req, res, next) {
    try {
      const {
        email,
        mobileNumber,
        password,
        firstName,
        lastName,
        dateOfBirth,
        adress,
        countryCode,
      } = req.body;
      const userDetail = await findUserById(req.userId);
      if (!userDetail) {
        throw apiError.notFound(responseMessages.USER_NOT_FOUND);
      } else {
        if (password) {
          let confirmPassword = req.body.confirmPassword;
          if (!confirmPassword) {
            throw apiError.badRequest({
              responseMessages: "Confirm password is required.",
            });
          } else if (confirmPassword != password) {
            throw apiError.badRequest(
              responseMessages.CONFIRM_PASSWORD_NOT_MATCHED
            );
          } else {
            const hassPass = bcrypt.hashSync(password, 10);
            await updateUserById(
              { _id: userDetail._id },
              { $set: { password: hassPass } }
            );
            return res.json(
              new successResponse(responseMessages.PASSWORD_CHANGED)
            );
          }
        }
        if (email && mobileNumber) {
          const query = {
            $and: [
              {
                $or: [{ email: email }, { mobileNumber: mobileNumber }],
              },
              {
                _id: { $ne: userDetail._id },
              },
            ],
          };

          const result = await findUser(query);
          if (result.email == email) {
            throw apiError.conflict(responseMessages.EMAIL_ALREADY_EXIST);
          } else if (result.mobileNumber == mobileNumber) {
            throw apiError.conflict(responseMessages.MOBILE_ALREADY_EXIST);
          } else {
            const result = await updateUserById(
              { _id: userDetail._id },
              { $set: { email: email, mobileNumber: mobileNumber } }
            );
            return res.json(
              new successResponse(result, responseMessages.SUCCESS)
            );
          }
        } else if (!email && mobileNumber) {
          const query = {
            $and: [
              { mobileNumber: mobileNumber },
              {
                _id: { $ne: userDetail._id },
              },
            ],
          };
          const result = await findUser(query);
          if (result) {
            throw apiError.conflict(responseMessages.MOBILE_ALREADY_EXIST);
          } else {
            const result = await updateUserById(
              { _id: userDetail._id },
              { $set: { mobileNumber: mobileNumber } }
            );
            return res.json(
              new successResponse(result, responseMessages.SUCCESS)
            );
          }
        } else if (email && !mobileNumber) {
          const query = {
            $and: [
              { email: email },
              {
                _id: { $ne: userDetail._id },
              },
            ],
          };
          const result = await findUser(query);
          if (result) {
            throw apiError.conflict(responseMessages.EMAIL_ALREADY_EXIST);
          } else {
            const result = await updateUserById(
              { _id: userDetail._id },
              { $set: { email: email } }
            );
            return res.json(
              new successResponse(result, responseMessages.SUCCESS)
            );
          }
        } else if (!email && !mobileNumber) {
          const result = await updateUserById(
            { _id: userDetail._id },
            { $set: req.body }
          );
          return res.json(
            new successResponse(result, responseMessages.SUCCESS)
          );
        }
      }
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  async emailVerification(req, res, next) {
    try {
      const userDetail = await findUserById({ _id: req.userId });
      if (!userDetail) {
        throw apiError.notFound(responseMessages.USER_NOT_FOUND);
      }
      const link = `http://localhost:${config.get(
        "port"
      )}/api/v1/user/verififcationLink/${userDetail._id}`;

      if (userDetail.isVerifiedEmail == true) {
        throw apiError.conflict(responseMessages.EMAIL_ALREADY_VERIFIED);
      } else {
        await commonFunction.sendMail(
          userDetail.email,
          "email verification link ",
          `<a href=${link}>click here</a>`
        );
        return res.json(
          new successResponse(responseMessages.EMAIL_VERIFICATION_LINK_SENT)
        );
      }
    } catch (error) {
      console.log("Error", error);
      return next(error);
    }
  }

  async verififcationLink(req, res, next) {
    try {
      const id = req.params.id;
      const result = await findUserById({ _id: id });
      if (!id) {
        throw apiError.notFound(responseMessages.NOT_FOUND);
      }
      if (result.isVerifiedEmail == true) {
        throw apiError.conflict(responseMessages.EMAIL_ALREADY_VERIFIED);
      } else {
        await updateUserById(
          { _id: result._id },
          { $set: { isVerifiedEmail: true } }
        );
        return res.json(new successResponse(responseMessages.Email_VERIFIED));
      }
    } catch (error) {
      console.log("error", error);
      return next(error);
    }
  }

  async reSetPassword(req, res, next) {
    try {
      const requiredFields = [
        "oldPassword",
        "newPassword",
        "confirmNewPassword",
      ];
      const missingFields = [];
      const body = req.body;
      requiredFields.forEach((field) => {
        if (!body[field]) {
          missingFields.push(field);
        }
      });
      if (missingFields.length > 0) {
        const err = missingFields.map((fields) => `${fields} is required`);
        return res.json({ responseMessages: err });
      } else {
        const user = await findUserById({ _id: req.userId });
        if (!user) {
          throw apiError.notFound(responseMessages.USER_NOT_FOUND);
        }
        const compare = await bcrypt.compare(body.oldPassword, user.password);
        if (compare == false) {
          throw apiError.badRequest(responseMessages.INVALID_OLD_PASSWORD);
        } else if (body.newPassword != body.confirmNewPassword) {
          throw apiError.badRequest(
            responseMessages.CONFIRM_PASSWORD_NOT_MATCHED
          );
        } else {
          const updatPassword = bcrypt.hashSync(body.confirmNewPassword, 10);
          await updateUserById(
            { _id: user._id },
            { set: { password: updatPassword } }
          );
          return res.json(
            new successResponse(responseMessages.PASSWORD_CHANGED)
          );
        }
      }
    } catch (error) {
      console.log("Error", error);
      return next(error);
    }
  }

  async updateProfilePhoto(req, res, next) {
    try {
      const userDetail = await findUserById({ _id: req.userId });
      if (!userDetail) {
        throw apiError.badRequest(responseMessages.USER_NOT_FOUND);
      } else {
        const image = req.files["file"];
        // const image = req.body.file       //base64
        if (!image) {
          throw apiError.badRequest(responseMessages.IMAGE_REQUIRED);
        }
        // const encoded = await commonFunction.base64encoded(image);
        // console.log(encoded);
        const getUrl = await commonFunction.getSecureUrl(image);
        const updateProfile = await updateUserById(
          { _id: userDetail._id },
          { $set: { profileImage: getUrl } }
        );
        return res.json(
          new successResponse(updateProfile, responseMessages.PROFILE_UPDATED)
        );
      }
    } catch (error) {
      console.log("Error", error);
      return next(error);
    }
  }

  async qrcodeGeneration(req, res, next) {
    try {
      const profile = await findUserById({ _id: req.userId });
      if (!profile) {
        throw apiError.notFound(responseMessages.USER_NOT_FOUND);
      } else {
        qr.toDataURL(profile.mobileNumber, (err, url) => {
          if (err) {
            throw apiError.internal(responseMessages.QR_GENERATION_FAILED);
          } else {
            console.log(url);
            return res.json(new successResponse(url, responseMessages.SUCCESS));
          }
        });
      }
    } catch (error) {
      console.log("Error", error);
      return next(error);
    }
  }

  async twoFa(req, res, next) {
    try {
      var secret = speakeasy.generateSecret();
      if (!secret) {
        throw apiError.internal(responseMessages.INTERNAL_ERROR);
      }
      const url = await commonFunction.base64encoded(secret.otpauth_url);
      const keys = secret.base32;
     return res.json(new successResponse({ url, keys }, responseMessages.SUCCESS));
    } catch (error) {
      console.log("Error", error);
      return next(error);
    }
  }

  async twoFaVerification(req, res, next) {
    try {
      const { secret, code } = req.body;
      if (!secret || !code) {
        if (!secret) {
          throw apiError.badRequest(responseMessages.SECRET_KEY_REQUIRED);
        } else if (!code) {
          throw apiError.badRequest(responseMessages.SECRET_CODE_REQUIRED);
        }
      }
      var verified = speakeasy.totp.verify({
        secret: secret,
        encoding: "base32",
        token: code,
      });
      if (verified) {
        return res.json(new successResponse(responseMessages.VERIFIED));
      } else {
        throw apiError.invalid(responseMessages.INVALID);
      }
    } catch (error) {
      console.log("Error", error);
      return next(error);
    }
  }

  async cronJob(req, res, next) {
    try {
      const user = await findUser({ _id: req.userId });
      if (!user) {
        throw apiError.notFound(responseMessages.USER_NOT_FOUND);
      }
      const task = cron.schedule(
        "* * 23 * * *",
        async () => {
          if (user.isVerified == false) {
            await commonFunction.sendMail(
              user.email,
              "Hello there, you have not verified your account please verify it for the further benifits."
            );
            task.start();
            return res.json(
              new successResponse(responseMessages.TASK_IS_SCHEDULED)
            );
          } else {
            throw apiError.conflict(responseMessages.ALREADY_VERIFIED);
          }
        },
        {
          scheduled: true, //bydefault true....
          timezone: "Asia/Kolkata",
        }
      );
      task.stop();
    } catch (error) {
      console.log("Error", error);
      return next(error);
    }
  }
}
export default new userController();
