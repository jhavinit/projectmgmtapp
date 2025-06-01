/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import { hash } from "bcryptjs";
import { userRouter } from "../../src/server/api/routers/user";
import { PrismaClient } from "@prisma/client";

// Mock bcryptjs.hash
vi.mock("bcryptjs", () => ({
    hash: vi.fn(() => Promise.resolve("hashed-password")),
}));

describe("userRouter", () => {
    let dbMock: ReturnType<typeof mockDeep<PrismaClient>>;
    let ctx: { db: ReturnType<typeof mockDeep<PrismaClient>>; session: { user: { id: string }; expires: string } | null };

    beforeEach(() => {
        dbMock = mockDeep<PrismaClient>();
        ctx = { db: dbMock, session: { user: { id: "u1" }, expires: "" } };
        vi.clearAllMocks();
    });

    it("should get all users (authenticated)", async () => {
        const fakeUsers = [
            { id: "1", name: "Alice", email: "alice@example.com", password: "hashed-password" },
        ];
        dbMock.user.findMany.mockResolvedValue(fakeUsers);

        const caller = userRouter.createCaller(ctx);
        const result = await caller.getAll();

        expect(result).toEqual(fakeUsers);
        expect(dbMock.user.findMany.mock.calls.length).toBeGreaterThan(0);
    });

    it("should register a new user", async () => {
        dbMock.user.findUnique.mockResolvedValue(null);
        dbMock.user.create.mockResolvedValue({
            id: "1",
            name: "New User",
            email: "new@example.com",
            password: "hashed-password",
        });

        // For register, session can be null (publicProcedure)
        const ctxNoSession = { db: dbMock, session: null };

        const input = {
            name: "New User",
            email: "new@example.com",
            password: "password123",
        };

        const caller = userRouter.createCaller(ctxNoSession);
        const result = await caller.register(input);

        expect(result).toEqual({ success: true });
        expect(dbMock.user.findUnique).toHaveBeenCalledWith({
            where: { email: input.email },
        });
        expect(hash).toHaveBeenCalledWith(input.password, 10);
        expect(dbMock.user.create).toHaveBeenCalledWith({
            data: {
                name: input.name,
                email: input.email,
                password: "hashed-password",
            },
        });
    });

    it("should throw error if user already exists", async () => {
        dbMock.user.findUnique.mockResolvedValue({
            id: "1",
            name: "Existing",
            email: "exist@example.com",
            password: "hashed-password",
        });

        const ctxNoSession = { db: dbMock, session: null };

        const caller = userRouter.createCaller(ctxNoSession);
        await expect(
            caller.register({
                name: "Existing",
                email: "exist@example.com",
                password: "secret123",
            })
        ).rejects.toThrow("User already exists");
    });
});
