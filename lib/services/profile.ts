import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { sendOtpEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import {
  requestEmailChangeSchema,
  requestPasswordChangeSchema,
  verifyCredentialOtpSchema
} from "@/lib/validation/profile-credentials";
import { createRecoveryRequestSchema, resolveRecoveryRequestSchema } from "@/lib/validation/profile";

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getNextCredentialChangeDate(user: {
  lastEmailChangeAt: Date | null;
  lastPasswordChangeAt: Date | null;
}) {
  return {
    email: user.lastEmailChangeAt ? addDays(user.lastEmailChangeAt, 60) : null,
    password: user.lastPasswordChangeAt ? addDays(user.lastPasswordChangeAt, 60) : null
  };
}

function ensureCooldown(lastChangedAt: Date | null, label: string) {
  if (!lastChangedAt) {
    return;
  }

  const nextAllowedAt = addDays(lastChangedAt, 60);

  if (nextAllowedAt > new Date()) {
    throw new Error(
      `${label} can only be changed every 60 days. Next eligible time: ${nextAllowedAt.toISOString()}`
    );
  }
}

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function createRecoveryRequest(rawInput: {
  userId: string;
  currentEmail: string;
  requestedEmail: string;
  reason: string;
}) {
  const input = createRecoveryRequestSchema.parse(rawInput);

  return prisma.$transaction(async (tx) => {
    const existingOpenRequest = await tx.accountRecoveryRequest.findFirst({
      where: {
        userId: rawInput.userId,
        status: "OPEN"
      }
    });

    if (existingOpenRequest) {
      throw new Error("You already have an open recovery request.");
    }

    return tx.accountRecoveryRequest.create({
      data: {
        userId: rawInput.userId,
        currentEmail: rawInput.currentEmail.toLowerCase(),
        requestedEmail: input.requestedEmail.toLowerCase(),
        reason: input.reason
      }
    });
  });
}

export async function requestEmailChange(rawInput: {
  userId: string;
  currentEmail: string;
  nextEmail: string;
}) {
  const input = requestEmailChangeSchema.parse(rawInput);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: rawInput.userId }
    });

    if (!user) {
      throw new Error("User not found.");
    }

    ensureCooldown(user.lastEmailChangeAt, "Email");

    if (user.email.toLowerCase() === input.nextEmail.toLowerCase()) {
      throw new Error("Use a different email address.");
    }

    const existingTarget = await tx.user.findUnique({
      where: { email: input.nextEmail.toLowerCase() }
    });

    if (existingTarget) {
      throw new Error("That email is already in use.");
    }

    await tx.credentialChangeRequest.deleteMany({
      where: {
        userId: user.id,
        type: "EMAIL",
        verifiedAt: null
      }
    });

    const otpCode = generateOtpCode();
    const request = await tx.credentialChangeRequest.create({
      data: {
        userId: user.id,
        type: "EMAIL",
        targetEmail: input.nextEmail.toLowerCase(),
        otpCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    });

    await sendOtpEmail({
      to: user.email,
      subject: "Stake IPL email change OTP",
      headline: `Confirm your email change to ${input.nextEmail}`,
      otpCode
    });

    return request;
  });
}

export async function requestPasswordChange(rawInput: {
  userId: string;
  currentEmail: string;
  nextPassword: string;
  confirmPassword: string;
}) {
  const input = requestPasswordChangeSchema.parse(rawInput);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: rawInput.userId }
    });

    if (!user) {
      throw new Error("User not found.");
    }

    ensureCooldown(user.lastPasswordChangeAt, "Password");

    await tx.credentialChangeRequest.deleteMany({
      where: {
        userId: user.id,
        type: "PASSWORD",
        verifiedAt: null
      }
    });

    const otpCode = generateOtpCode();
    const passwordHash = await hash(input.nextPassword, 12);
    const request = await tx.credentialChangeRequest.create({
      data: {
        userId: user.id,
        type: "PASSWORD",
        passwordHash,
        otpCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    });

    await sendOtpEmail({
      to: user.email,
      subject: "Stake IPL password change OTP",
      headline: "Confirm your password change",
      otpCode
    });

    return request;
  });
}

export async function verifyCredentialOtp(rawInput: {
  userId: string;
  requestId: string;
  otpCode: string;
}) {
  const input = verifyCredentialOtpSchema.parse(rawInput);

  return prisma.$transaction(async (tx) => {
    const request = await tx.credentialChangeRequest.findUnique({
      where: { id: input.requestId },
      include: { user: true }
    });

    if (!request || request.userId !== rawInput.userId) {
      throw new Error("Credential request not found.");
    }

    if (request.verifiedAt) {
      throw new Error("This OTP has already been used.");
    }

    if (request.expiresAt < new Date()) {
      throw new Error("This OTP has expired. Request a new one.");
    }

    if (request.otpCode !== input.otpCode) {
      throw new Error("Invalid OTP.");
    }

    if (request.type === "EMAIL") {
      if (!request.targetEmail) {
        throw new Error("Requested email is missing.");
      }

      try {
        await tx.user.update({
          where: { id: request.userId },
          data: {
            email: request.targetEmail,
            lastEmailChangeAt: new Date()
          }
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          throw new Error("That email is already in use.");
        }

        throw error;
      }
    }

    if (request.type === "PASSWORD") {
      if (!request.passwordHash) {
        throw new Error("Requested password change is invalid.");
      }

      await tx.user.update({
        where: { id: request.userId },
        data: {
          passwordHash: request.passwordHash,
          lastPasswordChangeAt: new Date()
        }
      });
    }

    await tx.credentialChangeRequest.update({
      where: { id: request.id },
      data: {
        verifiedAt: new Date()
      }
    });

    return request.type;
  });
}

export async function resolveRecoveryRequest(rawInput: {
  requestId: string;
  email: string;
  adminEmail: string;
}) {
  const input = resolveRecoveryRequestSchema.parse(rawInput);

  return prisma.$transaction(async (tx) => {
    const admin = await tx.user.findUnique({
      where: { email: rawInput.adminEmail.toLowerCase() }
    });

    if (!admin || admin.role !== "ADMIN") {
      throw new Error("Admin authorization required.");
    }

    const request = await tx.accountRecoveryRequest.findUnique({
      where: { id: input.requestId },
      include: { user: true }
    });

    if (!request) {
      throw new Error("Recovery request not found.");
    }

    if (request.status !== "OPEN") {
      throw new Error("Recovery request has already been processed.");
    }

    try {
      const updatedUser = await tx.user.update({
        where: { id: request.userId },
        data: {
          email: input.email.toLowerCase(),
          lastEmailChangeAt: new Date()
        }
      });

      await tx.accountRecoveryRequest.update({
        where: { id: request.id },
        data: {
          requestedEmail: input.email.toLowerCase(),
          status: "RESOLVED",
          resolvedAt: new Date()
        }
      });

      await tx.adminActionLog.create({
        data: {
          adminId: admin.id,
          actionType: "ACCOUNT_RECOVERY_RESOLVED",
          targetType: "User",
          targetId: updatedUser.id,
          reason: `Resolved account recovery for ${request.currentEmail} to ${updatedUser.email}`,
          metadata: {
            requestId: request.id,
            previousEmail: request.currentEmail,
            newEmail: updatedUser.email
          }
        }
      });

      return updatedUser;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new Error("That replacement email is already in use.");
      }

      throw error;
    }
  });
}
