import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMarket extends Document {
  marketId: string;
  source: 'kalshi' | 'polymarket' | 'manifold';
  marketName: string;
  eventName: string;
  marketUrl: string;
  eventUrl?: string;
  description?: string;
  creationDate?: Date;
  resolutionDate?: Date;
  currentPrice: number;
  price1DayAgo?: number;
  price1WeekAgo?: number;
  price1MonthAgo?: number;
  priceChange1Day?: number;
  priceChange1Week?: number;
  priceChange1Month?: number;
  category?: string;
  isExcluded: boolean;
  excludedBy?: string;
  excludedAt?: Date;
  lastUpdated: Date;
}

const MarketSchema = new Schema<IMarket>(
  {
    marketId: { type: String, required: true },
    source: {
      type: String,
      required: true,
      enum: ['kalshi', 'polymarket', 'manifold']
    },
    marketName: { type: String, required: true },
    eventName: { type: String, required: true },
    marketUrl: { type: String, required: true },
    eventUrl: { type: String },
    description: { type: String },
    creationDate: { type: Date },
    resolutionDate: { type: Date },
    currentPrice: { type: Number, required: true },
    price1DayAgo: { type: Number },
    price1WeekAgo: { type: Number },
    price1MonthAgo: { type: Number },
    priceChange1Day: { type: Number },
    priceChange1Week: { type: Number },
    priceChange1Month: { type: Number },
    category: { type: String },
    isExcluded: { type: Boolean, default: false },
    excludedBy: { type: String },
    excludedAt: { type: Date },
    lastUpdated: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: false,
  }
);

// Compound unique index on marketId and source
MarketSchema.index({ marketId: 1, source: 1 }, { unique: true });

// Indexes for efficient querying
MarketSchema.index({ source: 1 });
MarketSchema.index({ lastUpdated: -1 });
MarketSchema.index({ priceChange1Day: -1 });
MarketSchema.index({ priceChange1Week: -1 });
MarketSchema.index({ priceChange1Month: -1 });
MarketSchema.index({ isExcluded: 1 });

// Compound index for filtering and sorting by price change
MarketSchema.index({ isExcluded: 1, priceChange1Day: -1 });
MarketSchema.index({ isExcluded: 1, priceChange1Week: -1 });
MarketSchema.index({ isExcluded: 1, priceChange1Month: -1 });

const Market: Model<IMarket> =
  mongoose.models.Market || mongoose.model<IMarket>('Market', MarketSchema);

export default Market;
