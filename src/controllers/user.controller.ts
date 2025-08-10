import { Request, Response } from "express";
import { AppError, handleCatchError } from "../middlewares/index.js";
import {
   hashPassword,
   validateLoginDto,
   ValidateSignUpDto,
   validateUpdateDto,
   verifyPassword,
} from "../utils/index.js";
import { generateToken } from "../utils/generate.token.js";
import { db } from "../db/prisma.js";

// Enhanced User Response Type
interface UserResponse {
   id: string;
   fullName: string;
   email: string;
   role: string;
   token: string;
}

// create user
export const createUser = async (req: Request, res: Response): Promise<any> => {
   try {
      const { error } = ValidateSignUpDto(req.body);

      if (error) throw new AppError(error.details[0].message, 400);

      const { fullName, email, password } = req.body;
      const userExists = await db.user.findUnique({
         where: { email },
      });

      if (userExists)
         throw new AppError("User with that email already exists", 401);

      // Hash password
      const hashedPassword = await hashPassword(password);

      const savedUser = await db.user.create({
         data: {
            fullName,
            email,
            password: hashedPassword,
         },
      });

      const token = await generateToken(
         savedUser.fullName,
         savedUser.id as string,
         savedUser.role
      );

      const userResponse: UserResponse = {
         id: savedUser.id,
         fullName: savedUser.fullName,
         email: savedUser.email,
         role: savedUser.role,
         token,
      };

      return res.status(201).json({
         success: true,
         message: "Account created successfully",
         data: userResponse,
      });
   } catch (error: AppError | any) {
      return handleCatchError(error, res);
   }
};

// login user
export const loginUser = async (req: Request, res: Response): Promise<any> => {
   try {
      const { error } = validateLoginDto(req.body);

      if (error) throw new AppError(error.details[0].message, 400);

      const { email, password } = req.body;

      const user = await db.user.findUnique({
         where: { email },
      });

      if (!user) throw new AppError("Invalid credentials", 400);

      // Verify password
      const isPasswordValid = await verifyPassword(password, user.password);
      if (!isPasswordValid) throw new AppError("Invalid credentials", 400);

      const token = await generateToken(
         user.fullName,
         user.id as string,
         user.role
      );

      const userResponse: UserResponse = {
         id: user.id,
         fullName: user.fullName,
         email: user.email,
         role: user.role,
         token,
      };

      return res.status(200).json({
         success: true,
         message: "Login successfully",
         data: userResponse,
      });
   } catch (error: AppError | any) {
      return handleCatchError(error, res);
   }
};

// Get User by ID (for authentication verification)
export const getUserById = async (
   req: Request,
   res: Response
): Promise<any> => {
   try {
      const { userId } = req.params;

      const user = await db.user.findUnique({
         where: { id: userId },
         select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
         },
      });

      if (!user) throw new AppError("User not found", 404);

      return res.status(200).json({
         success: true,
         message: "User retrieved successfully",
         data: user,
      });
   } catch (error: AppError | any) {
      return handleCatchError(error, res);
   }
};

export const getAllUsers = async (
   _req: Request,
   res: Response
): Promise<any> => {
   try {
      const users = await db.user.findMany({
         select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
         },
      });

      return res.status(200).json({
         success: true,
         message: "Users retrieved",
         data: users,
      });
   } catch (error: AppError | any) {
      return handleCatchError(error, res);
   }
};

export const updateUser = async (req: Request, res: Response): Promise<any> => {
   try {
      const { error } = validateUpdateDto(req.body);
      if (error) throw new AppError(error.details[0].message, 400);

      const { userId } = req.params;
      const { fullName, email, password } = req.body;

      let updateData: any = { fullName, email };

      if (password) {
         updateData.password = await hashPassword(password);
      }

      const updatedUser = await db.user.update({
         where: { id: userId },
         data: updateData,
         select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
         },
      });

      return res.status(200).json({
         success: true,
         message: "User updated successfully",
         data: updatedUser,
      });
   } catch (error: AppError | any) {
      return handleCatchError(error, res);
   }
};

// Delete user
export const deleteUser = async (req: Request, res: Response): Promise<any> => {
   try {
      const { userId } = req.params;

      const userExists = await db.user.findUnique({
         where: { id: userId },
      });

      if (!userExists) throw new AppError("User not found", 404);

      await db.user.delete({
         where: { id: userId },
      });

      return res
         .status(200)
         .json({ success: true, message: "User deleted successfully" });
   } catch (error: AppError | any) {
      return handleCatchError(error, res);
   }
};
