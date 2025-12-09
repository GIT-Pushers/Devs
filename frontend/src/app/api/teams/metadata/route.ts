import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const teamName = formData.get('teamName') as string;
    const teamImage = formData.get('teamImage') as File | null;
    const teamDescription = formData.get('teamDescription') as string;
    const members = JSON.parse(formData.get('members') as string || '[]');

    if (!process.env.NEXT_PUBLIC_PINATA_JWT) {
      throw new Error('Pinata JWT not configured');
    }

    // Upload image to Pinata if provided
    let imageUrl = '';
    if (teamImage) {
      const imageFormData = new FormData();
      imageFormData.append('file', teamImage);

      const imageResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
        },
        body: imageFormData,
      });

      if (!imageResponse.ok) {
        throw new Error('Failed to upload image to IPFS');
      }

      const imageData = await imageResponse.json();
      imageUrl = `ipfs://${imageData.IpfsHash}`;
    }

    // Create metadata JSON
    const metadata = {
      name: teamName,
      description: teamDescription,
      image: imageUrl,
      members,
      createdAt: new Date().toISOString(),
    };

    // Upload metadata to Pinata
    const metadataResponse = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `${teamName}-metadata.json`,
        },
      }),
    });

    if (!metadataResponse.ok) {
      throw new Error('Failed to upload metadata to IPFS');
    }

    const metadataData = await metadataResponse.json();
    const metadataUri = `ipfs://${metadataData.IpfsHash}`;

    return NextResponse.json({
      success: true,
      metadataUri,
      metadata,
    });
  } catch (error: any) {
    console.error('Upload metadata error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to upload metadata' 
    }, { status: 500 });
  }
}
