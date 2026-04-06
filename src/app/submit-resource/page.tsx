'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';

import { useAuth } from '@/context/auth-context';
import { apiUrl, trackedApiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlusCircle, Trash2, UploadCloud } from 'lucide-react';

const requestResourceSchema = z.object({
  resourceName: z.string().min(1, '资源名称不能为空'),
  sourceUrl: z.string().url('请输入有效的 URL').optional().or(z.literal('')),
});

type RequestResourceFormValues = z.infer<typeof requestResourceSchema>;

const authorSubmissionSchema = z.object({
  resourceType: z.enum(['app', 'game'], { required_error: '请选择资源类型' }),
  resourceName: z.string().min(1, '资源名称不能为空'),
  description: z.string().min(10, '资源介绍至少 10 个字符'),
  downloadUrl: z.string().url('请输入有效的下载链接'),
  resourceSize: z
    .string()
    .min(1, '资源大小不能为空')
    .regex(/^\d+(\.\d+)?(KB|MB|GB|TB)$/i, '格式如 1.5GB、200MB'),
  imageUrls: z
    .array(
      z.object({
        value: z
          .string()
          .url({ message: '请输入有效的图片链接' })
          .min(1, '图片链接不能为空'),
      }),
    )
    .min(1, '至少需要 1 张介绍图')
    .max(5, '最多只能添加 5 张介绍图'),
  authorName: z.string().min(1, '作者名不能为空'),
});

type AuthorSubmissionFormValues = z.infer<typeof authorSubmissionSchema>;

