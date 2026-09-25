import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requestHandler } from '../server/index.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // @vercel/node wraps req/res differently, but requestHandler uses IncomingMessage / ServerResponse
  // which VercelRequest/Response extend.
  return requestHandler(req, res);
}
