import successResponse from "../../../../../assets/response";
import responseMessages from "../../../../../assets/responseMessages";
import status from "../../../../enums/status";
import userType from "../../../../enums/userType";
import apiError from "../../../../helper/apiError";
import commonFunction from "../../../../helper/utils";
import userServices from "../../services/user";
import bcrypt from "bcrypt";
import Joi from "joi";
const {
  updateUserById,
  findAdmin,
  paginate
} = userServices;

export class adminController {
  
  /**
   * @swagger
   * /api/v1/admin/adminLogin:
   *   post:
   *     summary: Admin Login
   *     tags:
   *       - ADMIN
   *     description: admin login
   *     produces:
   *       - application/json
   *     parameters:
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
   *       404:
   *         description: User not found || Data not found.
   *       501:
   *         description: Something went wrong!
   */
  async adminLogin(req, res, next) {
    const fields = Joi.object({
      email: Joi.string().required(),
      password: Joi.string().required(),
    });
    try {

      const validate = await fields.validateAsync(req.body);
      let query = { $and: [{ userType: userType.ADMIN }, { email: validate.email }] };
      const adminDetails = await findAdmin(query);
      if (!adminDetails) {
        throw apiError.notFound(responseMessages.ADMIN_NOT_FOUND);
      }
      const comparePassword = bcrypt.compareSync(validate.password, adminDetails.password);
      if (comparePassword == false) {
        throw apiError.invalid(responseMessages.INVALID_PASSWORD);
      } else {
        const token = await commonFunction.getToken({ _id: adminDetails._id })
        return res.json(new successResponse(token, responseMessages.LOGIN_SUCCESS));
      }
    } catch (error) {
      console.log("Error", error);
      return next(error);
    } 
  }

  async adminResetPassword(req, res, next) {
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
        const admin = await findAdmin({ $and: [{ _id: req.userId }, { userType: userType.ADMIN }] });

        if (!admin) {
          throw apiError.notFound(responseMessages.USER_NOT_FOUND);
        }
        const compare = await bcrypt.compare(
          body.oldPassword,
          admin.password,
        );
        if (compare == false) {
          throw apiError.badRequest(responseMessages.INVALID_OLD_PASSWORD);
        } else if (body.newPassword != body.confirmNewPassword) {
          throw apiError.badRequest(
            responseMessages.CONFIRM_PASSWORD_NOT_MATCHED
          );
        } else {
          const updatPassword = bcrypt.hashSync(body.confirmNewPassword, 10);
          await updateUserById(
            { _id: admin._id },
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

  async paginateAlluserList(req, res, next) {
    try {
      const { page, limit } = req.query;
      if (page < 1) {
        throw apiError.badRequest(responseMessages.PAGE_UNSPECIFIED);
      } else if (limit < 1) {
        throw apiError.badRequest(responseMessages.LIMIT_UNSPECIFIED);
      }
      const query = { $and: [{ userType: userType.USER }, { status: status.ACTIVE }] };
      const paginateResult = await paginate(query, page, limit);
      if (!paginateResult) {
        throw apiError.notFound(responseMessages.NOT_FOUND);
      }
      return res.json(new successResponse(paginateResult, responseMessages.SUCCESS));
    } catch (error) {
      console.log("Error", error);
      return next(error);
    }
  }

}
export default new adminController();
