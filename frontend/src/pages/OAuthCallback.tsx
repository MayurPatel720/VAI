import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { queryClient } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: 'Unable to sign in with Google. Please try again.',
      });
      navigate('/login');
      return;
    }

    if (token) {
      // Store token in localStorage
      localStorage.setItem('token', token);

      // Invalidate queries to fetch user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });

      toast({
        title: 'Welcome! 🎉',
        description: 'Successfully signed in with Google.',
      });

      // Set flag to show welcome intro
      sessionStorage.setItem('showWelcomeIntro', 'true');

      // Redirect to home
      setTimeout(() => {
        navigate('/');
      }, 500);
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
