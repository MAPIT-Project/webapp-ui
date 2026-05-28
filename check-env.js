#!/usr/bin/env node

// Debug script to check what environment variables are being used
console.log('🔍 Environment Variables Check');
console.log('================================');

console.log('PUBLIC_SUPABASE_URL:', process.env.PUBLIC_SUPABASE_URL || 'NOT SET');
console.log('PUBLIC_SUPABASE_ANON_KEY:', process.env.PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL || 'NOT SET');
console.log('BACKEND_URL:', process.env.BACKEND_URL || 'NOT SET');

console.log('\n📊 All PUBLIC_ variables:');
Object.keys(process.env)
  .filter(key => key.startsWith('PUBLIC_'))
  .forEach(key => {
    console.log(`${key}:`, process.env[key] || 'NOT SET');
  });

console.log('\n📊 All VITE_ variables:');
Object.keys(process.env)
  .filter(key => key.startsWith('VITE_'))
  .forEach(key => {
    console.log(`${key}:`, process.env[key] || 'NOT SET');
  });