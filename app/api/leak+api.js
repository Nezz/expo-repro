import { Client } from '../../components/Client';

export function GET() {
  return Response.json({ client: typeof Client });
}
