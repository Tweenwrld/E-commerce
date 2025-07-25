import crypto from 'crypto'
import { ValidationError } from '@packages/error-handler';
import redis from '@packages/libs/redis';
import { sendEmail } from './sendMail';
import { NextFunction, Request, Response } from 'express';
import prisma from '@packages/libs/prisma';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegistrationData = (data: any, userType: "user" | "seller") => {
    const { name, email, password, phone_number, country } = data;

    if (
        !name || 
        !email || 
        !password || 
        (userType === "seller" && (!phone_number || !country))
    ) {
        throw new ValidationError('Missing required fields!');
    }

    if (!emailRegex.test(email)) {
        throw new ValidationError('Invalid email format!');
    }
}

// Check If the user has exceeded the OTP request limit
export const checkOtpRestrictions = async (
    email: string, 
    next: NextFunction
) => { 
    if (await redis.get(`otp_lock:${email}`)) {
        throw next(
            new ValidationError(
                'Account is locked due to multiple failed attempts! Try again after 30 minutes.'
            )
        );
    }

    // Security spamming prevention of OTP
    if (await redis.get(`otp_spam_lock:${email}`)) {
        throw next(
            new ValidationError(
                'Too many OTP requests! Please wait for 1 hour before requesting again.'
            )
        );
    }

    // 1 minute wait next OTP request
    if (await redis.get(`otp_cooldown:${email}`)) {
        throw next(
            new ValidationError(
                'Please wait for 1 minute before requesting a new OTP.'
            )
        );
    }
}

export const trackOtpRequests = async (
    email: string,
    next: NextFunction
) => {
    const otpRequestKey = `otp_requests:${email}`;
    let otpRequests = parseInt((await redis.get(otpRequestKey)) || '0');

    if (otpRequests >= 2) {
        await redis.set(`otp_spam_lock:${email}`, 'locked', 'EX', 3600); 
        throw next(
            new ValidationError(
                'Too many OTP requests! Please wait for 1 hour before requesting again.'
            )
        );
    } 
    await redis.set(otpRequestKey, otpRequests + 1, 'EX', 3600); // Reset after 1 hour
}

export const sendOtp = async (
    name: string, 
    email: string, 
    template: string
) => {
    const otp = crypto.randomInt(1000, 9999).toString(); //4 digit OTP
    
    await sendEmail(email, 'Verify your email', template, { name, otp });

    await redis.set(`otp:${email}`, otp, 'EX', 300); // Store OTP in Redis for 5 minutes
    
    await redis.set(`otp_cooldown:${email}`, 'true', 'EX', 60); // Set cooldown for 1 minute

}

export const verifyOtp = async (
    email: string, 
    otp: string, 
    next: NextFunction
) => {
    const storedOtp = await redis.get(`otp:${email}`);

    if (!storedOtp) {
        throw new ValidationError('OTP expired or invalid!');
    }

    const failedAttemptKey = `otp_attempts:${email}`;
    const failedAttempts = parseInt((await redis.get(failedAttemptKey)) || '0');

    if (storedOtp !== otp) {
        if (failedAttempts >= 2) {
            await redis.set(`otp_lock:${email}`, 'locked', 'EX', 1800); // Lock account for 30 minutes
            await redis.del(`otp:${email}`, failedAttemptKey);
            throw new ValidationError(
                'Account is locked due to multiple failed attempts! Try again after 30 minutes.'
            );
        }

        await redis.set(failedAttemptKey, failedAttempts + 1, 'EX', 300);
        throw new ValidationError(`Incorrect OTP! You have ${2 - failedAttempts} attempts left.`);
    }

    await redis.del(`otp:${email}`, failedAttemptKey);  
}

export const handleForgotPassword = async (
    req: Request, 
    res: Response, 
    next: NextFunction, 
    userType: "user" | "seller"
) => {
    try {
        const { email } = req.body;

        if (!email) throw new ValidationError('Email is required!');

        // find user/seller by email
        const user = userType === "user" && await prisma.users.findUnique({ where: { email } });

        if(!user) throw new ValidationError(`${userType} not found!`);

        // check OTP restrictions
        await checkOtpRestrictions(email, next);
        await trackOtpRequests(email, next);

        // send OTP
        await sendOtp(email, user.name, 'forgot-password-user-mail');

        res.status(200).json({
            message: 'OTP sent to email! Please verify your account.',
        });

    } catch (error) {
        next(error);
    }
}

export const verifyForgotPasswordOtp = async (
    req: Request, 
    res: Response, 
    next: NextFunction, 
) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            throw next(new ValidationError('Email and OTP are required!'));
        }

        await verifyOtp(email, otp, next);

        res.status(200).json({
            message: 'OTP verified successfully! You can now reset your password.' });
    } catch (error) {
        next(error);
    }
}