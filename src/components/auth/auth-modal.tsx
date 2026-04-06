'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, User, KeyRound, Smartphone } from 'lucide-react';
import type { ApiResponse, AuthData } from '@/types';
import { apiUrl } from '@/lib/api';
import { getDeviceHeaders, getDeviceId, getDeviceName } from '@/lib/auth-device';
import { buildTrackingHeaders } from '@/lib/tracking-headers';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const API_BASE_URL = apiUrl('/auth');

export default function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { login } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [method, setMethod] = useState<'password' | 'email'>('password');
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');

  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

  const resetForm = () => {
    setEmail('');
    setUsername('');
    setPassword('');
    setCode('');
    setName('');
  };

  const handleSendCode = async () => {
    if (!email) {
      toast({ variant: 'destructive', title: '请输入邮箱地址' });
      return;
    }

    setIsLoading(true);
    try {
      const type = activeTab === 'login' ? 'login' : 'register';
      const res = await fetch(`${API_BASE_URL}/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...buildTrackingHeaders(),
        },
        body: JSON.stringify({ email, type }),
      });

      const json: ApiResponse<{ message: string }> = await res.json();
      if (json.code === 0) {
        toast({ title: '验证码已发送', description: json.data?.message || '请检查邮箱' });
        setCountdown(60);
      } else {
        toast({ variant: 'destructive', title: '发送失败', description: json.message || '请稍后重试' });
      }
    } catch {
      toast({ variant: 'destructive', title: '网络请求失败' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let url = `${API_BASE_URL}/login`;
      let body: Record<string, unknown> = {
        username,
        password,
        device_id: getDeviceId(),
        device_name: getDeviceName(),
      };

      if (method === 'email') {
        url = `${API_BASE_URL}/login-by-email`;
        body = {
          email,
          code,
          device_id: getDeviceId(),
          device_name: getDeviceName(),
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getDeviceHeaders(),
          ...buildTrackingHeaders(),
        },
        body: JSON.stringify(body),
      });

      const json: ApiResponse<AuthData> = await res.json();
      if (json.code === 0 && json.data) {
        login(json.data);
        toast({ title: '登录成功', description: `欢迎回来，${json.data.user.name || json.data.user.username}` });
        onOpenChange(false);
        resetForm();
      } else {
        toast({ variant: 'destructive', title: '登录失败', description: json.message || '请检查账号信息' });
      }
    } catch {
      toast({ variant: 'destructive', title: '网络请求失败' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let url = `${API_BASE_URL}/register`;
      let body: Record<string, unknown> = { username, email, password, name };

      if (method === 'email') {
        url = `${API_BASE_URL}/register-by-email`;
        body = { email, code, username, password, name };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...buildTrackingHeaders(),
        },
        body: JSON.stringify(body),
      });

      const json: ApiResponse<AuthData> = await res.json();
      if (json.code === 0 && json.data) {
        login(json.data);
        toast({ title: '注册成功', description: '账号已创建并自动登录' });
        onOpenChange(false);
        resetForm();
      } else {
        toast({ variant: 'destructive', title: '注册失败', description: json.message || '请稍后重试' });
      }
    } catch {
      toast({ variant: 'destructive', title: '网络请求失败' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            {activeTab === 'login' ? '欢迎回来' : '创建账号'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {activeTab === 'login' ? '登录后可同步收藏、评论和消息。' : '注册后即可参与社区互动。'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')} className="w-full">
          <TabsList className="mb-4 grid w-full grid-cols-2">
            <TabsTrigger value="login">登录</TabsTrigger>
            <TabsTrigger value="register">注册</TabsTrigger>
          </TabsList>

          <div className="mb-6 flex justify-center gap-4">
            <Button
              variant={method === 'password' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMethod('password')}
              className="w-full text-xs"
            >
              <Lock className="mr-2 h-3.5 w-3.5" />
              密码{activeTab === 'login' ? '登录' : '注册'}
            </Button>
            <Button
              variant={method === 'email' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMethod('email')}
              className="w-full text-xs"
            >
              <Mail className="mr-2 h-3.5 w-3.5" />
              邮箱验证码
            </Button>
          </div>

          <TabsContent value="login">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {method === 'password' ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="login-username">用户名</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="login-username"
                        placeholder="请输入用户名"
                        className="pl-9"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="login-password">密码</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="请输入密码"
                        className="pl-9"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="login-email">邮箱地址</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-9"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="login-code">验证码</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-grow">
                        <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="login-code"
                          placeholder="6 位验证码"
                          className="pl-9"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          required
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSendCode}
                        disabled={countdown > 0 || isLoading}
                        className="min-w-[100px]"
                      >
                        {countdown > 0 ? `${countdown}s` : '发送验证码'}
                      </Button>
                    </div>
                  </div>
                </>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                登录
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="reg-username">用户名</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reg-username"
                    placeholder="3-20 个字符"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="reg-email">邮箱地址</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              {method === 'email' && (
                <div className="grid gap-2">
                  <Label htmlFor="reg-code">邮箱验证码</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="reg-code"
                        placeholder="6 位验证码"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="pl-9"
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSendCode}
                      disabled={countdown > 0 || isLoading}
                      className="min-w-[100px]"
                    >
                      {countdown > 0 ? `${countdown}s` : '发送验证码'}
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="reg-password">密码</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="至少 6 位，建议字母+数字"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required={method === 'password'}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="reg-name">显示名称（可选）</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reg-name"
                    placeholder="公开显示的昵称"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                注册
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
