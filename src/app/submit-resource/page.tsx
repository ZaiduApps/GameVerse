
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import * as z from 'zod';
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, UploadCloud } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const requestResourceSchema = z.object({
  resourceName: z.string().min(1, "资源名称不能为空"),
  sourceUrl: z.string().url("请输入有效的URL").optional().or(z.literal('')),
});

type RequestResourceFormValues = z.infer<typeof requestResourceSchema>;

const authorSubmissionSchema = z.object({
  resourceType: z.enum(["app", "game"], { required_error: "请选择资源类型" }),
  resourceName: z.string().min(1, "资源名称不能为空"),
  description: z.string().min(10, "资源介绍至少需要10个字符"),
  downloadUrl: z.string().url("请输入有效的下载链接"),
  resourceSize: z.string().min(1, "资源大小不能为空").regex(/^\d+(\.\d+)?(KB|MB|GB|TB)$/i, "格式如: 1.5GB, 200MB"),
  imageUrls: z.array(
      z.object({ value: z.string().url({ message: "请输入有效的图片链接" }).min(1, "图片链接不能为空") })
    ).min(1, "至少需要一张介绍图").max(5, "最多只能添加5张介绍图"),
  authorName: z.string().min(1, "作者名不能为空"),
});

type AuthorSubmissionFormValues = z.infer<typeof authorSubmissionSchema>;

export default function SubmitResourcePage() {
  const { toast } = useToast();

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

  const { fields: imageUrlFields, append: appendImageUrl, remove: removeImageUrl } = useFieldArray({
    control: authorForm.control,
    name: "imageUrls",
  });

  function onRequestSubmit(data: RequestResourceFormValues) {
    console.log('Requesting resource:', data);
    toast({
      title: "请求已提交",
      description: "感谢您的请求，我们会尽快处理。",
    });
    requestForm.reset();
  }

  function onAuthorSubmit(data: AuthorSubmissionFormValues) {
    console.log('Author submission:', data);
     toast({
      title: "投稿已提交",
      description: "感谢您的投稿！我们将审核您的内容。",
    });
    authorForm.reset();
    // Reset field array to initial state
    authorForm.setValue('imageUrls', [{ value: '' }]);
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4 fade-in">
      <div className="flex flex-col items-center mb-8">
        <UploadCloud className="w-12 h-12 text-primary mb-3" />
        <h1 className="text-3xl font-bold text-center">资源投稿</h1>
        <p className="text-muted-foreground text-center mt-2">
          帮助我们丰富资源库，分享您的发现或创作。
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
              <CardDescription>如果您发现我们缺少某些资源，请告诉我们。</CardDescription>
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
                        <FormLabel>资源来源地址 (选填)</FormLabel>
                        <FormControl>
                          <Input placeholder="例如：https://example.com/game-info" {...field} />
                        </FormControl>
                        <FormDescription>
                          提供资源的官方网站、介绍页面或相关信息链接。
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full md:w-auto btn-interactive">提交请求</Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>

        <TabsContent value="author">
          <Card>
            <CardHeader>
              <CardTitle>作者投稿</CardTitle>
              <CardDescription>如果您是应用的开发者或游戏的作者，欢迎在此提交您的作品。</CardDescription>
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
                          <Input placeholder="您的应用/游戏名称" {...field} />
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
                            placeholder="详细介绍您的资源特点、玩法等 (至少10字符)"
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
                          <Input placeholder="例如: 100MB, 1.2GB" {...field} />
                        </FormControl>
                         <FormDescription>
                          请包含单位 (KB, MB, GB, TB)。
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel>资源介绍图链接 * (至少1张, 最多5张)</FormLabel>
                    <FormDescription className="mb-2">请提供可公开访问的图片URL。</FormDescription>
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
                     {/* Error message for the entire array */}
                    {authorForm.formState.errors.imageUrls && !authorForm.formState.errors.imageUrls?.root && !authorForm.formState.errors.imageUrls?.[imageUrlFields.length-1]?.value && (
                        <p className="text-sm font-medium text-destructive">
                            {authorForm.formState.errors.imageUrls.message}
                        </p>
                    )}
                    {/* Display error for the last item if specific */}
                     {authorForm.formState.errors.imageUrls?.[imageUrlFields.length-1]?.value && (
                        <p className="text-sm font-medium text-destructive">
                            {authorForm.formState.errors.imageUrls?.[imageUrlFields.length-1]?.value?.message}
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
                          <Input placeholder="您的署名" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full md:w-auto btn-interactive">提交投稿</Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    