export default function SubmitResourcePage() {
  const { toast } = useToast();
  const { user, token } = useAuth();

  const requestForm = useForm<RequestResourceFormValues>({
    resolver: zodResolver(requestResourceSchema),
    defaultValues: {
      resourceName: '',
      sourceUrl: '',
    },
  });

  const authorForm = useForm<AuthorSubmissionFormValues>({
    resolver: zodResolver(authorSubmissionSchema),
    defaultValues: {
      resourceType: undefined,
      resourceName: '',
      description: '',
      downloadUrl: '',
      resourceSize: '',
      imageUrls: [{ value: '' }],
      authorName: '',
    },
  });

  const { fields: imageUrlFields, append: appendImageUrl, remove: removeImageUrl } =
    useFieldArray({
      control: authorForm.control,
      name: 'imageUrls',
    });

  const buildCommonFeedbackFields = () => {
    const displayName = user?.name || user?.username || '游客';
    const contact = user?.email || user?.phone || '';
    return {
      user_id: user?._id || '',
      nickname: displayName,
      contact,
      clientType: 'Web',
      clientVersion: process.env.NEXT_PUBLIC_CLIENT_VERSION || '',
      osVersion: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      deviceModel: typeof navigator !== 'undefined' ? navigator.platform : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };
  };

  const submitFeedback = async (payload: Record<string, unknown>) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;

      const res = await trackedApiFetch('/feedbacks', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.code !== 0) {
      throw new Error(json?.message || `HTTP ${res.status}`);
    }
  };

  const onRequestSubmit = async (data: RequestResourceFormValues) => {
    const common = buildCommonFeedbackFields();
    const payload = {
      type: 'missing',
      title: '求添加资源反馈',
      description: [
        `资源名称：${data.resourceName}`,
        `资源来源：${data.sourceUrl || '未提供'}`,
        '提交入口：Web /submit-resource（求添加资源）',
        `提交用户：${common.nickname || '游客'}`,
        `联系方式：${common.contact || '未提供'}`,
      ].join('\n'),
      ref_url: data.sourceUrl || '',
      ...common,
    };

    try {
      await submitFeedback(payload);
      toast({
        title: '请求已提交',
        description: '已按反馈工单提交，感谢你的建议。',
      });
      requestForm.reset();
    } catch (error) {
      toast({
        title: '提交失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  const onAuthorSubmit = async (data: AuthorSubmissionFormValues) => {
    const common = buildCommonFeedbackFields();
    const imageUrls = (data.imageUrls || [])
      .map((item) => item?.value?.trim())
      .filter(Boolean);

    const payload = {
      type: 'suggestion',
      title: '资源投稿反馈',
      description: [
        `资源类型：${data.resourceType}`,
        `资源名称：${data.resourceName}`,
        `作者/团队：${data.authorName}`,
        `资源大小：${data.resourceSize}`,
        `下载链接：${data.downloadUrl}`,
        `资源介绍：${data.description}`,
        `配图数量：${imageUrls.length}`,
        '',
        `提交用户：${common.nickname || '游客'}`,
        `联系方式：${common.contact || '未提供'}`,
      ].join('\n'),
      images: imageUrls,
      ref_url: data.downloadUrl,
      ...common,
    };

    try {
      await submitFeedback(payload);
      toast({
        title: '投稿已提交',
        description: '已按反馈工单提交，等待审核处理。',
      });
      authorForm.reset();
      authorForm.setValue('imageUrls', [{ value: '' }]);
    } catch (error) {
      toast({
        title: '提交失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4 fade-in">
      <div className="flex flex-col items-center mb-8">
        <UploadCloud className="mb-3 h-10 w-10 text-primary" />
        <h1 className="text-xl font-bold text-center">资源投稿</h1>
        <p className="text-muted-foreground text-center mt-2">
          帮助我们丰富资源库，分享你的发现或创作。
        </p>
      </div>

      <Tabs defaultValue="request" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="request">求添加资源</TabsTrigger>
          <TabsTrigger value="author">我是作者</TabsTrigger>
        </TabsList>

        <TabsContent value="request">
          <Card>
            <CardHeader>
              <CardTitle>缺少游戏/应用资源求添加</CardTitle>
              <CardDescription>如果你发现我们缺少某些资源，请告诉我们。</CardDescription>
            </CardHeader>
            <Form {...requestForm}>
              <form onSubmit={requestForm.handleSubmit(onRequestSubmit)}>
                <CardContent className="space-y-6">
                  <FormField
                    control={requestForm.control}
                    name="resourceName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>资源名称</FormLabel>
                        <FormControl>
                          <Input placeholder="例如：超级马里奥兄弟" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={requestForm.control}
                    name="sourceUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>资源来源地址（选填）</FormLabel>
                        <FormControl>
                          <Input placeholder="例如：https://example.com/game-info" {...field} />
                        </FormControl>
                        <FormDescription>
                          可提供资源官网、介绍页或其它参考信息链接。
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full md:w-auto btn-interactive">
                    提交请求
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>

        <TabsContent value="author">
          <Card>
            <CardHeader>
              <CardTitle>作者投稿</CardTitle>
              <CardDescription>
                如果你是应用开发者或游戏作者，欢迎在此提交你的作品。
              </CardDescription>
            </CardHeader>
            <Form {...authorForm}>
              <form onSubmit={authorForm.handleSubmit(onAuthorSubmit)}>
                <CardContent className="space-y-6">
                  <FormField
                    control={authorForm.control}
                    name="resourceType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>资源类型 *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="app" />
                              </FormControl>
                              <FormLabel className="font-normal">应用</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="game" />
                              </FormControl>
                              <FormLabel className="font-normal">游戏</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={authorForm.control}
                    name="resourceName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>资源名称 *</FormLabel>
                        <FormControl>
                          <Input placeholder="你的应用/游戏名称" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={authorForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>资源介绍 *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="详细介绍资源特点、玩法等（至少10字符）"
                            className="resize-y min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={authorForm.control}
                    name="downloadUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>资源下载地址 *</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/download/myresource.apk" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={authorForm.control}
                    name="resourceSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>资源大小 *</FormLabel>
                        <FormControl>
                          <Input placeholder="例如：100MB、1.2GB" {...field} />
                        </FormControl>
                        <FormDescription>请包含单位（KB、MB、GB、TB）。</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel>资源介绍图链接 *（至少1张，最多5张）</FormLabel>
                    <FormDescription className="mb-2">请提供可公开访问的图片 URL。</FormDescription>
                    {imageUrlFields.map((field, index) => (
                      <FormField
                        control={authorForm.control}
                        key={field.id}
                        name={`imageUrls.${index}.value`}
                        render={({ field: itemField }) => (
                          <FormItem className="flex items-center space-x-2 mb-2">
                            <FormControl>
                              <Input placeholder={`图片链接 ${index + 1}`} {...itemField} />
                            </FormControl>
                            {imageUrlFields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeImageUrl(index)}
                                className="text-destructive hover:text-destructive"
                                aria-label="删除图片链接"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </FormItem>
                        )}
                      />
                    ))}

                    {authorForm.formState.errors.imageUrls &&
                      !authorForm.formState.errors.imageUrls?.root &&
                      !authorForm.formState.errors.imageUrls?.[imageUrlFields.length - 1]?.value && (
                        <p className="text-sm font-medium text-destructive">
                          {authorForm.formState.errors.imageUrls.message}
                        </p>
                      )}

                    {authorForm.formState.errors.imageUrls?.[imageUrlFields.length - 1]?.value && (
                      <p className="text-sm font-medium text-destructive">
                        {authorForm.formState.errors.imageUrls?.[imageUrlFields.length - 1]?.value?.message}
                      </p>
                    )}

                    {imageUrlFields.length < 5 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendImageUrl({ value: '' })}
                        className="mt-1 text-sm"
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        添加图片链接
                      </Button>
                    )}
                  </div>

                  <FormField
                    control={authorForm.control}
                    name="authorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>作者名/团队名 *</FormLabel>
                        <FormControl>
                          <Input placeholder="你的署名" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full md:w-auto btn-interactive">
                    提交投稿
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

