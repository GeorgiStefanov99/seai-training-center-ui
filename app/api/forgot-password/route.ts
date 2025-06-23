import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('=== FORGOT PASSWORD API ROUTE DEBUG ===');
    console.log('Request body received:', body);
    console.log('Request body JSON:', JSON.stringify(body));

    // Make request to backend API
    const backendUrl = 'https://api.seai.co/api/v1/training-centers/forgot-password';
    console.log('Making request to backend URL:', backendUrl);
    
    const requestPayload = JSON.stringify(body);
    console.log('Payload being sent to backend:', requestPayload);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: requestPayload,
    });

    console.log('Backend response status:', response.status);
    console.log('Backend response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
      console.error('Backend error status:', response.status);
      return NextResponse.json(
        { error: 'Failed to send reset email', details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('Backend success response:', result);
    console.log('=== END DEBUG ===');
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Forgot password API route error:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 