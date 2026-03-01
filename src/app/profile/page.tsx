
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  User as UserIcon, 
  Mail, 
  Lock, 
  Calendar, 
  ShieldCheck, 
  History, 
  LogOut, 
  Loader2,
  CheckCircle2,
  Smartphone
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProfilePage() {
  const { user, token, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Handle unauthorized access
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground">正在加载个人资料...</p>
      </div>
    );
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: '两次输入的密码不一致' });
      return;
    }

    if (newPassword.length < 6) {
      toast({ variant: 'destructive', title: '新密码至少需要6个字符' });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch('https://api.hk.apks.cc/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      
      const json = await res.json();
      
      if (json.code === 0) {
        toast({ title: '密码修改成功', description: '请使用新密码重新登录' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        // Optional: Force relogin
        logout();
      } else {
        toast({ variant: 'destructive', title: '修改失败', description: json.message });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: '网络请求失败' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知';
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 md:py-8 fade-in">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Sidebar: Brief Info */}
        <div className="w-full md:w-1/3 space-y-6">
          <Card className="shadow-lg border-primary/10 overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-primary/20 to-accent/20" />
            <CardContent className="relative pt-0 flex flex-col items-center">
              <Avatar className="w-24 h-24 border-4 border-background -mt-12 shadow-xl">
                <AvatarImage src={user.avatar} alt={user.name || user.username} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {(user.name || user.username).substring(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center mt-4 space-y-1">
                <h2 className="text-xl font-bold">{user.name || user.username}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>

              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {user.isVerified && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1 border-green-200">
                    <CheckCircle2 className="w-3 h-3" /> 已认证
                  </Badge>
                )}
                {user.isActive && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200">
                    正常状态
                  </Badge>
                )}
              </div>

              <Separator className="my-6" />

              <div className="w-full space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <History className="w-4 h-4" /> 登录次数
                  </span>
                  <span className="font-semibold">{user.loginCount || 0}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> 上次登录
                  </span>
                  <span className="text-xs font-medium pl-5">{formatDate(user.lastLoginTime)}</span>
                </div>
              </div>

              <Button 
                variant="destructive" 
                className="w-full mt-8 btn-interactive gap-2"
                onClick={logout}
              >
                <LogOut className="w-4 h-4" /> 退出登录
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Content: Tabs for Detailed Settings */}
        <div className="flex-1">
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="account">账户信息</TabsTrigger>
              <TabsTrigger value="security">安全设置</TabsTrigger>
            </TabsList>

            <TabsContent value="account">
              <Card className="shadow-md border-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-primary" /> 基本资料
                  </CardTitle>
                  <CardDescription>查看您的基本账户信息。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">用户名</Label>
                      <div className="p-3 bg-muted/30 rounded-md border text-sm font-medium">
                        {user.username}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">显示名称</Label>
                      <div className="p-3 bg-muted/30 rounded-md border text-sm font-medium">
                        {user.name || '未设置'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">电子邮箱</Label>
                    <div className="p-3 bg-muted/30 rounded-md border text-sm font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      {user.email}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">手机号码</Label>
                      <div className="p-3 bg-muted/30 rounded-md border text-sm font-medium flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-muted-foreground" />
                        {user.phone || '未绑定'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">注册时间</Label>
                      <div className="p-3 bg-muted/30 rounded-md border text-sm font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {formatDate(user.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">用户权限</Label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map((role, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs bg-accent/5">
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">普通用户</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card className="shadow-md border-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" /> 安全与隐私
                  </CardTitle>
                  <CardDescription>管理您的账户安全，更新密码。</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="old-password">当前密码</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            id="old-password" 
                            type="password" 
                            className="pl-9"
                            placeholder="输入您的当前密码"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="space-y-2">
                        <Label htmlFor="new-password">新密码</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            id="new-password" 
                            type="password" 
                            className="pl-9"
                            placeholder="至少6位，包含字母和数字"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">确认新密码</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            id="confirm-password" 
                            type="password" 
                            className="pl-9"
                            placeholder="请再次输入新密码"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        className="w-full sm:w-auto px-8 btn-interactive" 
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        确认修改密码
                      </Button>
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="bg-muted/30 text-xs text-muted-foreground border-t mt-6">
                  <p>提示：修改密码后您将需要重新登录所有设备。</p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
