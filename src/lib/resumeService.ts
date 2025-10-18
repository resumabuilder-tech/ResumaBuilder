import { supabase } from './supabase';
import { ResumeTemplate } from '../types'; // ✅ Use the shared type here

export type Resume = {
  id?: string;
  user_id?: string;
  title: string;
  content: any; // JSON
  created_at?: string;
  updated_at?: string;
  
};

// -------------------
// RESUME CRUD METHODS
// -------------------

export async function fetchResumes(userId: string) {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function createResume(payload: Partial<Resume>) {
  const { data, error } = await supabase
    .from('resumes')
    .insert([payload])
    .select()
    .single();

  return { data, error };
}

export async function saveResume(payload: any) {
  const { data, error } = await supabase
    .from('resumes')
    .insert([payload]);

  if (error) console.error(error);
  return data;
}

export async function updateResume(id: string, payload: Partial<Resume>) {
  const { data, error } = await supabase
    .from('resumes')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

export async function deleteResume(id: string) {
  const { data, error } = await supabase
    .from('resumes')
    .delete()
    .eq('id', id);

  return { data, error };
}

// -------------------
// TEMPLATE FUNCTIONS
// -------------------

export async function fetchTemplates(): Promise<ResumeTemplate[]> {
  const { data, error } = await supabase
    .from('resume_templates')
    .select('*');

  if (error) {
    console.error('Error fetching templates:', error);
    return [];
  }

  return data || [];
}
