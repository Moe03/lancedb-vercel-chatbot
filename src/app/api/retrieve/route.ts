import { NextResponse } from 'next/server';

import { retrieveContext } from './retrieve';

export async function GET(req: Request) {
  await retrieveContext(`test`, 'test');
  return NextResponse.json({
    yes: 'no'
  })
}
export async function POST(req: Request) {
  // Extract the `messages` from the body of the request
  const { query, table } = await req.json();
  console.log(query, table)
  const context = await retrieveContext(query, table)
  return NextResponse.json(context)
}