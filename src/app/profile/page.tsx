
'use client';

import React, { useState, useEffect } from 'react';
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
  Smartphone,
  MapPin,
  PencilLine,
  Cake,
  Globe2
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { User, ApiResponse } from '@/types';
import { trackedApiFetch } from '@/lib/api';

export default function ProfilePage() {
  const { user: authUser, token, isAuthenticated, isLoading: isAuthLoading, logout, login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<User | null>(null);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);
  
  // Form States for Profile Update
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editBirthday, setEditBirthday] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editProvince, setEditProvince] = useState('');
  const [editCity, setEditCity] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Form States for Password Change
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Fetch detailed profile
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/');
      return;
    }

    const fetchDetailedProfile = async () => {
      if (!token) return;
      setIsFetchingProfile(true);
      try {
        const res = await trackedApiFetch('/users/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json: ApiResponse<User> = await res.json();
        if (json.code === 0) {
          setProfile(json.data);
          // Sync form states
          setEditName(json.data.name || '');
          setEditPhone(json.data.phone || '');
          setEditGender(json.data.gender || '');
          setEditBirthday(json.data.birthday || '');
          setEditCountry(json.data.country || '');
          setEditProvince(json.data.province || '');
          setEditCity(json.data.city || '');
        } else {
          toast({ variant: 'destructive', title: '获取资料失败', description: json.message });
        }
      } catch (error) {
        toast({ variant: 'destructive', title: '网络请求失败' });
      } finally {
        setIsFetchingProfile(false);
      }
    };

    if (isAuthenticated && token) {
      fetchDetailedProfile();
    }
  }, [isAuthLoading, isAuthenticated, token, router, toast]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const res = await trackedApiFetch('/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          gender: editGender,
          birthday: editBirthday,
          country: editCountry,
          province: editProvince,
          city: editCity
        })
      });
      
      const json: ApiResponse<User> = await res.json();
      
      if (json.code === 0) {
        toast({ title: '个人资料已更新' });
        setProfile(json.data);
        // Also update AuthContext so header/other parts reflect changes
        if (token) {
          login({ user: json.data, token });
        }
      } else {
        toast({ variant: 'destructive', title: '更新失败', description: json.message });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: '网络请求失败' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

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
      const res = await trackedApiFetch('/auth/change-password', {
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
    if (!dateString) return '未设置';
    try {
        return new Date(dateString).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
  };

  if (isAuthLoading || isFetchingProfile || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground">正在加载个人资料...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4 md:py-8 fade-in">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Sidebar: Brief Info */}
        <div className="w-full md:w-80 space-y-6">
          <Card className="shadow-lg border-primary/10 overflow-hidden sticky top-24">
            <div className="h-24 bg-gradient-to-r from-primary/20 to-accent/20" />
            <CardContent className="relative pt-0 flex flex-col items-center">
              <Avatar className="w-24 h-24 border-4 border-background -mt-12 shadow-xl">
                <AvatarImage src={profile.avatar} alt={profile.name || profile.username} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {(profile.name || profile.username).substring(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center mt-4 space-y-1">
                <h2 className="text-xl font-bold">{profile.name || profile.username}</h2>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>

              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {profile.isVerified && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1 border-green-200">
                    <CheckCircle2 className="w-3 h-3" /> 已认证
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200">
                  Lv.{profile.roles && profile.roles.length > 0 ? (typeof profile.roles[0] === 'object' ? '1' : '1') : '0'} 用户
                </Badge>
              </div>

              <Separator className="my-6" />

              <div className="w-full space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <History className="w-4 h-4" /> 登录次数
                  </span>
                  <span className="font-semibold">{profile.loginCount || 0}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> 注册于
                  </span>
                  <p className="text-xs font-medium pl-5">{formatDate(profile.created_at)}</p>
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
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="account">个人资料</TabsTrigger>
              <TabsTrigger value="edit">编辑信息</TabsTrigger>
              <TabsTrigger value="security">安全设置</TabsTrigger>
            </TabsList>

            <TabsContent value="account">
              <Card className="shadow-md border-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-primary" /> 基本资料
                  </CardTitle>
                  <CardDescription>查看您的公开个人资料信息。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">显示名称</Label>
                      <p className="font-medium">{profile.name || '未设置'}</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">用户名</Label>
                      <p className="font-medium">@{profile.username}</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">性别</Label>
                      <p className="font-medium">
                        {profile.gender === 'male' ? '男' : profile.gender === 'female' ? '女' : profile.gender === 'other' ? '其他' : '保密'}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">生日</Label>
                      <p className="font-medium flex items-center gap-2">
                        <Cake className="w-4 h-4 text-pink-400" />
                        {profile.birthday || '未设置'}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">手机号码</Label>
                      <p className="font-medium flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-green-500" />
                        {profile.phone || '未绑定'}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">地理位置</Label>
                      <p className="font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-400" />
                        {[profile.country, profile.province, profile.city].filter(Boolean).join(' · ') || '未设置'}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">系统角色</Label>
                    <div className="flex flex-wrap gap-2">
                      {profile.roles && profile.roles.length > 0 ? (
                        profile.roles.map((role, idx) => (
                          <Badge key={idx} variant="outline" className="bg-primary/5 border-primary/20">
                            {typeof role === 'object' && role !== null ? role.name : role}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline">普通用户</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="edit">
              <Card className="shadow-md border-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PencilLine className="w-5 h-5 text-primary" /> 修改基本信息
                  </CardTitle>
                  <CardDescription>更新您的姓名、性别、所在地等信息。</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">姓名 / 显示名称</Label>
                        <Input 
                          id="edit-name" 
                          value={editName} 
                          onChange={(e) => setEditName(e.target.value)} 
                          placeholder="请输入您的姓名"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-gender">性别</Label>
                        <Select value={editGender} onValueChange={setEditGender}>
                          <SelectTrigger id="edit-gender">
                            <SelectValue placeholder="请选择性别" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">男</SelectItem>
                            <SelectItem value="female">女</SelectItem>
                            <SelectItem value="other">其他</SelectItem>
                            <SelectItem value="">保密</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-birthday">生日</Label>
                        <Input 
                          id="edit-birthday" 
                          type="date"
                          value={editBirthday} 
                          onChange={(e) => setEditBirthday(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-phone">手机号码</Label>
                        <Input 
                          id="edit-phone" 
                          value={editPhone} 
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="请输入联系电话"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="edit-country">国家</Label>
                        <Input 
                          id="edit-country" 
                          value={editCountry} 
                          onChange={(e) => setEditCountry(e.target.value)}
                          placeholder="例如：中国"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-province">省份</Label>
                        <Input 
                          id="edit-province" 
                          value={editProvince} 
                          onChange={(e) => setEditProvince(e.target.value)}
                          placeholder="例如：广东省"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-city">城市</Label>
                        <Input 
                          id="edit-city" 
                          value={editCity} 
                          onChange={(e) => setEditCity(e.target.value)}
                          placeholder="例如：深圳市"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button 
                        type="submit" 
                        className="w-full sm:w-auto px-8 btn-interactive" 
                        disabled={isUpdatingProfile}
                      >
                        {isUpdatingProfile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        保存修改
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card className="shadow-md border-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" /> 安全与隐私
                  </CardTitle>
                  <CardDescription>管理您的账户安全，定期更新密码以保护账户。</CardDescription>
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
                <CardFooter className="bg-muted/30 text-xs text-muted-foreground border-t mt-6 rounded-b-lg">
                  <p className="p-2">提示：修改密码后您将需要重新登录所有设备以确保安全。</p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
