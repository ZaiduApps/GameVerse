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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { trackedApiFetch } from '@/lib/api';
import {
  getGameReviewAdminEmailSwitch,
  getGameReviewEmailPreference,
  updateGameReviewAdminEmailSwitch,
  updateGameReviewEmailPreference,
} from '@/lib/game-review-api';
import type { ApiResponse, User } from '@/types';
import {
  Calendar,
  Cake,
  CheckCircle2,
  History,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  LogOut,
  MapPin,
  PencilLine,
  Settings2,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import ProfileDashboard from './ProfileDashboard';
import CenterAuthRequired from './center/CenterAuthRequired';

function hasAdminRole(roles: User['roles'] | undefined): boolean {
  if (!Array.isArray(roles)) return false;
  return roles.some((role) => {
    if (typeof role === 'string') {
      return /(admin|administrator|super|ops|moderator|manage)/i.test(role);
    }
    if (!role || typeof role !== 'object') return false;
    const code = String((role as { code?: unknown }).code || '').trim();
    const name = String((role as { name?: unknown }).name || '').trim();
    return /(admin|administrator|super|ops|moderator|manage)/i.test(`${code} ${name}`);
  });
}

export default function ProfilePage() {
  const { user: authUser, token, isAuthenticated, isLoading: isAuthLoading, logout, login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [profile, setProfile] = useState<User | null>(null);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);

  const [editName, setEditName] = useState('');
  const [editSignature, setEditSignature] = useState('');
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
  const [emailVerifyCode, setEmailVerifyCode] = useState('');
  const [emailVerifyCountdown, setEmailVerifyCountdown] = useState(0);
  const [isSendingEmailVerifyCode, setIsSendingEmailVerifyCode] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [emailNotifyEnabled, setEmailNotifyEnabled] = useState(false);
  const [isSavingEmailNotify, setIsSavingEmailNotify] = useState(false);
  const [adminEmailSwitchEnabled, setAdminEmailSwitchEnabled] = useState(true);
  const [isSavingAdminEmailSwitch, setIsSavingAdminEmailSwitch] = useState(false);
  const isAdminUser = hasAdminRole(profile?.roles || authUser?.roles);

  useEffect(() => {
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
          setEditSignature(json.data.signature || '');
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
  }, [authUser, isAuthLoading, isAuthenticated, toast, token]);

  useEffect(() => {
    let cancelled = false;

    const loadNotificationSettings = async () => {
      if (!token || !isAuthenticated) return;
      const [userPref, adminSwitch] = await Promise.all([
        getGameReviewEmailPreference(token),
        isAdminUser
          ? getGameReviewAdminEmailSwitch(token)
          : Promise.resolve({ enabled: true, source: 'local' as const }),
      ]);
      if (cancelled) return;
      setEmailNotifyEnabled(Boolean(userPref.enabled));
      setAdminEmailSwitchEnabled(adminSwitch.enabled === null ? true : Boolean(adminSwitch.enabled));
    };

    void loadNotificationSettings();
    return () => {
      cancelled = true;
    };
  }, [isAdminUser, isAuthenticated, token]);

  useEffect(() => {
    if (emailVerifyCountdown <= 0) return;
    const timer = window.setTimeout(() => {
      setEmailVerifyCountdown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [emailVerifyCountdown]);

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
          signature: editSignature,
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

  const handleSendEmailVerifyCode = async () => {
    if (!token || profile?.isVerified) return;
    setIsSendingEmailVerifyCode(true);
    try {
      const res = await trackedApiFetch('/auth/verify-email/send-code', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.code === 0) {
        if (json.data?.verified && json.data?.user) {
          setProfile(json.data.user);
          login({ user: json.data.user, token });
        }
        setEmailVerifyCountdown(json.data?.verified ? 0 : 60);
        toast({ title: json.data?.message || json.message || '验证码已发送，请查收邮件' });
      } else {
        const retryAfter = Number(json.data?.retry_after_seconds || json.retry_after_seconds || 0);
        if (retryAfter > 0) {
          setEmailVerifyCountdown(retryAfter);
        }
        toast({ variant: 'destructive', title: '发送失败', description: json.message || '请稍后重试' });
      }
    } catch {
      toast({ variant: 'destructive', title: '网络请求失败' });
    } finally {
      setIsSendingEmailVerifyCode(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || profile?.isVerified) return;
    if (!/^\d{6}$/.test(emailVerifyCode.trim())) {
      toast({ variant: 'destructive', title: '请输入 6 位邮箱验证码' });
      return;
    }

    setIsVerifyingEmail(true);
    try {
      const res = await trackedApiFetch('/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: emailVerifyCode.trim() }),
      });
      const json = await res.json();
      if (json.code === 0 && json.data?.user) {
        setProfile(json.data.user);
        login({ user: json.data.user, token });
        setEmailVerifyCode('');
        setEmailVerifyCountdown(0);
        toast({ title: json.data?.message || '邮箱认证成功' });
      } else {
        toast({ variant: 'destructive', title: '认证失败', description: json.message || '请稍后重试' });
      }
    } catch {
      toast({ variant: 'destructive', title: '网络请求失败' });
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleToggleEmailNotify = async (checked: boolean) => {
    if (!token || !isAuthenticated) return;
    setIsSavingEmailNotify(true);
    try {
      const result = await updateGameReviewEmailPreference({
        token,
        enabled: checked,
      });
      if (!result.ok) {
        toast({ variant: 'destructive', title: '保存失败', description: result.message || '请稍后重试' });
        return;
      }
      setEmailNotifyEnabled(result.enabled);
      toast({ title: checked ? '已开启邮件提醒' : '已关闭邮件提醒', description: result.message });
    } finally {
      setIsSavingEmailNotify(false);
    }
  };

  const handleToggleAdminEmailSwitch = async (checked: boolean) => {
    if (!token || !isAuthenticated || !isAdminUser) return;
    setIsSavingAdminEmailSwitch(true);
    try {
      const result = await updateGameReviewAdminEmailSwitch({
        token,
        enabled: checked,
      });
      if (!result.ok) {
        toast({ variant: 'destructive', title: '保存失败', description: result.message || '请稍后重试' });
        return;
      }
      setAdminEmailSwitchEnabled(result.enabled);
      toast({ title: checked ? '已开启全站邮件提醒' : '已关闭全站邮件提醒', description: result.message });
    } finally {
      setIsSavingAdminEmailSwitch(false);
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

  if (isAuthLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">正在加载个人资料...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <CenterAuthRequired
        title="个人资料"
        description="管理你的个人资料、安全设置与个人中心数据。"
        containerClassName="max-w-5xl"
      />
    );
  }

  if (isFetchingProfile || !profile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">正在加载个人资料...</p>
      </div>
    );
  }

  const profileDisplayName = profile.name || profile.username || '社区用户';
  const profileHandle = profile.username ? `@${profile.username}` : '';

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-4 md:py-8 fade-in">
      <div className="flex flex-col gap-8 md:flex-row">
        <div className="w-full space-y-6 md:w-80">
          <Card className="sticky top-24 overflow-hidden border-primary/10 shadow-lg">
            <div className="h-24 bg-gradient-to-r from-primary/20 to-accent/20" />
            <CardContent className="relative flex flex-col items-center pt-0">
              <Avatar className="-mt-12 h-20 w-20 border-4 border-background shadow-xl">
                <AvatarImage src={profile.avatar} alt={profileDisplayName} />
                <AvatarFallback className="bg-primary text-xl text-primary-foreground">
                  {profileDisplayName.substring(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="mt-4 space-y-1 text-center">
                <h2 className="text-lg font-bold">{profileDisplayName}</h2>
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

              <Button
                variant="destructive"
                className="btn-interactive mt-8 w-full gap-2"
                onClick={logout}
                data-acbox-action="profile_logout"
                data-acbox-label="退出登录"
              >
                <LogOut className="h-4 w-4" /> 退出登录
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1">
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-6">
              <TabsTrigger
                value="dashboard"
                data-acbox-action="profile_tab_dashboard"
                data-acbox-label="个人中心"
              >
                个人中心
              </TabsTrigger>
              <TabsTrigger
                value="account"
                data-acbox-action="profile_tab_account"
                data-acbox-label="个人资料"
              >
                个人资料
              </TabsTrigger>
              <TabsTrigger
                value="edit"
                data-acbox-action="profile_tab_edit"
                data-acbox-label="编辑信息"
              >
                编辑信息
              </TabsTrigger>
              <TabsTrigger
                value="security"
                data-acbox-action="profile_tab_security"
                data-acbox-label="安全设置"
              >
                安全设置
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                data-acbox-action="profile_tab_notifications"
                data-acbox-label="通知设置"
              >
                通知设置
              </TabsTrigger>
              <TabsTrigger
                value="api-keys"
                data-acbox-action="profile_tab_api_keys"
                data-acbox-label="API密钥"
              >
                API密钥
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <ProfileDashboard token={token || ''} />
            </TabsContent>

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
                      <p className="font-medium">{profileHandle || '未设置'}</p>
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
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">个性签名</Label>
                      <p className="flex items-center gap-2 font-medium">
                        <PencilLine className="h-4 w-4 text-green-500" />
                        {profile.signature || '未设置'}
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
                  <CardDescription>更新你的姓名、性别、个性签名和地区信息。</CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={handleUpdateProfile}
                    className="space-y-6"
                    data-acbox-action="profile_update_submit"
                    data-acbox-label="保存个人资料"
                  >
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
                        <Label htmlFor="edit-signature">个性签名</Label>
                        <Input id="edit-signature" value={editSignature} onChange={(e) => setEditSignature(e.target.value)} maxLength={120} placeholder="写一句你的主页签名" />
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

                    <Button
                      type="submit"
                      className="btn-interactive w-full px-8 sm:w-auto"
                      disabled={isUpdatingProfile}
                      data-acbox-action="profile_update_submit"
                      data-acbox-label="保存修改"
                    >
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
                  <CardDescription>管理邮箱认证与登录密码，保护你的账号安全。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-primary" />
                          <p className="font-medium">邮箱认证</p>
                          {profile.isVerified ? (
                            <Badge variant="secondary" className="border-green-200 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              <CheckCircle2 className="mr-1 h-3 w-3" /> 已认证
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                              待认证
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                        <p className="text-xs text-muted-foreground">
                          邮箱认证后可稳定接收回复、系统消息与账号安全通知。
                        </p>
                      </div>
                    </div>

                    {!profile.isVerified ? (
                      <form onSubmit={handleVerifyEmail} className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <div className="relative flex-1">
                          <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={emailVerifyCode}
                            onChange={(e) => setEmailVerifyCode(e.target.value)}
                            className="pl-9"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="输入 6 位验证码"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            disabled={isSendingEmailVerifyCode || emailVerifyCountdown > 0}
                            onClick={() => {
                              void handleSendEmailVerifyCode();
                            }}
                            data-acbox-action="profile_email_verify_send"
                            data-acbox-label="发送邮箱认证验证码"
                          >
                            {isSendingEmailVerifyCode && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {emailVerifyCountdown > 0 ? `${emailVerifyCountdown}s` : '发送验证码'}
                          </Button>
                          <Button
                            type="submit"
                            disabled={isVerifyingEmail}
                            data-acbox-action="profile_email_verify_submit"
                            data-acbox-label="确认邮箱认证"
                          >
                            {isVerifyingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            确认认证
                          </Button>
                        </div>
                      </form>
                    ) : null}
                  </div>

                  <form
                    onSubmit={handleChangePassword}
                    className="space-y-6"
                    data-acbox-action="profile_password_submit"
                    data-acbox-label="确认修改密码"
                  >
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

                    <Button
                      type="submit"
                      className="btn-interactive w-full px-8 sm:w-auto"
                      disabled={isChangingPassword}
                      data-acbox-action="profile_password_submit"
                      data-acbox-label="确认修改密码"
                    >
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

            <TabsContent value="notifications">
              <Card className="border-primary/5 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings2 className="h-5 w-5 text-primary" /> 通知设置
                  </CardTitle>
                  <CardDescription>
                    管理回复与系统消息邮件提醒。
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-xl border border-border/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">回复和系统消息邮件提醒我</p>
                        <p className="text-sm text-muted-foreground">
                          收到帖子回复、评论回复或系统消息时发送邮件通知。
                        </p>
                      </div>
                      <Switch
                        checked={adminEmailSwitchEnabled && emailNotifyEnabled}
                        disabled={!adminEmailSwitchEnabled || isSavingEmailNotify}
                        onCheckedChange={(checked) => {
                          void handleToggleEmailNotify(Boolean(checked));
                        }}
                        data-acbox-action="profile_email_notify_toggle"
                        data-acbox-label="回复和系统消息邮件提醒"
                      />
                    </div>
                    {!adminEmailSwitchEnabled ? (
                      <p className="mt-3 text-xs text-amber-600">
                        管理员当前已关闭全站邮件提醒，个人开关暂不可用。
                      </p>
                    ) : null}
                  </div>

                  {isAdminUser ? (
                    <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">管理员：全站游戏评论邮件提醒</p>
                          <p className="text-sm text-muted-foreground">
                            关闭后，全体用户回复与系统消息邮件通知都会暂停。
                          </p>
                        </div>
                        <Switch
                          checked={adminEmailSwitchEnabled}
                          disabled={isSavingAdminEmailSwitch}
                          onCheckedChange={(checked) => {
                            void handleToggleAdminEmailSwitch(Boolean(checked));
                          }}
                          data-acbox-action="profile_admin_email_notify_toggle"
                          data-acbox-label="全站通知邮件提醒"
                        />
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api-keys">
              <Card className="border-primary/5 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShieldCheck className="h-5 w-5 text-primary" /> API 密钥
                  </CardTitle>
                  <CardDescription>
                    创建并管理用于公开内容接口调用的 API 密钥。
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    API 密钥支持命名、过期时间和启停控制，发布后可用在外部服务调用发帖接口。
                  </p>
                  <Button
                    className="btn-interactive"
                    onClick={() => {
                      router.push('/profile/api-keys');
                    }}
                    data-acbox-action="profile_api_keys_manage"
                    data-acbox-label="前往 API 密钥管理"
                  >
                    前往 API 密钥管理
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
