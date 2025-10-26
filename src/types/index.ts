export interface User {
  id: string;
  full_name?: string;
  email?: string;
  is_admin?: boolean;
  plan?: 'free' | 'paid';
  created_date?: string;
  last_active?: string;
}

// Profile represents the DB row for the "profiles" table.
// It usually contains the same fields as User, plus any DB-specific fields.
export interface Profile extends User {
  // if your DB uses created_date / last_active fields as timestamps:
  created_date?: string;
  last_active?: string;
}
export type Resume = {
  id?: string;
  owner: string;
  user_id?: string;
  title: string;
  summary?: string;
  personal_info?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    portfolio?: string;
    github?: string;
    photo?: string; // ✅ Added this line
  };
  education?: {
    degree?: string;
    institution?: string;
    year?: string;
    gpa?: string;
  }[];
  experience?: {
    title?: string;
    company?: string;
    duration?: string;
    description?: string;
  }[];
  certifications?: {
    name?: string;
    issuer?: string;
    year?: string;
  }[];
  projects?: {
    title?: string;
    description?: string;
    tech?: string;
    duration?: string;
  }[];
  skills?: string[];
  template?: string | number;
  created_at?: string;
  updated_at?: string;
  technologies?: string[];
  languages?: string[];
  references?: {
    name: string;
    designation: string;
    company: string;
    contact: string;
  }[];
};



export interface CoverLetter {
  id: string;
  owner: string;
  job_title: string;
  job_link?: string;
  content: string;
  pdf_file?: string;
  created_date: string;
}

export interface Payment {
  id: string;
  owner: string;
  amount: number;
  status: 'pending' | 'verified' | 'rejected';
  tx_reference: string;
  proof_image?: string;
  created_date: string;
}

export interface UsageLog {
  id: string;
  owner: string;
  action_type: 'resume_generated' | 'cover_letter_generated' | 'ats_check' | 'pdf_export';
  details: string;
  timestamp: string;
}

export interface ATSResult {
  score: number;
  missing_keywords: string[];
  suggested_improvements: string[];
}

export type ResumeTemplate = {
  id: string;
  name: string;
  description?: string;
  url: string;
  preview_image?: string;   // ✅ add this
  is_premium?: boolean;     // ✅ add this
  is_active?: boolean;      // ✅ add this
  category?: string;
  created_date?: string;
  created_by?: string;
};
