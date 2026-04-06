'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { trackedApiFetch } from '@/lib/api';
import type { ApiResponse, User } from '@/types';
import {
  Calendar,
  Cake,
  CheckCircle2,
  History,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  PencilLine,
  ShieldCheck,
  Smartphone,
  User as UserIcon,
} from 'lucide-react';

export default function ProfilePage() {
  const { user: authUser, token, isAuthenticated, isLoading: isAuthLoading, logout, login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [profile, setProfile] = useState<User | null>(null);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);

  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editBirthday, setEditBirthday] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editProvince, setEditProvince] = useState('');
  const [editCity, setEditCity] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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
          headers: { Authorization: `Bearer ${token}` },
        });
        const json: ApiResponse<User> = await res.json();

        if (json.code === 0 && json.data) {
          setProfile(json.data);
          setEditName(json.data.name || '');
          setEditPhone(json.data.phone || '');
          setEditGender(json.data.gender || 'secret');
          setEditBirthday(json.data.birthday || '');
          setEditCountry(json.data.country || '');
          setEditProvince(json.data.province || '');
          setEditCity(json.data.city || '');
        } else {
          toast({ variant: 'destructive', title: '获取资料失败', description: json.message || '请稍后重试' });
        }
      } catch (error) {
        toast({ variant: 'destructive', title: '网络请求失败', description: '请检查网络连接' });
      } finally {
        setIsFetchingProfile(false);
      }
    };

    if (isAuthenticated && token) {
      fetchDetailedProfile();
    } else if (authUser) {
      setProfile(authUser);
      setIsFetchingProfile(false);
    }
  }, [authUser, isAuthLoading, isAuthenticated, router, toast, token]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsUpdatingProfile(true);
    try {
      const res = await trackedApiFetch('/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          gender: editGender === 'secret' ? '' : editGender,
          birthday: editBirthday,
          country: editCountry,
          province: editProvince,
          city: editCity,
        }),
      });

      const json: ApiResponse<User> = await res.json();
      if (json.code === 0 && json.data) {
        setProfile(json.data);
        login({ user: json.data, token });
        toast({ title: '个人资料已更新' });
      } else {
        toast({ variant: 'destructive', title: '更新失败', description: json.message || '请稍后重试' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: '网络请求失败' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: '两次输入的新密码不一致' });
      return;
    }

    if (newPassword.length < 6) {
      toast({ variant: 'destructive', title: '新密码至少 6 位' });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await trackedApiFetch('/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const json = await res.json();
      if (json.code === 0) {
        toast({ title: '密码修改成功', description: '请使用新密码重新登录' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        logout();
      } else {
        toast({ variant: 'destructive', title: '修改失败', description: json.message || '请稍后重试' });
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
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (isAuthLoading || isFetchingProfile || !profile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">正在加载个人资料...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-4 md:py-8 fade-in">
      <div className="flex flex-col gap-8 md:flex-row">
        <div className="w-full space-y-6 md:w-80">
          <Card className="sticky top-24 overflow-hidden border-primary/10 shadow-lg">
            <div className="h-24 bg-gradient-to-r from-primary/20 to-accent/20" />
            <CardContent className="relative flex flex-col items-center pt-0">
              <Avatar className="-mt-12 h-20 w-20 border-4 border-background shadow-xl">
                <AvatarImage src={profile.avatar} alt={profile.name || profile.username} />
                <AvatarFallback className="bg-primary text-xl text-primary-foreground">
                  {(profile.name || profile.username).substring(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="mt-4 space-y-1 text-center">
                <h2 className="text-lg font-bold">{profile.name || profile.username}</h2>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {profile.isVerified && (
                  <Badge variant="secondary" className="gap-1 border-green-200 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3" /> 已认证
                  </Badge>
                )}
                <Badge variant="secondary" className="border-blue-200 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  普通用户
                </Badge>
              </div>

              <Separator className="my-6" />

              <div className="w-full space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <History className="h-4 w-4" /> 登录次数
                  </span>
                  <span className="font-semibold">{profile.loginCount || 0}</span>
                </div>
                <div className="space-y-1">
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" /> 注册时间
                  </span>
                  <p className="pl-5 text-xs font-medium">{formatDate(profile.created_at)}</p>
                </div>
              </div>

              <Button variant="destructive" className="btn-interactive mt-8 w-full gap-2" onClick={logout}>
                <LogOut className="h-4 w-4" /> 退出登录
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1">
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-3">
              <TabsTrigger value="account">个人资料</TabsTrigger>
              <TabsTrigger value="edit">编辑信息</TabsTrigger>
              <TabsTrigger value="security">安全设置</TabsTrigger>
            </TabsList>

            <TabsContent value="account">
              <Card className="border-primary/5 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <UserIcon className="h-5 w-5 text-primary" /> 基本资料
                  </CardTitle>
                  <CardDescription>查看你的公开个人资料信息。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">显示名称</Label>
                      <p className="font-medium">{profile.name || '未设置'}</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">用户名</Label>
                      <p className="font-medium">@{profile.username}</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">性别</Label>
                      <p className="font-medium">
                        {profile.gender === 'male'
                          ? '男'
                          : profile.gender === 'female'
                            ? '女'
                            : profile.gender === 'other'
                              ? '其他'
                              : '保密'}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">生日</Label>
                      <p className="flex items-center gap-2 font-medium">
                        <Cake className="h-4 w-4 text-pink-400" />
                        {profile.birthday || '未设置'}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">手机号</Label>
                      <p className="flex items-center gap-2 font-medium">
                        <Smartphone className="h-4 w-4 text-green-500" />
                        {profile.phone || '未绑定'}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">地理位置</Label>
                      <p className="flex items-center gap-2 font-medium">
                        <MapPin className="h-4 w-4 text-red-400" />
                        {[profile.country, profile.province, profile.city].filter(Boolean).join(' / ') || '未设置'}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">系统角色</Label>
                    <div className="flex flex-wrap gap-2">
                      {profile.roles && profile.roles.length > 0 ? (
                        profile.roles.map((role, idx) => (
                          <Badge key={idx} variant="outline" className="border-primary/20 bg-primary/5">
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
              <Card className="border-primary/5 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <PencilLine className="h-5 w-5 text-primary" /> 编辑基本信息
                  </CardTitle>
                  <CardDescription>更新你的姓名、性别、联系方式和地区信息。</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">姓名 / 显示名称</Label>
                        <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="请输入你的姓名" />
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
                            <SelectItem value="secret">保密</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-birthday">生日</Label>
                        <Input id="edit-birthday" type="date" value={editBirthday} onChange={(e) => setEditBirthday(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-phone">手机号</Label>
                        <Input id="edit-phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="请输入手机号码" />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="edit-country">国家</Label>
                        <Input id="edit-country" value={editCountry} onChange={(e) => setEditCountry(e.target.value)} placeholder="例如：中国" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-province">省份</Label>
                        <Input id="edit-province" value={editProvince} onChange={(e) => setEditProvince(e.target.value)} placeholder="例如：广东省" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-city">城市</Label>
                        <Input id="edit-city" value={editCity} onChange={(e) => setEditCity(e.target.value)} placeholder="例如：深圳市" />
                      </div>
                    </div>

                    <Button type="submit" className="btn-interactive w-full px-8 sm:w-auto" disabled={isUpdatingProfile}>
                      {isUpdatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      保存修改
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card className="border-primary/5 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShieldCheck className="h-5 w-5 text-primary" /> 安全与隐私
                  </CardTitle>
                  <CardDescription>定期更新密码，保护你的账号安全。</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="old-password">当前密码</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="old-password"
                          type="password"
                          className="pl-9"
                          placeholder="请输入当前密码"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password">新密码</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="new-password"
                          type="password"
                          className="pl-9"
                          placeholder="至少 6 位，建议字母+数字"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">确认新密码</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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

                    <Button type="submit" className="btn-interactive w-full px-8 sm:w-auto" disabled={isChangingPassword}>
                      {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      确认修改密码
                    </Button>
                  </form>
                </CardContent>
                <CardFooter className="mt-6 rounded-b-lg border-t bg-muted/30 text-xs text-muted-foreground">
                  修改密码后，建议在其他设备重新登录以确保账号安全。
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
