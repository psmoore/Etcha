import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Market, { IMarket } from '@/models/Market';

interface MarketsQuery {
  marketName?: { $regex: string; $options: string };
  source?: string;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';
    const source = searchParams.get('source') || '';

    // Build query
    const query: MarketsQuery = {};

    if (search) {
      query.marketName = { $regex: search, $options: 'i' };
    }

    if (source && ['kalshi', 'polymarket', 'manifold'].includes(source)) {
      query.source = source;
    }

    // Get total count for pagination
    const total = await Market.countDocuments(query);

    // Fetch paginated markets
    const skip = (page - 1) * limit;
    const markets = await Market.find(query)
      .sort({ lastUpdated: -1 })
      .skip(skip)
      .limit(limit)
      .lean<IMarket[]>()
      .exec();

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      markets,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching admin markets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch markets' },
      { status: 500 }
    );
  }
}
