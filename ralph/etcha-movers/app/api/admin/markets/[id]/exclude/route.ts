import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Market from '@/models/Market';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();

    // Parse request body
    const body = await request.json();
    const { isExcluded } = body;

    if (typeof isExcluded !== 'boolean') {
      return NextResponse.json(
        { error: 'isExcluded must be a boolean' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: {
      isExcluded: boolean;
      excludedBy?: string;
      excludedAt?: Date;
    } = {
      isExcluded,
    };

    if (isExcluded) {
      updateData.excludedBy = session.user?.email || 'unknown';
      updateData.excludedAt = new Date();
    } else {
      // When including a market, clear the excluded metadata
      updateData.excludedBy = undefined;
      updateData.excludedAt = undefined;
    }

    // Find and update the market
    const market = await Market.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).lean();

    if (!market) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      market: {
        _id: market._id,
        marketId: market.marketId,
        marketName: market.marketName,
        source: market.source,
        isExcluded: market.isExcluded,
        excludedBy: market.excludedBy,
        excludedAt: market.excludedAt,
      },
    });
  } catch (error) {
    console.error('Error updating market exclusion:', error);
    return NextResponse.json(
      { error: 'Failed to update market exclusion' },
      { status: 500 }
    );
  }
}
