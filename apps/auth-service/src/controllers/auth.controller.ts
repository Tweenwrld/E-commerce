import { NextFunction, Request, Response } from "express";
import { checkOtpRestrictions, handleForgotPassword, sendOtp, trackOtpRequests, validateRegistrationData, verifyForgotPasswordOtp, verifyOtp } from "../utils/auth.helper";
import prisma from "@packages/libs/prisma";
import { AuthError, ValidationError } from "@packages/error-handler";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";import { setCookie } from "../utils/cookies/setCookie";
''


// Register a new user
export const userRegistration = async (
    req: Request, 
    res: Response, 
    next: NextFunction
) => { 
    try {
        validateRegistrationData(req.body, "user");
        const {name, email} = req.body;

        const existingUser = await prisma.users.findUnique({where : { email }});

        if(existingUser) {
            return next(new ValidationError('User already exists with this email!'));
        };

        // OTP verification logic
        await checkOtpRestrictions(email, next);
        await trackOtpRequests(email, next);
        await sendOtp(name, email, "user-activation-mail");

        res.status(200).json({
            message: 'OTP sent to email. Please verify your account.',
        });
    } catch (error) {
        return next(error);
    }
};

// verify user account with OTP
export const verifyUser = async (
    req: Request, 
    res: Response, 
    next: NextFunction
) => {
    try {
        const { email, otp, password, name } = req.body;
        if (!email || !otp || !password || !name) {
            return next(new ValidationError('All fields are required!'));
      }
      
      const existingUser = await prisma.users.findUnique({ where: { email } });

      if (existingUser) {
          return next(new ValidationError('User already exists with this email!'));
      }

      await verifyOtp(email, otp, next);
      const hashedPassword = await bcrypt.hash(password, 10);

      await prisma.users.create({
        data: {name, email, password: hashedPassword},
      });

     res.status(201).json({
        success: true,
        message: 'User registered successfully!',
    });
    
    } catch (error) {
        return next(error);
        
    }
};

// login user
export const loginUser = async (
    req: Request, 
    res: Response, 
    next: NextFunction
) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new ValidationError('Email and password are required!'));
        }

        const user = await prisma.users.findUnique({ where: { email } });
        if (!user) {
            return next(new AuthError('User not found!'));
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password!);
        if (!isMatch) {
            return next(new AuthError('Invalid email or password!'));
        }

        // Access and refresh token
        const accessToken = jwt.sign({id: user.id, role: 'user'},
            process.env.ACCESS_TOKEN_SECRET as string,
            {
                expiresIn: '15m',
            }
        )
        
        const refreshToken = jwt.sign({id: user.id, role: 'user'},
            process.env.REFRESH_TOKEN_SECRET as string,
            {
                expiresIn: '7d',
            }
        );

        // Store refresh token in httpOnly secure cookie
        setCookie(res, 'refreshToken', refreshToken);
        setCookie(res, 'accessToken', accessToken);

        res.status(200).json({
            message: 'Login successful!',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        });

    } catch (error) {
        
    }
};

//forgot password
export const userForgotPassword = async (
    req: Request, 
    res: Response, 
    next: NextFunction
) => {
    await handleForgotPassword (req, res, next, "user");
};

// Verify OTP for forgot password
export const verifyUserForgotPassword = async (
    req: Request, 
    res: Response, 
    next: NextFunction
) => {

    await verifyForgotPasswordOtp(req, res, next);
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return next(new ValidationError('Email and OTP are required!'));
        }

        await verifyOtp(email, otp, next);

        res.status(200).json({
            message: 'OTP verified successfully!',
        });

    } catch (error) {
        return next(error);
        
    }
};

// Reset password
export const resetUserPassword = async (
    req: Request, 
    res: Response, 
    next: NextFunction
) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return next(new ValidationError('Email and new password are required!'));
        }

        const user = await prisma.users.findUnique({ where: { email } });
        if (!user) {
            return next(new AuthError('User not found!'));
        }

        // Password comparison new and existing 
        const isSamePassword = await bcrypt.compare(newPassword, user.password!);

        if (isSamePassword) {
            return next(new ValidationError('New password cannot be the same as the old one!'));
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.users.update({
            where: { email },
            data: { password: hashedPassword },
        });

        res.status(200).json({
            message: 'Password reset successful!',
        });

    } catch (error) {
        return next(error);
    }
};

