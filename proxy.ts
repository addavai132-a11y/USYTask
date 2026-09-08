import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  // Dejar pasar todas las peticiones sin intervenir
  return NextResponse.next();
}
