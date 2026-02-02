import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lzufyzhjwihdusghbbri.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6dWZ5emhqd2loZHVzZ2hiYnJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MTMyOTAsImV4cCI6MjA4NTE4OTI5MH0.-AuKLWczchAVtlc53nhykfigk_XIjLT2PVK58MaA_po';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';