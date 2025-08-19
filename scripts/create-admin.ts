/**
 * Script to create the first admin user
 * Run this once to set up your admin account
 * 
 * Usage: npx tsx scripts/create-admin.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const supabaseUrl = 'https://ndqxwvascqwhqaoqkpng.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcXh3dmFzY3F3aHFhb3FrcG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwODM2NDcsImV4cCI6MjA2OTY1OTY0N30.v1xFg9m6qOv6fhT5Wp1f7TCdhp8KspOiXf8EUC2N8bE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function createAdminUser() {
  console.log('🔐 Creating Admin User for Jové Admin Panel\n');

  try {
    const email = await ask('Enter admin email: ');
    const password = await ask('Enter admin password (min 6 chars): ');
    const fullName = await ask('Enter full name (optional): ');

    if (!email || !password) {
      console.error('❌ Email and password are required');
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('❌ Password must be at least 6 characters');
      process.exit(1);
    }

    console.log('\n📝 Creating user account...');

    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email
        }
      }
    });

    if (authError) {
      console.error('❌ Error creating user:', authError.message);
      process.exit(1);
    }

    if (!authData.user) {
      console.error('❌ Failed to create user');
      process.exit(1);
    }

    console.log('✅ User account created!');

    // Wait a moment for the trigger to create the user record
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Promote to admin
    console.log('👑 Promoting to admin...');

    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('roles')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching user:', fetchError.message);
      process.exit(1);
    }

    const currentRoles = userData.roles || [];
    if (!currentRoles.includes('admin')) {
      const newRoles = [...currentRoles, 'admin'];

      const { error: updateError } = await supabase
        .from('users')
        .update({ roles: newRoles })
        .eq('auth_user_id', authData.user.id);

      if (updateError) {
        console.error('❌ Error promoting to admin:', updateError.message);
        process.exit(1);
      }
    }

    console.log('✅ User promoted to admin!');
    console.log('\n🎉 Admin user created successfully!');
    console.log(`\n📧 Email: ${email}`);
    console.log(`🔗 Admin login: http://localhost:3000/admin/login`);
    console.log('\nYou can now sign in to the admin panel.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

createAdminUser();
