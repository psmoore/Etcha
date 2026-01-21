import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IHistoricalPrice extends Document {
  marketId: string;
  source: 'kalshi' | 'polymarket' | 'manifold';
  price: number;
  timestamp: Date;
}

const HistoricalPriceSchema = new Schema<IHistoricalPrice>(
  {
    marketId: { type: String, required: true },
    source: {
      type: String,
      required: true,
      enum: ['kalshi', 'polymarket', 'manifold']
    },
    price: { type: Number, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: false,
  }
);

// Index for efficient lookups by market and source
HistoricalPriceSchema.index({ marketId: 1, source: 1 });

// Index for time-based queries
HistoricalPriceSchema.index({ timestamp: -1 });

// Compound index for querying historical prices for a specific market over time
HistoricalPriceSchema.index({ marketId: 1, source: 1, timestamp: -1 });

const HistoricalPrice: Model<IHistoricalPrice> =
  mongoose.models.HistoricalPrice ||
  mongoose.model<IHistoricalPrice>('HistoricalPrice', HistoricalPriceSchema);

export default HistoricalPrice;
