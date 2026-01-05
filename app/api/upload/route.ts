import { NextRequest } from 'next/server';
import { getSupabaseServiceRoleClient } from '@/lib/supabase';

const BUCKET_NAME = 'products';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = getSupabaseServiceRoleClient();

    // Generar nombre único para el archivo
    const ext = file.name.split('.').pop() || 'jpg';
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Convertir File a ArrayBuffer y luego a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(safeName, buffer, {
        contentType: file.type || 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase Storage error:', error);

      // Si el bucket no existe, dar instrucciones claras
      if (error.message?.includes('not found') || error.message?.includes('Bucket')) {
        return new Response(JSON.stringify({
          error: 'Storage bucket not configured',
          details: `Crea un bucket llamado "${BUCKET_NAME}" en Supabase Storage y hazlo público.`
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        error: 'Upload failed',
        details: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return Response.json({
      url: publicUrlData.publicUrl,
      path: data.path
    });
  } catch (e: any) {
    console.error('Upload error:', e);
    return new Response(JSON.stringify({
      error: 'Upload error',
      details: e?.message || 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
