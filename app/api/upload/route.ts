import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return new Response('No file', { status: 400 });
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
    const filePath = path.join(uploadsDir, safeName);
    await writeFile(filePath, buffer);
    const url = `/uploads/${safeName}`;
    return Response.json({ url });
  } catch (e) {
    console.error(e);
    return new Response('Upload error', { status: 500 });
  }
}
