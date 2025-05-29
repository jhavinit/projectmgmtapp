import { db } from "~/server/db";
import bcrypt from "bcryptjs";
import type { NextApiRequest, NextApiResponse } from "next";

interface RegisterRequestBody {
  email: string;
  password: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, password } = req.body as RegisterRequestBody;

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser)
    return res.status(400).json({ error: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.user.create({
    data: { email, password: hashedPassword },
  });

  res.status(201).json({ message: "User registered" });
}
