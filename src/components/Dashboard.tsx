import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import {
  FileText,
  Edit,
  CheckCircle,
  Settings,
  LogOut as LogOutIcon,
  Crown,
  Sparkles,
} from 'lucide-react';
import logo from 'figma:asset/2cc5c58a6356b9bc99595ba4c64a3c807447e92a.png';

export type Section = 'resume' | 'cover-letter' | 'ats-checker' | 'upgrade' | 'admin';

interface DashboardProps {
  onNavigate: (section: Section) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, profile, isLoading, logout } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) return null;

  // Safely extract user info
  const fullName = profile?.full_name ?? user?.email ?? 'User';
  const firstName =
    typeof fullName === 'string' && fullName.trim().length > 0
      ? fullName.split(' ')[0]
      : 'User';
  const plan = profile?.plan ?? 'free';
  const isAdmin = !!profile?.is_admin;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-lg border-b border-border p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Resumize" className="h-8 w-8" />
            <h1 className="text-xl font-bold text-foreground">Resumize</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-medium text-foreground">{fullName}</p>
              <div className="flex items-center gap-2 justify-end">
                <Badge variant={plan === 'paid' ? 'default' : 'secondary'}>
                  {plan === 'paid' ? (
                    <>
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </>
                  ) : (
                    'Free Plan'
                  )}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOutIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Welcome back, {firstName}! 👋
          </h2>
          <p className="text-muted-foreground">
            Ready to build your next career opportunity? Let's get started with your resume.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card
            className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            onClick={() => onNavigate('resume')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary rounded-xl">
                  <FileText className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Resume Builder</CardTitle>
                  <CardDescription>Create ATS-friendly resumes with AI</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Build professional resumes that pass through ATS systems and get you noticed by recruiters.
              </p>
              <Button className="w-full">Start Building</Button>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            onClick={() => onNavigate('cover-letter')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-secondary rounded-xl">
                  <Edit className="h-6 w-6 text-secondary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Cover Letter</CardTitle>
                  <CardDescription>AI-powered personalized letters</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Generate tailored cover letters that align with your resume and target job positions.
              </p>
              <Button className="w-full" variant="outline">
                Create Letter
                {plan === 'free' && <Badge variant="secondary" className="ml-2">Premium</Badge>}
              </Button>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            onClick={() => onNavigate('ats-checker')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-accent rounded-xl">
                  <CheckCircle className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">ATS Checker</CardTitle>
                  <CardDescription>Check resume compatibility</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Analyze your resume against job descriptions and get actionable improvement suggestions.
              </p>
              <Button className="w-full" variant="outline">
                Check Resume
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Upgrade Section for Free Users */}
        {plan === 'free' && (
          <Card className="bg-primary text-primary-foreground mb-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            <CardContent className="p-6 md:p-8 relative z-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <div className="flex items-center gap-2 mb-3 justify-center md:justify-start">
                    <Sparkles className="h-6 w-6" />
                    <h3 className="text-2xl font-bold">Unlock Premium Features</h3>
                  </div>
                  <p className="text-primary-foreground/95 text-lg">
                    Get unlimited access to AI-powered tools, editable resumes, cover letters, and priority support for just <strong className="text-2xl">PKR 2,999</strong>.
                  </p>
                </div>
                <Button
                  size="lg"
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-xl font-semibold px-8 whitespace-nowrap"
                  onClick={() => onNavigate('upgrade')}
                >
                  <Crown className="h-5 w-5 mr-2" />
                  Upgrade Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest resumes and documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Software Engineer Resume</p>
                    <p className="text-sm text-muted-foreground">Created 2 days ago</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  View
                </Button>
              </div>

              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No documents yet. Create your first resume to get started!</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Panel Access */}
        {isAdmin && (
          <div className="mt-8">
            <Card className="bg-muted/50">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary rounded-xl">
                      <Settings className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Admin Panel</h3>
                      <p className="text-muted-foreground">
                        Manage users, payments, and system analytics
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => onNavigate('admin')}>
                    Open Admin Panel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};
