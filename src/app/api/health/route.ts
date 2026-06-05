import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Temporary diagnostic endpoint. Visit /api/health on the deployed site to see
 * the REAL database error (the storefront hides it behind a generic Server
 * Components error in production). Safe to delete once the DB connection works.
 */
export async function GET() {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const products = await prisma.product.count();
    return NextResponse.json({
      ok: true,
      db: 'connected',
      products,
      ms: Date.now() - started
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        name: error instanceof Error ? error.name : 'UnknownError',
        // Prisma redacts the password; this shows host/port/table, e.g.
        // P1001 = can't reach DB, P2021 = table missing, P1000 = auth failed.
        code: (error as { code?: string })?.code ?? null,
        message: error instanceof Error ? error.message : String(error),
        ms: Date.now() - started
      },
      { status: 500 }
    );
  }
}
