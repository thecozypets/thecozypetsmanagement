import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Welcome back, admin!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-primary/20 shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-primary/30">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
          </div>
          <CardTitle className="font-display text-2xl font-bold">Admin Access</CardTitle>
          <CardDescription>The Cozy Pets · Management System</CardDescription>
          <div className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground bg-muted/60 rounded-full px-3 py-1 mx-auto w-fit">
            <Lock className="h-3 w-3" /> Authorized personnel only
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Admin Email</Label>
              <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@thecozypets.com" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength={6} />
            </div>
            <Button type="submit" className="w-full font-semibold" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In to Dashboard'}
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground mt-6">
            Need an admin account? Contact the system owner to be granted access.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
