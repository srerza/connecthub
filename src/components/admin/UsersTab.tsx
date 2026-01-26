import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Shield, Building2, Loader2 } from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: 'superadmin' | 'company' | 'user';
}

export const UsersTab = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [profilesResult, rolesResult] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('user_id, role'),
    ]);

    if (profilesResult.data) {
      setProfiles(profilesResult.data);
    }

    if (rolesResult.data) {
      const rolesMap = new Map<string, string>();
      rolesResult.data.forEach((r: UserRole) => {
        rolesMap.set(r.user_id, r.role);
      });
      setUserRoles(rolesMap);
    }

    setLoading(false);
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    const existingRole = userRoles.get(userId);

    if (existingRole) {
      // Update existing role
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole as 'superadmin' | 'company' | 'user' })
        .eq('user_id', userId);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update user role.',
          variant: 'destructive',
        });
        return;
      }
    } else {
      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole as 'superadmin' | 'company' | 'user' });

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to assign role.',
          variant: 'destructive',
        });
        return;
      }
    }

    toast({ title: 'Role updated successfully!' });
    fetchData();
  };

  const getRoleIcon = (role: string | undefined) => {
    switch (role) {
      case 'superadmin':
        return <Shield className="w-4 h-4 text-primary" />;
      case 'company':
        return <Building2 className="w-4 h-4 text-accent" />;
      default:
        return <User className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getRoleBadge = (role: string | undefined) => {
    switch (role) {
      case 'superadmin':
        return <Badge className="bg-primary/10 text-primary">Superadmin</Badge>;
      case 'company':
        return <Badge className="bg-accent/10 text-accent">Company</Badge>;
      default:
        return <Badge variant="secondary">User</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <User className="w-5 h-5" />
          User Management
        </CardTitle>
        <CardDescription>View and manage user accounts and roles</CardDescription>
      </CardHeader>
      <CardContent>
        {profiles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No users registered yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {profiles.map((profile) => {
              const role = userRoles.get(profile.id);
              return (
                <div
                  key={profile.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-border bg-secondary/30 gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {getRoleIcon(role)}
                    </div>
                    <div>
                      <p className="font-medium">{profile.full_name || 'No name'}</p>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getRoleBadge(role)}
                    
                    <Select
                      value={role || 'user'}
                      onValueChange={(value) => updateUserRole(profile.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="superadmin">Superadmin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
