import mongoose from 'mongoose';

const maskMongoUri = uri => uri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');

const connectDB = async () => {
  const connUri = process.env.MONGODB_URI;
  if (!connUri) {
    throw new Error('MONGODB_URI is required');
  }

  console.log(`Connecting to MongoDB at: ${maskMongoUri(connUri)}`);
  const connection = await mongoose.connect(connUri, {
    serverSelectionTimeoutMS: 10000
  });

  process.env.USE_MOCK_DB = 'false';
  console.log(`MongoDB Connected: ${connection.connection.name}@${connection.connection.host}`);
  return connection;
};

export default connectDB;
