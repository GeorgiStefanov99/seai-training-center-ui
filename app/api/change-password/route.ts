import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Change password request body:', body);
    
    // Get trainingCenterId from query parameters
    const { searchParams } = new URL(request.url);
    const trainingCenterId = searchParams.get('trainingCenterId');
    
    if (!trainingCenterId) {
      return NextResponse.json(
        { error: 'Training Center ID is required' },
        { status: 400 }
      );
    }

    // Get authorization header from the incoming request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }

    // Make request to backend API
    const backendUrl = `https://api.seai.co/api/v1/training-centers/${trainingCenterId}/change-password`;
    console.log('Making request to backend:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    console.log('Backend response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
      return NextResponse.json(
        { error: 'Failed to change password' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Change password API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 