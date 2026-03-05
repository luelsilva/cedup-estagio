import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db';
import { refreshTokens } from '../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

const JWT_SECRET = env.JWT_SECRET || 'fallback-secret-para-dev';
const ACCESS_TOKEN_EXPIRES_IN = '15m';

/**
 * Gera um access token JWT
 */
export function generateAccessToken(userId: string, email: string, roles: string) {
    return jwt.sign(
        { id: userId, email, roles },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );
}

/**
 * Gera um refresh token único e o salva no banco
 */
export async function generateRefreshToken(userId: string, rememberMe = false) {
    // Gerar token aleatório
    const token = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Calcular expiração (15 dias padrão, ou 90 dias se "lembrar-me")
    const expiresAt = new Date();
    const days = rememberMe ? 90 : 15;
    expiresAt.setDate(expiresAt.getDate() + days);

    // Salvar no banco
    await db.insert(refreshTokens).values({
        userId,
        tokenHash,
        expiresAt
    });

    return token;
}

/**
 * Valida um refresh token e retorna o userId se válido
 */
export async function validateRefreshToken(token: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const [tokenData] = await db.select()
        .from(refreshTokens)
        .where(
            and(
                eq(refreshTokens.tokenHash, tokenHash),
                eq(refreshTokens.isRevoked, false),
                gt(refreshTokens.expiresAt, new Date())
            )
        )
        .limit(1);

    return tokenData ? tokenData.userId : null;
}

/**
 * Revoga um refresh token específico
 */
export async function revokeRefreshToken(token: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await db.update(refreshTokens)
        .set({ isRevoked: true })
        .where(eq(refreshTokens.tokenHash, tokenHash));
}

/**
 * Revoga todos os refresh tokens de um usuário
 */
export async function revokeAllUserTokens(userId: string) {
    await db.update(refreshTokens)
        .set({ isRevoked: true })
        .where(eq(refreshTokens.userId, userId));
}

export async function cleanupExpiredTokens() {
    await db.delete(refreshTokens)
        .where(gt(new Date(), refreshTokens.expiresAt));
}
