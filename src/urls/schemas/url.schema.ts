import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Url extends Document {
  @Prop({ required: true })
  originalUrl: string;

  @Prop({ unique: true })
  shortUrl: string;

  @Prop()
  title?: string;

  @Prop({ required: true, default: 0 })
  accessCount: number;

  _id: Types.ObjectId;
}

export const UrlSchema = SchemaFactory.createForClass(Url);
