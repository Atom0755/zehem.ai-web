import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vkwndhdqbmuyogieccph.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrd25kaGRxYm11eW9naWVjY3BoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNDg2NzcsImV4cCI6MjA4MTkyNDY3N30.Q2Kf4rzJWJdWnYjpLRofmGUp6DNWBgFoDkFJ4yr473k';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
