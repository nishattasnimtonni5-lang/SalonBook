import { betterAuth } from "better-auth";

import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { MongoClient } from 'mongodb';


const client = new MongoClient(process.env.MONGODB_URI as string) ;
const db = client.db("SalonBook");

export const auth = betterAuth({

user: {
  additionalFields: {
    role: {
      type: "string",
      required: false,
      defaultValue: "customer",
      input: false,
    },
  },
},
  emailAndPassword: { 
    enabled: true, 
  }, 
  socialProviders: { 
    google: { 
      clientId: process.env.GOOGLE_CLIENT_ID as string, 
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
    }, 
  }, 



  database: mongodbAdapter(db, {
    client,
  }),
});