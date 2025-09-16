import { put } from '@vercel/blob';

export const config = {
  runtime: 'edge',
};

export default async function upload(request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (!filename) {
    return new Response('No filename specified.', { status: 400 });
  }

  if (!request.body) {
    return new Response('No file to upload.', { status: 400 });
  }

  try {
    const blob = await put(`leave-request/${filename}`, request.body, {
      access: 'public',
    });

    return new Response(JSON.stringify(blob), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    return new Response(`Error uploading file: ${error.message}`, { status: 500 });
  }
}
