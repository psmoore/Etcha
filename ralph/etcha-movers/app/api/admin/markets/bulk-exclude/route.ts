import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Market from '@/models/Market';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Parse request body
    const body = await request.json();
    const { marketIds } = body;

    if (!Array.isArray(marketIds) || marketIds.length === 0) {
      return NextResponse.json(
        { error: 'marketIds must be a non-empty array' },
        { status: 400 }
      );
    }

    // Update all selected markets in a single database operation
    const result = await Market.updateMany(
      { _id: { $in: marketIds } },
      {
        $set: {
          isExcluded: true,
          excludedBy: session.user?.email || 'unknown',
          excludedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      excludedCount: result.modifiedCount,
      message: `Successfully excluded ${result.modifiedCount} market${result.modifiedCount === 1 ? '' : 's'}`,
    });
  } catch (error) {
    console.error('Error bulk excluding markets:', error);
    return NextResponse.json(
      { error: 'Failed to bulk exclude markets' },
      { status: 500 }
    );
  }
}
