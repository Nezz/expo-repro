import { runTask } from 'expo-server';

export async function GET(request: Request) {
  runTask(async () => {
    console.log('Background task running');
    // Simulate a background operation
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('Background task completed');
  });

  return new Response('Pong', { status: 200 });
}

export async function POST(request: Request) {
  runTask(async () => {
    console.log('Background task running');
    // Simulate a background operation
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('Background task completed');
  });
  
  return new Response('Pong', { status: 200 });
}